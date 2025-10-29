package com.hotel.booking.domain.enums;

import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public enum LanguageCode {
    RU("Русский", "RU"),
    EN("English", "EN");

    private final String displayName;
    private final String code;

    LanguageCode(String displayName, String code) {
        this.displayName = displayName;
        this.code = code;
    }

}