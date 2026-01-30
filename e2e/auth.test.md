# Authentication E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Test Email: test@hailstormpro.com
- Test Password: TestPassword123!

---

## TEST-AUTH-001: Login Page Loads Correctly

### Steps
1. Navigate to http://localhost:5173/login
2. Take snapshot of page
3. Verify elements present:
   - Email input field
   - Password input field
   - "Sign In" button
   - "Continue with Google" button
   - Toggle link for signup

### Expected Results
- Login page renders with all form elements
- Google OAuth button is visible
- No console errors

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_snapshot: {}
browser_is_visible: { ref: "[data-testid=email-input]" } OR { ref: "input[type=email]" }
browser_is_visible: { ref: "[data-testid=password-input]" } OR { ref: "input[type=password]" }
browser_is_visible: { ref: "button[type=submit]" }
browser_take_screenshot: { filename: "login-page.png" }
```

---

## TEST-AUTH-002: Sign Up Flow

### Steps
1. Navigate to http://localhost:5173/login
2. Click "Don't have an account? Sign up" link
3. Fill email: newuser@test.com
4. Fill password: NewUserPass123!
5. Click "Create Account" button
6. Verify success message appears

### Expected Results
- Form switches to signup mode
- Button text changes to "Create Account"
- After submit: success toast "Account created! Please check your email to verify."

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_click: { ref: "text=Don't have an account" }
browser_fill: { ref: "input[type=email]", value: "newuser@test.com" }
browser_fill: { ref: "input[type=password]", value: "NewUserPass123!" }
browser_click: { ref: "button[type=submit]" }
browser_wait_for: { ref: "text=Account created", timeout: 5000 }
browser_take_screenshot: { filename: "signup-success.png" }
```

---

## TEST-AUTH-003: Login with Email/Password

### Steps
1. Navigate to http://localhost:5173/login
2. Fill email: test@hailstormpro.com
3. Fill password: TestPassword123!
4. Click "Sign In" button
5. Wait for redirect to /app
6. Verify dashboard loads

### Expected Results
- After login: redirect to /app (dashboard)
- Success toast "Welcome back!"
- User name visible in header/sidebar

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_fill: { ref: "input[type=email]", value: "test@hailstormpro.com" }
browser_fill: { ref: "input[type=password]", value: "TestPassword123!" }
browser_click: { ref: "button[type=submit]" }
browser_wait_for: { ref: "text=Dashboard", timeout: 10000 }
browser_take_screenshot: { filename: "login-success.png" }
```

---

## TEST-AUTH-004: Login with Invalid Credentials

### Steps
1. Navigate to http://localhost:5173/login
2. Fill email: wrong@email.com
3. Fill password: wrongpassword
4. Click "Sign In" button
5. Verify error message

### Expected Results
- Error toast appears with authentication failure message
- User remains on login page
- Form is not cleared

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_fill: { ref: "input[type=email]", value: "wrong@email.com" }
browser_fill: { ref: "input[type=password]", value: "wrongpassword" }
browser_click: { ref: "button[type=submit]" }
browser_wait_for: { ref: "[class*=toast]", timeout: 5000 }
browser_take_screenshot: { filename: "login-error.png" }
```

---

## TEST-AUTH-005: Google OAuth Button

### Steps
1. Navigate to http://localhost:5173/login
2. Click "Continue with Google" button
3. Verify OAuth redirect initiates

### Expected Results
- Google OAuth popup or redirect occurs
- No JavaScript errors
- Button shows loading state while redirecting

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_is_visible: { ref: "text=Continue with Google" }
browser_click: { ref: "text=Continue with Google" }
browser_take_screenshot: { filename: "google-oauth.png" }
```

---

## TEST-AUTH-006: Logout Flow

### Prerequisites
- User must be logged in first

### Steps
1. Navigate to http://localhost:5173/app
2. Click sign out button (in header or sidebar)
3. Verify redirect to login page
4. Attempt to access /app directly
5. Verify redirect back to login

### Expected Results
- User is logged out
- Redirected to /login
- Protected routes redirect to login

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_click: { ref: "text=Sign Out" } OR { ref: "[aria-label=Sign out]" }
browser_wait_for: { ref: "input[type=email]", timeout: 5000 }
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "input[type=email]", timeout: 5000 }
browser_take_screenshot: { filename: "logout-success.png" }
```

---

## TEST-AUTH-007: Protected Routes Redirect

### Steps
1. Clear browser cookies/session
2. Navigate directly to http://localhost:5173/app
3. Verify redirect to login

### Expected Results
- Unauthenticated users cannot access /app/*
- Redirect to /login occurs automatically

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "input[type=email]", timeout: 5000 }
browser_take_screenshot: { filename: "protected-route.png" }
```

---

## TEST-AUTH-008: Session Persistence

### Steps
1. Login successfully
2. Close browser tab
3. Open new tab to http://localhost:5173/app
4. Verify still logged in

### Expected Results
- Session persists across page refreshes
- User remains authenticated
- Dashboard loads without re-login

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/login" }
browser_fill: { ref: "input[type=email]", value: "test@hailstormpro.com" }
browser_fill: { ref: "input[type=password]", value: "TestPassword123!" }
browser_click: { ref: "button[type=submit]" }
browser_wait_for: { ref: "text=Dashboard", timeout: 10000 }
browser_reload: {}
browser_wait_for: { ref: "text=Dashboard", timeout: 10000 }
browser_take_screenshot: { filename: "session-persist.png" }
```
