package com.hotel.booking.domain.enums;

import lombok.Getter;

public enum BookingStatus {
    PENDING("Ожидает подтверждения", false),
    CONFIRMED("Подтверждено", false),
    CHECKED_IN("Гость заселён", false),
    COMPLETED("Завершено", true),
    CANCELLED("Отменено", true);

    @Getter
    private final String displayName;
    private final boolean isFinal;

    BookingStatus(String displayName, boolean isFinal) {
        this.displayName = displayName;
        this.isFinal = isFinal;
    }

    public boolean isFinal() {
        return isFinal;
    }

    public boolean canTransitionTo(BookingStatus newStatus) {
        if (this.isFinal) {
            return false;
        }

        return switch (this) {
            case PENDING -> newStatus == CONFIRMED || newStatus == CANCELLED;
            case CONFIRMED -> newStatus == CHECKED_IN || newStatus == CANCELLED;
            case CHECKED_IN -> newStatus == COMPLETED;
            default -> false;
        };
    }
}