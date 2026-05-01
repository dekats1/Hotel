# Implementation Plan

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - PUT Deserialization Failure (Condition A) & Profile Route Mismatch (Condition B)
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Scope to the concrete failing cases for reproducibility
  - Test A: Send `PUT /api/admin/users/{validUUID}` with a complete, valid JSON body → assert HTTP 200 (will fail with 400 — Jackson cannot instantiate `@Value` DTO, no no-arg constructor)
  - Test B: Send `GET /api/admin/users/profile` with ADMIN JWT → assert HTTP 200 (will fail with 400 — `"profile"` parsed as UUID, `MethodArgumentTypeMismatchException`)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found:
    - Condition A: `HttpMessageNotReadableException` or `HttpMessageConversionException` confirms `@Value` is the cause
    - Condition B: `MethodArgumentTypeMismatchException` confirms route ordering is the cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Unaffected Endpoint Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (isBugCondition returns false):
    - `GET /api/admin/users` → observe 200 with user list
    - `POST /api/admin/users` with valid body → observe 200 with created user
    - `DELETE /api/admin/users/{uuid}` → observe 204
    - `PUT /api/admin/users/{userId}` with missing/invalid field → observe 400 with validation details
    - Any admin endpoint without JWT → observe 403
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all PUT requests with random combinations of missing/invalid fields → assert 400 with validation details
    - For GET list, POST create, DELETE, and auth-failure paths → assert same responses as observed
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [-] 3. Fix admin user API 400 errors

  - [x] 3.1 Replace `@Value` with `@Data` in `AdminUserUpdateRequest`
    - In `src/main/java/com/hotel/booking/dto/request/admin/AdminUserUpdateRequest.java`:
    - Remove `import lombok.Value;`
    - Add `import lombok.Data;`
    - Replace `@Value` annotation with `@Data` on the class declaration
    - Result: Lombok generates a no-arg constructor, getters, and setters; Jackson can now deserialize the JSON body using its default strategy; Bean Validation annotations remain in place
    - _Bug_Condition: isBugCondition(request) where request.method = PUT AND AdminUserUpdateRequest IS annotated WITH @Value_
    - _Expected_Behavior: Jackson deserializes request body successfully; endpoint returns HTTP 200 with updated AdminUserDetailsResponse_
    - _Preservation: PUT requests with invalid/missing fields must still return HTTP 400 with Bean Validation error details_
    - _Requirements: 2.1, 3.4_

  - [x] 3.2 Move `GET /users/profile` handler before `GET /users/{userId}` in `AdminController`
    - In `src/main/java/com/hotel/booking/controller/AdminController.java`:
    - Move the `getCurrentAdminProfile()` method (currently at line ~58) to appear **before** the `getUserById()` method (currently at line ~43)
    - No changes to method signatures, annotations, or business logic required
    - Result: Spring MVC registers the literal `/profile` mapping first; when `/api/admin/users/profile` arrives, the literal match takes precedence and no UUID conversion is attempted
    - _Bug_Condition: isBugCondition(request) where request.method = GET AND request.path = "/api/admin/users/profile" AND GET_userId_mapping IS declared BEFORE GET_profile_mapping_
    - _Expected_Behavior: Literal /profile route matches; endpoint returns HTTP 200 with current admin profile_
    - _Preservation: GET /api/admin/users/{validUUID} must still return HTTP 200 with correct user details_
    - _Requirements: 2.2, 2.3, 3.1_

  - [ ] 3.3 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - PUT Deserialization & Profile Route Resolution
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Unaffected Endpoint Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass; ask the user if questions arise
