package com.hotel.booking.dto.response.admin;

import com.hotel.booking.domain.enums.LanguageCode;
import com.hotel.booking.domain.enums.RoomType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class AdminRoomDetailsResponse {
    UUID id;
    String roomNumber;
    RoomType type;
    BigDecimal basePrice;
    Integer capacity;
    BigDecimal areaSqm;
    Integer floor;

    Boolean hasWifi;
    Boolean hasTv;
    Boolean hasMinibar;
    Boolean hasBalcony;
    Boolean hasSeaView;

    Boolean isActive;

    Map<String, TranslationResponse> translations;

    List<PhotoResponse> photos;

    Double averageRating;
    Long reviewCount;

    LocalDateTime createdAt;

    @Value
    @Builder
    public static class TranslationResponse {
        String name;
        String description;
    }

    @Value
    @Builder
    public static class PhotoResponse {
        UUID id;
        String url;
        String thumbnailUrl;
        String altText;
        Integer displayOrder;
        Boolean isPrimary;
    }
}
