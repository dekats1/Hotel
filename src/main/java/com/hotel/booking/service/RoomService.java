package com.hotel.booking.service;

import com.hotel.booking.dto.response.room.RoomDTOResponse;
import java.time.LocalDate;
import java.util.List;

public interface RoomService {

  List<RoomDTOResponse> getAllRooms();

  List<RoomDTOResponse> getAvailableRooms(LocalDate checkIn, LocalDate checkOut, String type, Integer guests);
}