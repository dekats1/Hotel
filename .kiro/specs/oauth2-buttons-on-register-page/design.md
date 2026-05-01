# OAuth2 Buttons on Register Page Bugfix Design

## Overview

The registration page (register.html) is missing OAuth2 authentication buttons that are present on the login page (login.html), creating an inconsistent user experience. The backend OAuth2 configuration is fully functional (SecurityConfig.java), but the frontend registration page lacks the UI elements to trigger OAuth2 registration flows. This fix will add the OAuth2 divider section and Google/GitHub authentication buttons to register.html, mirroring the implementation from login.html with registration-appropriate text.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user visits register.html, OAuth2 buttons are not displayed
- **Property (P)**: The desired behavior - OAuth2 buttons should be displayed on register.html with registration-appropriate text
- **Preservation**: Existing login.html OAuth2 buttons, traditional registration form functionality, and page footer links that must remain unchanged
- **OAuth2 Divider**: The visual separator element with text "или зарегистрироваться через" that appears before OAuth2 buttons
- **OAuth2 Buttons**: The clickable elements that redirect to `/oauth2/authorization/google` and `/oauth2/authorization/github`
- **register.html**: The registration page template located at `src/main/resources/templates/pages/register.html`
- **login.html**: The login page template located at `src/main/resources/templates/pages/login.html` that contains the reference OAuth2 implementation

## Bug Details

### Bug Condition

The bug manifests when a user visits the registration page (register.html). The page does not display OAuth2 authentication buttons for Google and GitHub, nor does it display the OAuth2 divider section. This occurs because the HTML markup for these elements is missing from the template.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PageVisit
  OUTPUT: boolean
  
  RETURN input.page == 'register.html'
         AND NOT hasOAuth2Divider(input.page)
         AND NOT hasOAuth2Buttons(input.page)
END FUNCTION
```

### Examples

- **Example 1**: User visits `/register` → OAuth2 divider is not displayed (Expected: divider with text "или зарегистрироваться через" should be visible)
- **Example 2**: User visits `/register` → Google OAuth2 button is not displayed (Expected: button with text "Зарегистрироваться через Google" should be visible)
- **Example 3**: User visits `/register` → GitHub OAuth2 button is not displayed (Expected: button with text "Зарегистрироваться через GitHub" should be visible)
- **Edge Case**: User visits `/login` → OAuth2 buttons are correctly displayed with text "Войти через Google/GitHub" (Expected: this behavior should remain unchanged)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Login page OAuth2 buttons must continue to display with text "Войти через Google/GitHub"
- Traditional registration form submission must continue to work with username/password authentication
- Registration page footer links ("Уже есть аккаунт? Войти" and "Вернуться на главную") must remain unchanged
- OAuth2 authentication flow must continue to use existing OAuth2SuccessHandler configured in SecurityConfig.java
- OAuth2 redirect endpoints (`/oauth2/authorization/google` and `/oauth2/authorization/github`) must remain unchanged

**Scope:**
All inputs that do NOT involve visiting the registration page should be completely unaffected by this fix. This includes:
- Login page rendering and OAuth2 button functionality
- Traditional form-based registration flow
- OAuth2 backend configuration and authentication handlers
- Page navigation and routing

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing HTML Markup**: The register.html template does not contain the HTML markup for the OAuth2 divider and buttons
   - login.html contains the OAuth2 section (lines 140-153) with divider and two OAuth2 buttons
   - register.html ends with the card-footer section (lines 285-297) and does not include OAuth2 markup
   - The OAuth2 section needs to be added after the card-footer but before the closing `</div><!-- /.card -->` tag

2. **Incomplete Template Migration**: When register.html was created, the OAuth2 section from login.html was not copied over
   - Both pages share similar structure (auth-card-wrapper, card, card-header, card-body, card-footer)
   - The OAuth2 section in login.html appears after the card-footer
   - This section was omitted from register.html during initial development

3. **Text Localization Not Applied**: The OAuth2 buttons need registration-specific text instead of login text
   - login.html uses "Войти через Google/GitHub" (Login via Google/GitHub)
   - register.html should use "Зарегистрироваться через Google/GitHub" (Register via Google/GitHub)
   - The divider text should be "или зарегистрироваться через" instead of "или войти через"

## Correctness Properties

Property 1: Bug Condition - OAuth2 Buttons Display on Register Page

_For any_ page visit where the user navigates to register.html, the fixed template SHALL display an OAuth2 divider with text "или зарегистрироваться через" followed by two OAuth2 buttons (Google and GitHub) with registration-appropriate text ("Зарегистрироваться через Google/GitHub"), using the same CSS classes as login.html for visual consistency.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Register Page Behavior

_For any_ page visit that is NOT to register.html (including login.html, traditional registration form submission, OAuth2 authentication flows), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for login page OAuth2 buttons, form-based registration, and OAuth2 backend processing.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/main/resources/templates/pages/register.html`

**Location**: After the card-footer section (after line 297), before the closing `</div><!-- /.card -->` tag

