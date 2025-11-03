package com.hotel.booking.service;

import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;

import java.util.List;
import java.util.UUID;

public interface BookingService {
  BookingResponse addBooking(CreateBookingRequest dto);

  List<BookingResponse> getMyBookings();

  void cancelBooking(UUID bookingId);
}
