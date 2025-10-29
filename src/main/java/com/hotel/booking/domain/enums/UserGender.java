package com.hotel.booking.domain.enums;

import jakarta.persistence.Enumerated;
import lombok.Getter;

@Getter
public enum UserGender {
    MALE("Мужской"),
    FEMALE("Женский"),
    OTHER("Другой"),
    PREFER_NOT_TO_SAY("Предпочитаю не указывать");

    private final String displayName;

    UserGender(String displayName) {
        this.displayName = displayName;
    }

}