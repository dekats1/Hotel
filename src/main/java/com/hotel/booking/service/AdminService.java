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

    List<AdminUserDetailsResponse> getAllUsers();
    AdminUserDetailsResponse createUser(AdminUserCreateRequest request);
    AdminUserDetailsResponse getUserById(UUID userId);
    AdminUserDetailsResponse updateUser(UUID userId, AdminUserUpdateRequest request);
    AdminUserDetailsResponse getUserByEmail(String email);
    void deleteUser(UUID userId);

    AdminRoomDetailsResponse createRoom(CreateRoomRequest request);
    List<AdminRoomDetailsResponse> getAllRooms();
    AdminRoomDetailsResponse updateRoom(UUID roomId, UpdateRoomRequest request);
    void deleteRoom(UUID roomId);

    AdminRoomDetailsResponse setRoomActive(UUID roomId, boolean value);

    AdminRoomDetailsResponse uploadRoomPhotos(UUID roomId, List<MultipartFile> files);
    void deleteRoomPhoto(UUID photoId);
    AdminRoomDetailsResponse setPrimaryRoomPhoto(UUID photoId);

    AdminRoomDetailsResponse replaceRoomTranslations(UUID roomId, Map<LanguageCode, CreateRoomRequest.TranslationData> translations);
    AdminRoomDetailsResponse patchRoomTranslations(UUID roomId, Map<LanguageCode, CreateRoomRequest.TranslationData> translations);

    List<AdminBookingDetailsResponse> getAllBookings();
    AdminBookingDetailsResponse updateBookingStatus(UUID bookingId, String newStatus);

    List<AdminReviewResponse> getAllReviews();
    AdminReviewResponse updateReviewVisibility(UUID reviewId, boolean isVisible);
    AdminReviewResponse approveReview(UUID reviewId, boolean isApproved);
    void deleteReview(UUID reviewId);
}
