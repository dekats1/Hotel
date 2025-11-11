package com.hotel.booking.controller;

import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;
import com.hotel.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/booking")
public class BookingController {

  private final BookingService bookingService;

  @PostMapping("/addBooking")
  public ResponseEntity<BookingResponse> addBooking(@RequestBody @Valid CreateBookingRequest dto) {
    log.info("=== BOOKING REQUEST ===");
    BookingResponse booking = bookingService.addBooking(dto);
    log.info("Booking response: {}", booking.getId());
    return ResponseEntity.ok(booking);
  }

  @GetMapping("/myBookings")
  public ResponseEntity<List<BookingResponse>> getMyBookings() {
    log.info("=== GET MY BOOKINGS ===");
    List<BookingResponse> bookings = bookingService.getMyBookings();
    log.info("Found {} bookings", bookings.size());
    return ResponseEntity.ok(bookings);
  }

  @PutMapping("/{bookingId}/cancel")
  public ResponseEntity<Void> cancelBooking(@PathVariable UUID bookingId) {
    log.info("=== CANCEL BOOKING {} ===", bookingId);
    bookingService.cancelBooking(bookingId);
    log.info("Booking cancelled successfully");
    return ResponseEntity.noContent().build();
  }
}
