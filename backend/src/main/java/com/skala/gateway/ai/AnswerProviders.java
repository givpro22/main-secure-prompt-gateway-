package com.skala.gateway.ai;

import java.util.Locale;

/**
 * {@code answer.provider} 값 하나로 어느 {@link AnswerClient} 구현이 뜰지 정한다.
 *
 * <p><b>왜 이 클래스가 있나.</b> {@code application.yml}이 {@code ${ANSWER_PROVIDER:}}로
 * 기본값을 주기 때문에 이 속성은 <b>언제나 존재하고 값만 빈 문자열</b>이 된다. 그래서
 * {@code @ConditionalOnProperty(matchIfMissing = true)}가 걸리지 않는다 — 그 옵션은
 * 속성이 "없을 때"만 동작하는데, 여기서는 없는 게 아니라 비어 있는 것이다. 이 차이 때문에
 * 어떤 구현도 뜨지 않아 {@code AnswerService}가 생성되지 못하고 컨텍스트 전체가 죽었다.
 *
 * <p>비워 두었을 때의 규칙은 {@code application.yml} 주석이 정한 그대로다 —
 * <b>endpoint가 있으면 openai, 없으면 claude.</b> ollama는 endpoint만으로는 구분되지
 * 않으므로(openai 호환 게이트웨이도 endpoint를 쓴다) 반드시 명시해야 한다.
 *
 * <p>순수 함수로 떼어 둔 이유는 이 규칙 하나가 부팅 가능 여부를 가르기 때문이다.
 * 컨텍스트를 띄우지 않고 표로 검증할 수 있어야 한다.
 */
public final class AnswerProviders {

    /** endpoint가 없을 때의 기본 제공자. 공식 SDK를 쓰는 유일한 구현이다 */
    public static final String CLAUDE = "claude";
    /** OpenAI 호환 경로. base URL이 있어야 부를 수 있다 */
    public static final String OPENAI = "openai";
    /** 사내 Ollama. 외부로 나가지 않으므로 실수로 골라지면 안 되고, 그래서 명시만 인정한다 */
    public static final String OLLAMA = "ollama";

    private AnswerProviders() {
    }

    /**
     * 실제로 뜰 제공자 이름을 돌려준다.
     *
     * @param provider {@code answer.provider}. {@code null}·공백이면 미지정으로 본다
     * @param endpoint {@code answer.endpoint}. 미지정일 때만 판단에 쓰인다
     * @return {@link #CLAUDE} · {@link #OPENAI} · {@link #OLLAMA} 중 하나, 또는 사용자가 적은 값 그대로
     */
    public static String resolve(String provider, String endpoint) {
        if (provider != null && !provider.isBlank()) {
            return provider.trim().toLowerCase(Locale.ROOT);
        }
        return endpoint == null || endpoint.isBlank() ? CLAUDE : OPENAI;
    }
}
