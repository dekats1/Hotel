package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.PasswordResetToken;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.repository.PasswordResetTokenRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.EmailService;
import com.hotel.booking.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.password-reset.code-length:6}")
    private int codeLength;

    @Value("${app.password-reset.expiration-minutes:15}")
    private long expirationMinutes;

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new BadRequestException("Пользователь с таким email не найден"));

        tokenRepository.deleteByUser(user);

        String verificationCode = generateVerificationCode();
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .verificationCode(verificationCode)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .used(false)
                .build();

        tokenRepository.save(token);
        emailService.sendPasswordResetEmail(user, verificationCode);
        log.info("Password reset code generated for user {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(String email, String verificationCode, String newPassword) {
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new BadRequestException("Пользователь с таким email не найден"));

        PasswordResetToken token = tokenRepository.findByUserAndVerificationCodeAndUsedIsFalse(user, verificationCode)
                .orElseThrow(() -> new BadRequestException("Неверный код подтверждения"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Срок действия кода истек");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("Password reset successful for {}", email);
    }

    private String generateVerificationCode() {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < codeLength; i++) {
            builder.append(secureRandom.nextInt(10));
        }
        return builder.toString();
    }
}

