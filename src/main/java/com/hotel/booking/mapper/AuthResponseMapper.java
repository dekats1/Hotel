package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.User;
import com.hotel.booking.dto.response.auth.AuthResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface AuthResponseMapper {

    @Mapping(target = "token", source = "token")
    @Mapping(target = "type", constant = "Bearer")
    @Mapping(target = "user", source = "user")
    AuthResponse toAuthResponse(String token, User user);
}
