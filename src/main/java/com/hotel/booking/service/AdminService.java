package com.hotel.booking.service;

import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.dto.request.admin.AdminUserCreateRequest;
import com.hotel.booking.dto.request.admin.AdminUserUpdateRequest;
import com.hotel.booking.dto.request.room.CreateRoomRequest;
import com.hotel.booking.dto.request.room.UpdateRoomRequest;
import com.hotel.booking.dto.response.admin.AdminBookingDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminReviewResponse;
import com.hotel.booking.dto.response.admin.AdminRoomDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminUserDetailsResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AdminService {

    // --- Пользователи ---
    List<AdminUserDetailsResponse> getAllUsers();
    AdminUserDetailsResponse createUser(AdminUserCreateRequest request);
    AdminUserDetailsResponse getUserById(UUID userId);
    AdminUserDetailsResponse updateUser(UUID userId, AdminUserUpdateRequest request);
    AdminUserDetailsResponse getUserByEmail(String email);
    void deleteUser(UUID userId);

    // --- Номера ---
    AdminRoomDetailsResponse createRoom(CreateRoomRequest request);
    List<AdminRoomDetailsResponse> getAllRooms();
    AdminRoomDetailsResponse updateRoom(UUID roomId, UpdateRoomRequest request);
    void deleteRoom(UUID roomId);

    // Новый: активность номера
    AdminRoomDetailsResponse setRoomActive(UUID roomId, boolean value);

    // Новые: фото номера
    AdminRoomDetailsResponse uploadRoomPhotos(UUID roomId, List<MultipartFile> files);
    void deleteRoomPhoto(UUID photoId);
    AdminRoomDetailsResponse setPrimaryRoomPhoto(UUID photoId);

    // Новые: переводы
    AdminRoomDetailsResponse replaceRoomTranslations(UUID roomId, Map<LanguageCode, CreateRoomRequest.TranslationData> translations);
    AdminRoomDetailsResponse patchRoomTranslations(UUID roomId, Map<LanguageCode, CreateRoomRequest.TranslationData> translations);

    // --- Бронирования ---
    List<AdminBookingDetailsResponse> getAllBookings();
    AdminBookingDetailsResponse updateBookingStatus(UUID bookingId, String newStatus);

    // --- Отзывы ---
    List<AdminReviewResponse> getAllReviews();
    AdminReviewResponse updateReviewVisibility(UUID reviewId, boolean isVisible);
    void deleteReview(UUID reviewId);
}
