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
    @JsonBackReference("room-translations")
    private Room room;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @NotBlank(message = "Room name is required")
    @Size(max = 200, message = "Room name must not exceed 200 characters")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Room description is required")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
}
