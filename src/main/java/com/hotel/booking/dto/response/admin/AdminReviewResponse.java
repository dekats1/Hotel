package com.hotel.booking.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminReviewResponse {
    UUID id;

    // Связи
    UUID bookingId;
    UUID userId;
    String userName; // Имя пользователя
    UUID roomId;
    String roomNumber; // Номер комнаты

    // Оценка
    int rating;
    String comment;

    // Детальные оценки
    Integer cleanlinessRating;
    Integer comfortRating;
    Integer serviceRating;
    Integer valueRating;

    // Модерация
    boolean isApproved;
    boolean isVisible;

    LocalDateTime createdAt;
}
