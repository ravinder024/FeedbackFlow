# PRD: Observer Mode: PinFlow

## Feature Name
PinFlow

## 1. Accesss t0
1. Moderators
2. Admins

## 2. Core Objective
Allow moderators or Admins to view and manage feedback submitted by test members in real-time. Provide tools for resolving pins, adding comments, and tracking feedback status.

## 3. Key Workflows
1. Access the Observer Mode dashboard.
2. Can view pins in two modes- All pins and Summarized pins
3. View a real-time list of submitted feedback. The list can be expanded or collapsed (default)
4. Filter feedback pins by test group, severity, emoji type or status.
5. Click on a feedback item to view details and associated pins.
6. Resolve or comment on feedback, updating its status.
7. Export feedback data for further analysis if needed.


## 4. Technical Requirements
- **Real-Time Updates**: Use WebSockets or polling to fetch new feedback in real-time.
- **Feedback Management**: Allow moderators to resolve, comment, and update feedback status.
- **Filters and Sorting**: Provide options to filter and sort feedback by various criteria.
- **Export Functionality**: Enable exporting feedback data in CSV or JSON format.

## 5. Data Requirements
- **Feedback Metadata**:
  - Feedback ID
  - Timestamp
  - User ID
  - Test group ID
  - Status
- **Feedback Content**:
  - Severity level
  - Comments
  - Attachments (optional)
- **Moderator Actions**:
  - Action performed
  - Timestamp
  - Moderator ID

## 6. Success Metrics
- **Efficiency**: Average time to resolve feedback.
- **Engagement**: Percentage of moderators actively using Observer Mode.
- **Reliability**: Zero reported issues with real-time updates.

## 7. Known Challenges and Solutions
- **Challenge**: Ensuring real-time updates are performant.
  - **Solution**: Use WebSockets for efficient data transfer.
- **Challenge**: Preventing data overload in large test groups.
  - **Solution**: Implement pagination and lazy loading.

## 8. Key Features
1. Users can toggle between "All pins" mode (default) and "Summarized pins"
2. Under summarized pins, pins having same or similar feedback is combined for optimal view of pins and feedback. For any summarized pin, All the feedback will me shown as combined list of feedback under the same pin. For e.g. if 8 members have placed a pin and each provided a comment, in summarized pin mode, all the 8 comments will be collated under single pin as a list of comments
3. Summarized pins can be resolved at once resulting in resolution for all collated pins
4. Comments made by moderator on a summarized pin will be threaded and be visible to all the members who have put pins that are collated
5. Members can always come back to testing page to view comments made by moderator or admin
6. each summarized pin will be given a AI generated summary based on comments made
