package com.hotel.booking.dto.request.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class WithdrawRequest {

    @NotNull(message = "Сумма обязательна")
    @DecimalMin(value = "10.00", message = "Минимальная сумма вывода: 10")
    private BigDecimal amount;

    @NotNull(message = "Валюта обязательна")
    private String currency;

    @NotBlank(message = "Метод вывода обязателен")
    private String withdrawalMethod; // BANK_CARD, BANK_ACCOUNT

    @NotBlank(message = "Реквизиты обязательны")
    private String withdrawalDetails; // Номер карты или счёта

    private String description;
}
