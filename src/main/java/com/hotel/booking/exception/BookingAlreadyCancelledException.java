package com.hotel.booking.exception;

import java.util.UUID;

public class BookingAlreadyCancelledException extends RuntimeException {
    public BookingAlreadyCancelledException(UUID bookingId) {
        super("Бронирование уже отменено: " + bookingId);
    }
}