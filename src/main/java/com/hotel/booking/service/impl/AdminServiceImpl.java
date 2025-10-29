package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.*;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.dto.request.admin.AdminUserCreateRequest;
import com.hotel.booking.dto.request.admin.AdminUserUpdateRequest;
import com.hotel.booking.dto.request.room.CreateRoomRequest;
import com.hotel.booking.dto.request.room.UpdateRoomRequest;
import com.hotel.booking.dto.response.admin.AdminBookingDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminReviewResponse;
import com.hotel.booking.dto.response.admin.AdminRoomDetailsResponse;
import com.hotel.booking.dto.response.admin.AdminUserDetailsResponse;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.mapper.BookingMapper;
import com.hotel.booking.mapper.ReviewMapper;
import com.hotel.booking.mapper.RoomMapper;
import com.hotel.booking.mapper.UserMapper;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.ReviewRepository;
import com.hotel.booking.repository.RoomPhotoRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.AdminService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final RoomPhotoRepository roomPhotoRepository;
    private final PasswordEncoder passwordEncoder;

    private final EntityManager entityManager;

    private final UserMapper userMapper;
    private final RoomMapper roomMapper;
    private final BookingMapper bookingMapper;
    private final ReviewMapper reviewMapper;

    private static final String STATIC_UPLOADS_ROOT = "src/main/resources/static/uploads";
    private static final String ROOMS_FOLDER = "rooms";

    // ========== USER MANAGEMENT ==========

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserDetailsResponse> getAllUsers() {
        log.info("Fetching all users for admin view");
        return userRepository.findAll().stream()
                .map(userMapper::toAdminUserDetailsResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminUserDetailsResponse createUser(AdminUserCreateRequest request) {
        log.info("Creating new user with email: {}", request.getEmail());
        validateUserCreationRequest(request);

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword())); // ДОБАВЬТЕ ЭТУ СТРОКУ

        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getId());

        return userMapper.toAdminUserDetailsResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailsResponse getUserById(UUID userId) {
        log.info("Fetching user with ID: {}", userId);
        User user = findUserById(userId);
        return userMapper.toAdminUserDetailsResponse(user);
    }

    @Override
    @Transactional
    public AdminUserDetailsResponse updateUser(UUID userId, AdminUserUpdateRequest request) {
        log.info("Updating user with ID: {}", userId);
        User user = findUserById(userId);
        updateUserFromRequest(user, request);
        User savedUser = userRepository.save(user);
        log.info("User with ID: {} updated successfully", userId);
        return userMapper.toAdminUserDetailsResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailsResponse getUserByEmail(String email) {
        log.info("Fetching user with email: {}", email);
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return userMapper.toAdminUserDetailsResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        log.warn("Deleting user with ID: {}", userId);
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId.toString());
        }
        userRepository.deleteById(userId);
        log.info("User with ID: {} deleted successfully", userId);
    }

    // ========== ROOM MANAGEMENT ==========

    @Override
    @Transactional
    public AdminRoomDetailsResponse createRoom(CreateRoomRequest request) {
        log.info("Creating new room with number: {}", request.getRoomNumber());
        validateRoomCreationRequest(request);

        Room room = roomMapper.toEntity(request);
        attachTranslationsFromLanguageCodeMap(room, request.getTranslations());

        Room savedRoom = roomRepository.save(room);
        log.info("Room created successfully with ID: {}", savedRoom.getId());

        return roomMapper.toAdminRoomDetailsResponse(savedRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminRoomDetailsResponse> getAllRooms() {
        log.info("Fetching all rooms for admin view");
        return roomRepository.findAll().stream()
                .map(roomMapper::toAdminRoomDetailsResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse updateRoom(UUID roomId, UpdateRoomRequest request) {
        log.info("Updating room with ID: {}", roomId);
        Room room = findRoomById(roomId);
        updateRoomFromRequest(room, request);
        Room updatedRoom = roomRepository.save(room);
        log.info("Room with ID: {} updated successfully", roomId);
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    @Override
    @Transactional
    public void deleteRoom(UUID roomId) {
        log.warn("Deleting room with ID: {}", roomId);
        Room room = findRoomById(roomId);

        if (room.getBookings() != null && !room.getBookings().isEmpty()) {
            long activeBookings = room.getBookings().stream()
                    .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                            b.getStatus() == BookingStatus.PENDING)
                    .count();
            if (activeBookings > 0) {
                throw new IllegalStateException("Cannot delete room with active bookings");
            }
        }

        roomRepository.deleteById(roomId);
        log.info("Room with ID: {} deleted successfully", roomId);
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse setRoomActive(UUID roomId, boolean value) {
        log.info("Setting room {} active status to {}", roomId, value);
        Room room = findRoomById(roomId);
        room.setIsActive(value);
        Room updatedRoom = roomRepository.save(room);
        log.info("Room {} active status updated to {}", roomId, value);
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse uploadRoomPhotos(UUID roomId, List<MultipartFile> files) {
        log.info("Uploading {} photos for room {}", files.size(), roomId);
        Room room = findRoomById(roomId);

        for (MultipartFile file : files) {
            try {
                String photoUrl = saveRoomPhoto(roomId, file);
                String thumbnailUrl = generateThumbnail(roomId, file);

                RoomPhoto roomPhoto = RoomPhoto.builder()
                        .room(room)
                        .url(photoUrl)
                        .thumbnailUrl(thumbnailUrl)
                        .altText("Room " + room.getRoomNumber())
                        .isPrimary(room.getPhotos().isEmpty())
                        .displayOrder(room.getPhotos().size())
                        .build();

                room.getPhotos().add(roomPhoto);
            } catch (IOException e) {
                log.error("Failed to save photo for room {}: {}", roomId, e.getMessage());
                throw new RuntimeException("Failed to save photo", e);
            }
        }

        Room updatedRoom = roomRepository.save(room);
        log.info("Uploaded {} photos for room {}", files.size(), roomId);
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    @Override
    @Transactional
    public void deleteRoomPhoto(UUID photoId) {
        log.info("Deleting photo {}", photoId);
        RoomPhoto photo = roomPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", photoId.toString()));

        Room room = photo.getRoom();
        deletePhotoFiles(photo);
        room.getPhotos().remove(photo);
        roomPhotoRepository.delete(photo);

        log.info("Photo {} deleted successfully", photoId);
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse setPrimaryRoomPhoto(UUID photoId) {
        log.info("Setting photo {} as primary", photoId);
        RoomPhoto photo = roomPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", photoId.toString()));

        Room room = photo.getRoom();

        // Сбросить все isPrimary флаги
        room.getPhotos().forEach(p -> p.setIsPrimary(false));

        // Установить новое primary фото
        photo.setIsPrimary(true);

        Room updatedRoom = roomRepository.save(room);
        log.info("Photo {} set as primary for room {}", photoId, room.getId());
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse replaceRoomTranslations(
            UUID roomId,
            Map<LanguageCode, CreateRoomRequest.TranslationData> translations) {
        log.info("Replacing translations for room {}", roomId);
        Room room = findRoomById(roomId);

        // Удалить все существующие переводы
        room.getTranslations().clear();

        // Добавить новые переводы
        attachTranslationsFromLanguageCodeMap(room, translations);

        Room updatedRoom = roomRepository.save(room);
        log.info("Translations replaced for room {}", roomId);
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    @Override
    @Transactional
    public AdminRoomDetailsResponse patchRoomTranslations(
            UUID roomId,
            Map<LanguageCode, CreateRoomRequest.TranslationData> translations) {
        log.info("Patching translations for room {}", roomId);
        Room room = findRoomById(roomId);

        // Обновить или добавить переводы
        for (Map.Entry<LanguageCode, CreateRoomRequest.TranslationData> entry : translations.entrySet()) {
            String langCode = entry.getKey().name();
            CreateRoomRequest.TranslationData translationData = entry.getValue();

            // Найти существующий перевод
            Optional<RoomTranslation> existingTranslation = room.getTranslations().stream()
                    .filter(t -> t.getLanguage().equals(langCode))
                    .findFirst();

            if (existingTranslation.isPresent()) {
                // Обновить существующий
                RoomTranslation translation = existingTranslation.get();
                translation.setName(translationData.getName());
                translation.setDescription(translationData.getDescription());
            } else {
                // Добавить новый
                RoomTranslation newTranslation = RoomTranslation.builder()
                        .room(room)
                        .language(langCode)
                        .name(translationData.getName())
                        .description(translationData.getDescription())
                        .build();
                room.getTranslations().add(newTranslation);
            }
        }

        Room updatedRoom = roomRepository.save(room);
        log.info("Translations patched for room {}", roomId);
        return roomMapper.toAdminRoomDetailsResponse(updatedRoom);
    }

    // ========== BOOKING MANAGEMENT ==========

    @Override
    @Transactional(readOnly = true)
    public List<AdminBookingDetailsResponse> getAllBookings() {
        log.info("Fetching all bookings for admin view");
        return bookingRepository.findAll().stream()
                .map(bookingMapper::toAdminBookingDetailsResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminBookingDetailsResponse updateBookingStatus(UUID bookingId, String newStatus) {
        log.info("Updating booking {} status to {}", bookingId, newStatus);
        Booking booking = findBookingById(bookingId);

        BookingStatus status = BookingStatus.valueOf(newStatus.toUpperCase());

        if (status == BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
        }

        booking.setStatus(status);
        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking {} status updated successfully", bookingId);
        return bookingMapper.toAdminBookingDetailsResponse(updatedBooking);
    }

    // ========== REVIEW MANAGEMENT ==========

    @Override
    @Transactional(readOnly = true)
    public List<AdminReviewResponse> getAllReviews() {
        log.info("Fetching all reviews for admin view");
        return reviewRepository.findAll().stream()
                .map(reviewMapper::toAdminReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminReviewResponse updateReviewVisibility(UUID reviewId, boolean isVisible) {
        log.info("Updating review {} visibility to {}", reviewId, isVisible);
        Review review = findReviewById(reviewId);
        review.setIsVisible(isVisible);

        if (isVisible) {
            review.setIsApproved(true);
        }

        Review updatedReview = reviewRepository.save(review);
        log.info("Review {} visibility updated to {}", reviewId, isVisible);
        return reviewMapper.toAdminReviewResponse(updatedReview);
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId) {
        log.warn("Deleting review {}", reviewId);
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResourceNotFoundException("Review", "id", reviewId.toString());
        }
        reviewRepository.deleteById(reviewId);
        log.info("Review {} deleted successfully", reviewId);
    }

    // ========== PRIVATE HELPER METHODS ==========

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));
    }

    private Room findRoomById(UUID roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId.toString()));
    }

    private Booking findBookingById(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId.toString()));
    }

    private Review findReviewById(UUID reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId.toString()));
    }

    private void validateUserCreationRequest(AdminUserCreateRequest request) {
        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone already exists: " + request.getPhone());
        }
    }

    private void validateRoomCreationRequest(CreateRoomRequest request) {
        if (roomRepository.existsRoomByRoomNumber(request.getRoomNumber())) {
            throw new IllegalArgumentException("Room number already exists: " + request.getRoomNumber());
        }
    }

    private void updateUserFromRequest(User user, AdminUserUpdateRequest request) {
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());
        user.setBalance(request.getBalance());
    }

    private void updateRoomFromRequest(Room room, UpdateRoomRequest request) {
        room.setRoomNumber(request.getRoomNumber());
        room.setType(request.getType());
        room.setBasePrice(request.getBasePrice());
        room.setCapacity(request.getCapacity());
        room.setAreaSqm(request.getAreaSqm());
        room.setFloor(request.getFloor());
        room.setHasWifi(Boolean.TRUE.equals(request.getHasWifi()));
        room.setHasTv(Boolean.TRUE.equals(request.getHasTv()));
        room.setHasMinibar(Boolean.TRUE.equals(request.getHasMinibar()));
        room.setHasBalcony(Boolean.TRUE.equals(request.getHasBalcony()));
        room.setHasSeaView(Boolean.TRUE.equals(request.getHasSeaView()));
        room.setIsActive(Boolean.TRUE.equals(request.getIsActive()));

        if (request.getTranslations() != null && !request.getTranslations().isEmpty()) {
            // Получаем Iterator для безопасного удаления
            Iterator<RoomTranslation> iterator = room.getTranslations().iterator();
            while (iterator.hasNext()) {
                RoomTranslation translation = iterator.next();
                iterator.remove();
                translation.setRoom(null); // Разрываем связь
            }
            // Применяем удаление к базе данных
            entityManager.flush();
            // Добавляем новые переводы
            attachTranslationsFromLanguageCodeMap(room, request.getTranslations());
        }
    }


    // Унифицированный метод для работы с LanguageCode
    private void attachTranslationsFromLanguageCodeMap(
            Room room,
            Map<LanguageCode, CreateRoomRequest.TranslationData> translations) {
        if (translations == null || translations.isEmpty()) return;

        for (Map.Entry<LanguageCode, CreateRoomRequest.TranslationData> entry : translations.entrySet()) {
            String langCode = entry.getKey().name();
            CreateRoomRequest.TranslationData transData = entry.getValue();

            RoomTranslation translation = RoomTranslation.builder()
                    .room(room)
                    .language(langCode)
                    .name(transData.getName())
                    .description(transData.getDescription())
                    .build();

            room.getTranslations().add(translation);
        }
    }

    private String saveRoomPhoto(UUID roomId, MultipartFile file) throws IOException {
        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename())
        );
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID() + extension;

        Path roomDir = Paths.get(STATIC_UPLOADS_ROOT, ROOMS_FOLDER, roomId.toString());
        Files.createDirectories(roomDir);

        Path targetPath = roomDir.resolve(filename);
        try (InputStream inputStream = file.getInputStream();
             OutputStream outputStream = Files.newOutputStream(targetPath, StandardOpenOption.CREATE)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }

        return "/uploads/" + ROOMS_FOLDER + "/" + roomId + "/" + filename;
    }

    private String generateThumbnail(UUID roomId, MultipartFile file) throws IOException {
        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename())
        );
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String thumbnailFilename = "thumb_" + UUID.randomUUID() + extension;

        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        int thumbnailWidth = 300;
        int thumbnailHeight = (int) (originalImage.getHeight() *
                ((double) thumbnailWidth / originalImage.getWidth()));

        BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight,
                BufferedImage.TYPE_INT_RGB);
        Graphics2D g = thumbnail.createGraphics();
        g.drawImage(originalImage.getScaledInstance(thumbnailWidth, thumbnailHeight,
                Image.SCALE_SMOOTH), 0, 0, null);
        g.dispose();

        Path roomDir = Paths.get(STATIC_UPLOADS_ROOT, ROOMS_FOLDER, roomId.toString());
        Files.createDirectories(roomDir);
        Path thumbnailPath = roomDir.resolve(thumbnailFilename);
        ImageIO.write(thumbnail, extension.substring(1), thumbnailPath.toFile());

        return "/uploads/" + ROOMS_FOLDER + "/" + roomId + "/" + thumbnailFilename;
    }

    private void deletePhotoFiles(RoomPhoto photo) {
        try {
            Path photoPath = Paths.get(STATIC_UPLOADS_ROOT + photo.getUrl());
            Path thumbnailPath = Paths.get(STATIC_UPLOADS_ROOT + photo.getThumbnailUrl());
            Files.deleteIfExists(photoPath);
            Files.deleteIfExists(thumbnailPath);
        } catch (IOException e) {
            log.error("Failed to delete photo files: {}", e.getMessage());
        }
    }
}