**Specific Changes**:
1. **Add OAuth2 Divider**: Insert a `<div class="oauth-divider">` element with the span text "или зарегистрироваться через"
   - Use the same CSS class `oauth-divider` as login.html for consistent styling
   - Position it after the card-footer section

2. **Add Google OAuth2 Button**: Insert an `<a>` element with href="/oauth2/authorization/google"
   - Use CSS classes: `btn btn-oauth btn-google`
   - Include Google icon: `<img src="/images/google-icon.svg" alt="Google" width="20" height="20">`
   - Button text: "Зарегистрироваться через Google"

3. **Add GitHub OAuth2 Button**: Insert an `<a>` element with href="/oauth2/authorization/github"
   - Use CSS classes: `btn btn-oauth btn-github`
   - Include GitHub icon: `<i class="fab fa-github"></i>`
   - Button text: "Зарегистрироваться через GitHub"

4. **Maintain HTML Structure**: Ensure the OAuth2 section is placed inside the card element but after the card-footer
   - This matches the structure in login.html where OAuth2 buttons appear at the bottom of the card

5. **Preserve Existing Elements**: Do not modify any existing elements in register.html
   - Keep all form fields, validation logic, and footer links unchanged
   - Only add the new OAuth2 section

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually inspect register.html in a browser and verify that OAuth2 buttons are missing. Check the HTML source to confirm the markup is absent. Run these tests on the UNFIXED code to observe the missing elements.

**Test Cases**:
1. **Register Page Visual Inspection**: Navigate to `/register` and verify OAuth2 divider is not visible (will fail on unfixed code)
2. **Register Page HTML Source**: View page source of `/register` and search for "oauth-divider" class (will fail on unfixed code - not found)
3. **Register Page Google Button**: Navigate to `/register` and verify Google OAuth2 button is not visible (will fail on unfixed code)
4. **Register Page GitHub Button**: Navigate to `/register` and verify GitHub OAuth2 button is not visible (will fail on unfixed code)

**Expected Counterexamples**:
- OAuth2 divider element is not present in register.html DOM
- Possible causes: missing HTML markup, incorrect template structure, CSS class not applied

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL pageVisit WHERE isBugCondition(pageVisit) DO
  result := renderPage_fixed(pageVisit)
  ASSERT hasOAuth2Divider(result)
  ASSERT hasOAuth2Buttons(result)
  ASSERT buttonText(result.googleButton) == "Зарегистрироваться через Google"
  ASSERT buttonText(result.githubButton) == "Зарегистрироваться через GitHub"
  ASSERT buttonHref(result.googleButton) == "/oauth2/authorization/google"
  ASSERT buttonHref(result.githubButton) == "/oauth2/authorization/github"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL pageVisit WHERE NOT isBugCondition(pageVisit) DO
  ASSERT renderPage_original(pageVisit) = renderPage_fixed(pageVisit)
END FOR
```

**Testing Approach**: Manual testing is recommended for preservation checking because:
- The change is isolated to a single template file (register.html)
- The fix only adds new elements without modifying existing ones
- Visual inspection can quickly confirm that login.html and other pages are unchanged
- Traditional registration form functionality can be verified through manual form submission

**Test Plan**: Observe behavior on UNFIXED code first for login page OAuth2 buttons and registration form submission, then verify this behavior continues after fix.

**Test Cases**:
1. **Login Page OAuth2 Preservation**: Navigate to `/login` and verify OAuth2 buttons display with text "Войти через Google/GitHub" (should work identically before and after fix)
2. **Registration Form Preservation**: Submit traditional registration form on `/register` and verify username/password registration works (should work identically before and after fix)
3. **Login OAuth2 Flow Preservation**: Click Google/GitHub buttons on `/login` and verify OAuth2 authentication flow works (should work identically before and after fix)
4. **Footer Links Preservation**: Verify "Уже есть аккаунт? Войти" and "Вернуться на главную" links on `/register` continue to work (should work identically before and after fix)

### Unit Tests

- Test that register.html renders with OAuth2 divider element present
- Test that register.html renders with Google OAuth2 button with correct href and text
- Test that register.html renders with GitHub OAuth2 button with correct href and text
- Test that OAuth2 buttons use correct CSS classes (oauth-divider, btn-oauth, btn-google, btn-github)

### Property-Based Tests

Not applicable for this fix - the change is purely presentational (HTML template modification) and does not involve business logic or data transformation that would benefit from property-based testing.

### Integration Tests

- Test full registration flow: navigate to `/register`, verify OAuth2 buttons are visible, click Google button, verify redirect to OAuth2 authorization endpoint
- Test full registration flow: navigate to `/register`, verify OAuth2 buttons are visible, click GitHub button, verify redirect to OAuth2 authorization endpoint
- Test that clicking OAuth2 buttons on register.html triggers the same OAuth2SuccessHandler as login.html
- Test visual consistency: verify OAuth2 buttons on register.html have the same styling as login.html
