package com.hotel.booking.dto.request.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsRequest {
    private String currency; // BYN, USD, EUR
    private String language; // RU, EN
}