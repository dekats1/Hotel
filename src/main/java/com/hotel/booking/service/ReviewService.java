package com.hotel.booking.service;

import com.hotel.booking.dto.request.review.CreateReviewRequest;
import com.hotel.booking.dto.response.review.ReviewResponse;
import java.util.List;

public interface ReviewService {

  List<ReviewResponse> getUserReviews(String name);

  ReviewResponse createReview(String name, CreateReviewRequest createReviewRequest);
}