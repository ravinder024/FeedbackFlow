# PRD: User Management

## 1. Feature Name
User Management

## 2. Core Objective
Provide administrators with tools to manage users, including role assignment, workspace membership, and account status. Ensure a seamless experience for inviting and managing users within the platform.

## 3. Key Workflows
### For Invited Members: Member users
1. Login to the platform
2. View assigned test groups
3. Load assigned test domain using Launch action
4. Conduct test
5. Activate Feedback mode for placing pins, comments and related attributes
6. Limited access to platform
7. Can access Feedback guide and perform sample test

### For Moderators: Moderator users
1. Can View Dashboard
2. Create and manage test groups
3. Invite, manage or revoke Member users for test groups
4. Can access to the feature items like- User management, Billing, PinFlow, Analytics, Reports
5. Access and worklow as that of Member users is included


### For Administrators: Admin user
1. Navigate to the User Management section in the admin dashboard.
2. View a list of all users with their roles and statuses.
3. Invite new users by entering their email addresses.
4. Assign roles (ADMIN, MODERATOR, TEST_MEMBER) to users.
5. Activate, deactivate, or delete user accounts as needed.
6. All features of Moderators and members
7. Can override actions- add, manage, or remove pins, test groups or members

## 4. Technical Requirements
- **User Roles**: Define roles with specific permissions.
- **Invitation System**: Send email invites with unique tokens for account setup.
- **Role Management**: Allow role updates and enforce permissions.
- **Account Status**: Support activation, deactivation, and deletion of accounts.
- **Audit Logs**: Record all user management actions for accountability.

## 5. Data Requirements
- **User Data**:
  - User ID
  - Email
  - Name
  - Role
  - Account status
- **Audit Logs**:
  - Action performed
  - Timestamp
  - Admin ID

## 6. Success Metrics
- **Adoption**: Percentage of administrators using the user management tools.
- **Efficiency**: Average time to invite and manage users.
- **Reliability**: Zero reported issues with role enforcement.

## 7. Known Challenges and Solutions
- **Challenge**: Preventing unauthorized role changes.
  - **Solution**: Enforce strict role-based access control.
- **Challenge**: Ensuring email invites are delivered.
  - **Solution**: Use a reliable SMTP provider with delivery tracking.


## Super Admin
1. Credentials can be found in .env file
2. Always Keep the authentication for the mentioned emails.