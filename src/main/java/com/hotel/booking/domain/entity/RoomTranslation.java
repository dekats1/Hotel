package com.hotel.booking.domain.entity;

import com.hotel.booking.domain.enums.LanguageCode;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "room_translations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "language"}),
        indexes = {
                @Index(name = "idx_room_translations_room", columnList = "room_id"),
                @Index(name = "idx_room_translations_lang", columnList = "language")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomTranslation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false)
    private LanguageCode language;

    @NotBlank(message = "Название номера обязательно")
    @Size(max = 200, message = "Название не должно превышать 200 символов")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Описание номера обязательно")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "amenities", columnDefinition = "TEXT")
    private String amenities; // JSON или текст со списком удобств
}
