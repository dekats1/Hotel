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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    UserRepository userRepository;
    @Mock
    AuthenticationManager authenticationManager;
    @Mock
    JwtTokenProvider tokenProvider;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    UserMapper userMapper;
    @Mock
    AuthResponseMapper authResponseMapper;

    @InjectMocks
    AuthServiceImpl authService;

    @Test
    void register_successful() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@mail.com");
        request.setPassword("pass123");
        request.setConfirmPassword("pass123");
        request.setPhone("123");

        User user = new User();
        when(userRepository.existsUserByEmail("test@mail.com")).thenReturn(false);
        when(userRepository.existsUserByPhone("123")).thenReturn(false);
        when(userMapper.toEntity(request)).thenReturn(user);

        user.setPasswordHash("hashed");
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(tokenProvider.generateToken(savedUser.getId())).thenReturn("jwt-token");
        AuthResponse expected = new AuthResponse();
        when(authResponseMapper.toAuthResponse("jwt-token", savedUser)).thenReturn(expected);

        AuthResponse result = authService.register(request);

        assertEquals(expected, result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_emailExists_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("used@mail.com");
        request.setPassword("pass123");
        request.setConfirmPassword("pass123");
        request.setPhone("321");

        when(userRepository.existsUserByEmail("used@mail.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    void login_successful() {
        LoginRequest request = new LoginRequest();
        request.setEmail("login@mail.com");
        request.setPassword("password");

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        UserDetails userDetails = mock(UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("login@mail.com");

        User user = new User();
        user.setId(UUID.randomUUID());
        when(userRepository.findUserByEmail("login@mail.com")).thenReturn(Optional.of(user));

        when(tokenProvider.generateToken(user.getId())).thenReturn("jwt-token");
        AuthResponse expected = new AuthResponse();
        when(authResponseMapper.toAuthResponse("jwt-token", user)).thenReturn(expected);

        AuthResponse result = authService.login(request);

        assertEquals(expected, result);
    }

    @Test
    void getCurrentUser_authenticated_returnsUser() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("current@mail.com");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(userDetails);

        SecurityContextHolder.getContext().setAuthentication(auth);

        User user = new User();
        user.setEmail("current@mail.com");
        when(userRepository.findUserByEmail("current@mail.com")).thenReturn(Optional.of(user));

        User result = authService.getCurrentUser();

        assertEquals(user, result);
    }
}
