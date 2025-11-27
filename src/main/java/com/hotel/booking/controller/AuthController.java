package com.hotel.booking.controller;

import com.hotel.booking.dto.request.auth.ForgotPasswordRequest;
import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.request.auth.ResetPasswordRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.service.AuthService;
import com.hotel.booking.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    private static final int COOKIE_MAX_AGE = 24 * 60 * 60;
    private static final String JWT_COOKIE_NAME = "auth_jwt";

    private ResponseCookie createJwtCookie(String token, int maxAge) {
        log.info("Creating JWT cookie with token: {}...", token.substring(0, Math.min(20, token.length())));

        return ResponseCookie.from(JWT_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for: {}", request.getEmail());

        AuthResponse authResponse = authService.register(request);
        ResponseCookie cookie = createJwtCookie(authResponse.getToken(), COOKIE_MAX_AGE);

        log.info("Registration successful, cookie set for: {}", request.getEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for: {}", request.getEmail());

        AuthResponse authResponse = authService.login(request);
        ResponseCookie cookie = createJwtCookie(authResponse.getToken(), COOKIE_MAX_AGE);

        log.info("Login successful, cookie set for: {}", request.getEmail());
        log.info("Cookie header: {}", cookie.toString());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        log.info("👋 Logout request received");

        ResponseCookie cookie = createJwtCookie("", 0);

        log.info("Logout successful, cookie cleared");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request for: {}", request.getEmail());
        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Код для восстановления пароля отправлен на email"));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request for: {}", request.getEmail());

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Пароли не совпадают");
        }

        passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Пароль успешно обновлен"));
    }
}
