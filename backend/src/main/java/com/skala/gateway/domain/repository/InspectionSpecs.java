package com.skala.gateway.domain.repository;

import com.skala.gateway.domain.Inspection;
import com.skala.gateway.domain.enums.FinalDecision;
import com.skala.gateway.domain.enums.InspectionPhase;
import com.skala.gateway.domain.enums.MessageStatus;
import jakarta.persistence.criteria.Join;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/**
 * 감사 콘솔 목록(`GET /api/v1/inspections`)의 선택 필터 (기획서 5.4, 계약서 §1-6).
 *
 * <p>{@code null}인 필터는 Specification 자체를 만들지 않는다. 조건이 SQL에 나가지
 * 않으므로 "값이 없으면 전체"가 자연스럽게 성립한다.
 */
public final class InspectionSpecs {

    /** 정렬은 {@code createdAt DESC} 고정이다. 정렬 파라미터를 두지 않는다 (계약서 §1-6). */
    public static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private InspectionSpecs() {
    }

    /** 제출자 부서. INFOSEC은 프롬프트를 제출하지 않아 항상 0건이다 (0.5 D2). */
    public static Specification<Inspection> deptId(Long deptId) {
        return (root, query, cb) -> {
            Join<?, ?> user = root.join("message").join("user");
            return cb.equal(user.get("department").get("deptId"), deptId);
        };
    }

    /**
     * 판정 4값. <b>{@code message.status}가 아니라 이 검사의 {@code final_decision}을 본다.</b>
     *
     * <p>한 메시지에 검사가 둘 붙기 때문이다 — 프롬프트는 마스킹돼 나갔는데 답변이 검토
     * 대기일 수 있다. message.status로 거르면 그 답변 행이 "검토 대기" 필터에서 사라진다.
     * 담당자가 폴링하는 화면이 바로 이 필터라 행이 빠지면 확정이 영영 이뤄지지 않는다.
     */
    public static Specification<Inspection> status(MessageStatus status) {
        FinalDecision decision = decisionOf(status);
        return (root, query, cb) -> cb.equal(root.get("finalDecision"), decision);
    }

    /** INPUT(프롬프트) / OUTPUT(답변). 감사 콘솔이 두 축을 따로 훑는다. */
    public static Specification<Inspection> phase(InspectionPhase phase) {
        return (root, query, cb) -> cb.equal(root.get("phase"), phase);
    }

    /** 화면의 상태 4값 → 저장된 판정. 두 enum은 1:1이며 이름만 다르다. */
    private static FinalDecision decisionOf(MessageStatus status) {
        return switch (status) {
            case ALLOWED -> FinalDecision.ALLOW;
            case MASKED -> FinalDecision.MASK;
            case BLOCKED -> FinalDecision.BLOCK;
            case PENDING_REVIEW -> FinalDecision.PENDING;
        };
    }

    /** {@code from} 이상. */
    public static Specification<Inspection> createdFrom(OffsetDateTime from) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    /** {@code to} <b>미만</b>. 경계를 포함하면 하루 단위 필터가 다음 날 00:00을 삼킨다. */
    public static Specification<Inspection> createdBefore(OffsetDateTime to) {
        return (root, query, cb) -> cb.lessThan(root.get("createdAt"), to);
    }

    /** null이 아닌 필터만 AND로 묶는다. 전부 null이면 조건 없는 전체 조회다. */
    public static Specification<Inspection> of(Long deptId, MessageStatus status,
                                               InspectionPhase phase,
                                               OffsetDateTime from, OffsetDateTime to) {
        List<Specification<Inspection>> specs = new ArrayList<>();
        if (deptId != null) {
            specs.add(deptId(deptId));
        }
        if (status != null) {
            specs.add(status(status));
        }
        if (phase != null) {
            specs.add(phase(phase));
        }
        if (from != null) {
            specs.add(createdFrom(from));
        }
        if (to != null) {
            specs.add(createdBefore(to));
        }
        return specs.stream().reduce(Specification::and).orElse(null);
    }
}
