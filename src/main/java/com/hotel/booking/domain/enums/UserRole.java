package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    USER("Пользователь"),
    ADMIN("Администратор");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

}