package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.entity.RoomPhoto;
import com.hotel.booking.domain.entity.RoomTranslation;
import com.hotel.booking.dto.request.room.CreateRoomRequest;
import com.hotel.booking.dto.response.admin.AdminRoomDetailsResponse;
import org.mapstruct.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "translations", ignore = true)
    @Mapping(target = "photos", ignore = true)
    @Mapping(target = "bookings", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "hasWifi", expression = "java(Boolean.TRUE.equals(request.getHasWifi()))")
    @Mapping(target = "hasTv", expression = "java(Boolean.TRUE.equals(request.getHasTv()))")
    @Mapping(target = "hasMinibar", expression = "java(Boolean.TRUE.equals(request.getHasMinibar()))")
    @Mapping(target = "hasBalcony", expression = "java(Boolean.TRUE.equals(request.getHasBalcony()))")
    @Mapping(target = "hasSeaView", expression = "java(Boolean.TRUE.equals(request.getHasSeaView()))")
    @Mapping(target = "isActive", expression = "java(Boolean.TRUE.equals(request.getIsActive()))")
    Room toEntity(CreateRoomRequest request);

    @Mapping(target = "translations", expression = "java(mapTranslations(room))")
    @Mapping(target = "photos", expression = "java(mapPhotos(room))")
    @Mapping(target = "averageRating", expression = "java(room.getAverageRating())")
    @Mapping(target = "reviewCount", expression = "java(room.getReviewCount())")
    AdminRoomDetailsResponse toAdminRoomDetailsResponse(Room room);

    // Вспомогательные методы (default methods)
    default Map<String, AdminRoomDetailsResponse.TranslationResponse> mapTranslations(Room room) {
        if (room.getTranslations() == null) {
            return Map.of();
        }
        return room.getTranslations().stream()
                .collect(Collectors.toMap(
                        RoomTranslation::getLanguage,
                        t -> AdminRoomDetailsResponse.TranslationResponse.builder()
                                .name(t.getName())
                                .description(t.getDescription())
                                .build()
                ));
    }

    default List<AdminRoomDetailsResponse.PhotoResponse> mapPhotos(Room room) {
        if (room.getPhotos() == null) {
            return List.of();
        }
        return room.getPhotos().stream()
                .sorted(Comparator.comparing(
                        RoomPhoto::getDisplayOrder,
                        Comparator.nullsLast(Integer::compareTo)))
                .map(p -> AdminRoomDetailsResponse.PhotoResponse.builder()
                        .id(p.getId())
                        .url(p.getUrl())
                        .thumbnailUrl(p.getThumbnailUrl())
                        .altText(p.getAltText())
                        .displayOrder(p.getDisplayOrder())
                        .isPrimary(Boolean.TRUE.equals(p.getIsPrimary()))
                        .build())
                .toList();
    }
}
