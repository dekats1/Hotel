package com.hotel.booking.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminReviewResponse {
    UUID id;

    UUID bookingId;
    UUID userId;
    String userName;
    UUID roomId;
    String roomNumber;

    int rating;
    String comment;

    Integer cleanlinessRating;
    Integer comfortRating;
    Integer serviceRating;
    Integer valueRating;

    boolean isApproved;
    boolean isVisible;

    LocalDateTime createdAt;
}
