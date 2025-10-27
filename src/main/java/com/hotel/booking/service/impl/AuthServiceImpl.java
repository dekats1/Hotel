package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.UserRole;
import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;
import com.hotel.booking.dto.response.auth.UserInfoResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.security.JwtTokenProvider;
import com.hotel.booking.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        // Проверка email
        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new BadRequestException("Email уже используется");
        }

        // Проверка телефона
        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new BadRequestException("Телефон уже используется");
        }

        // Проверка паролей
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Пароли не совпадают");
        }

        // Создание пользователя
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .middleName(request.getMiddleName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .isActive(true)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Генерация токена
        String token = tokenProvider.generateToken(savedUser.getId());

        return createAuthResponse(token, savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            log.info("Login attempt for email: {}", request.getEmail());

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            log.info("Authentication successful!");
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = (User) authentication.getPrincipal();
            String token = tokenProvider.generateToken(user.getId());

            log.info("Generated token for user: {}", user.getId());
            return createAuthResponse(token, user);
        } catch (BadCredentialsException e) {
            log.error("Bad credentials for email: {}", request.getEmail());
            throw new BadRequestException("Неверный email или пароль");
        }
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        } else {
            // Если principal не User, загружаем по email
            String email = principal.toString();
            return userRepository.findUserByEmail(email).orElse(null);
        }
    }

    @Override
    public User getUserById(UUID userId) {
        log.info("Loading user by ID: {}", userId);
        return userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Пользователь не найден"));
    }

    private AuthResponse createAuthResponse(String token, User user) {
        UserInfoResponse userInfo = UserInfoResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(userInfo)
                .build();
    }
}