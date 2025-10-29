    package com.hotel.booking.repository;

    import com.hotel.booking.domain.entity.Review;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.stereotype.Repository;

    import java.util.List;
    import java.util.Optional;
    import java.util.UUID;

    @Repository
    public interface ReviewRepository extends JpaRepository<Review, UUID> {

        @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.room JOIN FETCH r.booking")
        List<Review> findAllReviewsWithUserAndRoom();

        Optional<Review> findReviewById(UUID id);

        boolean existsReviewById(UUID id);

        void deleteReviewById(UUID id);
    }