package com.skala.gateway.ai;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.context.annotation.Conditional;

/**
 * {@link AnswerProviders#resolve} 결과가 {@link #value()}와 같을 때만 빈을 만든다.
 *
 * <p>{@code @ConditionalOnProperty}를 쓰지 않는 이유는 {@link AnswerProviders} 문서에 있다 —
 * 빈 문자열과 미지정을 구분하지 못해서 셋 다 뜨지 않는 상태가 나왔다.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(AnswerProviderCondition.class)
public @interface ConditionalOnAnswerProvider {

    /** {@code claude} · {@code openai} · {@code ollama} */
    String value();
}
