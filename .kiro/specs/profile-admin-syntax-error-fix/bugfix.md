twoicalisues ithadm revewmagmntytm:

1.**JvaSrpt SytaxErrr**:Mngt l807 n`eAdmn.js`causes ae812,ing.

2.**Review Moderation Logic Prolems**: The `viewSttus()` functo uses inconsistent loicto eterereview states, checking `r.status`, `r.isAproved`, d `r.isVisibl` inconsig ways tha d't propery represent the three requred staes (PENDING, APPROVED, HIDDEN)

**Issue 1: JavaScript Syntax Error**issng)

**Iue 2: Review Moderato Loic Problems**

1.4 WHEN `reviewStatus(r` is called THEN the system checks `r.status` field which doesn't exist in the Review entity1.5 WHEN `reviewStatus(r)` evaluates `r.isApproved` THEN the system returns 'APPROVED' without checking `r.isVisible`, incorrectly showing approved status for hidden reviews

1.6 WHEN `reviewStatus(r)` evaluates `r.isVisible === false` THEN the system returns 'REJECTED' which is incorrect terminology (should be 'HIDDEN')

1.7 WHEN a new review is created with default values (`isApproved = false`, `isVisible = true`) THEN the system returns 'PENDING' but this logic is only reached as a fallback

1.8 WHEN the review modal displays action buttons THEN the system shows only "approve" and "reject" actions without a "hide" option

1.9 WHEN `moderateReview(action)` is called with action 'reject' THEN the system sets `isApproved=false` but doesn't set `isVisible=false`, failing to actually hide the review



**Issue 1: JavaScript Syntax Error**avaScript functionlity correctly

**Issue 2: Reiew Modertion Logic**

2.4 WHEN `reviewtatus(r)` is alled with `isAppoved = false` and `isVisble = true` THEN the system SHALL return 'PENDING' (На модерации)

2.5 WHEN `reviewStatus(r)` is called with `isAproved = true` and `isVisible = true` THEN he system SHALL return 'APPROVED' (Одобрен)

2.6 WHEN `reviewStatus(r)` is called with `isVisible = false`(regardless o `isApproved`) THEN the system SHALL retr 'HIDDEN' (Скрыт)

2.7 WHEN the review modal displays aon butts for a PENDING review THEN the system SHALL show "Одобрить" (approve) nd "Скрыть" (hide) buttons

2.8 WHEN the review modal dispays action buttons for an APPROVED revew THEN he sstem SHALL show "Скрыть"(hide) button

2.9 WHEN the review modal displays ation buttons f a HIDDEN view THEN the system SHALL show "Показать" (unhide) button

2.10 WHEN admin licks "Одобрить" (approve) THEN the sysem SHALL cal `/api/admin/reviews/{id}/approve?isApproved=true` to set `isApproved = true`

2.11 WHEN admin clicks "Скрыть" (hide) THEN the sstem SHALL update the review to set `isVisible = false`2.12 WHEN admin clicks "Показать" (unhide) THEN the system SHALL update the review to set `isVisible = true`

ay star rtings correctl

3.4 WHEN the backend endpoint `/api/admin/reviews/{id}/approve?isApproved=true/false` is called THEN the system SHALL CONTINUE TO update the`isApproved` field

3.5 WHEN a review is deleted THEN the ystem SHALL CONTINUE TO remove it from he database

3.6 WHEN reviews efilteed by r or earch term THEN the system SHALL CONTINUE TO filter

---

**Issue 3: EXPANDED - Logout Button Not Working - Incomplete Session Cleanup (Frontend AND Backend)**

The logout functionality has problems in BOTH frontend and backend:

**FRONTEND PROBLEM:**
The logout button exists in the HTML (profileAdmin.html line 103) with `id="logoutBtn"`, and the event listener is registered correctly. However, the `logout()` function in profileAdmin.js (lines 954-963) does NOT properly clear user session data from localStorage. After logout, user data remains in browser storage, which is a security issue and prevents proper session cleanup.

**BACKEND PROBLEM:**
The logout endpoint at `AuthController.logout()` (line 77-87) only clears the `auth_jwt` cookie but does NOT invalidate the HTTP session or clear the `JSESSIONID` cookie. SecurityConfig uses `SessionCreationPolicy.IF_REQUIRED` which creates JSESSIONID cookies. After logout, JSESSIONID remains active.

**CONCRETE EVIDENCE - Actual data remaining after logout:**

1. **localStorage key `user_data`** contains:
```json
{
  "id": "0d916165-9b01-4917-872d-47cd80980d8f",
  "email": "deniskatckozz@gmail.com",
  "firstName": "Денис",
  "lastName": "Кацко",
  "role": "USER"
}
```

2. **Cookie `JSESSIONID`** contains:
```
JSESSIONID=6719783B7B51828FA36B03DD2D12D19E
```

**localStorage key name:**
- From login.js line 17: `const USER_DATA_KEY = 'user_data';`
- From register.js line 12: `const USER_KEY = 'user_data';`
- Both use the same key: `'user_data'`

**Frontend Root Cause:**
The `logout()` function in profileAdmin.js does NOT call `localStorage.removeItem('user_data')` before redirecting.

