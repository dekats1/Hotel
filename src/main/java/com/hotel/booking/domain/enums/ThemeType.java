package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum ThemeType {
    LIGHT("Светлая тема"),
    DARK("Тёмная тема"),
    AUTO("Автоматическая");

    private final String displayName;

    ThemeType(String displayName) {
        this.displayName = displayName;
    }

}