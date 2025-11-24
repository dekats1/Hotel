package com.hotel.booking.exception;

import java.util.UUID;

public class ReviewAlreadyExistsException extends RuntimeException {
    public ReviewAlreadyExistsException(UUID bookingId) {
        super("Отзыв по бронированию уже существует: " + bookingId);
    }
}