**Backend Root Cause:**
The `logout()` endpoint in AuthController does NOT:
- Accept `HttpServletRequest request` parameter
- Call `request.getSession(false)` to get session
- Call `session.invalidate()` to clear JSESSIONID
- Explicitly clear JSESSIONID cookie

**Current Backend Implementation:**
```java
@PostMapping("/logout")
public ResponseEntity<Void> logout() {
    log.info("👋 Logout request received");
    ResponseCookie cookie = createJwtCookie("", 0);  // Only clears auth_jwt
    log.info("Logout successful, cookie cleared");
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .build();
}
```

**Expected Backend Fix:**
```java
@PostMapping("/logout")
public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    log.info("👋 Logout request received");
    
    // Clear JWT cookie
    ResponseCookie jwtCookie = createJwtCookie("", 0);
    
    // Invalidate HTTP session (clears JSESSIONID)
    HttpSession session = request.getSession(false);
    if (session != null) {
        session.invalidate();
    }
    
    // Explicitly clear JSESSIONID cookie
    Cookie jsessionCookie = new Cookie("JSESSIONID", "");
    jsessionCookie.setPath("/");
    jsessionCookie.setMaxAge(0);
    response.addCookie(jsessionCookie);
    
    log.info("Logout successful, all cookies cleared");
    
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
            .build();
}
```

**Security Impact:**
- Frontend: Leaving user data in localStorage after logout is a security vulnerability - anyone with access to the browser can see the user's ID, email, name, and role
- Backend: Leaving JSESSIONID active after logout means the HTTP session remains valid, potentially allowing session reuse

**Data that should be preserved:**
- `localStorage.getItem('theme')` - theme preference
- `localStorage.getItem('language')` - language preference
- `localStorage.getItem('currency')` - currency preference

**Comparison:** The main app.js logout function (lines 96-106) also doesn't clear localStorage, so BOTH implementations have the same issue.

### Current Behavior (Defect)

**Frontend Defects:**

1.10 WHEN the admin clicks the logout button THEN the system sends POST to `/api/auth/logout` and redirects to `/login` but does NOT call `localStorage.removeItem('user_data')`

1.11 WHEN the `logout()` function completes THEN the localStorage key `'user_data'` remains with value `{"id":"0d916165-9b01-4917-872d-47cd80980d8f","email":"deniskatckozz@gmail.com","firstName":"Денис","lastName":"Кацко","role":"USER"}`, allowing potential unauthorized access to cached user information

**Backend Defects:**

1.12 WHEN the backend `/api/auth/logout` endpoint is called THEN the system only clears the `auth_jwt` cookie but does NOT invalidate the HTTP session

1.13 WHEN the logout endpoint completes THEN the `JSESSIONID` cookie remains active with value like `JSESSIONID=6719783B7B51828FA36B03DD2D12D19E`, leaving the HTTP session valid

1.14 WHEN the `AuthController.logout()` method executes THEN the system does NOT call `request.getSession(false)` or `session.invalidate()` to clear the server-side session

1.15 WHEN the logout endpoint returns THEN the system does NOT explicitly clear the `JSESSIONID` cookie by setting it with `maxAge=0`

### Expected Behavior (Correct)

**Frontend Expected Behavior:**

2.13 WHEN the admin clicks the logout button THEN the system SHALL call the `logout()` function

2.14 WHEN the `logout()` function is called THEN the system SHALL send a POST request to `/api/auth/logout` with credentials and CSRF headers

2.15 WHEN the logout request completes THEN the system SHALL clear the localStorage key `'user_data'` by calling `localStorage.removeItem('user_data')`

2.16 WHEN the logout function clears localStorage THEN the system SHALL preserve user preferences (theme, language, currency) and only remove the `'user_data'` key

2.17 WHEN all frontend cleanup is complete THEN the system SHALL redirect to `/login` page

**Backend Expected Behavior:**

2.18 WHEN the backend `/api/auth/logout` endpoint is called THEN the system SHALL accept `HttpServletRequest request` and `HttpServletResponse response` as parameters

2.19 WHEN the logout endpoint executes THEN the system SHALL clear the JWT cookie by calling `createJwtCookie("", 0)`

2.20 WHEN the logout endpoint executes THEN the system SHALL call `request.getSession(false)` to retrieve the current HTTP session

2.21 WHEN the HTTP session exists (is not null) THEN the system SHALL call `session.invalidate()` to destroy the server-side session

2.22 WHEN the logout endpoint executes THEN the system SHALL explicitly clear the `JSESSIONID` cookie by creating a new Cookie with empty value, path="/", and maxAge=0

2.23 WHEN the logout endpoint completes THEN the system SHALL return ResponseEntity.ok() with the JWT cookie in the Set-Cookie header

### Unchanged Behavior (Regression Prevention)

3.7 WHEN other sidebar buttons are clicked THEN the system SHALL CONTINUE TO work correctly

3.8 WHEN the logout endpoint `/api/auth/logout` is called THEN the backend SHALL CONTINUE TO return a successful response (200 OK)

3.9 WHEN user preferences (theme, language, currency) are stored in localStorage THEN the system SHALL CONTINUE TO preserve these settings after logout

3.10 WHEN the JWT authentication filter processes requests THEN the system SHALL CONTINUE TO validate JWT tokens correctly

3.11 WHEN users log in after logout THEN the system SHALL CONTINUE TO create new sessions and set cookies correctly