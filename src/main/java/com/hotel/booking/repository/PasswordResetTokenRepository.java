package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.PasswordResetToken;
import com.hotel.booking.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findTopByUserOrderByCreatedAtDesc(User user);

    Optional<PasswordResetToken> findByUserAndVerificationCodeAndUsedIsFalse(User user, String verificationCode);

    void deleteByUser(User user);
}

