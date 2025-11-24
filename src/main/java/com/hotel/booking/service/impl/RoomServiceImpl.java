package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.enums.RoomType;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
import com.hotel.booking.mapper.RoomMapper;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    return roomMapper.toDTOList(rooms);
  }

  @Override
  @Transactional(readOnly = true)
  public List<RoomDTOResponse> getAvailableRooms(
          LocalDate checkIn,
          LocalDate checkOut,
          String type,
          Integer guests
  ) {
    log.info("Searching available rooms: checkIn={}, checkOut={}, type={}, guests={}",
            checkIn, checkOut, type, guests);

    if (checkIn == null || checkOut == null) {
      log.warn("Check-in or check-out date is null, returning all active rooms");
      return getAllRooms();
    }

    if (checkIn.isAfter(checkOut) || checkIn.isEqual(checkOut)) {
      log.warn("Invalid date range: checkIn={}, checkOut={}", checkIn, checkOut);
      throw new IllegalArgumentException("Дата выезда должна быть позже даты заезда");
    }

    RoomType roomType = null;
    if (type != null && !type.isEmpty()) {
      try {
        roomType = RoomType.valueOf(type.toUpperCase());
      } catch (IllegalArgumentException e) {
        log.warn("Invalid room type: {}", type);
      }
    }

    List<Room> availableRooms = roomRepository.findAvailableRooms(
            checkIn,
            checkOut,
            roomType,
            guests
    );

    log.info("Found {} available rooms", availableRooms.size());
    return roomMapper.toDTOList(availableRooms);
  }
}
