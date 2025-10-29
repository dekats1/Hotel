package com.hotel.booking.dto.response.user;

import com.hotel.booking.domain.enums.UserGender;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;


@Builder
@Value
@AllArgsConstructor
public class
UserProfileResponse {
    String id;
    String email;
    String firstName;
    String lastName;
    String phone;
    LocalDate birthDate;
    UserGender gender;
    BigDecimal balance;
    String role;
    Boolean emailVerified;
    Boolean isActive;

    // Статистика (можно добавить позже)
    Integer totalBookings;
    Double averageRating;
    Integer membershipYears;
}