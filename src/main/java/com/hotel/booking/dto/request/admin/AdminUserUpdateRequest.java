package com.hotel.booking.dto.request.admin;

import com.hotel.booking.domain.enums.UserGender;
import com.hotel.booking.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;


@Value
public class AdminUserUpdateRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255)
    String email;

    @NotBlank(message = "Phone is required")
    @Size(max = 20)
    String phone;

    @NotNull(message = "Birth date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    LocalDate birthDate;

    @NotNull(message = "Role is required")
    UserRole role;

    @NotNull(message = "Is active status is required")
    Boolean isActive;

    @NotNull(message = "Email verification status is required")
    Boolean emailVerified;

    @NotNull(message = "Balance is required")
    BigDecimal balance;

    @NotNull(message = "")
    UserGender gender;
}
