package com.hotel.booking.domain.enums;

import lombok.Getter;

public enum TransactionStatus {
    PENDING("Ожидает обработки", false),
    COMPLETED("Завершено", true),
    FAILED("Ошибка", true),
    CANCELLED("Отменено", true);

    @Getter
    private final String displayName;
    private final boolean isFinal;

    TransactionStatus(String displayName, boolean isFinal) {
        this.displayName = displayName;
        this.isFinal = isFinal;
    }

    public boolean isFinal() {
        return isFinal;
    }
}