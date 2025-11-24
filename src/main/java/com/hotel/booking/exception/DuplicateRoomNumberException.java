package com.hotel.booking.exception;

public class DuplicateRoomNumberException extends RuntimeException {
    public DuplicateRoomNumberException(String roomNumber) {
        super(String.format("Room number %s already exists", roomNumber));
    }
}
