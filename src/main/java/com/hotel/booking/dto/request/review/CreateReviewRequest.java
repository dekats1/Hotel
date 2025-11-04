package com.hotel.booking.dto.request.review;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

  @NotNull(message = "ID бронирования обязателен")
  private UUID bookingId;

  @NotNull(message = "Оценка обязательна")
  @Min(value = 1, message = "Минимальная оценка: 1")
  @Max(value = 5, message = "Максимальная оценка: 5")
  private Integer rating;

  @NotBlank(message = "Комментарий обязателен")
  @Size(min = 10, max = 1000, message = "Комментарий должен содержать от 10 до 1000 символов")
  private String comment;

  @Min(value = 1, message = "Минимальная оценка чистоты: 1")
  @Max(value = 5, message = "Максимальная оценка чистоты: 5")
  private Integer cleanlinessRating;

  @Min(value = 1, message = "Минимальная оценка комфорта: 1")
  @Max(value = 5, message = "Максимальная оценка комфорта: 5")
  private Integer comfortRating;

  @Min(value = 1, message = "Минимальная оценка сервиса: 1")
  @Max(value = 5, message = "Максимальная оценка сервиса: 5")
  private Integer serviceRating;

  @Min(value = 1, message = "Минимальная оценка соотношения цена/качество: 1")
  @Max(value = 5, message = "Максимальная оценка соотношения цена/качество: 5")
  private Integer valueRating;
}
