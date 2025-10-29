package com.hotel.booking.dto.response.admin;

import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.domain.enums.CurrencyType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminBookingDetailsResponse {
    UUID id;

    // Информация о пользователе (для админа)
    UUID userId;
    String userEmail;

    // Информация о номере
    UUID roomId;
    String roomNumber;

    // Даты
    LocalDate checkInDate;
    LocalDate checkOutDate;
    LocalDateTime bookingDate;
    int guestsCount;
    int totalNights;

    // Финансы
    BigDecimal pricePerNight;
    BigDecimal totalPrice;
    CurrencyType currency;

    // Статус
    BookingStatus status;

    String specialRequests;
    LocalDateTime createdAt;
    LocalDateTime cancelledAt;
    String cancellationReason;
}
