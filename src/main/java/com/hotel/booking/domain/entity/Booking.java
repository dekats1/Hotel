package com.hotel.booking.domain.entity;

import com.hotel.booking.domain.entity.listener.BookingEntityListener;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.domain.enums.CurrencyType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_bookings_user", columnList = "user_id"),
        @Index(name = "idx_bookings_room", columnList = "room_id"),
        @Index(name = "idx_bookings_status", columnList = "status"),
        @Index(name = "idx_bookings_dates", columnList = "check_in_date, check_out_date"),
        @Index(name = "idx_bookings_check_in", columnList = "check_in_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EntityListeners(BookingEntityListener.class)
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @NotNull(message = "Дата заезда обязательна")
    @FutureOrPresent(message = "Дата заезда не может быть в прошлом")
    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @NotNull(message = "Дата выезда обязательна")
    @Future(message = "Дата выезда должна быть в будущем")
    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "booking_date", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime bookingDate = LocalDateTime.now();

    @Min(value = 1, message = "Количество гостей должно быть не менее 1")
    @Column(name = "guests_count", nullable = false)
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
    @Column(name = "price_per_night", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @NotNull(message = "Общая цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть положительной")
    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency", nullable = false)
    private CurrencyType currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("changedAt DESC")
    @Builder.Default
    private List<BookingHistory> history = new ArrayList<>();

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private Review review;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();

    @AssertTrue(message = "Дата выезда должна быть позже даты заезда")
    private boolean isValidDateRange() {
        if (checkInDate == null || checkOutDate == null) {
            return true; // пропускаем валидацию если даты null
        }
        return checkOutDate.isAfter(checkInDate);
    }

    @AssertTrue(message = "Дата заезда не может быть в прошлом при создании")
    private boolean isValidCheckInDate() {
        if (checkInDate == null || super.getId() != null) {
            return true;
        }
        return !checkInDate.isBefore(LocalDate.now());
    }

    public void calculateTotalPrice() {
        if (pricePerNight != null && getTotalNights() != null) {
            this.totalPrice = pricePerNight.multiply(BigDecimal.valueOf(getTotalNights()));
        }
    }

    public boolean canBeCancelled() {
        return status == BookingStatus.PENDING || status == BookingStatus.CONFIRMED;
    }

    public boolean canBeModified() {
        return status == BookingStatus.PENDING;
    }

    public boolean isActive() {
        return status == BookingStatus.CONFIRMED || status == BookingStatus.CHECKED_IN;
    }

    public boolean isCompleted() {
        LocalDate today = LocalDate.now();
        return this.status == BookingStatus.COMPLETED
                || (this.checkOutDate != null && this.checkOutDate.isBefore(today));
    }

    public boolean canBeReviewed() {
        return status == BookingStatus.COMPLETED && review == null;
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        if (bookingDate == null) {
            bookingDate = LocalDateTime.now();
        }
        calculateTotalPrice();
    }

    @PreUpdate
    protected void onUpdate() {
        if (status == BookingStatus.CANCELLED && cancelledAt == null) {
            cancelledAt = LocalDateTime.now();
        }
    }
}