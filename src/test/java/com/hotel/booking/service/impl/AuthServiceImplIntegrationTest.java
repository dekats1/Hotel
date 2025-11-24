package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.UserGender;
import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)


@Transactional
class AuthServiceImplIntegrationTest {

    @Autowired
    AuthService authService;
    @Autowired
    UserRepository userRepository;

    @Test
    void register_and_login_flow() {
        RegisterRequest register = new RegisterRequest();
        register.setEmail("int@mail.com");
        register.setPassword("intpass");
        register.setConfirmPassword("intpass");
        register.setPhone("899");
        register.setFirstName("intname");
        register.setLastName("intlastname");
        register.setBirthDate(LocalDate.of(2000, 1, 1));
        register.setGender(UserGender.MALE);

        AuthResponse regResponse = authService.register(register);
        assertNotNull(regResponse.getToken());
        assertNotNull(regResponse.getUser());

        LoginRequest login = new LoginRequest();
        login.setEmail("int@mail.com");
        login.setPassword("intpass");

        AuthResponse loginResponse = authService.login(login);
        assertEquals(regResponse.getUser().getEmail(), loginResponse.getUser().getEmail());
        assertNotNull(loginResponse.getToken());
    }

    @Test
    void getUserById_success() {
        RegisterRequest register = new RegisterRequest();
        register.setEmail("byid@mail.com");
        register.setPassword("passid");
        register.setConfirmPassword("passid");
        register.setPhone("900");
        register.setFirstName("Имя");
        register.setLastName("Фамилия");
        register.setBirthDate(LocalDate.of(1990, 1, 1));

        AuthResponse regResponse = authService.register(register);

        User user = authService.getUserById(regResponse.getUser().getId());
        assertEquals("byid@mail.com", user.getEmail());
    }
}
