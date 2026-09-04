package com.skala.gateway.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 이 표 하나가 부팅 가능 여부를 가른다. 어느 칸도 빈 결과를 내면 안 된다 —
 * {@code AnswerClient} 구현이 하나도 안 뜨면 {@code AnswerService}가 생성되지 못하고
 * 컨텍스트 전체가 죽는다. 실제로 그렇게 죽어서 이 테스트가 생겼다.
 */
class AnswerProvidersTest {

    @Test
    @DisplayName("비워 두면 endpoint 유무로 정한다 — 없으면 claude, 있으면 openai")
    void resolvesByEndpointWhenProviderBlank() {
        assertThat(AnswerProviders.resolve("", "")).isEqualTo(AnswerProviders.CLAUDE);
        assertThat(AnswerProviders.resolve(null, null)).isEqualTo(AnswerProviders.CLAUDE);
        assertThat(AnswerProviders.resolve("  ", "  ")).isEqualTo(AnswerProviders.CLAUDE);
        assertThat(AnswerProviders.resolve("", "https://api.groq.com/openai/v1"))
                .isEqualTo(AnswerProviders.OPENAI);
    }

    @Test
    @DisplayName("명시한 값이 endpoint보다 우선한다 — ollama는 이 경로로만 선택된다")
    void explicitProviderWins() {
        assertThat(AnswerProviders.resolve("claude", "https://api.openai.com/v1"))
                .isEqualTo(AnswerProviders.CLAUDE);
        assertThat(AnswerProviders.resolve("ollama", "http://localhost:11434"))
                .isEqualTo(AnswerProviders.OLLAMA);
        assertThat(AnswerProviders.resolve("ollama", "")).isEqualTo(AnswerProviders.OLLAMA);
    }

    @Test
    @DisplayName("대소문자와 공백은 흡수한다 — 환경변수는 손으로 적는 값이다")
    void normalisesCasingAndWhitespace() {
        assertThat(AnswerProviders.resolve(" Claude ", "")).isEqualTo(AnswerProviders.CLAUDE);
        assertThat(AnswerProviders.resolve("OPENAI", "")).isEqualTo(AnswerProviders.OPENAI);
    }

    @Test
    @DisplayName("어떤 입력에도 이름 하나는 나온다 — 아무것도 안 뜨는 상태가 없어야 한다")
    void neverResolvesToNothing() {
        for (String provider : new String[] {null, "", "  ", "claude", "openai", "ollama"}) {
            for (String endpoint : new String[] {null, "", "http://localhost:11434"}) {
                assertThat(AnswerProviders.resolve(provider, endpoint)).isNotBlank();
            }
        }
    }
}
