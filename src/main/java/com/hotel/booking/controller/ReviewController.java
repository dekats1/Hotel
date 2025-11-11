package com.hotel.booking.controller;

import com.hotel.booking.dto.request.review.CreateReviewRequest;
import com.hotel.booking.dto.request.review.ReviewResponse;
import com.hotel.booking.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
  public ResponseEntity<?> createReview(
          Authentication authentication,
          @RequestBody CreateReviewRequest createReviewRequest
  ) {
    try {
      ReviewResponse response = reviewService.createReview(
              authentication.getName(),
              createReviewRequest
      );
      return ResponseEntity.ok(response);
    } catch (IllegalStateException e) {
      Map<String, String> error = new HashMap<>();
      error.put("message", e.getMessage());
      return ResponseEntity.badRequest().body(error);
    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("message", "Внутренняя ошибка сервера: " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
  }

}