package com.hotel.booking.exception;

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException() {
        super("Недостаточно средств для выполнения операции");
    }
}
