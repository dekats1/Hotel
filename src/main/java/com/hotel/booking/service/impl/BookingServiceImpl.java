package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;
import com.hotel.booking.mapper.BookingMapper;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.BookingService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();
    log.info("User email: {}", userEmail);

    User user = userRepository.findUserByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
    log.info("User found: {}", user.getId());

    Room room = roomRepository.findById(dto.getRoomId())
            .orElseThrow(() -> new RuntimeException("Room not found: " + dto.getRoomId()));
    log.info("Room found: {}", room.getRoomNumber());

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
    log.info("Booking created: {}", saved.getId());
    user.setBalance(user.getBalance() .subtract(saved.getTotalPrice()));
    userRepository.save(user);
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
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

    if (!booking.getUser().getEmail().equals(userEmail)) {
      throw new RuntimeException("Access denied: this booking does not belong to you");
    }

    if (booking.getStatus() == BookingStatus.CANCELLED) {
      throw new RuntimeException("Booking is already cancelled");
    }

    booking.setStatus(BookingStatus.CANCELLED);
    booking.setCancelledAt(LocalDateTime.now());
    bookingRepository.save(booking);

    log.info("Booking {} cancelled successfully", bookingId);
  }
}
