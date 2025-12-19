# PRD: Widget Foundation

## 1. Feature Name
Widget Foundation

## 2. Core Objective
The Widget Foundation enables seamless feedback collection by embedding a sandboxed iframe into client websites. Test members can interact with the widget to drop pins on specific DOM elements, providing actionable insights while ensuring the host website remains unaffected.

## 3. Key Workflows
### For Test Members:
1. Open the target web app with the FeedbackFlow widget embedded.
2. Click the floating feedback button to activate the widget.
3. Hover over elements to highlight them and click to drop a pin.
4. Fill out the feedback form, including severity, comments, and optional attachments.
5. Submit the feedback, which is logged and visible to moderators.

### For Moderators:
1. Access the admin dashboard to view submitted feedback.
2. Filter feedback by test group, severity, or status.
3. Click on a feedback item to view details and associated pins.
4. Resolve or comment on feedback, updating its status.
5. Export feedback data for further analysis if needed.

## 4. Technical Requirements
- **Iframe Implementation**: The widget must operate within a sandboxed iframe to prevent interference with the host website’s styles or scripts.
- **CORS Handling**: Ensure proper cross-origin resource sharing (CORS) policies to allow secure communication between the widget and the FeedbackFlow backend.
- **Widget Isolation**: Use shadow DOM or scoped CSS to avoid style conflicts with the host website.
- **Responsive Design**: The widget must adapt to various screen sizes and orientations.
- **Error Handling**: Gracefully handle network or runtime errors with user-friendly messages.

## 5. Data Requirements
- **Feedback Metadata**:
  - Page URL
  - DOM element selector
  - X/Y coordinates
  - Timestamp
  - User ID
  - Test group ID
- **Feedback Content**:
  - Severity level
  - Comments
  - Attachments (optional)
- **Widget Usage Metrics**:
  - Number of pins dropped
  - Time spent on feedback submission

## 6. Success Metrics
- **Adoption**: Percentage of test members actively using the widget.
- **Accuracy**: Percentage of feedback items with correctly identified DOM elements.
- **Performance**: Widget load time under 1 second.
- **Reliability**: Less than 1% error rate during feedback submission.
- **Engagement**: Average number of pins dropped per session.

## 7. Known Challenges and Solutions
- **Challenge**: Ensuring iframe compatibility across all browsers.
  - **Solution**: Use feature detection and polyfills for older browsers.
- **Challenge**: Preventing style conflicts with host websites.
  - **Solution**: Implement shadow DOM and scoped CSS.
- **Challenge**: Handling dynamic DOM changes in SPAs.
  - **Solution**: Use MutationObserver to track and update DOM element references.
- **Challenge**: Maintaining secure communication between the widget and backend.
  - **Solution**: Enforce strict CORS policies and use short-lived tokens for authentication.