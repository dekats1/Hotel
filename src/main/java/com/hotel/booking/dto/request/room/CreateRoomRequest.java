package com.hotel.booking.dto.request.room;

import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.domain.enums.RoomType;
import jakarta.validation.constraints.*;
import lombok.Value;

import java.math.BigDecimal;
import java.util.Map;

@Value
public class CreateRoomRequest {

    @NotBlank(message = "Room number is required")
    @Size(max = 20)
    String roomNumber;

    @NotNull(message = "Room type is required")
    RoomType type;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.01", message = "Base price must be positive")
    BigDecimal basePrice;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    Integer capacity;

    @NotNull(message = "Floor is required")
    @Min(value = 1, message = "Floor must be at least 1")
    Integer floor;

    @DecimalMin(value = "0.0", message = "Area must be non-negative")
    BigDecimal areaSqm;

    @NotNull Boolean hasWifi;
    @NotNull Boolean hasTv;
    @NotNull Boolean hasMinibar;
    @NotNull Boolean hasBalcony;
    @NotNull Boolean hasSeaView;

    @NotNull Boolean isActive;

    @NotNull(message = "Room translations are required")
    @Size(min = 1, message = "At least one translation is required")
    Map<LanguageCode, TranslationData> translations;

    @Value
    public static class TranslationData {
        @NotBlank String name;
        @NotBlank String description;
    }
}
