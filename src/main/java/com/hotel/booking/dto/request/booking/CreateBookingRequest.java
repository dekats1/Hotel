package com.hotel.booking.dto.request.booking;

import com.hotel.booking.domain.entity.BookingHistory;
import com.hotel.booking.domain.entity.Review;
import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.entity.Transaction;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.domain.enums.CurrencyType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class CreateBookingRequest {
  private UUID userId;

  private UUID roomId;

  @NotNull(message = "Check-in date is required")
  @FutureOrPresent(message = "Check-in date cannot be in the past")
  private LocalDate checkInDate;

  @NotNull(message = "Check-out date is required")
  @Future(message = "Check-out date must be in the future")
  private LocalDate checkOutDate;

  @Min(value = 1, message = "Number of guests must be at least 1")
  private Integer guestsCount;

  @Transient
  public Integer getTotalNights() {
    if (checkInDate != null && checkOutDate != null) {
      return (int) ChronoUnit.DAYS.between(checkInDate, checkOutDate);
    }
    return null;
  }

  @NotNull(message = "Price per night is required")
  @DecimalMin(value = "0.01", message = "Price must be positive")
  private BigDecimal pricePerNight;

  @NotNull(message = "Total price is required")
  @DecimalMin(value = "0.01", message = "Price must be positive")
  private BigDecimal totalPrice;

  @Enumerated(EnumType.STRING)
  private CurrencyType currency;

  private String specialRequests;
}