package com.hotel.booking.service;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.auth.LoginRequest;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.response.auth.AuthResponse;

import java.util.UUID;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getCurrentUser();
    User getUserById(UUID userId);
}