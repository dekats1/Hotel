package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.room")
    List<Booking> findAllBookingsWithUserAndRoom();

    Optional<Booking> findBookingById(UUID id);

    @Query("SELECT b FROM Booking b JOIN FETCH b.room WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.room WHERE b.user.email = :email ORDER BY b.createdAt DESC")
    List<Booking> findByUserEmail(@Param("email") String email);

    @Modifying
    @Query("UPDATE Booking b SET b.status = :status WHERE b.id = :id")
    void updateBookingStatus(@Param("id") UUID id, @Param("status") BookingStatus status);
}
