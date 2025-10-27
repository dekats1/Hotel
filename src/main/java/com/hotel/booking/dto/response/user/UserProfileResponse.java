package com.hotel.booking.dto.response.user;

import com.hotel.booking.domain.enums.UserGender;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String middleName;
    private String phone;
    private LocalDate birthDate;
    private UserGender gender;
    private BigDecimal balance;
    private String role;
    private Boolean emailVerified;
    private Boolean isActive;

    // Статистика (можно добавить позже)
    private Integer totalBookings;
    private Double averageRating;
    private Integer membershipYears;
}