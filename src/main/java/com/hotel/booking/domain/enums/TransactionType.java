package com.hotel.booking.domain.enums;

import lombok.Getter;

@Getter
public enum TransactionType {
    DEPOSIT("Пополнение счёта", 1),
    PAYMENT("Оплата", -1),
    REFUND("Возврат средств", 1),
    WITHDRAWAL("Вывод средств", -1);

    private final String displayName;
    private final int multiplier; // 1 для зачисления, -1 для списания

    TransactionType(String displayName, int multiplier) {
        this.displayName = displayName;
        this.multiplier = multiplier;
    }

    public boolean isCredit() {
        return multiplier > 0;
    }

    public boolean isDebit() {
        return multiplier < 0;
    }
}