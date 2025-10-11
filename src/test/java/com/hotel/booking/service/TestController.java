package com.hotel.booking.service;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/test")
    public String test() {
        return "🏨 Hotel Booking API is working! 🎉";
    }

    @GetMapping("/health")
    public String health() {
        return "✅ OK - Application is healthy";
    }

    @GetMapping("/info")
    public String info() {
        return """
            Hotel Booking System
            Version: 1.0.0
            Status: Running
            Database: Connected
            """;
    }
}