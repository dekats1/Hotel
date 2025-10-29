package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Review;
import com.hotel.booking.dto.response.admin.AdminReviewResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(review.getUser().getFirstName() + \" \" + review.getUser().getLastName())")
    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.roomNumber")
    AdminReviewResponse toAdminReviewResponse(Review review);
}
