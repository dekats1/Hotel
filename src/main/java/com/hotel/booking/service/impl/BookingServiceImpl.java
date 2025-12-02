package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;
import com.hotel.booking.exception.BookingAlreadyCancelledException;
import com.hotel.booking.exception.ForbiddenException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.exception.RoomNotAvailableException;
import com.hotel.booking.mapper.BookingMapper;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

  private final BookingRepository bookingRepository;
  private final RoomRepository roomRepository;
  private final UserRepository userRepository;
  private final BookingMapper bookingMapper;

  @Override
  @Transactional
  public BookingResponse addBooking(CreateBookingRequest dto) {
    log.info("=== ADD BOOKING ===");
    log.info("Request: roomId={}, checkIn={}, checkOut={}, guests={}",
            dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), dto.getGuestsCount());

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();
    log.info("User email: {}", userEmail);

    User user = userRepository.findUserByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
    log.info("User found: id={}, balance={}", user.getId(), user.getBalance());

    Room room = roomRepository.findById(dto.getRoomId())
            .orElseThrow(() -> new ResourceNotFoundException("Room", "id", dto.getRoomId().toString()));
    log.info("Room found: number={}, price={}", room.getRoomNumber(), room.getBasePrice());

    // 3. ПРОВЕРЯЕМ ДОСТУПНОСТЬ НОМЕРА
    long conflictingBookings = roomRepository.countConflictingBookings(
            dto.getRoomId(),
            dto.getCheckInDate(),
            dto.getCheckOutDate()
    );

    if (conflictingBookings > 0) {
      log.warn("Room {} is not available for dates {} - {}",
              room.getRoomNumber(), dto.getCheckInDate(), dto.getCheckOutDate());
      throw new RoomNotAvailableException(
              String.format("Номер %s уже забронирован на выбранные даты", room.getRoomNumber())
      );
    }

    log.info("Room is available, proceeding with booking...");

    if (user.getBalance().compareTo(dto.getTotalPrice()) < 0) {
      log.warn("Insufficient balance: user has {}, needs {}",
              user.getBalance(), dto.getTotalPrice());
      throw new IllegalStateException("Недостаточно средств на балансе");
    }

    Booking booking = new Booking();
    booking.setBookingDate(LocalDateTime.now());
    booking.setStatus(BookingStatus.PENDING);
    booking.setCurrency(dto.getCurrency());
    booking.setCheckInDate(dto.getCheckInDate());
    booking.setCheckOutDate(dto.getCheckOutDate());
    booking.setRoom(room);
    booking.setUser(user);
    booking.setGuestsCount(dto.getGuestsCount());
    booking.setPricePerNight(dto.getPricePerNight());
    booking.setTotalPrice(dto.getTotalPrice());
    booking.setSpecialRequests(dto.getSpecialRequests());

    Booking saved = bookingRepository.save(booking);
    log.info("Booking created: id={}, status={}", saved.getId(), saved.getStatus());

    BigDecimal newBalance = user.getBalance().subtract(saved.getTotalPrice());
    user.setBalance(newBalance);
    userRepository.save(user);
    log.info("Balance updated: old={}, new={}",
            user.getBalance().add(saved.getTotalPrice()), newBalance);

    return bookingMapper.toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public List<BookingResponse> getMyBookings() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();
    log.info("Loading bookings for user: {}", userEmail);

    List<Booking> bookings = bookingRepository.findByUserEmail(userEmail);
    log.info("Found {} bookings", bookings.size());

    return bookings.stream()
            .map(bookingMapper::toResponse)
            .collect(Collectors.toList());
  }

  @Override
  @Transactional
  public void cancelBooking(UUID bookingId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();
    log.info("Cancelling booking {} for user: {}", bookingId, userEmail);

    Booking booking = bookingRepository.findBookingById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId.toString()));

    // Проверка прав доступа
    if (!booking.getUser().getEmail().equals(userEmail)) {
      throw new ForbiddenException("Access denied: this booking does not belong to you");
    }

    if (booking.getStatus() == BookingStatus.CANCELLED) {
      throw new BookingAlreadyCancelledException(booking.getId());
    }

    if (booking.getStatus() == BookingStatus.COMPLETED) {
      throw new IllegalStateException("Невозможно отменить завершенное бронирование");
    }

    User user = booking.getUser();
    BigDecimal refundAmount = booking.getTotalPrice();
    user.setBalance(user.getBalance().add(refundAmount));
    userRepository.save(user);
    log.info("Refunded {} to user {}", refundAmount, user.getEmail());

    // Отмена бронирования
    booking.setStatus(BookingStatus.CANCELLED);
    booking.setCancelledAt(LocalDateTime.now());
    bookingRepository.save(booking);

    log.info("Booking {} cancelled successfully", bookingId);
  }
}
