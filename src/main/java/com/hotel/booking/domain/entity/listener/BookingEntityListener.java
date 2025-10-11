package com.hotel.booking.domain.entity.listener;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.BookingHistory;
import com.hotel.booking.domain.enums.BookingStatus;
import jakarta.persistence.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class BookingEntityListener {

    private static ApplicationContext context;

    @Autowired
    public void setApplicationContext(ApplicationContext applicationContext) {
        context = applicationContext;
    }

    private static final ThreadLocal<BookingStatus> oldStatusHolder = new ThreadLocal<>();

    @PreUpdate
    public void preUpdate(Booking booking) {
        if (booking.getId() != null) {
            EntityManager em = getEntityManager();
            if (em != null) {
                Booking oldBooking = em.find(Booking.class, booking.getId());
                if (oldBooking != null) {
                    oldStatusHolder.set(oldBooking.getStatus());
                }
            }
        }
    }

    @PostUpdate
    public void postUpdate(Booking booking) {
        BookingStatus oldStatus = oldStatusHolder.get();
        BookingStatus newStatus = booking.getStatus();

        if (oldStatus != null && oldStatus != newStatus) {
            BookingHistory history = BookingHistory.builder()
                    .booking(booking)
                    .oldStatus(oldStatus)
                    .newStatus(newStatus)
                    .build();

            booking.getHistory().add(history);
        }

        oldStatusHolder.remove();
    }

    private EntityManager getEntityManager() {
        if (context != null) {
            try {
                return context.getBean(EntityManager.class);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}