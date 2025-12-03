package com.hotel.booking.service;

import com.hotel.booking.domain.entity.User;

public interface EmailService {

    void sendPasswordResetEmail(User user, String verificationCode);
    
    void sendContactFormEmail(String name, String email, String message);
}