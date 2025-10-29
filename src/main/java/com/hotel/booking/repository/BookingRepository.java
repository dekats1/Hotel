package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.room")
    List<Booking> findAllBookingsWithUserAndRoom();

    Optional<Booking> findBookingById(UUID id);
}