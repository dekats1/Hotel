package com.hotel.booking.service;

import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

public interface UserService {
    UserProfileResponse getUserProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request);
    void changePassword(UUID userId, ChangePasswordRequest request);
    BigDecimal getWalletBalance(UUID userId);

    UserSettingsResponse getUserSettings(UUID userId);
    UserSettingsResponse updateUserSettings(UUID userId, UserSettingsRequest request);
}