package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum RoomType {
    STANDARD("Стандарт", 1),
    DELUXE("Делюкс", 2),
    SUITE("Люкс", 3),
    APARTMENT("Апартаменты", 4),
    PENTHOUSE("Пентхаус", 5);

    private final String displayName;
    private final int level;

    RoomType(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }

}