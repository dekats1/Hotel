package com.hotel.booking.exception;

public class ReviewNotAllowedException extends RuntimeException {
    public ReviewNotAllowedException(String s) {
        super(s);
    }
}
