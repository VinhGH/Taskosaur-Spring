package com.taskosaur.taskosaur.aspects;

import com.taskosaur.taskosaur.annotations.RateLimit;
import com.taskosaur.taskosaur.enums.RateLimitStrategy;
import com.taskosaur.taskosaur.exceptions.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitAspect {

    private final StringRedisTemplate stringRedisTemplate;
    private final HttpServletRequest request;

    @Around("@annotation(rateLimit)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        String identifier = resolveIdentifier(rateLimit.strategy());
        String redisKey = "rate_limit:" + rateLimit.keyPrefix() + ":" + identifier;

        try {
            Long currentCount = stringRedisTemplate.opsForValue().increment(redisKey);

            if (currentCount != null && currentCount == 1L) {
                stringRedisTemplate.expire(redisKey, Duration.ofSeconds(rateLimit.period()));
            }

            if (currentCount != null && currentCount > rateLimit.limit()) {
                Long ttlSeconds = stringRedisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
                int retryAfter = (ttlSeconds != null && ttlSeconds > 0) ? ttlSeconds.intValue() : rateLimit.period();

                log.warn("Rate limit exceeded for [{}] on key [{}]. Count: {}/{}, Retry-After: {}s",
                        identifier, redisKey, currentCount, rateLimit.limit(), retryAfter);

                throw new RateLimitExceededException(
                        String.format("Rate limit exceeded. Maximum %d requests allowed per %d seconds.",
                                rateLimit.limit(), rateLimit.period()),
                        retryAfter
                );
            }
        } catch (RateLimitExceededException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Redis unavailable for RateLimit check on key [{}]: {}. Allowing request to proceed (Fail-open).",
                    redisKey, ex.getMessage());
        }

        return joinPoint.proceed();
    }

    private String resolveIdentifier(RateLimitStrategy strategy) {
        if (strategy == RateLimitStrategy.BY_USER) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName())) {
                return "user_" + authentication.getName();
            }
        }
        return "ip_" + getClientIp();
    }

    private String getClientIp() {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank() && !"unknown".equalsIgnoreCase(xfHeader)) {
            return xfHeader.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
