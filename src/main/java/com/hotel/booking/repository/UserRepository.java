package com.hotel.booking.repository;

import com.hotel.booking.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u")
    List<User> findAllUsers();

    Optional<User> findUserByEmail( String email);

    Optional<User> findUserById(UUID id);

    boolean existsUserByEmail(String email);

    boolean existsUserByPhone( String phone);

    boolean existsUserById(UUID id);

    void deleteUserById(UUID id);
}