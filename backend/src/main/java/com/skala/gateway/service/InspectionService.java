package com.skala.gateway.service;

import com.skala.gateway.ai.AiAssessment;
import com.skala.gateway.ai.AiInspectionRequest;
import com.skala.gateway.ai.AiInspectionRunner;
import com.skala.gateway.api.dto.InspectionDetailResponse;
import com.skala.gateway.api.dto.InspectionSummaryDto;
import com.skala.gateway.api.ApiException;
import com.skala.gateway.api.dto.ResponseVerdictResponse;
import com.skala.gateway.domain.enums.InspectionPhase;
import com.skala.gateway.api.dto.MessageVerdictResponse;
import com.skala.gateway.api.dto.PageEnvelope;
import com.skala.gateway.domain.AppUser;
import com.skala.gateway.domain.Inspection;
import com.skala.gateway.domain.InspectionFinding;
import com.skala.gateway.domain.Message;
import com.skala.gateway.domain.enums.AiStatus;
import com.skala.gateway.domain.enums.DecidedBy;
import com.skala.gateway.domain.enums.FinalDecision;
import com.skala.gateway.domain.enums.MessageStatus;
import com.skala.gateway.domain.enums.PolicyCategory;
import com.skala.gateway.domain.repository.AppUserRepository;
import com.skala.gateway.domain.repository.InspectionFindingRepository;
import com.skala.gateway.domain.repository.InspectionRepository;
import com.skala.gateway.domain.repository.InspectionSpecs;
import com.skala.gateway.domain.repository.MessageRepository;
import com.skala.gateway.engine.EngineVerdict;
import com.skala.gateway.engine.RuleEngine;
import com.skala.gateway.engine.RuleHit;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 판정 파이프라인의 저장·응답 단계 (기획서 7.4-9)와 감사 조회.
 *
 * <p>매칭·억제·충돌 해결·마스킹은 {@link RuleEngine}이 하고, 이 클래스는 정책 로드부터
 * 영속화와 AI 인계까지를 트랜잭션으로 묶는다.
 */
@Service
public class InspectionService {

    private static final Logger log = LoggerFactory.getLogger(InspectionService.class);

    /** 감사 목록 페이지 크기 상한 (계약서 §1-6). 초과 요청은 거부하지 않고 절삭한다. */
    public static final int MAX_PAGE_SIZE = 100;

    /** 유출 후보에 카테고리가 없을 때의 기본값. 출력 유출은 기밀 축으로 본다 */
    private static final PolicyCategory DEFAULT_AI_CATEGORY = PolicyCategory.CONFIDENTIAL;

    private final AppUserRepository appUserRepository;
    private final MessageRepository messageRepository;
    private final InspectionRepository inspectionRepository;
    private final InspectionFindingRepository findingRepository;
    private final PolicyService policyService;
    private final RuleEngine ruleEngine;
    private final AiInspectionRunner aiInspectionRunner;
    private final AnswerLeakService answerLeakService;
    private final int pollAfterMs;

    public InspectionService(AppUserRepository appUserRepository,
                             MessageRepository messageRepository,
                             InspectionRepository inspectionRepository,
                             InspectionFindingRepository findingRepository,
                             PolicyService policyService,
                             RuleEngine ruleEngine,
                             AiInspectionRunner aiInspectionRunner,
                             AnswerLeakService answerLeakService,
                             @Value("${gateway.polling.interval-ms}") int pollAfterMs) {
        this.appUserRepository = appUserRepository;
        this.messageRepository = messageRepository;
        this.inspectionRepository = inspectionRepository;
        this.findingRepository = findingRepository;
        this.policyService = policyService;
        this.ruleEngine = ruleEngine;
        this.aiInspectionRunner = aiInspectionRunner;
        this.answerLeakService = answerLeakService;
        this.pollAfterMs = pollAfterMs;
    }

