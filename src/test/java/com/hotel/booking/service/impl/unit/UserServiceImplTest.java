package com.hotel.booking.service.impl.unit;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.UserGender;
import com.hotel.booking.domain.enums.UserRole;
import com.hotel.booking.dto.request.user.ChangePasswordRequest;
import com.hotel.booking.dto.request.user.UpdateProfileRequest;
import com.hotel.booking.dto.request.user.UserSettingsRequest;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.user.UserSettingsResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.mapper.UserMapper;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private UUID testUserId;
    private String testEmail;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testEmail = "test@example.com";

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail(testEmail);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setPhone("+375291234567");
        testUser.setPasswordHash("$2a$10$hashedPassword");
        testUser.setRole(UserRole.USER);
        testUser.setBalance(BigDecimal.valueOf(1000.00));
        testUser.setBirthDate(LocalDate.of(1990, 1, 1));
        testUser.setGender(UserGender.MALE);
    }

    @Test
    @DisplayName("Should return user profile when user exists by UUID")
    void getUserProfile_WhenUserExists_ReturnsProfile() {
        UserProfileResponse expectedResponse = UserProfileResponse.builder()
                .id(testUserId)
                .email(testEmail)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userMapper.toUserProfileResponse(testUser)).thenReturn(expectedResponse);

        UserProfileResponse result = userService.getUserProfile(testUserId);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(testEmail);
        assertThat(result.getFirstName()).isEqualTo("John");
        verify(userRepository).findById(testUserId);
        verify(userMapper).toUserProfileResponse(testUser);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found by UUID")
    void getUserProfile_WhenUserNotFound_ThrowsException() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile(testUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(testUserId.toString());

        verify(userRepository).findById(testUserId);
        verifyNoInteractions(userMapper);
    }

    @Test
    @DisplayName("Should return user profile when user exists by email")
    void getUserProfileByEmail_WhenUserExists_ReturnsProfile() {
        UserProfileResponse expectedResponse = UserProfileResponse.builder()
                .id(testUserId)
                .email(testEmail)
                .firstName("John")
                .build();

        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(userMapper.toUserProfileResponse(testUser)).thenReturn(expectedResponse);

        UserProfileResponse result = userService.getUserProfileByEmail(testEmail);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(testEmail);
        verify(userRepository).findUserByEmail(testEmail);
        verify(userMapper).toUserProfileResponse(testUser);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found by email")
    void getUserProfileByEmail_WhenUserNotFound_ThrowsException() {
        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfileByEmail(testEmail))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(testEmail);

        verify(userRepository).findUserByEmail(testEmail);
        verifyNoInteractions(userMapper);
    }

    @Test
    @DisplayName("Should successfully update user profile")
    void updateProfile_WhenValidRequest_UpdatesSuccessfully() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email(testEmail)
                .phone("+375291234567")
                .birthDate(LocalDate.of(1995, 5, 15))
                .gender(UserGender.FEMALE)
                .build();

        User updatedUser = new User();
        updatedUser.setId(testUserId);
        updatedUser.setFirstName("Jane");
        updatedUser.setLastName("Smith");
        updatedUser.setEmail(testEmail);

        UserProfileResponse expectedResponse = UserProfileResponse.builder()
                .id(testUserId)
                .firstName("Jane")
                .lastName("Smith")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(updatedUser);
        when(userMapper.toUserProfileResponse(updatedUser)).thenReturn(expectedResponse);

        UserProfileResponse result = userService.updateProfile(testUserId, request);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getLastName()).isEqualTo("Smith");

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(User.class));
        verify(userMapper).toUserProfileResponse(updatedUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException when email already exists")
    void updateProfile_WhenEmailExists_ThrowsException() {
        String newEmail = "newemail@example.com";
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email(newEmail)
                .phone(testUser.getPhone())
                .birthDate(LocalDate.of(1995, 5, 15))
                .gender(UserGender.FEMALE)
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsUserByEmail(newEmail)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(testUserId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email уже используется");

        verify(userRepository).findById(testUserId);
        verify(userRepository).existsUserByEmail(newEmail);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when phone already exists")
    void updateProfile_WhenPhoneExists_ThrowsException() {
        String newPhone = "+375297777777";
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email(testEmail)
                .phone(newPhone)
                .birthDate(LocalDate.of(1995, 5, 15))
                .gender(UserGender.FEMALE)
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsUserByPhone(newPhone)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(testUserId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Телефон уже используется");

        verify(userRepository).findById(testUserId);
        verify(userRepository).existsUserByPhone(newPhone);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully change password when current password is correct")
    void changePassword_WhenCurrentPasswordCorrect_ChangesSuccessfully() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", "$2a$10$hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword456")).thenReturn("$2a$10$newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changePassword(testUserId, request);

        verify(userRepository).findById(testUserId);
        verify(passwordEncoder).matches("oldPassword123", "$2a$10$hashedPassword");
        verify(passwordEncoder).encode("newPassword456");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException when current password is incorrect")
    void changePassword_WhenCurrentPasswordIncorrect_ThrowsException() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", testUser.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(testUserId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Текущий пароль неверен");

        verify(userRepository).findById(testUserId);
        verify(passwordEncoder).matches("wrongPassword", testUser.getPasswordHash());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when passwords don't match")
    void changePassword_WhenPasswordsDontMatch_ThrowsException() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword456")
                .confirmPassword("differentPassword")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", testUser.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword(testUserId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Пароли не совпадают");

        verify(userRepository).findById(testUserId);
        verify(passwordEncoder).matches("oldPassword123", testUser.getPasswordHash());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should return wallet balance by UUID")
    void getWalletBalance_WhenUserExists_ReturnsBalance() {
        BigDecimal expectedBalance = BigDecimal.valueOf(1000.00);
        testUser.setBalance(expectedBalance);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        BigDecimal result = userService.getWalletBalance(testUserId);

        assertThat(result).isEqualTo(expectedBalance);
        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should return wallet balance by email")
    void getWalletBalanceByEmail_WhenUserExists_ReturnsBalance() {
        BigDecimal expectedBalance = BigDecimal.valueOf(1500.50);
        testUser.setBalance(expectedBalance);

        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.of(testUser));

        BigDecimal result = userService.getWalletBalanceByEmail(testEmail);

        assertThat(result).isEqualTo(expectedBalance);
        verify(userRepository).findUserByEmail(testEmail);
    }

    @Test
    @DisplayName("Should return user settings when user exists")
    void getUserSettings_WhenUserExists_ReturnsSettings() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        UserSettingsResponse result = userService.getUserSettings(testUserId);

        assertThat(result).isNotNull();
        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found for settings")
    void getUserSettings_WhenUserNotFound_ThrowsException() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserSettings(testUserId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should update user settings successfully")
    void updateUserSettings_WhenValidRequest_UpdatesSuccessfully() {
        UserSettingsRequest request = UserSettingsRequest.builder()
                .language("en")
                .currency("USD")
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        UserSettingsResponse result = userService.updateUserSettings(testUserId, request);

        assertThat(result).isNotNull();
        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should update user settings by email successfully")
    void updateUserSettingsByEmail_WhenValidRequest_UpdatesSuccessfully() {
        UserSettingsRequest request = UserSettingsRequest.builder()
                .language("ru")
                .currency("BYN")
                .build();

        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        UserSettingsResponse result = userService.updateUserSettingsByEmail(testEmail, request);

        assertThat(result).isNotNull();
        verify(userRepository).findUserByEmail(testEmail);
    }

    @Test
    @DisplayName("Should update profile by email successfully")
    void updateProfileByEmail_WhenValidRequest_UpdatesSuccessfully() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("UpdatedName")
                .lastName("UpdatedLastName")
                .email(testEmail)
                .phone(testUser.getPhone())
                .birthDate(LocalDate.of(1992, 3, 20))
                .gender(UserGender.MALE)
                .build();

        User updatedUser = new User();
        updatedUser.setId(testUserId);
        updatedUser.setFirstName("UpdatedName");

        UserProfileResponse expectedResponse = UserProfileResponse.builder()
                .id(testUserId)
                .firstName("UpdatedName")
                .build();

        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(updatedUser);
        when(userMapper.toUserProfileResponse(updatedUser)).thenReturn(expectedResponse);

        UserProfileResponse result = userService.updateProfileByEmail(testEmail, request);

        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("UpdatedName");
        verify(userRepository).findUserByEmail(testEmail);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should change password by email successfully")
    void changePasswordByEmail_WhenValidRequest_ChangesSuccessfully() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword123")
                .newPassword("newPassword789")
                .confirmPassword("newPassword789")
                .build();

        when(userRepository.findUserByEmail(testEmail)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", testUser.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.encode("newPassword789")).thenReturn("$2a$10$newHash");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changePasswordByEmail(testEmail, request);

        verify(userRepository).findUserByEmail(testEmail);
        verify(passwordEncoder).encode("newPassword789");
        verify(userRepository).save(testUser);
    }
}