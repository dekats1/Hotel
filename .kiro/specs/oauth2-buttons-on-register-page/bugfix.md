# Bugfix Requirements Document

## Introduction

The registration page (register.html) is missing OAuth2 authentication buttons for Google and GitHub that are present on the login page (login.html). This creates an inconsistent user experience where users can authenticate via OAuth2 on login but not during registration. The backend OAuth2 configuration is fully functional (SecurityConfig.java lines 96-101), but the frontend registration page lacks the UI elements to trigger OAuth2 flows.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits the registration page (register.html) THEN the system does not display OAuth2 authentication buttons for Google and GitHub

1.2 WHEN a user visits the registration page (register.html) THEN the system does not display the OAuth2 divider section ("или зарегистрироваться через")

1.3 WHEN a user wants to register using OAuth2 providers THEN the system provides no UI mechanism to initiate OAuth2 registration flow

### Expected Behavior (Correct)

2.1 WHEN a user visits the registration page (register.html) THEN the system SHALL display OAuth2 authentication buttons for Google and GitHub with registration-appropriate text ("Зарегистрироваться через Google/GitHub")

2.2 WHEN a user visits the registration page (register.html) THEN the system SHALL display an OAuth2 divider with text "или зарегистрироваться через" before the OAuth2 buttons

2.3 WHEN a user clicks the Google OAuth2 button on register.html THEN the system SHALL redirect to `/oauth2/authorization/google` to initiate the OAuth2 registration flow

2.4 WHEN a user clicks the GitHub OAuth2 button on register.html THEN the system SHALL redirect to `/oauth2/authorization/github` to initiate the OAuth2 registration flow

2.5 WHEN OAuth2 buttons are displayed on register.html THEN the system SHALL use the same CSS classes as login.html (`oauth-divider`, `btn-oauth`, `btn-google`, `btn-github`) for visual consistency

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user visits the login page (login.html) THEN the system SHALL CONTINUE TO display OAuth2 buttons with text "Войти через Google/GitHub"

3.2 WHEN a user submits the traditional registration form on register.html THEN the system SHALL CONTINUE TO process the registration using username/password authentication

3.3 WHEN OAuth2 buttons are clicked on login.html THEN the system SHALL CONTINUE TO redirect to `/oauth2/authorization/google` and `/oauth2/authorization/github` respectively

3.4 WHEN the registration page footer is displayed THEN the system SHALL CONTINUE TO show the "Уже есть аккаунт? Войти" link and "Вернуться на главную" link

3.5 WHEN OAuth2 authentication completes successfully THEN the system SHALL CONTINUE TO use the existing OAuth2SuccessHandler configured in SecurityConfig.java
