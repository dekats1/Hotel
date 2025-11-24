package com.hotel.booking.exception;

import java.util.UUID;

public class BookingNotFoundException extends RuntimeException {
    public BookingNotFoundException(UUID bookingId) {
        super("Бронирование не найдено: " + bookingId);
    }
}
