package com.hotel.booking.dto.response.wallet;

import com.hotel.booking.domain.enums.TransactionStatus;
import com.hotel.booking.domain.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private TransactionStatus status;
    private String description;
    private String paymentMethod;
    private String externalTransactionId;
    private Instant createdAt;
    private Instant completedAt;
    private UUID bookingId;
}
