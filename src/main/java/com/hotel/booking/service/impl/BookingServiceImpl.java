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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

  private final BookingRepository bookingRepository;
  private final RoomRepository roomRepository;
  private final UserRepository userRepository;
  private final BookingMapper bookingMapper;  // ✅ ДОБАВЛЕНО

  @Override
  @Transactional
  public BookingResponse addBooking(CreateBookingRequest dto) {  // ✅ ИЗМЕНЕНО: возвращаем DTO
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
    log.info("✅ Booking created: {}", saved.getId());

    // ✅ КОНВЕРТИРУЕМ В DTO
    return bookingMapper.toResponse(saved);
  }
}
