package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.entity.RoomPhoto;
import com.hotel.booking.domain.entity.RoomTranslation;
import com.hotel.booking.dto.request.room.CreateRoomRequest;
import com.hotel.booking.dto.response.admin.AdminRoomDetailsResponse;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
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

  // ДЛЯ АДМИНА - оставляем Map
  @Mapping(target = "translations", expression = "java(mapTranslationsForAdmin(room))")
  @Mapping(target = "photos", expression = "java(mapAdminPhotos(room))")
  @Mapping(target = "averageRating", expression = "java(room.getAverageRating())")
  @Mapping(target = "reviewCount", expression = "java(room.getReviewCount())")
  AdminRoomDetailsResponse toAdminRoomDetailsResponse(Room room);

  // ДЛЯ КЛИЕНТА - используем List
  @Mapping(target = "type", source = "type")
  @Mapping(target = "translations", expression = "java(mapTranslationsToList(room))")
  @Mapping(target = "photos", expression = "java(mapPhotosToDTO(room))")
  @Mapping(target = "averageRating", expression = "java(room.getAverageRating())")
  @Mapping(target = "stars", expression = "java(room.getAverageRating())")
  @Mapping(target = "reviewCount", expression = "java(room.getReviewCount())")
  RoomDTOResponse toDTO(Room room);

  List<RoomDTOResponse> toDTOList(List<Room> rooms);

  // ДЛЯ АДМИНА - Map с ключом language
  default Map<String, AdminRoomDetailsResponse.TranslationResponse> mapTranslationsForAdmin(Room room) {
    if (room.getTranslations() == null || room.getTranslations().isEmpty()) {
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

  default List<AdminRoomDetailsResponse.PhotoResponse> mapAdminPhotos(Room room) {
    if (room.getPhotos() == null || room.getPhotos().isEmpty()) {
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

  // ДЛЯ КЛИЕНТА - List с полем language в каждом объекте
  default List<RoomDTOResponse.TranslationDTO> mapTranslationsToList(Room room) {
    if (room.getTranslations() == null || room.getTranslations().isEmpty()) {
      return List.of();
    }
    return room.getTranslations().stream()
            .map(t -> RoomDTOResponse.TranslationDTO.builder()
                    .language(t.getLanguage())  // ВАЖНО: добавляем поле language!
                    .name(t.getName())
                    .description(t.getDescription())
                    .build())
            .collect(Collectors.toList());
  }

  default List<RoomDTOResponse.PhotoDTO> mapPhotosToDTO(Room room) {
    if (room.getPhotos() == null || room.getPhotos().isEmpty()) {
      return List.of();
    }
    return room.getPhotos().stream()
            .sorted((p1, p2) -> {
              // Primary photos first
              if (Boolean.TRUE.equals(p1.getIsPrimary()) && !Boolean.TRUE.equals(p2.getIsPrimary())) return -1;
              if (!Boolean.TRUE.equals(p1.getIsPrimary()) && Boolean.TRUE.equals(p2.getIsPrimary())) return 1;
              // Then by display order
              return Comparator.comparing(
                      RoomPhoto::getDisplayOrder,
                      Comparator.nullsLast(Integer::compareTo)
              ).compare(p1, p2);
            })
            .map(p -> RoomDTOResponse.PhotoDTO.builder()
                    .id(p.getId())
                    .url(p.getUrl())
                    .thumbnailUrl(p.getThumbnailUrl())
                    .altText(p.getAltText())
                    .displayOrder(p.getDisplayOrder())
                    .isPrimary(Boolean.TRUE.equals(p.getIsPrimary()))
                    .build())
            .collect(Collectors.toList());
  }
}
