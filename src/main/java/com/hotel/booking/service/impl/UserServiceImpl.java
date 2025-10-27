package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = null;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ChangeSetPersister.NotFoundException());
        } catch (ChangeSetPersister.NotFoundException e) {
            throw new RuntimeException(e);
        }

        // Расчет статистики (можно вынести в отдельный сервис)
        int totalBookings = user.getBookings() != null ? user.getBookings().size() : 0;
        int membershipYears = LocalDate.now().getYear() -  LocalDate.ofInstant(user.getCreatedAt(), ZoneId.systemDefault()).getYear();;

        return UserProfileResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .middleName(user.getMiddleName())
                .phone(user.getPhone())
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .balance(user.getBalance())
                .role(user.getRole().name())
                .emailVerified(user.getEmailVerified())
                .isActive(user.getIsActive())
                .totalBookings(totalBookings)
                .membershipYears(membershipYears)
                .build();
    }


    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = null;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ChangeSetPersister.NotFoundException());
        } catch (ChangeSetPersister.NotFoundException e) {
            throw new RuntimeException(e);
        }

        // Проверка email на уникальность (если изменился)
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsUserByEmail(request.getEmail())) {
            throw new BadRequestException("Email уже используется");
        }

        // Проверка телефона на уникальность (если изменился)
        if (!user.getPhone().equals(request.getPhone()) &&
                userRepository.existsUserByPhone(request.getPhone())) {
            throw new BadRequestException("Телефон уже используется");
        }

        // Обновление данных
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setMiddleName(request.getMiddleName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());

        User updatedUser = userRepository.save(user);
        return getUserProfile(updatedUser.getId());
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = null;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ChangeSetPersister.NotFoundException());
        } catch (ChangeSetPersister.NotFoundException e) {
            throw new RuntimeException(e);
        }

        // Проверка текущего пароля
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Текущий пароль неверен");
        }

        // Проверка совпадения новых паролей
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Пароли не совпадают");
        }

        // Установка нового пароля
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public BigDecimal getWalletBalance(UUID userId) {
        User user = null;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ChangeSetPersister.NotFoundException());
        } catch (ChangeSetPersister.NotFoundException e) {
            throw new RuntimeException(e);
        }
        return user.getBalance();
    }

    @Override
    public UserSettingsResponse getUserSettings(UUID userId) {
        // Возвращаем пустой объект, так как настройки на фронтенде
        return new UserSettingsResponse();
    }

    @Transactional
    @Override
    public UserSettingsResponse updateUserSettings(UUID userId, UserSettingsRequest request) {
        User user = null;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ChangeSetPersister.NotFoundException());
        } catch (ChangeSetPersister.NotFoundException e) {
            throw new RuntimeException(e);
        }

        // Здесь можно сохранить валюту и язык в профиль пользователя если нужно
        // Но обычно это сохраняется отдельно для каждого заказа
        System.out.println("User currency preference: " + request.getCurrency());
        System.out.println("User language preference: " + request.getLanguage());

        return new UserSettingsResponse();
    }
}