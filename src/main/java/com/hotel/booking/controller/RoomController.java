package com.hotel.booking.controller;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
import com.hotel.booking.service.RoomService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
class RoomController {
  private final RoomService roomService;

  @GetMapping("/getAllRooms")
  public ResponseEntity<List<RoomDTOResponse>> getAllRooms() {
    List<RoomDTOResponse> allRooms = roomService.getAllRooms();
    System.out.println(allRooms);
    return new ResponseEntity<>(allRooms, HttpStatus.OK);
  }

  @GetMapping("/available")
  public List<RoomDTOResponse> getAvailableRooms(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) Integer guests
  ) {
    return roomService.getAvailableRooms(checkIn, checkOut, type, guests);
  }

}