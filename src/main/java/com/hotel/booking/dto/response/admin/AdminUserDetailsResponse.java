package com.hotel.booking.dto.response.admin;

import com.hotel.booking.domain.enums.UserGender;
import com.hotel.booking.domain.enums.UserRole;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminUserDetailsResponse {
    UUID id;
    UserRole role;

    // Персональные данные
    String firstName;
    String lastName;
    String email;
    String phone;
    LocalDate birthDate;
    UserGender gender;

    // Финансы
    BigDecimal balance;

    // Метаданные
    Boolean isActive;
    Boolean emailVerified;
    LocalDateTime createdAt;
    LocalDateTime lastLogin;
}
