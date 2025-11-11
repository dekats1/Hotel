package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.dto.response.admin.AdminBookingDetailsResponse;
import com.hotel.booking.dto.response.booking.BookingResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.temporal.ChronoUnit;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "userFullName", expression = "java(booking.getUser().getFirstName() + \" \" + booking.getUser().getLastName())")

    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.roomNumber")
    @Mapping(target = "roomType", source = "room.type")

    @Mapping(target = "totalNights", expression = "java(calculateTotalNights(booking))")

    BookingResponse toResponse(Booking booking);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "userFullName", expression = "java(booking.getUser().getFirstName() + \" \" + booking.getUser().getLastName())")
    @Mapping(target = "userPhone", source = "user.phone")

    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.roomNumber")
    @Mapping(target = "roomType", source = "room.type")

    @Mapping(target = "totalNights", expression = "java(calculateTotalNights(booking))")

    AdminBookingDetailsResponse toAdminBookingDetailsResponse(Booking booking);

    default Integer calculateTotalNights(Booking booking) {
        if (booking.getCheckInDate() == null || booking.getCheckOutDate() == null) {
            return null;
        }
        return (int) ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
    }
}
