# Admin User API 400 Fix — Bugfix Design

## Overview

Two independent bugs cause HTTP 400 responses on admin user endpoints:

1. **`AdminUserUpdateRequest` uses Lombok `@Value`** — generates an immutable, all-args-constructor-only class. Jackson cannot deserialize a JSON request body without a no-arg constructor, so every `PUT /api/admin/users/{userId}` call fails with 400.
2. **Route ordering conflict in `AdminController`** — `GET /users/{userId}` is declared before `GET /users/profile`. Spring resolves the literal string `"profile"` as the `{userId}` path variable, attempts a `String → UUID` conversion, and throws `MethodArgumentTypeMismatchException` → 400.

Both fixes are minimal, surgical, and carry no risk of behavioral regression for unaffected endpoints.

## Glossary

- **Bug_Condition (C)**: The set of HTTP requests that trigger a 400 due to either root cause described above.
- **Property (P)**: The desired behavior — the endpoint returns 2xx with the correct response body.
- **Preservation**: All other admin and user endpoints must continue to behave exactly as before.
- **`AdminUserUpdateRequest`**: DTO in `src/main/java/com/hotel/booking/dto/request/admin/AdminUserUpdateRequest.java` that carries the request body for `PUT /api/admin/users/{userId}`.
- **`AdminController`**: REST controller in `src/main/java/com/hotel/booking/controller/AdminController.java` that maps all `/api/admin/**` routes.
- **`@Value` (Lombok)**: Generates a final, immutable class with a single all-args constructor — incompatible with Jackson's default deserialization strategy.
- **`@Data` (Lombok)**: Generates getters, setters, `equals`, `hashCode`, `toString`, and a no-arg constructor — fully compatible with Jackson.
- **Route ambiguity**: Spring MVC resolves path segments greedily; a literal segment (`/profile`) must be declared before a variable segment (`/{userId}`) to take precedence.

## Bug Details

### Bug Condition

The bug manifests under two distinct conditions, both resulting in HTTP 400:

**Condition A** — Jackson deserialization failure on `PUT /api/admin/users/{userId}`:
`AdminUserUpdateRequest` is annotated with `@Value`, which makes the class final and provides only an all-args constructor. Jackson's default `ObjectMapper` requires either a no-arg constructor or an explicit `@JsonCreator` to instantiate the DTO from a JSON body. Neither is present, so deserialization fails before the controller method is even invoked.

**Condition B** — UUID conversion failure on `GET /api/admin/users/profile`:
In `AdminController`, `GET /users/{userId}` is declared at line 43 and `GET /users/profile` at line 58. Spring MVC evaluates mappings in declaration order when specificity is equal. The literal `"profile"` is matched as the `{userId}` variable, and the `UUID` converter throws `MethodArgumentTypeMismatchException`.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request of type HttpRequest
  OUTPUT: boolean

  IF request.method = PUT
     AND request.path MATCHES "/api/admin/users/{uuid}"
     AND AdminUserUpdateRequest IS annotated WITH @Value
  THEN RETURN true   -- Condition A

  IF request.method = GET
     AND request.path = "/api/admin/users/profile"
     AND GET_userId_mapping IS declared BEFORE GET_profile_mapping IN AdminController
  THEN RETURN true   -- Condition B

  RETURN false
