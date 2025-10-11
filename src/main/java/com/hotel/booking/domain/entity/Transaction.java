package com.hotel.booking.domain.entity;

import com.hotel.booking.domain.enums.CurrencyType;
import com.hotel.booking.domain.enums.TransactionStatus;
import com.hotel.booking.domain.enums.TransactionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_transactions_user", columnList = "user_id"),
        @Index(name = "idx_transactions_status", columnList = "status"),
        @Index(name = "idx_transactions_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    @NotNull(message = "Сумма транзакции обязательна")
    @DecimalMin(value = "0.01", message = "Сумма должна быть положительной")
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency", nullable = false)
    private CurrencyType currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    // Дополнительная информация
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 50)
    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // card, paypal, bank_transfer, etc.

    @Size(max = 255)
    @Column(name = "external_transaction_id", length = 255)
    private String externalTransactionId; // ID в платёжной системе

    // Метаданные
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    // Связь с бронированием
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (status == TransactionStatus.COMPLETED && completedAt == null) {
            completedAt = Instant.now();
        }
    }

    // Бизнес-логика
    public boolean isPending() {
        return status == TransactionStatus.PENDING;
    }

    public boolean isCompleted() {
        return status == TransactionStatus.COMPLETED;
    }

    public boolean isFailed() {
        return status == TransactionStatus.FAILED;
    }

    public boolean isCancelled() {
        return status == TransactionStatus.CANCELLED;
    }

    public boolean canBeCompleted() {
        return status == TransactionStatus.PENDING;
    }

    public boolean canBeCancelled() {
        return status == TransactionStatus.PENDING;
    }

    /**
     * Получить сумму с учётом типа транзакции
     * (положительная для пополнения, отрицательная для списания)
     */
    public BigDecimal getSignedAmount() {
        return amount.multiply(BigDecimal.valueOf(type.getMultiplier()));
    }

    /**
     * Создать описание транзакции по умолчанию
     */
    public void setDefaultDescription() {
        if (description == null || description.isEmpty()) {
            description = switch (type) {
                case DEPOSIT -> "Пополнение счёта";
                case PAYMENT -> booking != null
                        ? "Оплата бронирования #" + booking.getId()
                        : "Оплата";
                case REFUND -> booking != null
                        ? "Возврат средств за бронирование #" + booking.getId()
                        : "Возврат средств";
                case WITHDRAWAL -> "Вывод средств";
            };
        }
    }
}
