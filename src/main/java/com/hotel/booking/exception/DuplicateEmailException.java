package com.hotel.booking.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super(String.format("Email %s already exists", email));
    }
}
