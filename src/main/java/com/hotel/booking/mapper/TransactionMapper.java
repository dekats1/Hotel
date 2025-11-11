package com.hotel.booking.mapper;

import com.hotel.booking.domain.entity.Transaction;
import com.hotel.booking.dto.response.wallet.TransactionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(source = "currency", target = "currency")
    @Mapping(source = "booking.id", target = "bookingId")
    TransactionResponse toResponse(Transaction transaction);

    default String mapCurrency(com.hotel.booking.domain.enums.CurrencyType currency) {
        return currency != null ? currency.name() : null;
    }
}
