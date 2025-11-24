package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.Room;
import com.hotel.booking.domain.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    /**
     * Загружает все активные номера со всеми связанными данными
     */
    @Query("""
        SELECT DISTINCT r FROM Room r
        LEFT JOIN FETCH r.translations
        LEFT JOIN FETCH r.photos
        LEFT JOIN FETCH r.reviews rv
        WHERE r.isActive = true
        ORDER BY r.roomNumber
        """)
    List<Room> findAllRoomsWithDetails();

    /**
     * Находит доступные номера, исключая те, которые имеют
     * активные бронирования (PENDING, CONFIRMED, CHECKED_IN)
     * в указанный период
     */
    @Query("""
        SELECT DISTINCT r FROM Room r
        LEFT JOIN FETCH r.translations
        LEFT JOIN FETCH r.photos
        LEFT JOIN FETCH r.reviews rv
        WHERE r.isActive = true
        AND r.id NOT IN (
            SELECT DISTINCT b.room.id FROM Booking b
            WHERE b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            AND (
                (b.checkInDate < :checkOut AND b.checkOutDate > :checkIn)
            )
        )
        AND (:type IS NULL OR r.type = :type)
        AND (:guests IS NULL OR r.capacity >= :guests)
        ORDER BY r.roomNumber
        """)
    List<Room> findAvailableRooms(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("type") RoomType type,
            @Param("guests") Integer guests
    );

    /**
     * Проверяет доступность конкретного номера на указанные даты
     */
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
        AND (
            (b.checkInDate < :checkOut AND b.checkOutDate > :checkIn)
        )
        """)
    long countConflictingBookings(
            @Param("roomId") UUID roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );

    /**
     * Проверяет доступность номера, исключая конкретное бронирование
     * (для обновления существующего бронирования)
     */
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.room.id = :roomId
        AND b.id != :excludeBookingId
        AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
        AND (
            (b.checkInDate < :checkOut AND b.checkOutDate > :checkIn)
        )
        """)
    long countConflictingBookingsExcludingOne(
            @Param("roomId") UUID roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("excludeBookingId") UUID excludeBookingId
    );

    /**
     * Проверяет существование номера по его номеру (для админки)
     */
    boolean existsRoomByRoomNumber(String roomNumber);

    /**
     * Находит номер по его номеру
     */
    Optional<Room> findByRoomNumber(String roomNumber);

    /**
     * Находит номер по ID с полной загрузкой связанных данных
     */
    @Query("""
        SELECT DISTINCT r FROM Room r
        LEFT JOIN FETCH r.translations
        LEFT JOIN FETCH r.photos
        LEFT JOIN FETCH r.reviews rv
        WHERE r.id = :roomId
        """)
    Optional<Room> findByIdWithDetails(@Param("roomId") UUID roomId);

    /**
     * Находит все номера определенного типа
     */
    List<Room> findAllByType(RoomType type);

    /**
     * Находит все активные номера
     */
    List<Room> findAllByIsActiveTrue();

    /**
     * Находит все неактивные номера
     */
    List<Room> findAllByIsActiveFalse();

    /**
     * Находит номера по вместимости
     */
    List<Room> findAllByCapacityGreaterThanEqual(Integer capacity);

    /**
     * Находит номера в ценовом диапазоне
     */
    @Query("SELECT r FROM Room r WHERE r.basePrice BETWEEN :minPrice AND :maxPrice")
    List<Room> findRoomsByPriceRange(
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice
    );

    /**
     * Подсчитывает количество активных номеров
     */
    long countByIsActiveTrue();

    /**
     * Подсчитывает количество номеров по типу
     */
    long countByType(RoomType type);
}
