package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Transaction;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.CurrencyType;
import com.hotel.booking.domain.enums.TransactionStatus;
import com.hotel.booking.domain.enums.TransactionType;
import com.hotel.booking.dto.request.wallet.DepositRequest;
import com.hotel.booking.dto.request.wallet.WithdrawRequest;
import com.hotel.booking.dto.response.wallet.TransactionResponse;
import com.hotel.booking.dto.response.wallet.WalletBalanceResponse;
import com.hotel.booking.exception.BadRequestException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.mapper.TransactionMapper;
import com.hotel.booking.repository.TransactionRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;

    @Override
    public WalletBalanceResponse getBalance(String email) {
        User user = findUserByEmail(email);

        return WalletBalanceResponse.builder()
                .userId(user.getId())
                .balance(user.getBalance())
                .currency(CurrencyType.BYN.name())
                .build();
    }

    @Override
    @Transactional
    public TransactionResponse deposit(String email, DepositRequest request) {
        User user = findUserByEmail(email);

        // Валидация суммы
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Сумма пополнения должна быть больше нуля");
        }

        if (request.getAmount().compareTo(new BigDecimal("1000000")) > 0) {
            throw new BadRequestException("Максимальная сумма пополнения: 1,000,000");
        }

        // Создаём транзакцию
        Transaction transaction = Transaction.builder()
                .user(user)
                .type(TransactionType.DEPOSIT)
                .amount(request.getAmount())
                .currency(CurrencyType.valueOf(request.getCurrency()))
                .status(TransactionStatus.COMPLETED)
                .description(request.getDescription())
                .paymentMethod(request.getPaymentMethod())
                .externalTransactionId(generateTransactionId())
                .createdAt(Instant.now())
                .completedAt(Instant.now())
                .build();

        // Устанавливаем описание по умолчанию, если не указано
        transaction.setDefaultDescription();

        // Увеличиваем баланс
        BigDecimal newBalance = user.getBalance().add(request.getAmount());
        user.setBalance(newBalance);

        // Сохраняем
        Transaction savedTransaction = transactionRepository.save(transaction);
        userRepository.save(user);

        log.info("✅ Deposit completed: userId={}, amount={}, newBalance={}",
                user.getId(), request.getAmount(), user.getBalance());

        return transactionMapper.toResponse(savedTransaction);
    }

    @Override
    @Transactional
    public TransactionResponse withdraw(String email, WithdrawRequest request) {
        User user = findUserByEmail(email);

        // Валидация суммы
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Сумма вывода должна быть больше нуля");
        }

        // Проверка баланса
        if (user.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BadRequestException("Недостаточно средств на счёте. Текущий баланс: " + user.getBalance());
        }

        // Минимальная сумма вывода
        if (request.getAmount().compareTo(new BigDecimal("10")) < 0) {
            throw new BadRequestException("Минимальная сумма вывода: 10 BYN");
        }

        // Создаём транзакцию
        Transaction transaction = Transaction.builder()
                .user(user)
                .type(TransactionType.WITHDRAWAL)
                .amount(request.getAmount())
                .currency(CurrencyType.valueOf(request.getCurrency()))
                .status(TransactionStatus.PENDING) // Вывод требует подтверждения
                .description(request.getDescription())
                .paymentMethod(request.getWithdrawalMethod())
                .externalTransactionId(generateTransactionId())
                .createdAt(Instant.now())
                .build();

        // Устанавливаем описание по умолчанию
        transaction.setDefaultDescription();

        // Уменьшаем баланс
        BigDecimal newBalance = user.getBalance().subtract(request.getAmount());
        user.setBalance(newBalance);

        // Сохраняем
        Transaction savedTransaction = transactionRepository.save(transaction);
        userRepository.save(user);

        log.info("✅ Withdrawal initiated: userId={}, amount={}, newBalance={}",
                user.getId(), request.getAmount(), user.getBalance());

        return transactionMapper.toResponse(savedTransaction);
    }

    @Override
    public List<TransactionResponse> getTransactionHistory(String email, int page, int size) {
        User user = findUserByEmail(email);

        PageRequest pageRequest = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        List<Transaction> transactions = transactionRepository
                .findByUserId(user.getId(), pageRequest)
                .getContent();

        return transactions.stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TransactionResponse getTransaction(String email, UUID transactionId) {
        User user = findUserByEmail(email);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId.toString()));

        // Проверяем, что транзакция принадлежит пользователю
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Доступ к транзакции запрещён");
        }

        return transactionMapper.toResponse(transaction);
    }

    /**
     * Генерировать уникальный ID транзакции
     */
    private String generateTransactionId() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private User findUserByEmail(String email) {
        return userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
