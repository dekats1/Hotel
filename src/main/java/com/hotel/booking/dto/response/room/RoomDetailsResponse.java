package com.hotel.booking.dto.response.room;

import com.hotel.booking.domain.enums.RoomType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class RoomDetailsResponse {
    UUID id;
    String roomNumber;
    RoomType type;
    BigDecimal basePrice;
    Integer capacity;
    BigDecimal areaSqm;
    Integer floor;

    // Удобства
    Boolean hasWifi;
    Boolean hasTv;
    Boolean hasMinibar;
    Boolean hasBalcony;
    Boolean hasSeaView;

    String name;
    String description;

    List<PhotoResponse> photos;
    UUID primaryPhotoId;

    Double averageRating;
    Long reviewCount;

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
