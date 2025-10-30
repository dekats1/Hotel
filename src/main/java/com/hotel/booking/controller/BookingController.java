package com.hotel.booking.controller;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;
import com.hotel.booking.security.JwtTokenProvider;
import com.hotel.booking.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.nio.file.attribute.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/booking")
public class BookingController {
  private final BookingService bookingService;
  private final JwtTokenProvider jwtTokenProvider;

  @PostMapping("/addBooking")
  public ResponseEntity<BookingResponse> addBooking(@RequestBody @Valid CreateBookingRequest dto) {
    System.out.println("=== BOOKING REQUEST ===");
    BookingResponse booking = bookingService.addBooking(dto);
    System.out.println("✅ Booking response: {}"+ booking.getId());
    return ResponseEntity.ok(booking);
  }


}