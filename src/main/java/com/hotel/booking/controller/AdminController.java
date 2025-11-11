package com.hotel.booking.controller;

import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.dto.request.admin.AdminUserCreateRequest;
import com.hotel.booking.dto.request.admin.AdminUserUpdateRequest;
import com.hotel.booking.dto.request.room.CreateRoomRequest;
import com.hotel.booking.dto.request.room.UpdateRoomRequest;
import com.hotel.booking.dto.response.admin.AdminBookingDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminReviewResponse;
import com.hotel.booking.dto.response.admin.AdminRoomDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminUserDetailsResponse;
import com.hotel.booking.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // --- Users ---
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDetailsResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserDetailsResponse> createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        return ResponseEntity.ok(adminService.createUser(request));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserDetailsResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<AdminUserDetailsResponse> updateUser(@PathVariable UUID userId, @Valid @RequestBody AdminUserUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/profile")
    public ResponseEntity<AdminUserDetailsResponse> getCurrentAdminProfile() {
        // Реализация как была
        return ResponseEntity.ok(adminService.getUserByEmail(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName()));
    }

    // --- Rooms ---
    @PostMapping("/rooms")
    public ResponseEntity<AdminRoomDetailsResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return ResponseEntity.ok(adminService.createRoom(request));
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<AdminRoomDetailsResponse>> getAllRooms() {
        return ResponseEntity.ok(adminService.getAllRooms());
    }

    @PutMapping("/rooms/{roomId}")
    public ResponseEntity<AdminRoomDetailsResponse> updateRoom(@PathVariable UUID roomId, @Valid @RequestBody UpdateRoomRequest request) {
        return ResponseEntity.ok(adminService.updateRoom(roomId, request));
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID roomId) {
        adminService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }

    // Новый: активность номера (isActive)
    @PutMapping("/rooms/{roomId}/active")
    public ResponseEntity<AdminRoomDetailsResponse> setRoomActive(@PathVariable UUID roomId, @RequestParam("value") boolean value) {
        return ResponseEntity.ok(adminService.setRoomActive(roomId, value));
    }

    // Новые: фото номера
    @PostMapping(value = "/rooms/{roomId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminRoomDetailsResponse> uploadRoomPhotos(
            @PathVariable UUID roomId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        return ResponseEntity.ok(adminService.uploadRoomPhotos(roomId, files));
    }

    @DeleteMapping("/rooms/photos/{photoId}")
    public ResponseEntity<Void> deleteRoomPhoto(@PathVariable UUID photoId) {
        adminService.deleteRoomPhoto(photoId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/rooms/photos/{photoId}/primary")
    public ResponseEntity<AdminRoomDetailsResponse> setPrimaryRoomPhoto(@PathVariable UUID photoId) {
        return ResponseEntity.ok(adminService.setPrimaryRoomPhoto(photoId));
    }

    // Новые: переводы номера (Map<LanguageCode, TranslationData>)
    @PutMapping("/rooms/{roomId}/translations")
    public ResponseEntity<AdminRoomDetailsResponse> replaceRoomTranslations(
            @PathVariable UUID roomId,
            @RequestBody Map<LanguageCode, CreateRoomRequest.TranslationData> translations
    ) {
        return ResponseEntity.ok(adminService.replaceRoomTranslations(roomId, translations));
    }

    @PatchMapping("/rooms/{roomId}/translations")
    public ResponseEntity<AdminRoomDetailsResponse> patchRoomTranslations(
            @PathVariable UUID roomId,
            @RequestBody Map<LanguageCode, CreateRoomRequest.TranslationData> translations
    ) {
        return ResponseEntity.ok(adminService.patchRoomTranslations(roomId, translations));
    }

    // --- Bookings ---
    @GetMapping("/bookings")
    public ResponseEntity<List<AdminBookingDetailsResponse>> getAllBookings() {
        return ResponseEntity.ok(adminService.getAllBookings());
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<AdminBookingDetailsResponse> updateBookingStatus(
            @PathVariable UUID bookingId,
            @RequestParam("status") String newStatus
    ) {
        return ResponseEntity.ok(adminService.updateBookingStatus(bookingId, newStatus));
    }

    // --- Reviews ---
    @GetMapping("/reviews")
    public ResponseEntity<List<AdminReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(adminService.getAllReviews());
    }

    @PutMapping("/reviews/{reviewId}/visibility")
    public ResponseEntity<AdminReviewResponse> updateReviewVisibility(
            @PathVariable UUID reviewId,
            @RequestParam("isVisible") boolean isVisible
    ) {
        return ResponseEntity.ok(adminService.updateReviewVisibility(reviewId, isVisible));
    }

    @PutMapping("/reviews/{reviewId}/approve")
    public ResponseEntity<AdminReviewResponse> approveReview(
            @PathVariable UUID reviewId,
            @RequestParam("isApproved") boolean isApproved
    ) {
        return ResponseEntity.ok(adminService.approveReview(reviewId, isApproved));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable UUID reviewId) {
        adminService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}
