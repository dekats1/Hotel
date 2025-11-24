package com.hotel.booking.exception;

import java.time.LocalDate;
import java.util.UUID;

public class RoomNotAvailableException extends RuntimeException {

    public RoomNotAvailableException(UUID roomId, LocalDate checkIn, LocalDate checkOut) {
        super(String.format(
                "Номер %s недоступен на период с %s по %s",
                roomId,
                checkIn,
                checkOut
        ));
    }

    public RoomNotAvailableException(String message) {
        super(message);
    }
}
