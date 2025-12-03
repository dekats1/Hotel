package com.hotel.booking.dto.response.room;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDTOResponse {
  private UUID id;
  private String roomNumber;
  private String type;
  private BigDecimal basePrice;
  private Integer capacity;
  private BigDecimal areaSqm;
  private Integer floor;

  private Boolean hasWifi;
  private Boolean hasTv;
  private Boolean hasMinibar;
  private Boolean hasBalcony;
  private Boolean hasSeaView;
  private Boolean isActive;

  private Double stars;

  private List<TranslationDTO> translations;

  private List<PhotoDTO> photos;

  private Double averageRating;
  private Long reviewCount;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TranslationDTO {
    private String language;
    private String name;
    private String description;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PhotoDTO {
    private UUID id;
    private String url;
    private String thumbnailUrl;
    private String altText;
    private Integer displayOrder;
    private Boolean isPrimary;
  }
}
