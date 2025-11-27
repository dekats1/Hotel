package com.hotel.booking.service;

public interface PasswordResetService {

    void requestPasswordReset(String email);

    void resetPassword(String email, String verificationCode, String newPassword);
}

