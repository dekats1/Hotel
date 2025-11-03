package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum CurrencyType {
    BYN("Белорусский рубль", "Br"),
    USD("Доллар США", "$");

    private final String displayName;
    private final String symbol;

    CurrencyType(String displayName, String symbol) {
        this.displayName = displayName;
        this.symbol = symbol;
    }

}