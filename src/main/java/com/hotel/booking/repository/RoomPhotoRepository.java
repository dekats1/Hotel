package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.RoomPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoomPhotoRepository extends JpaRepository<RoomPhoto, UUID> {
    // Дополнительные методы при необходимости
}
