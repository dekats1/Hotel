package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum CurrencyType {
    USD("Доллар США", "$"),
    EUR("Белорусский рубль", "BYN");

    private final String displayName;
    private final String symbol;

    CurrencyType(String displayName, String symbol) {
        this.displayName = displayName;
        this.symbol = symbol;
    }

}