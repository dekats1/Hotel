package com.hotel.booking.dto.request.review;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
  private UUID id;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private UUID bookingId;
  private UUID userId;
  private String userFullName;
  private String userEmail;
  private UUID roomId;
  private String roomNumber;
  private String roomType;
  private Integer rating;
  private String comment;
  private Integer cleanlinessRating;
  private Integer comfortRating;
  private Integer serviceRating;
  private Integer valueRating;
  private Double averageDetailedRating;
  private Boolean isApproved;
  private LocalDateTime checkInDate;
  private LocalDateTime checkOutDate;
}
