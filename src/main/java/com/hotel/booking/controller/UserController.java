package com.hotel.booking.controller;

import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import com.hotel.booking.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        log.info("📋 Getting profile for authenticated user");


        String email = getUserEmailFromAuthentication(authentication);
        log.info("User email: {}", email);

        UserProfileResponse profile = userService.getUserProfileByEmail(email);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {

        log.info("📝 Updating profile for authenticated user");
        String email = getUserEmailFromAuthentication(authentication);

        UserProfileResponse updatedProfile = userService.updateProfileByEmail(email, request);
        return ResponseEntity.ok(updatedProfile);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {

        log.info("🔐 Changing password for authenticated user");
        String email = getUserEmailFromAuthentication(authentication);

        userService.changePasswordByEmail(email, request);
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменен"));
    }

    @GetMapping("/wallet")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BigDecimal> getWalletBalance(Authentication authentication) {
        log.info("💰 Getting wallet balance for authenticated user");
        String email = getUserEmailFromAuthentication(authentication);

        return ResponseEntity.ok(userService.getWalletBalanceByEmail(email));
    }



    @PutMapping("/settings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserSettingsResponse> updateSettings(
            Authentication authentication,
            @Valid @RequestBody UserSettingsRequest request) {

        log.info("⚙️ Updating settings for authenticated user");
        String email = getUserEmailFromAuthentication(authentication);

        UserSettingsResponse response = userService.updateUserSettingsByEmail(email, request);
        return ResponseEntity.ok(response);
    }

    private String getUserEmailFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            log.debug("Extracted email from UserDetails: {}", email);
            return email;
        }

        if (principal instanceof String) {
            log.debug("Extracted email from String principal: {}", principal);
            return (String) principal;
        }

        throw new IllegalStateException("Unable to extract email from authentication principal");
    }
}
