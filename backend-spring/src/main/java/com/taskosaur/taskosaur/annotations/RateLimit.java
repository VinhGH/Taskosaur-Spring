package com.taskosaur.taskosaur.annotations;

import com.taskosaur.taskosaur.enums.RateLimitStrategy;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * Tiền tố định danh trong Redis (VD: "ai_chat", "auth_login").
     */
    String keyPrefix() default "default";

    /**
     * Số lượng request tối đa được phép trong một chu kỳ.
     */
    int limit() default 10;

    /**
     * Độ dài chu kỳ tính bằng giây (VD: 60s).
     */
    int period() default 60;

    /**
     * Chiến lược định danh đối tượng giới hạn (User ID hay Client IP).
     */
    RateLimitStrategy strategy() default RateLimitStrategy.BY_USER;
}
