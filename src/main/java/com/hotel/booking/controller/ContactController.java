package com.hotel.booking.controller;

import com.hotel.booking.dto.request.ContactRequest;
import com.hotel.booking.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendContactMessage(@Valid @RequestBody ContactRequest request) {
        log.info("📧 Received contact form message from: {} ({})", request.getName(), request.getEmail());
        
        try {
            emailService.sendContactFormEmail(request.getName(), request.getEmail(), request.getMessage());
            log.info("Contact form email sent successfully");
            return ResponseEntity.ok(Map.of("message", "Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время."));
        } catch (Exception e) {
            log.error("Failed to send contact form email", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Не удалось отправить сообщение. Попробуйте еще раз позже."));
        }
    }
}

