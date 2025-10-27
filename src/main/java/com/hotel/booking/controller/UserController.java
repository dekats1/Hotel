package com.hotel.booking.controller;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import com.hotel.booking.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            UserProfileResponse profile = userService.getUserProfile(user.getId());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfileResponse updatedProfile = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(updatedProfile);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok().body("Пароль успешно изменен");
    }

    @GetMapping("/wallet")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWalletBalance(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(userService.getWalletBalance(user.getId()));
    }

    @PutMapping("/settings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserSettingsResponse> updateSettings(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserSettingsRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserSettingsResponse response = userService.updateUserSettings(user.getId(), request);
        return ResponseEntity.ok(response);
    }
}