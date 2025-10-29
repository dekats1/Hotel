package com.hotel.booking.dto.response.auth;


import lombok.*;


@Builder
@Value
@AllArgsConstructor

public class UserInfoResponse {
    String id;
    String email;
    String firstName;
    String lastName;
    String role;
}