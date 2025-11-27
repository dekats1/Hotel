package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@hotelbooking.com}")
    private String defaultFrom;

    @Override
    public void sendPasswordResetEmail(User user, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(defaultFrom);
        message.setTo(user.getEmail());
        message.setSubject("Сброс пароля в отеле \"Райский уголок\"");
        message.setText(buildBody(user, verificationCode));

        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (MailException ex) {
            log.error("Failed to send password reset email", ex);
            throw new BadRequestException("Не удалось отправить письмо. Попробуйте еще раз позже.");
        }
    }

    private String buildBody(User user, String verificationCode) {
        return """
                Здравствуйте, %s!

                Вы запросили смену пароля в системе бронирования отеля "Райский уголок".
                Используйте этот код подтверждения, он действителен ограниченное время:

                Код: %s

                Если вы не отправляли запрос на смену пароля, просто проигнорируйте это письмо.

                С уважением,
                Команда отеля "Райский уголок"
                """.formatted(user.getFirstName(), verificationCode);
    }
}

