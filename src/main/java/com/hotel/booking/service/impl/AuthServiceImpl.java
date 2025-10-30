package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.mapper.AuthResponseMapper;
import com.hotel.booking.mapper.UserMapper;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuthResponseMapper authResponseMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        validateRegistrationRequest(request);

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        String token = tokenProvider.generateToken(savedUser.getId());
        return authResponseMapper.toAuthResponse(token, savedUser);
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

            // ✅ ИСПРАВЛЕНО: Получаем email из UserDetails и загружаем User entity из БД
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();

            log.info("Loading user entity by email: {}", email);
            User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new BadRequestException("Пользователь не найден"));

            String token = tokenProvider.generateToken(user.getId());
            log.info("Generated token for user: {}", user.getId());

            return authResponseMapper.toAuthResponse(token, user);

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

        // ✅ ИСПРАВЛЕНО: Principal всегда будет UserDetails, получаем email
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findUserByEmail(email).orElse(null);
        }

        return null;
    }

    @Override
    public User getUserById(UUID userId) {
        log.info("Loading user by ID: {}", userId);
        return userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("Пользователь не найден"));
    }

    private void validateRegistrationRequest(RegisterRequest request) {
        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new BadRequestException("Email уже используется");
        }

        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new BadRequestException("Телефон уже используется");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Пароли не совпадают");
        }
    }
}