    /**
     * 프롬프트 제출 → 규칙 판정 → 저장 → (REVIEW면) AI 인계.
     *
     * <p>판정에 따라 컨트롤러가 200 / 202 / 403으로 갈린다. 어느 쪽이든 응답 본문은 같은
     * 필드 집합이다 (계약서 §1-4).
     *
     * @param userId {@code X-User-Id}. 호출 전에 존재를 확인한다
     * @param text   원문. 여기서만 다루고 응답·AI 입력 어디에도 싣지 않는다
     */
    @Transactional
    public MessageVerdictResponse submit(Long userId, String text) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + userId));

        // 1~3. 정책 로드와 스냅샷 (7.4-1~3)
        PolicyService.PolicyContext context = policyService.loadForDecision(user.getDepartment().getDeptId());

        // 4~8. 매칭 → 중첩 억제 → 충돌 해결 → 마스킹 (7.4-4~8)
        EngineVerdict verdict = ruleEngine.evaluate(text, context.rules());
        FinalDecision decision = verdict.decision();

        // 9. 저장. submitted_text가 NULL인 것은 BLOCK뿐이다 (0.5 D7) —
        //    BLOCK은 마스킹 자체를 실행하지 않아 만들어진 본문이 없다 (0.5 D5).
        Message message = messageRepository.save(
                new Message(user, text, decision == FinalDecision.BLOCK ? null : verdict.maskedText(), statusOf(decision)));

        boolean pending = decision == FinalDecision.PENDING;
        Inspection inspection = new Inspection(
                message,
                context.snapshot(),
                verdict.ruleResult(),
                pending ? AiStatus.PENDING : AiStatus.SKIPPED,
                decision,
                // 사람이 확정하기 전까지 REVIEW 건의 decidedBy는 비어 있다 (계약서 §1-4).
                pending ? null : DecidedBy.RULE);
        if (!pending) {
            inspection.setCompletedAt(OffsetDateTime.now());
        }
        inspectionRepository.save(inspection);

        for (RuleHit hit : verdict.findings()) {
            findingRepository.save(InspectionFinding.ofRule(
                    inspection, hit.rule(), hit.category(), hit.spanStart(), hit.spanEnd()));
        }

        if (pending) {
            scheduleAiInspection(inspection, user, verdict, context);
        }

        return MessageVerdictResponse.of(message, inspection, pending ? pollAfterMs : null);
    }

    /**
     * 출력 검사 — 모델이 돌려준 답변을 같은 정책으로 다시 본다 (UC-08, 17장 3단계).
     *
     * <p>지금까지 게이트웨이는 나가는 것만 봤다. 그런데 답변에도 같은 위험이 있다 —
     * 모델이 이름이나 번호를 지어내기도 하고, 사내 문서 조각을 물고 나오기도 한다.
     *
     * <p><b>입력과 같은 파이프라인을 그대로 탄다.</b> 정책 로드, 규칙 매칭, 중첩 억제,
     * 충돌 해결, 마스킹, AI 인계까지 한 줄도 다르지 않다. 다른 것은 {@code phase}와
     * 텍스트를 어느 칸에 넣느냐뿐이다. 스키마가 처음부터 이 자리를 비워 뒀기 때문이며
     * (`inspection.phase`에 UNIQUE 없는 message_id), 그래서 검사가 한 메시지에 둘 붙는다.
     *
     * <p>정책은 <b>작성자의 부서</b> 것을 쓴다. 답변을 보는 사람이 그 사람이므로,
     * 홍보팀 엠바고에 걸리는 제품명이 개발팀 화면에 뜨는지도 같은 기준으로 갈린다.
     */
    @Transactional
    public ResponseVerdictResponse inspectResponse(Long messageId, Long userId, String text) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> ApiException.invalidUser(userId));
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.messageNotFound(messageId));

        // 답변은 보낸 사람에게 돌아간 것이다. 남의 대화에 답변을 끼워 넣을 수 없다.
        if (!message.getUser().getUserId().equals(userId)) {
            throw ApiException.notAuthor(messageId);
        }
        // 나가지 않은 프롬프트에는 검사할 답변이 없다 (BLOCK이면 submittedText가 null이다).
        if (message.getSubmittedText() == null) {
            throw ApiException.notSent(messageId);
        }
        if (message.getResponseText() != null) {
            throw ApiException.responseAlreadyInspected(messageId);
        }

        PolicyService.PolicyContext context = policyService.loadForDecision(user.getDepartment().getDeptId());
        EngineVerdict verdict = ruleEngine.evaluate(text, context.rules());
        FinalDecision ruleDecision = verdict.decision();

        message.recordResponse(text, ruleDecision == FinalDecision.BLOCK ? null : verdict.maskedText());

        // 규칙이 통과시킨 답변을 한 번 더 본다. 규칙은 답변에 무엇이 "들어 있는지"만 보고,
        // 유출 검사기는 그것이 프롬프트에서 가렸던 값인지 사내 코드 조각인지를 본다 —
        // 답변 단독으로는 멀쩡해 보이는 문장이 프롬프트와 짝지어야 위험해지는 자리다.
        //
        // BLOCK이면 부르지 않는다. 이미 본문을 남기지 않기로 한 답변에 검사를 더 돌릴 이유가 없다.
        //
        // 입력 검사와 달리 동기다. 입력은 전송 전이라 사람을 기다리게 할 수 있지만, 답변은
        // 이미 만들어져 있어 폴링을 걸면 화면만 늦어진다. 검사기 셋 다 결정론적이라 빠르다.
        AiAssessment leak = ruleDecision == FinalDecision.BLOCK ? null
                : answerLeakService.check(message.getOriginalText(), message.getSubmittedText(),
                        text, user.getDepartment().getCode());
        boolean pending = ruleDecision == FinalDecision.PENDING
                || (leak != null && leak.reviewRequired());

        // BLOCK은 무엇이 더 나와도 BLOCK이다. 나머지는 검토가 필요하면 PENDING으로 올린다.
        FinalDecision decision = ruleDecision == FinalDecision.BLOCK ? FinalDecision.BLOCK
                : pending ? FinalDecision.PENDING : ruleDecision;

        Inspection inspection = new Inspection(
                message,
                InspectionPhase.OUTPUT,
                context.snapshot(),
                verdict.ruleResult(),
                // 유출 검사가 이 자리에서 끝났으므로 PENDING으로 두지 않는다. PENDING은
                // "아직 안 돌았다"는 뜻이고, 그러면 FE 폴링이 끝나지 않는다 (계약서 §1-5).
                leak == null ? AiStatus.SKIPPED : AiStatus.COMPLETED,
                decision,
                pending ? null : DecidedBy.RULE);
        inspection.setCompletedAt(OffsetDateTime.now());
        if (leak != null) {
            inspection.setAiResult(leak);
        }
        inspectionRepository.save(inspection);

        for (RuleHit hit : verdict.findings()) {
            findingRepository.save(InspectionFinding.ofRule(
                    inspection, hit.rule(), hit.category(), hit.spanStart(), hit.spanEnd()));
        }
        for (AiAssessment.RiskCandidate candidate : candidatesOf(leak)) {
            findingRepository.save(InspectionFinding.ofAi(
                    inspection, candidate.code(), aiCategory(candidate),
                    candidate.rationale(), candidate.evidence()));
        }

        log.info("출력 검사 messageId={} decision={} 규칙={}건 유출후보={}건",
                messageId, decision, verdict.findings().size(), candidatesOf(leak).size());
        return ResponseVerdictResponse.of(message, inspection, pending ? pollAfterMs : null);
    }

    /**
     * REVIEW 판정의 AI 인계 (계약서 §4 인계 3).
     *
     * <p>{@code schedule()}은 활성 트랜잭션이 있으면 <b>커밋 후로</b> 실행을 미룬다. 커밋 전에
     * {@code @Async} 메서드가 시작되면 새 스레드가 아직 커밋되지 않은 inspection을 조회해
     * 실패한다. {@code rule-engine-dev}가 {@code TransactionSynchronizationManager}를 직접
     * 다루지 않도록 계약 지점에서 한 번 막아 둔 것이므로 그대로 호출한다.
     *
     * <p>넘기는 것은 <b>마스킹 적용본</b>이다. 원문은 어떤 경로로도 이 요청에 들어가지 않는다 (9.3).
     */
    private void scheduleAiInspection(Inspection inspection, AppUser user,
                                      EngineVerdict verdict, PolicyService.PolicyContext context) {
        aiInspectionRunner.schedule(inspection.getInspectionId(), new AiInspectionRequest(
                verdict.maskedText(),
                user.getDepartment().getCode(),
                verdict.categories(),
                verdict.hits(),
                context.policyVersion()));
        log.debug("AI 검사 예약 inspectionId={} hits={}", inspection.getInspectionId(), verdict.hits().size());
    }

    /** {@code GET /api/v1/inspections/{id}} (계약서 §1-5). 폴링 겸용이다. */
    @Transactional(readOnly = true)
    public Optional<InspectionDetailResponse> detail(Long inspectionId) {
        return inspectionRepository.findDetailById(inspectionId)
                .map(inspection -> InspectionDetailResponse.of(inspection,
                        findingRepository.findByInspectionInspectionIdOrderBySourceAscFindingIdAsc(inspectionId)));
    }

    /**
     * {@code GET /api/v1/inspections} 감사 목록 (계약서 §1-6).
     *
     * <p>정렬은 {@code createdAt DESC} 고정이다. {@code ruleCount}는 페이지 단위로 한 번에 센다 —
     * 행마다 count 쿼리를 날리면 20행에 20쿼리다.
     */
    @Transactional(readOnly = true)
    public PageEnvelope<InspectionSummaryDto> list(Long deptId, MessageStatus status,
                                                  InspectionPhase phase,
                                                   OffsetDateTime from, OffsetDateTime to,
                                                   int page, int size) {
        Page<Inspection> found = inspectionRepository.findAll(
                InspectionSpecs.of(deptId, status, phase, from, to),
                PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), InspectionSpecs.DEFAULT_SORT));

        Map<Long, Long> ruleCounts = ruleCounts(found.getContent().stream()
                .map(Inspection::getInspectionId)
                .toList());

        return PageEnvelope.of(found, found.getContent().stream()
                .map(inspection -> InspectionSummaryDto.of(
                        inspection, ruleCounts.getOrDefault(inspection.getInspectionId(), 0L)))
                .toList());
    }

    /** {@code source='RULE'}인 finding만 센다. AI finding을 세면 안 된다 (5.4 목록 컬럼 정의). */
    private Map<Long, Long> ruleCounts(List<Long> inspectionIds) {
        if (inspectionIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (InspectionFindingRepository.RuleCountRow row : findingRepository.countRuleFindings(inspectionIds)) {
            counts.put(row.getInspectionId(), row.getRuleCount());
        }
        return counts;
    }

    /** 7.5의 판정 ↔ {@code message.status} 대응. */
    private static MessageStatus statusOf(FinalDecision decision) {
        return switch (decision) {
            case ALLOW -> MessageStatus.ALLOWED;
            case MASK -> MessageStatus.MASKED;
            case BLOCK -> MessageStatus.BLOCKED;
            case PENDING -> MessageStatus.PENDING_REVIEW;
        };
    }

    /** 유출 검사가 돌지 않았거나 후보가 없으면 빈 목록. 널 검사를 호출부마다 반복하지 않는다. */
    private static List<AiAssessment.RiskCandidate> candidatesOf(AiAssessment assessment) {
        if (assessment == null || assessment.riskCandidates() == null) {
            return List.of();
        }
        return assessment.riskCandidates();
    }

    /**
     * 후보 카테고리 문자열 → enum. 스키마 밖의 값이 와도 후보를 버리지 않는다 —
     * 후보를 잃는 것이 카테고리가 틀린 것보다 나쁘다 ({@code InspectionAiResultSink}와 같은 규칙).
     */
    private static PolicyCategory aiCategory(AiAssessment.RiskCandidate candidate) {
        if (candidate.category() == null) {
            return DEFAULT_AI_CATEGORY;
        }
        try {
            return PolicyCategory.valueOf(candidate.category());
        } catch (IllegalArgumentException e) {
            log.warn("유출 후보 {}의 category가 9.4 스키마 밖의 값입니다: {} — {}로 저장합니다",
                    candidate.code(), candidate.category(), DEFAULT_AI_CATEGORY);
            return DEFAULT_AI_CATEGORY;
        }
    }

}
