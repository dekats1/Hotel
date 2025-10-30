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

  @NotNull(message = "Дата заезда обязательна")
  @FutureOrPresent(message = "Дата заезда не может быть в прошлом")
  private LocalDate checkInDate;

  @NotNull(message = "Дата выезда обязательна")
  @Future(message = "Дата выезда должна быть в будущем")
  private LocalDate checkOutDate;

  @Min(value = 1, message = "Количество гостей должно быть не менее 1")
  private Integer guestsCount;

  @Transient
  public Integer getTotalNights() {
    if (checkInDate != null && checkOutDate != null) {
      return (int) ChronoUnit.DAYS.between(checkInDate, checkOutDate);
    }
    return null;
  }

  @NotNull(message = "Цена за ночь обязательна")
  @DecimalMin(value = "0.01", message = "Цена должна быть положительной")
  private BigDecimal pricePerNight;

  @NotNull(message = "Общая цена обязательна")
  @DecimalMin(value = "0.01", message = "Цена должна быть положительной")
  private BigDecimal totalPrice;

  @Enumerated(EnumType.STRING)
  private CurrencyType currency;

  private String specialRequests;
}