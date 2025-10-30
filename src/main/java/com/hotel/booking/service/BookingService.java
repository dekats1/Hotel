package com.hotel.booking.service;

import com.hotel.booking.dto.request.booking.CreateBookingRequest;
import com.hotel.booking.dto.response.booking.BookingResponse;

public interface BookingService {
  BookingResponse addBooking(CreateBookingRequest dto);
}
