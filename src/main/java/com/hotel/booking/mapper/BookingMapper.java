package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.dto.response.admin.AdminBookingDetailsResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.roomNumber")
    AdminBookingDetailsResponse toAdminBookingDetailsResponse(Booking booking);
}
