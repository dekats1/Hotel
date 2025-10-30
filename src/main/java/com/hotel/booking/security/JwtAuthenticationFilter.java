package com.hotel.booking.security;

import com.hotel.booking.service.impl.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
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
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;

    private static final String JWT_COOKIE_NAME = "auth_jwt";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // ✅ ДОБАВЛЕНО: Логируем все cookies
        log.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        if (request.getCookies() != null) {
            log.debug("Available cookies: {}",
                    Arrays.stream(request.getCookies())
                            .map(Cookie::getName)
                            .toList());
        } else {
            log.debug("No cookies in request");
        }

        String token = resolveToken(request);

        if (token != null) {
            log.debug("Token found, validating...");

            if (jwtProvider.validateToken(token)) {
                try {
                    String userId = jwtProvider.getUserIdFromToken(token);
                    log.info("✅ Extracted user ID from token: {}", userId);

                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = userDetailsService.loadUserById(
                                UUID.fromString(userId));

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
                        log.info("✅ User authenticated successfully: {}", userDetails.getUsername());
                    }
                } catch (Exception e) {
                    log.error("❌ Error loading user: {}", e.getMessage(), e);
                    SecurityContextHolder.clearContext();
                }
            } else {
                log.warn("❌ Token validation failed");
            }
        } else {
            log.warn("❌ No JWT token found in request");
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        // Проверяем Cookie
        if (request.getCookies() != null) {
            String tokenFromCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> JWT_COOKIE_NAME.equals(cookie.getName()))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);

            if (tokenFromCookie != null && !tokenFromCookie.isBlank()) {
                log.info("✅ Token found in Cookie: {}...", tokenFromCookie.substring(0, Math.min(20, tokenFromCookie.length())));
                return tokenFromCookie;
            }
        }

        // Проверяем Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String tokenFromHeader = authHeader.substring(7);
            if (!tokenFromHeader.trim().isEmpty()) {
                log.info("✅ Token found in Authorization header");
                return tokenFromHeader;
            }
        }

        log.warn("❌ No token found in Cookie or Authorization header");
        return null;
    }
}
