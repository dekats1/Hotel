package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.request.auth.RegisterRequest;
import com.hotel.booking.dto.request.admin.AdminUserCreateRequest;
import com.hotel.booking.dto.response.auth.UserInfoResponse;
import com.hotel.booking.dto.response.user.UserProfileResponse;
import com.hotel.booking.dto.response.admin.AdminUserDetailsResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", ignore = true) // Пароль кодируется в сервисе
    @Mapping(target = "role", expression = "java(com.hotel.booking.domain.enums.UserRole.USER)")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "emailVerified", constant = "true")
    @Mapping(target = "balance", expression = "java(java.math.BigDecimal.ZERO)")
    @Mapping(target = "bookings", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    User toEntity(RegisterRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", ignore = true) // Пароль кодируется в сервисе
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "emailVerified", constant = "false")
    @Mapping(target = "balance", expression = "java(java.math.BigDecimal.ZERO)")
    @Mapping(target = "bookings", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    User toEntity(AdminUserCreateRequest request);

    @Mapping(target = "id", expression = "java(user.getId().toString())")
    @Mapping(target = "role", expression = "java(user.getRole().name())")
    UserInfoResponse toUserInfoResponse(User user);

    @Mapping(target = "id", expression = "java(user.getId().toString())")
    @Mapping(target = "role", expression = "java(user.getRole().name())")
    @Mapping(target = "totalBookings", expression = "java(user.getBookings() != null ? user.getBookings().size() : 0)")
    @Mapping(target = "membershipYears", expression = "java(java.time.LocalDate.now().getYear() - user.getCreatedAt().getYear())")
    UserProfileResponse toUserProfileResponse(User user);

    AdminUserDetailsResponse toAdminUserDetailsResponse(User user);
}
