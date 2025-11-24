package com.hotel.booking.controller;

import com.hotel.booking.dto.response.room.RoomDTOResponse;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {

  private final RoomService roomService;

  @GetMapping("/getAllRooms")
  public ResponseEntity<List<RoomDTOResponse>> getAllRooms() {
    log.info("GET /api/rooms/getAllRooms");
    List<RoomDTOResponse> allRooms = roomService.getAllRooms();
    return ResponseEntity.ok(allRooms);
  }

  @GetMapping("/available")
  public ResponseEntity<List<RoomDTOResponse>> getAvailableRooms(
          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
          @RequestParam(required = false) String type,
          @RequestParam(required = false) Integer guests
  ) {
    log.info("GET /api/rooms/available - checkIn: {}, checkOut: {}, type: {}, guests: {}",
            checkIn, checkOut, type, guests);

    try {
      List<RoomDTOResponse> rooms = roomService.getAvailableRooms(checkIn, checkOut, type, guests);
      return ResponseEntity.ok(rooms);
    } catch (IllegalArgumentException e) {
      log.error("Invalid request parameters: {}", e.getMessage());
      return ResponseEntity.badRequest().build();
    }
  }
}
