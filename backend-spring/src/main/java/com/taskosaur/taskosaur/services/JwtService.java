package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.models.User;
import java.util.Date;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }
    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration)) // Hiện tại + 7 ngày
                .signWith(getSigningKey())
                .compact();
    }
    // Hàm phụ: Đọc toàn bộ nội dung (Claims) bên trong Token
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Xác thực chữ ký bằng key
                .build()
                .parseSignedClaims(token)    // Giải mã
                .getPayload();               // Lấy phần dữ liệu (payload)
    }
    // Lấy userId từ token
    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }
    // Lấy email từ token
    public String extractEmail(String token) {
        return extractAllClaims(token).get("email", String.class);
    }
    // Kiểm tra token còn hạn hay đã hết hạn
    public boolean isTokenValid(String token) {
        try {
            Date expiration = extractAllClaims(token).getExpiration();
            return !expiration.before(new Date()); // Hết hạn nếu trước thời điểm hiện tại
        } catch (Exception e) {
            return false; // Token không hợp lệ hoặc bị sửa đổi trái phép
        }
    }
}
