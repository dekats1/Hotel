package com.hotel.booking.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "room_photos", indexes = {
        @Index(name = "idx_room_photos_room", columnList = "room_id"),
        @Index(name = "idx_room_photos_order", columnList = "room_id, display_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @NotBlank(message = "URL фотографии обязателен")
    @Size(max = 500)
    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Size(max = 500)
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Size(max = 255)
    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    // Метод для установки главного фото
    public void setPrimary(boolean primary) {
        if (primary && room != null) {
            // Убираем флаг primary у всех других фото этого номера
            room.getPhotos().forEach(photo -> {
                if (!photo.equals(this)) {
                    photo.isPrimary = false;
                }
            });
        }
        this.isPrimary = primary;
    }
}