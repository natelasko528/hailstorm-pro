# Storms Page E2E Tests

## Test Environment Setup

- Base URL: http://localhost:5173
- Prerequisites: User logged in, storms data exists, Mapbox token configured

---

## TEST-STORMS-001: Storms Page Loads

### Steps
1. Navigate to /app/storms
2. Verify page renders
3. Check map is visible
4. Check storms list panel

### Expected Results
- Storms page loads
- Map renders with markers
- Storm list shows on sidebar
- No JavaScript errors

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: ".mapboxgl-map" }
browser_take_screenshot: { filename: "storms-loaded.png" }
```

---

## TEST-STORMS-002: Map Displays Markers

### Steps
1. Navigate to /app/storms
2. Wait for map to load
3. Verify storm markers visible
4. Hover over a marker
5. Verify popup appears

### Expected Results
- Map markers render for each storm
- Markers have correct severity colors
- Popup shows storm info on hover

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: ".mapboxgl-map", timeout: 10000 }
browser_wait_for: { timeout: 3000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "storms-map-markers.png" }
```

---

## TEST-STORMS-003: State Filter

### Steps
1. Navigate to /app/storms
2. Select a state from filter dropdown
3. Verify map updates
4. Verify storms list filters

### Expected Results
- State dropdown filters storms
- Map zooms to filtered area
- Only storms from selected state shown

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_select_option: { ref: "select", value: "TX" }
browser_wait_for: { timeout: 2000 }
browser_take_screenshot: { filename: "storms-filter-texas.png" }
```

---

## TEST-STORMS-004: Severity Filter

### Steps
1. Navigate to /app/storms
2. Select "Severe" from severity dropdown
3. Verify only severe storms show
4. Verify marker colors are correct

### Expected Results
- Severity filter works
- Only severe storms displayed
- Marker colors match severity

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_select_option: { ref: "select:nth-of-type(2)", value: "severe" }
browser_wait_for: { timeout: 2000 }
browser_snapshot: {}
browser_take_screenshot: { filename: "storms-filter-severe.png" }
```

---

## TEST-STORMS-005: Storm Search

### Steps
1. Navigate to /app/storms
2. Enter search term in search box
3. Verify results filter
4. Clear search

### Expected Results
- Search filters by storm name/county/state
- Results update dynamically
- Clear returns all storms

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_fill: { ref: "input[placeholder*=Search]", value: "Dallas" }
browser_wait_for: { timeout: 1000 }
browser_take_screenshot: { filename: "storms-search.png" }
```

---

## TEST-STORMS-006: Storm Selection

### Steps
1. Navigate to /app/storms
2. Click on a storm in the list
3. Verify map highlights the storm
4. Verify details panel shows info

### Expected Results
- Storm selection works
- Map pans/zooms to storm
- Storm polygon/marker highlights
- Details panel updates

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_click: { ref: "[class*=storm-item]:first-child" }
browser_wait_for: { timeout: 1000 }
browser_take_screenshot: { filename: "storms-selected.png" }
```

---

## TEST-STORMS-007: Map Controls

### Steps
1. Navigate to /app/storms
2. Use zoom in button
3. Use zoom out button
4. Use fullscreen button
5. Navigate/pan the map

### Expected Results
- Zoom controls work
- Fullscreen toggles
- Map navigation smooth
- Controls remain visible

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: ".mapboxgl-map", timeout: 10000 }
browser_click: { ref: ".mapboxgl-ctrl-zoom-in" }
browser_wait_for: { timeout: 500 }
browser_click: { ref: ".mapboxgl-ctrl-zoom-out" }
browser_wait_for: { timeout: 500 }
browser_take_screenshot: { filename: "storms-map-controls.png" }
```

---

## TEST-STORMS-008: Export Storms

### Steps
1. Navigate to /app/storms
2. Click "Export" button
3. Verify CSV downloads
4. Verify success toast

### Expected Results
- Export button works
- CSV file downloads
- Contains storm data
- Success message shows

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_click: { ref: "text=Export" }
browser_wait_for: { ref: "text=Exported", timeout: 5000 }
browser_take_screenshot: { filename: "storms-export.png" }
```

---

## TEST-STORMS-009: Map Legend

### Steps
1. Navigate to /app/storms
2. Verify legend is visible
3. Check all severity levels shown

### Expected Results
- Legend displays in corner
- Shows all 4 severity levels
- Colors match markers
- Labels readable

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: ".mapboxgl-map", timeout: 10000 }
browser_is_visible: { ref: "text=Legend" } OR { ref: "[class*=legend]" }
browser_take_screenshot: { filename: "storms-legend.png" }
```

---

## TEST-STORMS-010: Storms List Stats

### Steps
1. Navigate to /app/storms
2. Verify storm count displays
3. Check filter updates count

### Expected Results
- Total storms count shown
- Filtered count updates
- Stats are accurate

### Browser Commands
```
browser_navigate: { url: "http://localhost:5173/app/storms" }
browser_wait_for: { ref: "text=Storm Tracker", timeout: 10000 }
browser_snapshot: {}
browser_is_visible: { ref: "text=storms" }
browser_take_screenshot: { filename: "storms-stats.png" }
```
