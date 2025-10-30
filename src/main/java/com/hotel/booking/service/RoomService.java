package com.hotel.booking.service;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
import com.hotel.booking.repository.RoomRepository;
import java.util.List;
import java.util.UUID;

public interface RoomService {

  List<RoomDTOResponse> getAllRooms();
}