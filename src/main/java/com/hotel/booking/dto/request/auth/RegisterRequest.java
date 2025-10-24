package com.hotel.booking.dto.request.auth;

import com.hotel.booking.domain.enums.UserGender;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Имя обязательно")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Фамилия обязательна")
    @Size(max = 100)
    private String lastName;

    @Size(max = 100)
    private String middleName;

    @NotBlank(message = "Email обязателен")
    @Email
    private String email;

    @NotBlank(message = "Телефон обязателен")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String phone;

    @NotNull(message = "Дата рождения обязательна")
    @Past
    private LocalDate birthDate;

    @NotNull(message = "Пол обязателен")
    private UserGender gender;

    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, message = "Пароль должен содержать минимум 6 символов")
    private String password;

    @NotBlank(message = "Подтверждение пароля обязательно")
    private String confirmPassword;
}