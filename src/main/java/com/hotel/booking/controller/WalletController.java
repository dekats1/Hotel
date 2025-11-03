package com.hotel.booking.controller;

import com.hotel.booking.dto.request.wallet.DepositRequest;
import com.hotel.booking.dto.request.wallet.WithdrawRequest;
import com.hotel.booking.dto.response.wallet.TransactionResponse;
import com.hotel.booking.dto.response.wallet.WalletBalanceResponse;
import com.hotel.booking.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    /**
     * Получить баланс кошелька текущего пользователя
     */
    @GetMapping("/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WalletBalanceResponse> getBalance(Authentication authentication) {
        log.info("💰 Getting wallet balance for authenticated user");
        String email = getUserEmailFromAuthentication(authentication);

        WalletBalanceResponse balance = walletService.getBalance(email);
        return ResponseEntity.ok(balance);
    }

    /**
     * Пополнить кошелёк
     */
    @PostMapping("/deposit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TransactionResponse> deposit(
            Authentication authentication,
            @Valid @RequestBody DepositRequest request) {

        log.info("💵 Deposit request: amount={}, currency={}",
                request.getAmount(), request.getCurrency());

        String email = getUserEmailFromAuthentication(authentication);

        TransactionResponse response = walletService.deposit(email, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Вывести средства из кошелька
     */
    @PostMapping("/withdraw")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TransactionResponse> withdraw(
            Authentication authentication,
            @Valid @RequestBody WithdrawRequest request) {

        log.info("💸 Withdrawal request: amount={}, currency={}",
                request.getAmount(), request.getCurrency());

        String email = getUserEmailFromAuthentication(authentication);

        TransactionResponse response = walletService.withdraw(email, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Получить историю транзакций
     */
    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("📜 Getting transaction history: page={}, size={}", page, size);

        String email = getUserEmailFromAuthentication(authentication);

        List<TransactionResponse> transactions = walletService.getTransactionHistory(email, page, size);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Получить детали конкретной транзакции
     */
    @GetMapping("/transactions/{transactionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TransactionResponse> getTransaction(
            Authentication authentication,
            @PathVariable UUID transactionId) {

        log.info("🔍 Getting transaction details: id={}", transactionId);

        String email = getUserEmailFromAuthentication(authentication);

        TransactionResponse transaction = walletService.getTransaction(email, transactionId);
        return ResponseEntity.ok(transaction);
    }

    /**
     * Вспомогательный метод для извлечения email из Authentication
     */
    private String getUserEmailFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }

        if (principal instanceof String) {
            return (String) principal;
        }

        throw new IllegalStateException("Unable to extract email from authentication principal");
    }
}
