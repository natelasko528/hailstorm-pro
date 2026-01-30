# Properties Page E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Prerequisites: User logged in, leads data exists

---

## TEST-PROP-001: Property Page Loads Real Data

### Steps
1. Navigate to /app/leads
2. Click "View Details" on first lead
3. Verify property page loads
4. Verify real data (not mock) displays

### Expected Results
- Property page loads with real lead data
- Owner name matches lead from list
- Address and contact info display
- No hardcoded "John Smith" or mock data

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "text=View Details" }
browser_wait_for: { ref: "text=Owner Information", timeout: 10000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "property-real-data.png" }
```

---

## TEST-PROP-002: Property Details Section

### Steps
1. Navigate to property page
2. Verify Property Details section
3. Check fields display correctly

### Expected Results
- Property type shown
- Address complete
- City/State/Zip displayed
- Property value formatted

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Property Details", timeout: 10000 }
browser_is_visible: { ref: "text=Property Type" }
browser_is_visible: { ref: "text=Address" }
browser_take_screenshot: { filename: "property-details.png" }
```

---

## TEST-PROP-003: Damage Assessment Display

### Steps
1. Navigate to property page
2. Find Damage Assessment section
3. Verify three cards display

### Expected Results
- Damage Probability card shown
- Severity Level card shown
- Estimated Repair Cost card shown
- Values are calculated (not hardcoded)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Damage Assessment", timeout: 10000 }
browser_is_visible: { ref: "text=Damage Probability" }
browser_is_visible: { ref: "text=Severity Level" }
browser_is_visible: { ref: "text=Est. Repair Cost" }
browser_take_screenshot: { filename: "property-damage.png" }
```

---

## TEST-PROP-004: Lead Score Display

### Steps
1. Navigate to property page
2. Find Lead Score card in sidebar
3. Verify score and factors display

### Expected Results
- Lead score number displayed
- Priority level text shown
- Score factors listed
- Card is visually styled (gradient)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Lead Score", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: "text=Score Factors" }
browser_take_screenshot: { filename: "property-lead-score.png" }
```

---

## TEST-PROP-005: Quick Actions Work

### Steps
1. Navigate to property page
2. Find Quick Actions section
3. Click "Call Owner" (if phone exists)
4. Click "Send Email" (if email exists)
5. Click "View on Maps"

### Expected Results
- Call button opens dialer (or disabled if no phone)
- Email button opens mail client (or disabled if no email)
- Maps link opens Google Maps

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Quick Actions", timeout: 10000 }
browser_is_visible: { ref: "text=Call Owner" }
browser_is_visible: { ref: "text=Send Email" }
browser_is_visible: { ref: "text=View on Maps" }
browser_take_screenshot: { filename: "property-actions.png" }
```

---

## TEST-PROP-006: Status Update Persists

### Steps
1. Navigate to property page
2. Find Status dropdown
3. Change status to different value
4. Verify status updates
5. Refresh page
6. Verify status persisted

### Expected Results
- Status dropdown works
- Change triggers update to database
- Success toast shown
- Status persists after refresh

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Update Status", timeout: 10000 }
browser_select_option: { ref: "select", value: "qualified" }
browser_wait_for: { ref: "text=updated", timeout: 5000 }
browser_reload: {}
browser_wait_for: { ref: "text=Update Status", timeout: 10000 }
browser_get_input_value: { ref: "select" }
browser_take_screenshot: { filename: "property-status-persist.png" }
```

---

## TEST-PROP-007: Add Note Functionality

### Steps
1. Navigate to property page
2. Find activity timeline section
3. Enter note text
4. Click add note button
5. Verify note appears in timeline

### Expected Results
- Textarea accepts input
- Add button submits note
- Note appears in timeline
- Success toast shown
- Timestamp displays

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Activity Timeline", timeout: 10000 }
browser_fill: { ref: "textarea", value: "Test note from E2E test" }
browser_click: { ref: "text=Add Note" }
browser_wait_for: { ref: "text=Note added", timeout: 5000 }
browser_is_visible: { ref: "text=Test note from E2E test" }
browser_take_screenshot: { filename: "property-note-added.png" }
```

---

## TEST-PROP-008: Delete Note

### Steps
1. Navigate to property page with notes
2. Find a note in timeline
3. Click delete button on note
4. Verify note removed

### Expected Results
- Delete button visible on notes
- Confirmation or immediate delete
- Note disappears
- Success toast shown

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_wait_for: { ref: "text=Activity Timeline", timeout: 10000 }
browser_click: { ref: "button[aria-label=Delete] OR svg.lucide-trash-2" }
browser_wait_for: { ref: "text=deleted", timeout: 5000 }
browser_take_screenshot: { filename: "property-note-deleted.png" }
```

---

## TEST-PROP-009: Back Navigation

### Steps
1. Navigate to property from leads page
2. Click "Back to Leads" link
3. Verify returns to leads page

### Expected Results
- Back link works
- Returns to leads list
- Previous filters/page preserved (optional)

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "text=View Details" }
browser_wait_for: { ref: "text=Back to Leads", timeout: 10000 }
browser_click: { ref: "text=Back to Leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 5000 }
browser_take_screenshot: { filename: "property-back-nav.png" }
```

---

## TEST-PROP-010: Loading State

### Steps
1. Navigate directly to property page
2. Observe loading state
3. Wait for data to load

### Expected Results
- Loading spinner/skeleton shows
- Transitions smoothly to loaded state
- No flash of mock data

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/[ID]" }
browser_take_screenshot: { filename: "property-loading.png" }
browser_wait_for: { ref: "text=Owner Information", timeout: 10000 }
browser_take_screenshot: { filename: "property-loaded.png" }
```

---

## TEST-PROP-011: Error State (Invalid ID)

### Steps
1. Navigate to property with invalid ID
2. Verify error state displays
3. Check "Return to Leads" link

### Expected Results
- Error message shows "Property Not Found"
- No crash/blank screen
- Link to return to leads

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/properties/invalid-uuid-12345" }
browser_wait_for: { ref: "text=Property Not Found", timeout: 10000 }
browser_is_visible: { ref: "text=Return to Leads" }
browser_take_screenshot: { filename: "property-error.png" }
```
