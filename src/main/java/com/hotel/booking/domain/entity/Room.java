package com.hotel.booking.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hotel.booking.domain.enums.RoomType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.HashSet;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
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

    @Min(value = 1, message = "Вместимость должна быть не менее 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Площадь не может быть отрицательной")
    @Column(name = "area_sqm", precision = 6, scale = 2)
    private BigDecimal areaSqm;

    @Column(name = "floor")
    private Integer floor;

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

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("room-translations")  // Добавлено
    @Builder.Default
    private Set<RoomTranslation> translations = new HashSet<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @JsonManagedReference("room-photos")  // Добавлено
    @Builder.Default
    private Set<RoomPhoto> photos = new HashSet<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @JsonIgnore  // Обычно бронирования не нужны в JSON комнаты
    @Builder.Default
    private Set<Booking> bookings = new HashSet<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private Set<Review> reviews = new HashSet<>();

    public RoomPhoto getPrimaryPhoto() {
        return photos.stream()
            .filter(RoomPhoto::getIsPrimary)
            .findFirst()
            .orElse(photos.isEmpty() ? null : photos.iterator().next());
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