END FUNCTION
```

### Examples

- `PUT /api/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6` with valid JSON body → **400** (Jackson cannot instantiate `@Value` DTO). Expected: **200** with updated user.
- `GET /api/admin/users/profile` → **400** (`"profile"` parsed as UUID). Expected: **200** with current admin profile.
- `GET /api/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6` with valid UUID → **200** (unaffected by Condition B once profile route is fixed).
- `PUT /api/admin/users/{userId}` with a missing required field (e.g., no `email`) → **400** with validation error — this is correct behavior and must be preserved.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `GET /api/admin/users` continues to return 200 with the full user list.
- `POST /api/admin/users` continues to create a user and return 200.
- `DELETE /api/admin/users/{userId}` continues to delete and return 204.
- `PUT /api/admin/users/{userId}` with an invalid/missing field continues to return 400 with Bean Validation error details.
- All endpoints continue to return 403 when called without a valid ADMIN-role JWT.
- All room, booking, and review admin endpoints are completely unaffected.

**Scope:**
All requests that do NOT match the two bug conditions above must be completely unaffected by this fix. This includes:
- Any request to non-user admin endpoints (`/rooms`, `/bookings`, `/reviews`).
- Any request to `/api/users/**` (regular user controller).
- Any `PUT /api/admin/users/{userId}` request that intentionally carries an invalid body (validation errors must still be returned).

## Hypothesized Root Cause

1. **Wrong Lombok annotation on DTO**: `@Value` was likely chosen for immutability, but it is incompatible with Jackson's reflective deserialization. The correct annotation for a mutable Jackson-friendly DTO is `@Data`, which generates a no-arg constructor alongside getters/setters.

2. **Method declaration order in controller**: `GET /users/{userId}` was written before `GET /users/profile`. Spring MVC's `RequestMappingHandlerMapping` gives equal specificity to both when the request path is `/users/profile`, and resolves the ambiguity by picking the first registered mapping — the variable one. Declaring the literal `/profile` mapping first eliminates the ambiguity.

3. **No `@JsonCreator` fallback**: A secondary cause of Condition A is the absence of any Jackson annotation (`@JsonCreator`, `@JsonDeserialize`) that could compensate for the missing no-arg constructor. Replacing `@Value` with `@Data` is the cleanest fix.

4. **No integration test coverage**: Neither bug was caught before reaching production because there are no integration tests exercising these two specific request paths.

## Correctness Properties

Property 1: Bug Condition A — PUT Request Deserialization

_For any_ `PUT /api/admin/users/{userId}` request where the JSON body is valid and all required fields are present, the fixed `AdminUserUpdateRequest` (annotated `@Data`) SHALL be deserialized successfully by Jackson and the endpoint SHALL return HTTP 200 with the updated `AdminUserDetailsResponse`.

**Validates: Requirements 2.1**

Property 2: Bug Condition B — Literal Profile Route Resolution

_For any_ `GET /api/admin/users/profile` request made by an authenticated ADMIN, the fixed `AdminController` (with `/profile` declared before `/{userId}`) SHALL match the literal route and return HTTP 200 with the current admin's profile details.

**Validates: Requirements 2.2**

Property 3: Preservation — Validation Errors Still Returned

_For any_ `PUT /api/admin/users/{userId}` request where the JSON body is missing or has invalid required fields, the fixed code SHALL produce the same HTTP 400 validation error response as the original code, preserving Bean Validation behavior.

**Validates: Requirements 3.4**

Property 4: Preservation — Unaffected Endpoints

_For any_ request that does NOT match the bug condition (isBugCondition returns false), the fixed code SHALL produce exactly the same HTTP response as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

## Fix Implementation

### Changes Required

**Fix 1 — Replace `@Value` with `@Data`**

File: `src/main/java/com/hotel/booking/dto/request/admin/AdminUserUpdateRequest.java`

Specific Changes:
1. Remove `import lombok.Value;`
2. Add `import lombok.Data;`
3. Replace `@Value` annotation with `@Data` on the class declaration.

Result: Lombok generates a no-arg constructor, getters, and setters. Jackson can now deserialize the JSON body using its default strategy. The `@NotBlank`, `@NotNull`, and `@Size` Bean Validation annotations remain in place and continue to enforce field-level validation.

---

**Fix 2 — Reorder route declarations in `AdminController`**

File: `src/main/java/com/hotel/booking/controller/AdminController.java`

Specific Changes:
1. Move the `GET /users/profile` handler method (`getCurrentAdminProfile`) to appear **before** the `GET /users/{userId}` handler method (`getUserById`) in the class body.

Result: Spring MVC registers the literal `/profile` mapping first. When a request for `/api/admin/users/profile` arrives, the literal match takes precedence over the variable match, and no UUID conversion is attempted.

No changes to method signatures, annotations, or business logic are required for either fix.

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first run exploratory tests against the **unfixed** code to confirm the bugs reproduce as expected, then verify the fixes satisfy all correctness properties and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs on unfixed code. Confirm the root cause analysis. If tests do not fail as expected, re-hypothesize.

**Test Plan**: Write integration/unit tests that fire the exact HTTP requests described in the bug conditions and assert the expected 2xx responses. Run against the unfixed codebase — they should fail with 400.

**Test Cases**:
1. **PUT with valid body (Condition A)**: Send `PUT /api/admin/users/{validUUID}` with a complete, valid JSON body → assert 200. (Will fail on unfixed code — Jackson 400.)
2. **GET profile (Condition B)**: Send `GET /api/admin/users/profile` with ADMIN JWT → assert 200. (Will fail on unfixed code — UUID conversion 400.)
3. **GET by UUID after profile fix**: Send `GET /api/admin/users/{validUUID}` → assert 200. (Should pass on unfixed code; confirms no regression from fix 2.)
4. **PUT with missing field**: Send `PUT /api/admin/users/{validUUID}` with `email` omitted → assert 400 with validation message. (Should pass on unfixed code; confirms validation still works after fix 1.)

**Expected Counterexamples**:
- Test 1 fails: `HttpMessageNotReadableException` or `HttpMessageConversionException` — confirms `@Value` is the cause.
- Test 2 fails: `MethodArgumentTypeMismatchException` — confirms route ordering is the cause.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  response := fixedController.handle(request)
  ASSERT response.status IN [200, 204]
  ASSERT response.body IS valid AdminUserDetailsResponse (for PUT/GET)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT originalController.handle(request) = fixedController.handle(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many varied request inputs automatically.
- It catches edge cases (unusual field values, boundary UUIDs) that manual tests miss.
- It provides strong guarantees that non-buggy paths are unaffected.

**Test Plan**: Observe behavior of unaffected endpoints on unfixed code first, then write property-based tests that assert the same behavior holds after the fix.

**Test Cases**:
1. **Validation error preservation**: Generate PUT requests with random combinations of missing/invalid fields → assert 400 with validation details in all cases.
2. **GET list preservation**: Call `GET /api/admin/users` before and after fix → assert identical response.
3. **POST create preservation**: Call `POST /api/admin/users` with valid body → assert 200 and user created.
4. **DELETE preservation**: Call `DELETE /api/admin/users/{uuid}` → assert 204.
5. **Auth preservation**: Call any endpoint without JWT → assert 403.

### Unit Tests

- Test that `AdminUserUpdateRequest` can be instantiated via no-arg constructor and populated via setters after the `@Data` fix.
- Test that all Bean Validation constraints on `AdminUserUpdateRequest` still trigger correctly (null fields, blank strings, invalid email format).
- Test that `AdminController` method order places `/profile` before `/{userId}` in the handler mapping registry.

### Property-Based Tests

- Generate random valid `AdminUserUpdateRequest` JSON payloads and verify all deserialize successfully and return 200.
- Generate random invalid payloads (missing fields, wrong types) and verify all return 400 with validation errors.
- Generate random UUIDs for `GET /users/{userId}` and verify none are misrouted to the profile handler.

### Integration Tests

- Full Spring Boot slice test (`@WebMvcTest`) for `AdminController` covering both fixed endpoints.
- Verify `GET /api/admin/users/profile` returns 200 and correct body.
- Verify `PUT /api/admin/users/{userId}` with valid body returns 200.
- Verify `PUT /api/admin/users/{userId}` with invalid body returns 400 (regression guard).
- Verify `GET /api/admin/users/{validUUID}` still returns 200 after route reorder.
