package com.hotel.booking.controller;

import com.hotel.booking.dto.request.review.CreateReviewRequest;
import com.hotel.booking.dto.request.review.ReviewResponse;
import com.hotel.booking.service.ReviewService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {
  private final ReviewService reviewService;

  @GetMapping("/getUserReviews")
  public ResponseEntity<List<ReviewResponse>> getUserReviews(Authentication authentication){
    List<ReviewResponse> reviewList = reviewService.getUserReviews(authentication.getName());
    return new ResponseEntity<>(reviewList, HttpStatus.OK);
  }

  @PostMapping("/createReview")
  public ResponseEntity<ReviewResponse> createReview(Authentication authentication, @RequestBody CreateReviewRequest createReviewRequest){
    ReviewResponse response = reviewService.createReview(authentication.getName(), createReviewRequest);
    return new ResponseEntity<>(response, HttpStatus.OK);
  }
}