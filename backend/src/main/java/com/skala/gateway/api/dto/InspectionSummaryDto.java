package com.skala.gateway.api.dto;

import com.skala.gateway.domain.Inspection;
import com.skala.gateway.domain.Message;
import com.skala.gateway.domain.enums.InspectionPhase;
import com.skala.gateway.domain.enums.AiStatus;
import com.skala.gateway.domain.enums.DecidedBy;
import com.skala.gateway.domain.enums.MessageStatus;
import java.time.OffsetDateTime;

/**
 * 감사 콘솔 목록 행 (기획서 5.4, 8.4, 계약서 §1-6).
 *
 * <p>{@code department}·{@code userName}은 문자열이다. 목록 행에 필요한 것이 그것뿐이라
 * 중첩 객체로 만들 이유가 없다.
 *
 * @param ruleCount {@code source='RULE'}인 finding 개수다. <b>AI finding을 세지 않는다</b>
 *                  (5.4 목록 컬럼 정의). 0.5 D1 중첩 억제 후의 값이므로 Case A에서 2다
 */
public record InspectionSummaryDto(
        Long inspectionId,
        /** 같은 메시지의 INPUT·OUTPUT 두 행을 화면에서 묶는 열쇠다. */
        Long messageId,
        /** INPUT(프롬프트) / OUTPUT(답변). 어느 본문을 보고 있는지 이 값이 정한다. */
        InspectionPhase phase,
        OffsetDateTime createdAt,
        String department,
        String userName,
        MessageStatus status,
        long ruleCount,
        AiStatus aiStatus,
        DecidedBy decidedBy,
        /**
         * 마스킹 적용본. 감사 목록이 훑어볼 대상은 이것이다 (기획서 5.4 —
         * "원문 — submitted_text (마스킹된 본문). 원문(original_text)은 표시하지 않음").
         *
         * <p>규칙 BLOCK이면 {@code null}이다. 마스킹본이 생성된 적이 없다 (0.5 D5·D14).
         */
        String submittedText) {

    public static InspectionSummaryDto of(Inspection inspection, long ruleCount) {
        Message message = inspection.getMessage();
        return new InspectionSummaryDto(
                inspection.getInspectionId(),
                message.getMessageId(),
                inspection.getPhase(),
                ApiTimes.utc(inspection.getCreatedAt()),
                message.getUser().getDepartment().getName(),
                message.getUser().getName(),
                statusOf(inspection),
                ruleCount,
                inspection.getAiStatus(),
                inspection.getDecidedBy(),
                bodyUnderReview(inspection));
    }

    /**
     * 담당자가 보는 본문. 검사 단계에 따라 다른 칸을 읽는다 — INPUT은 나간 프롬프트,
     * OUTPUT은 돌아온 답변이다. 둘 다 <b>마스킹본</b>이며 원문은 어느 쪽에서도 나가지 않는다.
     *
     * <p>한 메시지에 검사가 둘 붙으므로(`inspection.phase`) 이 구분이 없으면 답변 검사 행에
     * 프롬프트가 실린다. 담당자는 답변을 보고 확정해야 하는데 프롬프트를 보게 된다.
     */
    static String bodyUnderReview(Inspection inspection) {
        Message message = inspection.getMessage();
        if (inspection.getPhase() == InspectionPhase.OUTPUT) {
            return message.getResponseMasked();
        }
        return message.getSubmittedText();
    }


    /**
     * 행의 상태. {@code message.status}가 아니라 <b>이 검사의 판정</b>에서 온다.
     *
     * <p>한 메시지에 검사가 둘 붙기 때문이다. 프롬프트는 마스킹으로 끝났는데 답변이 검토
     * 대기일 수 있고, 그때 두 행이 같은 상태로 보이면 담당자는 무엇을 확정해야 하는지 알 수 없다.
     * 목록 필터도 같은 기준을 쓴다 ({@code InspectionSpecs.status}).
     */
    private static MessageStatus statusOf(Inspection inspection) {
        return switch (inspection.getFinalDecision()) {
            case ALLOW -> MessageStatus.ALLOWED;
            case MASK -> MessageStatus.MASKED;
            case BLOCK -> MessageStatus.BLOCKED;
            case PENDING -> MessageStatus.PENDING_REVIEW;
        };
    }

}
