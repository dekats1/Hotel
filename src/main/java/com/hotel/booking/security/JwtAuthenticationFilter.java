package com.hotel.booking.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie; // 💡 Добавляем импорт для работы с Cookie
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays; // 💡 Добавляем импорт

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtProvider;
    private final CustomUserServiceImpl userDetailsService;

    // 💡 Новое поле для имени Cookie
    private static final String JWT_COOKIE_NAME = "auth_jwt";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 💡 Вызываем обновленный метод, который ищет токен в Cookie или заголовке
        String token = resolveToken(request);

        if (token != null && jwtProvider.validateToken(token)) {
            try {
                String userId = jwtProvider.getUserIdFromToken(token);

                // Проверяем, что аутентификация еще не установлена
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserById(userId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("✅ Authenticated user: {}", userDetails.getUsername());
                }
            } catch (Exception e) {
                log.error("❌ Error loading user by ID or validating token: {}", e.getMessage());
                // В случае ошибки (например, неверный ID или проблема с JWT) очищаем контекст
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Пытается извлечь JWT токен сначала из HTTP-only Cookie,
     * а затем из заголовка Authorization (для обратной совместимости или инструментов, как Postman).
     */
    private String resolveToken(HttpServletRequest request) {
        // 1. Поиск токена в Cookie
        if (request.getCookies() != null) {
            String tokenFromCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> JWT_COOKIE_NAME.equals(cookie.getName()))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);

            if (tokenFromCookie != null && !tokenFromCookie.isBlank()) {
                log.debug("Token resolved from Cookie: {}", JWT_COOKIE_NAME);
                return tokenFromCookie;
            }
        }

        // 2. Если в Cookie нет, проверяем заголовок Authorization (как запасной вариант)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String tokenFromHeader = authHeader.substring(7);
            if (!tokenFromHeader.trim().isEmpty() && !tokenFromHeader.equals("null") && !tokenFromHeader.equals("undefined")) {
                log.debug("Token resolved from Authorization header.");
                return tokenFromHeader;
            }
        }

        return null;
    }
}
