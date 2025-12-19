# Test Cases

## 1. User Authentication

### TC-001: User logs in with Google OAuth successfully
- **Preconditions**: User has a valid Google account.
- **Steps**:
    1. Navigate to the login page.
    2. Click on "Login with Google."
    3. Authenticate via Google OAuth.
- **Expected Result**: User is redirected to the dashboard and authenticated.
- **Priority**: High

### TC-002: Unauthorized user cannot access dashboard
- **Preconditions**: User is not logged in.
- **Steps**:
    1. Attempt to access the dashboard URL directly.
- **Expected Result**: User is redirected to the login page.
- **Priority**: High

### TC-003: Session persists across page refreshes
- **Preconditions**: User is logged in.
- **Steps**:
    1. Refresh the dashboard page.
- **Expected Result**: User remains logged in and stays on the dashboard.
- **Priority**: High

## 2. Test Group Management

### TC-004: Moderator creates test group with valid domain
- **Preconditions**: Moderator is logged in.
- **Steps**:
    1. Navigate to the "Test Groups" page.
    2. Click "Create Test Group."
    3. Enter a valid domain and submit.
- **Expected Result**: Test group is created successfully.
- **Priority**: High

### TC-005: Invalid domain format rejected
- **Preconditions**: Moderator is logged in.
- **Steps**:
    1. Navigate to the "Test Groups" page.
    2. Click "Create Test Group."
    3. Enter an invalid domain format and submit.
- **Expected Result**: Error message is displayed, and the group is not created.
- **Priority**: Medium

### TC-006: Test member invitation email sent
- **Preconditions**: Test group exists.
- **Steps**:
    1. Add a test member to the group.
- **Expected Result**: Invitation email is sent to the test member.
- **Priority**: High

## 3. Widget Embedding

### TC-007: Widget script loads on authorized domain
- **Preconditions**: Widget is embedded on an authorized domain.
- **Steps**:
    1. Load the page with the widget script.
- **Expected Result**: Widget script loads successfully.
- **Priority**: High

### TC-008: Widget button appears in bottom-right corner
- **Preconditions**: Widget script is loaded.
- **Steps**:
    1. Inspect the page layout.
- **Expected Result**: Widget button is visible in the bottom-right corner.
- **Priority**: Medium

### TC-009: Widget blocked on unauthorized domain
- **Preconditions**: Widget is embedded on an unauthorized domain.
- **Steps**:
    1. Load the page with the widget script.
- **Expected Result**: Widget does not load, and an error is logged.
- **Priority**: High

## 4. Pin Creation

### TC-010: Test member drops pin with comment and emotion
- **Preconditions**: Test member is logged in and widget is active.
- **Steps**:
    1. Open the widget.
    2. Drop a pin and add a comment with an emotion.
- **Expected Result**: Pin is created with the comment and emotion.
- **Priority**: High

### TC-011: DOM selector captured correctly
- **Preconditions**: Test member is logged in and widget is active.
- **Steps**:
    1. Drop a pin on a specific element.
- **Expected Result**: DOM selector is captured and stored.
- **Priority**: High

### TC-012: Pin saved to database with coordinates
- **Preconditions**: Test member drops a pin.
- **Steps**:
    1. Verify the database entry for the pin.
- **Expected Result**: Pin data, including coordinates, is saved in the database.
- **Priority**: High

## 5. Observer Mode

### TC-013: Moderator sees all pins from test members
- **Preconditions**: Pins exist for a test group.
- **Steps**:
    1. Open the observer mode.
- **Expected Result**: All pins are visible to the moderator.
- **Priority**: High

### TC-014: Pin details display on click
- **Preconditions**: Pins exist in observer mode.
- **Steps**:
    1. Click on a pin.
- **Expected Result**: Pin details (comment, emotion, etc.) are displayed.
- **Priority**: Medium

### TC-015: Moderator marks pin as resolved
- **Preconditions**: Pins exist in observer mode.
- **Steps**:
    1. Select a pin and mark it as resolved.
- **Expected Result**: Pin status changes to resolved.
- **Priority**: Medium

## 6. Privacy Features

### TC-016: Consent banner shown on first widget load
- **Preconditions**: Widget is embedded on a page.
- **Steps**:
    1. Load the page for the first time.
- **Expected Result**: Consent banner is displayed.
- **Priority**: High

### TC-017: Password fields auto-masked in widget
- **Preconditions**: Widget is active on a page with password fields.
- **Steps**:
    1. Inspect the widget's interaction with password fields.
- **Expected Result**: Password fields are masked in the widget.
- **Priority**: High

### TC-018: Anonymous feedback option works
- **Preconditions**: Widget is active.
- **Steps**:
    1. Submit feedback anonymously.
- **Expected Result**: Feedback is submitted without user identification.
- **Priority**: High  