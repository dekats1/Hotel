package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum LanguageCode {
    RU("Русский", "ru"),
    EN("English", "en");

    private final String displayName;
    private final String code;

    LanguageCode(String displayName, String code) {
        this.displayName = displayName;
        this.code = code;
    }

}