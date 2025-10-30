package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.dto.response.room.RoomDTOResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    // Для получения всех комнат БЕЗ связанных сущностей (быстрый запрос)
    @Query("SELECT r FROM Room r WHERE r.isActive = true")
    List<Room> findAllActiveRooms();

    @Query("SELECT DISTINCT r FROM Room r " +
        "LEFT JOIN FETCH r.translations " +
        "LEFT JOIN FETCH r.photos " +
        "WHERE r.isActive = true")
    List<Room> findAllRoomsWithDetails();

    @Query("SELECT DISTINCT r FROM Room r " +
        "LEFT JOIN FETCH r.translations " +
        "LEFT JOIN FETCH r.photos " +
        "WHERE r.id = :id")
    Room findByIdWithDetails(UUID id);

    // Простой метод для всех комнат (без загрузки связей)
    @Query("SELECT r FROM Room r")
    List<Room> findAllRooms();

    boolean existsRoomByRoomNumber(
        @NotBlank(message = "Room number is required") @Size(max = 20) String roomNumber);
}
