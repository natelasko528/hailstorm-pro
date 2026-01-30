# Dashboard E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Prerequisites: User must be logged in

---

## TEST-DASH-001: Dashboard Loads With Data

### Steps
1. Login and navigate to /app
2. Verify dashboard renders
3. Check stats cards are present
4. Verify numbers are not zero/placeholder

### Expected Results
- Dashboard page loads
- Stats cards show real data (Leads, Storms, Appointments, Revenue)
- No loading spinners visible after load
- Activity feed shows recent items

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "text=Dashboard", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: "text=Total Leads" }
browser_is_visible: { ref: "text=Active Storms" }
browser_take_screenshot: { filename: "dashboard-loaded.png" }
```

---

## TEST-DASH-002: Stats Cards Display Correct Data

### Steps
1. Navigate to dashboard
2. Verify each stats card:
   - Total Leads (with count)
   - Active Storms (with count)
   - Appointments (with count)
   - Revenue (with $ amount)

### Expected Results
- All 4 stats cards visible
- Each card has:
  - Icon
  - Label text
  - Numeric value
  - Change indicator (optional)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "text=Total Leads", timeout: 10000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "stats-cards.png" }
```

---

## TEST-DASH-003: Recent Activity Feed

### Steps
1. Navigate to dashboard
2. Scroll to activity feed section
3. Verify activity items are present

### Expected Results
- Activity feed shows recent leads/storms
- Each item has date/time
- Items are clickable (links to detail)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "text=Recent Activity", timeout: 10000 }
browser_scroll: { ref: "text=Recent Activity" }
browser_snapshot: {}
browser_take_screenshot: { filename: "activity-feed.png" }
```

---

## TEST-DASH-004: Quick Actions Work

### Steps
1. Navigate to dashboard
2. Find "Quick Actions" section
3. Click on a quick action button
4. Verify navigation/action occurs

### Expected Results
- Quick actions are clickable
- Navigation to correct page occurs
- No JavaScript errors

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "text=Quick Actions", timeout: 10000 }
browser_click: { ref: "text=View All Leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 5000 }
browser_take_screenshot: { filename: "quick-action-leads.png" }
```

---

## TEST-DASH-005: Dashboard Responsive Layout

### Steps
1. Navigate to dashboard
2. Resize to mobile width (375px)
3. Verify layout adapts
4. Resize to tablet (768px)
5. Resize back to desktop (1280px)

### Expected Results
- Stats cards stack on mobile
- Sidebar collapses on mobile
- All content remains accessible
- No horizontal scroll on mobile

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_wait_for: { ref: "text=Dashboard", timeout: 10000 }
browser_resize: { width: 375, height: 667 }
browser_take_screenshot: { filename: "dashboard-mobile.png" }
browser_resize: { width: 768, height: 1024 }
browser_take_screenshot: { filename: "dashboard-tablet.png" }
browser_resize: { width: 1280, height: 720 }
browser_take_screenshot: { filename: "dashboard-desktop.png" }
```

---

## TEST-DASH-006: Navigation Links Work

### Steps
1. Navigate to dashboard
2. Click "Storms" in sidebar
3. Verify storms page loads
4. Click "Leads" in sidebar
5. Verify leads page loads
6. Click "Settings" in sidebar
7. Verify settings page loads

### Expected Results
- All navigation links work
- Correct pages load
- Active state shows in sidebar

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app" }
browser_click: { ref: "text=Storm Map" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 5000 }
browser_click: { ref: "text=Leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 5000 }
browser_click: { ref: "text=Settings" }
browser_wait_for: { ref: "text=Profile Information", timeout: 5000 }
browser_take_screenshot: { filename: "navigation-test.png" }
```

---

## TEST-DASH-007: Error Handling

### Steps
1. Disconnect network (simulate offline)
2. Navigate to dashboard
3. Verify error state shows
4. Reconnect network
5. Verify data loads

### Expected Results
- Error boundary catches failures
- Friendly error message displayed
- "Try Again" button works
- Data loads after retry

### Notes
This test requires manual network throttling or mock API failures.
