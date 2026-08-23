package com.taskosaur.taskosaur.config;

import com.taskosaur.taskosaur.services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService; // Inject JwtService

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException { // <-- Có dấu mở ngoặc { ở đây

        // 1. Lấy Header Authorization
        String authHeader = request.getHeader("Authorization");

        // 2. Kiểm tra nếu không có Token hoặc không bắt đầu bằng "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Cho request đi tiếp
            return;
        }

        // 3. Cắt chuỗi để lấy JWT Token
        String jwt = authHeader.substring(7); // Bỏ qua chữ "Bearer "
        String userId = jwtService.extractUserId(jwt);

        // 4. Nếu có userId và chưa được xác thực trong SecurityContext
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtService.isTokenValid(jwt)) {
                // Tạo đối tượng xác thực
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.emptyList()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Đóng dấu xác thực vào SecurityContextHolder
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 5. Cho request đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }
}