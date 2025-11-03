package com.hotel.booking.dto.request.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositRequest {

    @NotNull(message = "Сумма обязательна")
    @DecimalMin(value = "0.01", message = "Сумма должна быть больше 0")
    private BigDecimal amount;

    @NotNull(message = "Валюта обязательна")
    private String currency; // BYN, USD, EUR (должно соответствовать CurrencyType enum)

    private String paymentMethod; // CARD, BANK_TRANSFER, CASH, PAYPAL

    private String description;
}
