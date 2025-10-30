package com.hotel.booking.dto.response.booking;

import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.domain.enums.CurrencyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
  private UUID id;
  private UUID userId;
  private String userEmail;
  private String userFullName;

  private UUID roomId;
  private String roomNumber;
  private String roomType;

  private LocalDate checkInDate;
  private LocalDate checkOutDate;
  private Integer totalNights;

  private Integer guestsCount;
  private BigDecimal pricePerNight;
  private BigDecimal totalPrice;
  private CurrencyType currency;

  private String specialRequests;
  private BookingStatus status;
  private LocalDateTime bookingDate;
}
