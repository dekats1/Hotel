package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
import com.hotel.booking.mapper.RoomMapper;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

  private final RoomRepository roomRepository;
  private final RoomMapper roomMapper;

  @Override
  @Transactional(readOnly = true)
  public List<RoomDTOResponse> getAllRooms() {
    log.info("Loading all rooms with details...");

    List<Room> rooms = roomRepository.findAllRoomsWithDetails();
    log.info("Loaded {} rooms from database", rooms.size());

    // Конвертируем в DTO (stars автоматически заполняется через маппер)
    List<RoomDTOResponse> dtos = roomMapper.toDTOList(rooms);
    log.info("Mapped to {} DTOs", dtos.size());

    // Логируем первый DTO для проверки
    if (!dtos.isEmpty()) {
      RoomDTOResponse firstDto = dtos.get(0);
      log.info("First DTO: id={}, stars={}, reviewCount={}",
          firstDto.getId(),
          firstDto.getStars(),
          firstDto.getReviewCount());
    }

    return dtos;
  }
}
