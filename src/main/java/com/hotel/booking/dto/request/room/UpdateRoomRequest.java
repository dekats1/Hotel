package com.hotel.booking.dto.request.room;

import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.domain.enums.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Value;

import java.math.BigDecimal;
import java.util.Map;

@Value
public class UpdateRoomRequest {

    @Size(max = 20)
    String roomNumber;

    RoomType type;

    @DecimalMin(value = "0.01", message = "Base price must be positive")
    BigDecimal basePrice;

    @Min(value = 1, message = "Capacity must be at least 1")
    Integer capacity;

    @Min(value = 1, message = "Floor must be at least 1")
    Integer floor;

    @DecimalMin(value = "0.0", message = "Area must be non-negative")
    BigDecimal areaSqm;


    Boolean hasWifi;
    Boolean hasTv;
    Boolean hasMinibar;
    Boolean hasBalcony;
    Boolean hasSeaView;

    Boolean isActive;

    Map<LanguageCode, CreateRoomRequest.TranslationData> translations;
}
