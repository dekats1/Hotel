package com.hotel.booking.domain.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hotel.booking.domain.enums.LanguageCode;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "room_translations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RoomTranslation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonBackReference("room-translations")  // Добавлено
    private Room room;

    @Column(name = "language", nullable = false, length = 10)
    private String language;  // Изменено с enum на String для гибкости

    @NotBlank(message = "Название номера обязательно")
    @Size(max = 200, message = "Название не должно превышать 200 символов")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Описание номера обязательно")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
}
