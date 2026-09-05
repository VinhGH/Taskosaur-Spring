package com.taskosaur.taskosaur.annotations;

import com.taskosaur.taskosaur.enums.ActivityType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /**
     * Loại hành động hoạt động (VD: TASK_CREATED, TASK_STATUS_CHANGED, TASK_UPDATED).
     */
    ActivityType action();

    /**
     * Loại thực thể (VD: "TASK", "PROJECT", "WORKSPACE", "SPRINT", "MEMBER").
     */
    String entityType() default "TASK";

    /**
     * Mô tả hành động mặc định nếu không cần trích xuất động.
     */
    String description() default "";
}
