# Settings Page E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Prerequisites: User logged in with profile data

---

## TEST-SETTINGS-001: Settings Page Loads

### Steps
1. Navigate to /app/settings
2. Verify page renders
3. Check tabs are visible

### Expected Results
- Settings page loads
- Profile tab active by default
- All 5 tabs visible (Profile, Notifications, Security, Billing, Integrations)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: "text=Notifications" }
browser_is_visible: { ref: "text=Security" }
browser_is_visible: { ref: "text=Billing" }
browser_is_visible: { ref: "text=Integrations" }
browser_take_screenshot: { filename: "settings-loaded.png" }
```

---

## TEST-SETTINGS-002: Profile Data Loads

### Steps
1. Navigate to /app/settings
2. Verify profile form has data
3. Check email field (should be disabled)

### Expected Results
- Profile data loads from database
- Email displays (not editable)
- Name fields populated (if set)
- Company name populated (if set)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_get_input_value: { ref: "input[type=email]" }
browser_is_enabled: { ref: "input[type=email]" }
browser_take_screenshot: { filename: "settings-profile-data.png" }
```

---

## TEST-SETTINGS-003: Update Profile

### Steps
1. Navigate to /app/settings
2. Update first name field
3. Update company name field
4. Click "Save Changes"
5. Verify success toast
6. Refresh and verify persisted

### Expected Results
- Fields are editable
- Save button triggers API call
- Success toast appears
- Data persists after refresh

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_fill: { ref: "input[placeholder*=First]", value: "TestFirst" }
browser_fill: { ref: "input[placeholder*=Company]", value: "Test Company LLC" }
browser_click: { ref: "text=Save Changes" }
browser_wait_for: { ref: "text=saved successfully", timeout: 5000 }
browser_reload: {}
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_get_input_value: { ref: "input[placeholder*=Company]" }
browser_take_screenshot: { filename: "settings-profile-updated.png" }
```

---

## TEST-SETTINGS-004: Tab Navigation

### Steps
1. Navigate to /app/settings
2. Click "Notifications" tab
3. Verify notifications content shows
4. Click "Security" tab
5. Verify security content shows
6. Return to "Profile" tab

### Expected Results
- Tab clicks switch content
- Active tab highlighted
- Content matches tab
- No page reload needed

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_click: { ref: "text=Notifications" }
browser_wait_for: { ref: "text=Notification Preferences", timeout: 5000 }
browser_take_screenshot: { filename: "settings-notifications.png" }
browser_click: { ref: "text=Security" }
browser_wait_for: { ref: "text=Security Settings", timeout: 5000 }
browser_take_screenshot: { filename: "settings-security.png" }
browser_click: { ref: "text=Profile" }
browser_wait_for: { ref: "text=Profile Information", timeout: 5000 }
```

---

## TEST-SETTINGS-005: Notification Toggles

### Steps
1. Navigate to /app/settings
2. Click "Notifications" tab
3. Toggle "New Storm Alerts"
4. Click "Save Preferences"
5. Verify saved

### Expected Results
- Toggle switches work
- Visual state changes
- Save persists to database
- Success toast shown

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_click: { ref: "text=Notifications" }
browser_wait_for: { ref: "text=Notification Preferences", timeout: 5000 }
browser_click: { ref: "text=New Storm Alerts" }
browser_wait_for: { timeout: 500 }
browser_click: { ref: "text=Save Preferences" }
browser_wait_for: { ref: "text=saved", timeout: 5000 }
browser_take_screenshot: { filename: "settings-notifications-saved.png" }
```

---

## TEST-SETTINGS-006: Password Change

### Steps
1. Navigate to /app/settings
2. Click "Security" tab
3. Fill current password (wrong)
4. Fill new password
5. Confirm new password
6. Click update - expect error

### Expected Results
- Password fields work
- Wrong current password shows error
- Password validation works
- Matching passwords required

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_click: { ref: "text=Security" }
browser_wait_for: { ref: "text=Change Password", timeout: 5000 }
browser_fill: { ref: "input[placeholder*=Current]", value: "WrongPassword" }
browser_fill: { ref: "input:nth-of-type(2)", value: "NewPassword123!" }
browser_fill: { ref: "input:nth-of-type(3)", value: "NewPassword123!" }
browser_click: { ref: "text=Update Password" }
browser_wait_for: { ref: "text=incorrect", timeout: 5000 }
browser_take_screenshot: { filename: "settings-password-error.png" }
```

---

## TEST-SETTINGS-007: Billing Tab Content

### Steps
1. Navigate to /app/settings
2. Click "Billing" tab
3. Verify billing content displays

### Expected Results
- Current plan shown
- Plan features listed
- Payment method section (may be empty)
- Billing history section

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_click: { ref: "text=Billing" }
browser_wait_for: { ref: "text=Billing & Subscription", timeout: 5000 }
browser_is_visible: { ref: "text=Free Plan" } OR { ref: "text=Professional Plan" }
browser_take_screenshot: { filename: "settings-billing.png" }
```

---

## TEST-SETTINGS-008: Integrations Tab

### Steps
1. Navigate to /app/settings
2. Click "Integrations" tab
3. Verify integrations list

### Expected Results
- Integrations list shows
- Each has name, description
- Connect/Disconnect buttons visible
- Coming soon notice shown

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_click: { ref: "text=Integrations" }
browser_wait_for: { ref: "text=GoHighLevel", timeout: 5000 }
browser_is_visible: { ref: "text=Mailchimp" }
browser_is_visible: { ref: "text=Zapier" }
browser_is_visible: { ref: "text=Coming Soon" }
browser_take_screenshot: { filename: "settings-integrations.png" }
```

---

## TEST-SETTINGS-009: Cancel Profile Edit

### Steps
1. Navigate to /app/settings
2. Modify a profile field
3. Click "Cancel" button
4. Verify data reverts

### Expected Results
- Cancel discards changes
- Original data restored
- No API call made
- Form resets to loaded values

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_fill: { ref: "input[placeholder*=First]", value: "ChangedValue" }
browser_click: { ref: "text=Cancel" }
browser_wait_for: { timeout: 1000 }
browser_get_input_value: { ref: "input[placeholder*=First]" }
browser_take_screenshot: { filename: "settings-cancel.png" }
```

---

## TEST-SETTINGS-010: Avatar Initials

### Steps
1. Navigate to /app/settings
2. Verify avatar shows initials
3. Check initials match name

### Expected Results
- Avatar circle displays
- Shows user's initials
- Styled with gradient background

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 10000 }
browser_is_visible: { ref: "[class*=rounded-full]" }
browser_take_screenshot: { filename: "settings-avatar.png" }
```
