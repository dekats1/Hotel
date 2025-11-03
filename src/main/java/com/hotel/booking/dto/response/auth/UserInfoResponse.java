package com.hotel.booking.dto.response.auth;


import lombok.*;

import java.util.UUID;


@Builder
@Value
@AllArgsConstructor

public class UserInfoResponse {
    UUID id;
    String email;
    String firstName;
    String lastName;
    String role;
}