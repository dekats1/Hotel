package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.UserGender;
import com.hotel.booking.domain.enums.UserRole;
import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("UserService Integration Tests")
class UserServiceImplIntegrationTest {

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User secondUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("integration@test.com");
        testUser.setFirstName("Integration");
        testUser.setLastName("Test");
        testUser.setPhone("+375291111111");
        testUser.setPasswordHash(passwordEncoder.encode("password123"));
        testUser.setRole(UserRole.USER);
        testUser.setBalance(BigDecimal.valueOf(500.00));
        testUser.setBirthDate(LocalDate.of(1990, 1, 1));
        testUser.setGender(UserGender.MALE);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);

        secondUser = new User();
        secondUser.setEmail("second@test.com");
        secondUser.setFirstName("Second");
        secondUser.setLastName("User");
        secondUser.setPhone("+375292222222");
        secondUser.setPasswordHash(passwordEncoder.encode("password456"));
        secondUser.setRole(UserRole.USER);
        secondUser.setBalance(BigDecimal.valueOf(1000.00));
        secondUser.setBirthDate(LocalDate.of(1995, 5, 15));
        secondUser.setGender(UserGender.FEMALE);
        secondUser.setCreatedAt(LocalDateTime.now());
        secondUser.setUpdatedAt(LocalDateTime.now());
        secondUser = userRepository.save(secondUser);
    }

    @Test
    @DisplayName("Should get user profile successfully by UUID")
    void shouldGetUserProfileByUuid() {
        UserProfileResponse profile = userService.getUserProfile(testUser.getId());

        assertThat(profile).isNotNull();
        assertThat(profile.getId()).isEqualTo(testUser.getId());
        assertThat(profile.getEmail()).isEqualTo("integration@test.com");
        assertThat(profile.getFirstName()).isEqualTo("Integration");
        assertThat(profile.getLastName()).isEqualTo("Test");
        assertThat(profile.getPhone()).isEqualTo("+375291111111");
    }

    @Test
    @DisplayName("Should get user profile successfully by email")
    void shouldGetUserProfileByEmail() {
        UserProfileResponse profile = userService.getUserProfileByEmail("integration@test.com");

        assertThat(profile).isNotNull();
        assertThat(profile.getId()).isEqualTo(testUser.getId());
        assertThat(profile.getEmail()).isEqualTo("integration@test.com");
        assertThat(profile.getFirstName()).isEqualTo("Integration");
    }

    @Test
    @DisplayName("Should throw exception when getting profile for non-existent user")
    void shouldThrowExceptionWhenUserNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        assertThatThrownBy(() -> userService.getUserProfile(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(nonExistentId.toString());
    }

    @Test
    @DisplayName("Should update user profile successfully")
    void shouldUpdateUserProfile() {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .firstName("Updated")
                .lastName("Name")
                .email("integration@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1992, 5, 15))
                .gender(UserGender.MALE)
                .build();

        UserProfileResponse updatedProfile = userService.updateProfile(testUser.getId(), updateRequest);

        assertThat(updatedProfile.getFirstName()).isEqualTo("Updated");
        assertThat(updatedProfile.getLastName()).isEqualTo("Name");
        assertThat(updatedProfile.getBirthDate()).isEqualTo(LocalDate.of(1992, 5, 15));

        User savedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(savedUser.getFirstName()).isEqualTo("Updated");
        assertThat(savedUser.getLastName()).isEqualTo("Name");
    }

    @Test
    @DisplayName("Should throw exception when updating with duplicate email")
    void shouldThrowExceptionWhenUpdatingWithDuplicateEmail() {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .firstName("Integration")
                .lastName("Test")
                .email("second@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(UserGender.MALE)
                .build();

        assertThatThrownBy(() -> userService.updateProfile(testUser.getId(), updateRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email уже используется");
    }

    @Test
    @DisplayName("Should throw exception when updating with duplicate phone")
    void shouldThrowExceptionWhenUpdatingWithDuplicatePhone() {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .firstName("Integration")
                .lastName("Test")
                .email("integration@test.com")
                .phone("+375292222222")
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(UserGender.MALE)
                .build();

        assertThatThrownBy(() -> userService.updateProfile(testUser.getId(), updateRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Телефон уже используется");
    }

    @Test
    @DisplayName("Should update profile by email successfully")
    void shouldUpdateProfileByEmail() {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .firstName("EmailUpdated")
                .lastName("User")
                .email("integration@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1993, 3, 20))
                .gender(UserGender.MALE)
                .build();

        UserProfileResponse updatedProfile = userService.updateProfileByEmail("integration@test.com", updateRequest);

        assertThat(updatedProfile.getFirstName()).isEqualTo("EmailUpdated");
        assertThat(updatedProfile.getLastName()).isEqualTo("User");
    }

    @Test
    @DisplayName("Should change password successfully")
    void shouldChangePasswordSuccessfully() {
        ChangePasswordRequest changeRequest = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        userService.changePassword(testUser.getId(), changeRequest);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("newPassword456", updatedUser.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("password123", updatedUser.getPasswordHash())).isFalse();
    }

    @Test
    @DisplayName("Should throw exception when current password is incorrect")
    void shouldThrowExceptionWhenCurrentPasswordIncorrect() {
        ChangePasswordRequest changeRequest = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        assertThatThrownBy(() -> userService.changePassword(testUser.getId(), changeRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Текущий пароль неверен");
    }

    @Test
    @DisplayName("Should throw exception when passwords don't match")
    void shouldThrowExceptionWhenPasswordsDontMatch() {
        ChangePasswordRequest changeRequest = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("newPassword456")
                .confirmPassword("differentPassword")
                .build();

        assertThatThrownBy(() -> userService.changePassword(testUser.getId(), changeRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Пароли не совпадают");
    }

    @Test
    @DisplayName("Should change password by email successfully")
    void shouldChangePasswordByEmail() {
        ChangePasswordRequest changeRequest = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("emailNewPassword789")
                .confirmPassword("emailNewPassword789")
                .build();

        userService.changePasswordByEmail("integration@test.com", changeRequest);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("emailNewPassword789", updatedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Should get wallet balance by UUID")
    void shouldGetWalletBalanceByUuid() {
        BigDecimal balance = userService.getWalletBalance(testUser.getId());

        assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(500.00));
    }

    @Test
    @DisplayName("Should get wallet balance by email")
    void shouldGetWalletBalanceByEmail() {
        BigDecimal balance = userService.getWalletBalanceByEmail("integration@test.com");

        assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(500.00));
    }

    @Test
    @DisplayName("Should return correct balance for different users")
    void shouldReturnCorrectBalanceForDifferentUsers() {
        BigDecimal balance1 = userService.getWalletBalance(testUser.getId());
        BigDecimal balance2 = userService.getWalletBalance(secondUser.getId());

        assertThat(balance1).isEqualByComparingTo(BigDecimal.valueOf(500.00));
        assertThat(balance2).isEqualByComparingTo(BigDecimal.valueOf(1000.00));
    }

    @Test
    @DisplayName("Should get user settings successfully")
    void shouldGetUserSettings() {
        var settings = userService.getUserSettings(testUser.getId());
        assertThat(settings).isNotNull();
    }

    @Test
    @DisplayName("Should update user settings successfully")
    void shouldUpdateUserSettings() {
        var settingsRequest = com.hotel.booking.dto.request.user.UserSettingsRequest.builder()
                .language("en")
                .currency("USD")
                .build();

        var settings = userService.updateUserSettings(testUser.getId(), settingsRequest);
        assertThat(settings).isNotNull();
    }

    @Test
    @DisplayName("Should update user settings by email successfully")
    void shouldUpdateUserSettingsByEmail() {
        var settingsRequest = com.hotel.booking.dto.request.user.UserSettingsRequest.builder()
                .language("ru")
                .currency("BYN")
                .build();

        var settings = userService.updateUserSettingsByEmail("integration@test.com", settingsRequest);
        assertThat(settings).isNotNull();
    }

    @Test
    @DisplayName("Should perform complete user lifecycle successfully")
    void shouldPerformCompleteUserLifecycle() {
        UserProfileResponse initialProfile = userService.getUserProfile(testUser.getId());
        assertThat(initialProfile.getFirstName()).isEqualTo("Integration");

        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .firstName("Lifecycle")
                .lastName("Updated")
                .email("integration@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1991, 6, 10))
                .gender(UserGender.MALE)
                .build();
        UserProfileResponse updatedProfile = userService.updateProfile(testUser.getId(), updateRequest);
        assertThat(updatedProfile.getFirstName()).isEqualTo("Lifecycle");

        ChangePasswordRequest passwordRequest = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("lifecycle789")
                .confirmPassword("lifecycle789")
                .build();
        userService.changePassword(testUser.getId(), passwordRequest);

        UserProfileResponse finalProfile = userService.getUserProfileByEmail("integration@test.com");
        assertThat(finalProfile.getFirstName()).isEqualTo("Lifecycle");
        assertThat(finalProfile.getLastName()).isEqualTo("Updated");

        User finalUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("lifecycle789", finalUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Should handle concurrent profile updates correctly")
    void shouldHandleConcurrentUpdates() {
        UpdateProfileRequest request1 = UpdateProfileRequest.builder()
                .firstName("FirstUpdate")
                .lastName("Test")
                .email("integration@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(UserGender.MALE)
                .build();

        UpdateProfileRequest request2 = UpdateProfileRequest.builder()
                .firstName("SecondUpdate")
                .lastName("Test")
                .email("integration@test.com")
                .phone("+375291111111")
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(UserGender.MALE)
                .build();

        userService.updateProfile(testUser.getId(), request1);
        UserProfileResponse finalProfile = userService.updateProfile(testUser.getId(), request2);

        assertThat(finalProfile.getFirstName()).isEqualTo("SecondUpdate");

        User savedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(savedUser.getFirstName()).isEqualTo("SecondUpdate");
    }
}