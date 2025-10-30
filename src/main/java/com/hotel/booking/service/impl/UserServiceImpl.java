package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.mapper.UserMapper;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    // ========================================
    // ✅ НОВЫЕ МЕТОДЫ для работы с email
    // ========================================

    @Override
    public UserProfileResponse getUserProfileByEmail(String email) {
        log.info("Getting profile for user with email: {}", email);
        User user = findUserByEmail(email);
        return userMapper.toUserProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfileByEmail(String email, UpdateProfileRequest request) {
        log.info("Updating profile for user with email: {}", email);
        User user = findUserByEmail(email);
        return updateProfile(user.getId(), request);
    }

    @Override
    @Transactional
    public void changePasswordByEmail(String email, ChangePasswordRequest request) {
        log.info("Changing password for user with email: {}", email);
        User user = findUserByEmail(email);
        changePassword(user.getId(), request);
    }

    @Override
    public BigDecimal getWalletBalanceByEmail(String email) {
        log.info("Getting wallet balance for user with email: {}", email);
        User user = findUserByEmail(email);
        return user.getBalance();
    }

    @Override
    @Transactional
    public UserSettingsResponse updateUserSettingsByEmail(String email, UserSettingsRequest request) {
        log.info("Updating settings for user with email: {}", email);
        User user = findUserByEmail(email);
        return updateUserSettings(user.getId(), request);
    }

    // ========================================
    // Существующие методы для работы с UUID
    // ========================================

    @Override
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = findUserById(userId);
        return userMapper.toUserProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUserById(userId);
        validateProfileUpdate(user, request);

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());

        User updatedUser = userRepository.save(user);
        return userMapper.toUserProfileResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Текущий пароль неверен");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Пароли не совпадают");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public BigDecimal getWalletBalance(UUID userId) {
        User user = findUserById(userId);
        return user.getBalance();
    }

    @Override
    public UserSettingsResponse getUserSettings(UUID userId) {
        findUserById(userId); // проверка существования
        return new UserSettingsResponse();
    }

    @Override
    @Transactional
    public UserSettingsResponse updateUserSettings(UUID userId, UserSettingsRequest request) {
        User user = findUserById(userId);
        // Здесь можно добавить логику сохранения настроек
        log.info("User currency preference: {}", request.getCurrency());
        log.info("User language preference: {}", request.getLanguage());
        return new UserSettingsResponse();
    }

    // ========================================
    // Private helper methods
    // ========================================

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));
    }

    private User findUserByEmail(String email) {
        return userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private void validateProfileUpdate(User user, UpdateProfileRequest request) {
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsUserByEmail(request.getEmail())) {
            throw new BadRequestException("Email уже используется");
        }

        if (!user.getPhone().equals(request.getPhone()) &&
                userRepository.existsUserByPhone(request.getPhone())) {
            throw new BadRequestException("Телефон уже используется");
        }
    }
}
