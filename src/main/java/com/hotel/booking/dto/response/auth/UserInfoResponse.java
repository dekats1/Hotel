package com.hotel.booking.dto.response.auth;


import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserInfoResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}