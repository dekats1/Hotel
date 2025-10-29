package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.Room;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @Query("SELECT r FROM Room r")
    List<Room> findAllRooms();

    Optional<Room> findRoomById(UUID id);

    boolean existsRoomById(UUID id);

    void deleteRoomById(UUID id);

    boolean existsRoomByRoomNumber(String roomNumber);
}