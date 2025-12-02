package com.hotel.booking.domain.entity;

import com.hotel.booking.domain.enums.BookingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_reviews_booking", columnList = "booking_id"),
        @Index(name = "idx_reviews_room", columnList = "room_id"),
        @Index(name = "idx_reviews_user", columnList = "user_id"),
        @Index(name = "idx_reviews_rating", columnList = "rating"),
        @Index(name = "idx_reviews_visible", columnList = "is_visible, is_approved")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Review extends BaseEntity {

    // Связи
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    // Основная оценка
    @NotNull(message = "Оценка обязательна")
    @Min(value = 1, message = "Минимальная оценка: 1")
    @Max(value = 5, message = "Максимальная оценка: 5")
    @Column(name = "rating", nullable = false)
    private Integer rating;

    // Текст отзыва
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    // Детальные оценки (опционально)
    @Min(value = 1, message = "Минимальная оценка: 1")
    @Max(value = 5, message = "Максимальная оценка: 5")
    @Column(name = "cleanliness_rating")
    private Integer cleanlinessRating;

    @Min(value = 1, message = "Минимальная оценка: 1")
    @Max(value = 5, message = "Максимальная оценка: 5")
    @Column(name = "comfort_rating")
    private Integer comfortRating;

    @Min(value = 1, message = "Минимальная оценка: 1")
    @Max(value = 5, message = "Максимальная оценка: 5")
    @Column(name = "service_rating")
    private Integer serviceRating;

    @Min(value = 1, message = "Минимальная оценка: 1")
    @Max(value = 5, message = "Максимальная оценка: 5")
    @Column(name = "value_rating")
    private Integer valueRating;

    // Модерация
    @Column(name = "is_approved")
    @Builder.Default
    private Boolean isApproved = false;

    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;

    // Бизнес-логика
    public boolean hasDetailedRatings() {
        return cleanlinessRating != null || comfortRating != null
                || serviceRating != null || valueRating != null;
    }

    public Double getAverageDetailedRating() {
        if (!hasDetailedRatings()) {
            return null;
        }

        int count = 0;
        int sum = 0;

        if (cleanlinessRating != null) {
            sum += cleanlinessRating;
            count++;
        }
        if (comfortRating != null) {
            sum += comfortRating;
            count++;
        }
        if (serviceRating != null) {
            sum += serviceRating;
            count++;
        }
        if (valueRating != null) {
            sum += valueRating;
            count++;
        }

        return count > 0 ? (double) sum / count : null;
    }

    public boolean isPositive() {
        return rating >= 4;
    }

    public boolean isNegative() {
        return rating <= 2;
    }

    public boolean canBeEdited() {
        // Отзыв можно редактировать только если он ещё не одобрен
        return !isApproved;
    }

    // Валидация
    @AssertTrue(message = "Отзыв должен быть привязан к завершённому бронированию")
    private boolean isBookingCompleted() {
        if (booking == null) {
            return true; // Пропускаем валидацию если booking null
        }

        LocalDate today = LocalDate.now();
        return booking.getStatus() == BookingStatus.COMPLETED
                || (booking.getCheckOutDate() != null && booking.getCheckOutDate().isBefore(today)) ||booking.getStatus() == BookingStatus.CHECKED_OUT;
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        // Если детальные оценки не указаны, заполняем их основной оценкой
        if (cleanlinessRating == null) {
            cleanlinessRating = rating;
        }
        if (comfortRating == null) {
            comfortRating = rating;
        }
        if (serviceRating == null) {
            serviceRating = rating;
        }
        if (valueRating == null) {
            valueRating = rating;
        }
    }
}