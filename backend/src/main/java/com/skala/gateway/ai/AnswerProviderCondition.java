package com.skala.gateway.ai;

import java.util.Map;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

/**
 * {@link ConditionalOnAnswerProvider}를 실제로 판정한다. 값 해석은 전부
 * {@link AnswerProviders#resolve}에 있고 여기는 환경에서 두 속성을 읽어 넘기기만 한다.
 */
class AnswerProviderCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        Map<String, Object> attributes =
                metadata.getAnnotationAttributes(ConditionalOnAnswerProvider.class.getName());
        if (attributes == null) {
            return false;
        }
        String wanted = String.valueOf(attributes.get("value"));
        String resolved = AnswerProviders.resolve(
                context.getEnvironment().getProperty("answer.provider"),
                context.getEnvironment().getProperty("answer.endpoint"));
        return wanted.equals(resolved);
    }
}
