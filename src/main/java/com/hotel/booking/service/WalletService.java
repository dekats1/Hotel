package com.hotel.booking.service;

import com.hotel.booking.dto.request.wallet.DepositRequest;
import com.hotel.booking.dto.request.wallet.WithdrawRequest;
import com.hotel.booking.dto.response.wallet.TransactionResponse;
import com.hotel.booking.dto.response.wallet.WalletBalanceResponse;

import java.util.List;
import java.util.UUID;

public interface WalletService {

    WalletBalanceResponse getBalance(String email);


    TransactionResponse deposit(String email, DepositRequest request);


    TransactionResponse withdraw(String email, WithdrawRequest request);


    List<TransactionResponse> getTransactionHistory(String email, int page, int size);

    TransactionResponse getTransaction(String email, UUID transactionId);
}
