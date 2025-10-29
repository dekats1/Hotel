package com.hotel.booking.controller;

import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;
import com.hotel.booking.dto.response.auth.UserInfoResponse; // 💡 Добавлен для типа ответа в Logout
import com.hotel.booking.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Время жизни Cookie (24 часа)
    private static final int COOKIE_MAX_AGE = 24 * 60 * 60;

    // Имя JWT Cookie
    private static final String JWT_COOKIE_NAME = "auth_jwt";

    private ResponseCookie createJwtCookie(String token, int maxAge) {
        return ResponseCookie.from(JWT_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    // --- Эндпоинт регистрации ---
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // 1. Регистрируем пользователя и получаем AuthResponse (который содержит JWT и User DTO)
        AuthResponse authResponse = authService.register(request);

        // 2. Создаем HTTP-only Cookie для токена
        ResponseCookie cookie = createJwtCookie(authResponse.getToken(), COOKIE_MAX_AGE);

        // 3. 💡 ИЗМЕНЕНИЕ: Возвращаем полный объект authResponse в теле.
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse); // ⬅️ ОТПРАВЛЯЕМ ПОЛНЫЙ AuthResponse
    }

    // --- Эндпоинт входа ---
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        // 1. Аутентифицируем пользователя и получаем AuthResponse
        AuthResponse authResponse = authService.login(request);

        // 2. Создаем HTTP-only Cookie для токена
        ResponseCookie cookie = createJwtCookie(authResponse.getToken(), COOKIE_MAX_AGE);

        // 3. 💡 ИЗМЕНЕНИЕ: Возвращаем полный объект authResponse в теле.
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse); // ⬅️ ОТПРАВЛЯЕМ ПОЛНЫЙ AuthResponse
    }

    // --- Эндпоинт выхода (Logout) ---
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        // Создаем "пустой" Cookie с maxAge=0, чтобы принудительно удалить его
        ResponseCookie cookie = createJwtCookie("", 0);

        // Отправляем ответ с заголовком, удаляющим Cookie
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
}
