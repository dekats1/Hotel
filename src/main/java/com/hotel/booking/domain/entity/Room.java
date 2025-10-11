package com.hotel.booking.domain.entity;

import com.hotel.booking.domain.enums.RoomType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms", indexes = {
        @Index(name = "idx_rooms_type", columnList = "type"),
        @Index(name = "idx_rooms_active", columnList = "is_active"),
        @Index(name = "idx_rooms_price", columnList = "base_price")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseEntity {

    @NotBlank(message = "Номер комнаты обязателен")
    @Size(max = 20)
    @Column(name = "room_number", nullable = false, unique = true, length = 20)
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private RoomType type;

    @NotNull(message = "Базовая цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть положительной")
    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    // Характеристики
    @Min(value = 1, message = "Вместимость должна быть не менее 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Площадь не может быть отрицательной")
    @Column(name = "area_sqm", precision = 6, scale = 2)
    private BigDecimal areaSqm;

    @Column(name = "floor")
    private Integer floor;

    // Удобства (amenities)
    @Column(name = "has_wifi")
    @Builder.Default
    private Boolean hasWifi = true;

    @Column(name = "has_tv")
    @Builder.Default
    private Boolean hasTv = true;

    @Column(name = "has_minibar")
    @Builder.Default
    private Boolean hasMinibar = false;

    @Column(name = "has_balcony")
    @Builder.Default
    private Boolean hasBalcony = false;

    @Column(name = "has_sea_view")
    @Builder.Default
    private Boolean hasSeaView = false;

    // Статус
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // Связи
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoomTranslation> translations = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<RoomPhoto> photos = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    // Вспомогательные методы
    public RoomPhoto getPrimaryPhoto() {
        return photos.stream()
                .filter(RoomPhoto::getIsPrimary)
                .findFirst()
                .orElse(photos.isEmpty() ? null : photos.get(0));
    }

    public Double getAverageRating() {
        if (reviews.isEmpty()) {
            return null;
        }
        return reviews.stream()
                .filter(Review::getIsVisible)
                .filter(Review::getIsApproved)
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    public long getReviewCount() {
        return reviews.stream()
                .filter(Review::getIsVisible)
                .filter(Review::getIsApproved)
                .count();
    }
}