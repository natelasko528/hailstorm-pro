# Leads Page E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Prerequisites: User must be logged in, leads data exists in database

---

## TEST-LEADS-001: Leads Page Loads With Data

### Steps
1. Navigate to /app/leads
2. Verify page renders
3. Check table has data rows
4. Verify pagination is visible

### Expected Results
- Leads table loads with data
- Shows count of total leads
- Pagination controls visible
- No loading state stuck

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: "table" }
browser_is_visible: { ref: "text=total leads" }
browser_take_screenshot: { filename: "leads-loaded.png" }
```

---

## TEST-LEADS-002: Search Functionality

### Steps
1. Navigate to /app/leads
2. Type search query in search box
3. Verify results filter
4. Clear search
5. Verify all results return

### Expected Results
- Search filters leads by name/address/city
- Results update as you type (debounced)
- Clearing search shows all leads

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_fill: { ref: "input[placeholder*=Search]", value: "Milwaukee" }
browser_wait_for: { timeout: 1000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "leads-search.png" }
browser_fill: { ref: "input[placeholder*=Search]", value: "" }
browser_wait_for: { timeout: 1000 }
```

---

## TEST-LEADS-003: Status Filter

### Steps
1. Navigate to /app/leads
2. Select "New" from status dropdown
3. Verify only "new" status leads show
4. Select "All Status"
5. Verify all leads return

### Expected Results
- Status dropdown filters correctly
- Count updates to reflect filter
- "new" status badges visible on all rows

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_select_option: { ref: "select", value: "new" }
browser_wait_for: { timeout: 1000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "leads-filter-new.png" }
browser_select_option: { ref: "select", value: "all" }
```

---

## TEST-LEADS-004: Score Filter

### Steps
1. Navigate to /app/leads
2. Select "High (70+)" from score dropdown
3. Verify only high-score leads show
4. Verify all scores are >= 70

### Expected Results
- Score filter works correctly
- Only leads with score >= 70 displayed
- Visual score indicators match filter

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_select_option: { ref: "select:nth-of-type(2)", value: "high" }
browser_wait_for: { timeout: 1000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "leads-filter-high.png" }
```

---

## TEST-LEADS-005: Sort Functionality

### Steps
1. Navigate to /app/leads
2. Select "Sort by Date"
3. Verify leads sorted by date descending
4. Select "Sort by Value"
5. Verify leads sorted by property value

### Expected Results
- Sorting changes order of leads
- Most recent/highest values first
- Sort persists across filter changes

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_select_option: { ref: "select", value: "date" }
browser_wait_for: { timeout: 1000 }
browser_take_screenshot: { filename: "leads-sort-date.png" }
browser_select_option: { ref: "select", value: "value" }
browser_wait_for: { timeout: 1000 }
browser_take_screenshot: { filename: "leads-sort-value.png" }
```

---

## TEST-LEADS-006: Pagination

### Steps
1. Navigate to /app/leads
2. Verify showing 1-25 of X leads
3. Click page 2 button
4. Verify page changes
5. Click previous button
6. Verify back on page 1

### Expected Results
- Pagination shows correct range
- Navigation between pages works
- Page indicator updates
- New data loads on page change

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_is_visible: { ref: "text=Showing 1 to 25" }
browser_click: { ref: "button:has-text('2')" }
browser_wait_for: { ref: "text=Showing 26 to 50", timeout: 5000 }
browser_take_screenshot: { filename: "leads-page-2.png" }
browser_click: { ref: "[aria-label=Previous]" } OR { ref: "button svg.lucide-chevron-left" }
browser_wait_for: { ref: "text=Showing 1 to 25", timeout: 5000 }
```

---

## TEST-LEADS-007: Status Update

### Steps
1. Navigate to /app/leads
2. Find a lead with "new" status
3. Change status to "contacted"
4. Verify status updates
5. Verify success toast appears

### Expected Results
- Status dropdown on each row works
- Status change persists to database
- Success toast shown
- UI updates immediately

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "tr:first-child select" }
browser_select_option: { ref: "tr:first-child select", value: "contacted" }
browser_wait_for: { ref: "text=Lead status updated", timeout: 5000 }
browser_take_screenshot: { filename: "leads-status-updated.png" }
```

---

## TEST-LEADS-008: View Details Link

### Steps
1. Navigate to /app/leads
2. Click "View Details" on first lead
3. Verify redirected to property page
4. Verify lead data displays

### Expected Results
- Click navigates to /app/properties/:id
- Property page shows lead data
- Back button returns to leads

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "text=View Details" }
browser_wait_for: { ref: "text=Owner Information", timeout: 5000 }
browser_take_screenshot: { filename: "lead-details.png" }
browser_click: { ref: "text=Back to Leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 5000 }
```

---

## TEST-LEADS-009: Bulk Selection

### Steps
1. Navigate to /app/leads
2. Click checkbox on header (select all)
3. Verify all visible leads selected
4. Verify bulk actions bar appears
5. Click "Clear" to deselect

### Expected Results
- Select all checkbox works
- Count shows selected leads
- Bulk action bar appears
- Clear button deselects all

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "thead input[type=checkbox]" }
browser_wait_for: { ref: "text=selected", timeout: 2000 }
browser_take_screenshot: { filename: "leads-bulk-select.png" }
browser_click: { ref: "text=Clear" }
```

---

## TEST-LEADS-010: Export to CSV

### Steps
1. Navigate to /app/leads
2. Click "Export All" button
3. Verify download starts
4. Verify success toast

### Expected Results
- CSV file downloads
- File contains all leads data
- Success message shown

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/leads" }
browser_wait_for: { ref: "text=Lead Management", timeout: 10000 }
browser_click: { ref: "text=Export All" }
browser_wait_for: { ref: "text=Exported", timeout: 5000 }
browser_take_screenshot: { filename: "leads-export.png" }
```
