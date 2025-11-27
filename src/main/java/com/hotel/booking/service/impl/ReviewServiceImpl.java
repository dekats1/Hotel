package com.hotel.booking.service.impl;

import com.hotel.booking.domain.entity.Booking;
import com.hotel.booking.domain.entity.Review;
import com.hotel.booking.domain.entity.User;
import com.hotel.booking.domain.enums.BookingStatus;
import com.hotel.booking.dto.request.review.CreateReviewRequest;
import com.hotel.booking.dto.response.review.ReviewResponse;
import com.hotel.booking.exception.ReviewAlreadyExistsException;
import com.hotel.booking.exception.ReviewNotAllowedException;
import com.hotel.booking.mapper.ReviewMapper;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.ReviewRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.ReviewService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
  private final ReviewRepository reviewRepository;
  private final BookingRepository bookingRepository;
  private final UserRepository userRepository;
  private final ReviewMapper reviewMapper;

  @Override
  public List<ReviewResponse> getUserReviews(String name) {
    User user = userRepository.findUserByEmail(name).orElseThrow(() ->
            new UsernameNotFoundException(name));
    List<Review> userReviews = reviewRepository.findAllReviewsByUserId(user.getId());
    return userReviews.stream().map(reviewMapper::toReviewResponse).collect(Collectors.toList());
  }

  @Override
  @Transactional
  public ReviewResponse createReview(String name, CreateReviewRequest createReviewRequest) {
    User user = userRepository.findUserByEmail(name).orElseThrow(() ->
            new UsernameNotFoundException(name));
    Booking booking = bookingRepository.findBookingById(createReviewRequest.getBookingId())
            .orElseThrow(() -> new RuntimeException("Бронирование не найдено"));

    if (reviewRepository.existsByBookingId(booking.getId())) {
      throw new ReviewAlreadyExistsException(booking.getId());
    }

    LocalDate today = LocalDate.now();

    if (booking.getCheckOutDate().isBefore(today) && booking.getStatus() != BookingStatus.COMPLETED) {
      bookingRepository.updateBookingStatus(booking.getId(), BookingStatus.COMPLETED);
      booking.setStatus(BookingStatus.COMPLETED);
    }

    if (!booking.isCompleted()) {
      throw new ReviewNotAllowedException("Cannot leave review: booking not completed");
    }

    Review review = Review.builder()
            .booking(booking)
            .user(user)
            .room(booking.getRoom())
            .rating(createReviewRequest.getRating())
            .comment(createReviewRequest.getComment())
            .cleanlinessRating(createReviewRequest.getCleanlinessRating())
            .comfortRating(createReviewRequest.getComfortRating())
            .serviceRating(createReviewRequest.getServiceRating())
            .valueRating(createReviewRequest.getValueRating())
            .isApproved(false)
            .isVisible(true)
            .build();

    Review savedReview = reviewRepository.save(review);
    return reviewMapper.toReviewResponse(savedReview);
  }
}
