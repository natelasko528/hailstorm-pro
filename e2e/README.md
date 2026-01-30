# HailStorm Pro E2E Tests

This folder contains end-to-end test scripts for HailStorm Pro using browser automation (Cursor IDE Browser MCP).

## Test Structure

- `auth.test.md` - Authentication flow tests (signup, login, logout, OAuth)
- `dashboard.test.md` - Dashboard data loading and display tests
- `storms.test.md` - Storms page filtering and map interaction tests
- `leads.test.md` - Leads page filtering, sorting, pagination tests
- `properties.test.md` - Property detail page tests
- `settings.test.md` - Settings page save/load tests

## Running Tests

These tests are designed to be run using Cursor's browser automation tools. Each test file contains step-by-step instructions that can be executed using the MCP browser tools.

### Prerequisites

1. HailStorm Pro app running locally (`npm run dev`)
2. Supabase configured with test data
3. Valid test credentials

### Test Execution

Each test can be run by:
1. Opening the test file
2. Following the browser automation steps
3. Verifying expected outcomes

## Test Data

Tests expect the following test account:
- Email: `test@hailstormpro.com`
- Password: `TestPassword123!`

Or use Google OAuth for authentication tests.
