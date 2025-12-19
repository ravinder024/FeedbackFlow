# API Endpoints Reference

This document provides a detailed reference for the API routes available in FeedbackFlow. Each endpoint includes information about HTTP methods, authentication requirements, request/response formats, and example usage.

---

## 1. Authentication

### POST `/api/auth/signin`
- **Authentication**: Not required
- **Description**: Authenticates a user and starts a session.
- **Request Body**:
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    ```
- **Response**:
    ```json
    {
        "status": "success",
        "sessionToken": "abc123"
    }
    ```
- **Error Codes**:
    - `401`: Invalid credentials

---

### GET `/api/auth/session`
- **Authentication**: Required
- **Description**: Retrieves the current session details.
- **Response**:
    ```json
    {
        "user": {
            "id": "user123",
            "email": "user@example.com"
        },
        "expires": "2023-12-31T23:59:59Z"
    }
    ```
- **Error Codes**:
    - `401`: Unauthorized

---

## 2. Test Groups

### GET `/api/test-groups`
- **Authentication**: Required
- **Description**: Fetches a list of test groups.
- **Response**:
    ```json
    [
        {
            "id": "group1",
            "name": "Test Group A"
        }
    ]
    ```
- **Error Codes**:
    - `401`: Unauthorized

---

### POST `/api/test-groups`
- **Authentication**: Required
- **Description**: Creates a new test group.
- **Request Body**:
    ```json
    {
        "name": "New Test Group"
    }
    ```
- **Response**:
    ```json
    {
        "id": "group2",
        "name": "New Test Group"
    }
    ```
- **Error Codes**:
    - `400`: Validation error

---

### PATCH `/api/test-groups/:id`
- **Authentication**: Required
- **Description**: Updates a test group.
- **Request Body**:
    ```json
    {
        "name": "Updated Test Group"
    }
    ```
- **Response**:
    ```json
    {
        "id": "group1",
        "name": "Updated Test Group"
    }
    ```
- **Error Codes**:
    - `404`: Test group not found

---

## 3. Sessions

### POST `/api/sessions/start`
- **Authentication**: Required
- **Description**: Starts a new session.
- **Request Body**:
    ```json
    {
        "testGroupId": "group1"
    }
    ```
- **Response**:
    ```json
    {
        "sessionId": "session123"
    }
    ```
- **Error Codes**:
    - `400`: Missing test group ID

---

### GET `/api/sessions/:id`
- **Authentication**: Required
- **Description**: Retrieves session details.
- **Response**:
    ```json
    {
        "id": "session123",
        "testGroupId": "group1",
        "status": "active"
    }
    ```
- **Error Codes**:
    - `404`: Session not found

---

## 4. Pins

### GET `/api/pins?testGroupId=&url=`
- **Authentication**: Required
- **Description**: Fetches pins for a specific test group and URL.
- **Response**:
    ```json
    [
        {
            "id": "pin1",
            "content": "Feedback content"
        }
    ]
    ```
- **Error Codes**:
    - `400`: Missing parameters

---

### POST `/api/pins`
- **Authentication**: Required
- **Description**: Creates a new pin.
- **Request Body**:
    ```json
    {
        "testGroupId": "group1",
        "content": "New feedback"
    }
    ```
- **Response**:
    ```json
    {
        "id": "pin2",
        "content": "New feedback"
    }
    ```
- **Error Codes**:
    - `400`: Validation error

---

### PATCH `/api/pins/:id`
- **Authentication**: Required
- **Description**: Updates a pin.
- **Request Body**:
    ```json
    {
        "content": "Updated feedback"
    }
    ```
- **Response**:
    ```json
    {
        "id": "pin1",
        "content": "Updated feedback"
    }
    ```
- **Error Codes**:
    - `404`: Pin not found

---

## 5. Widget

### GET `/api/widget/token?testGroupId=&memberToken=`
- **Authentication**: Required
- **Description**: Generates a widget token for embedding.
- **Response**:
    ```json
    {
        "widgetToken": "widget123"
    }
    ```
- **Error Codes**:
    - `400`: Missing parameters

---

### GET `/api/widget/feedback-widget.js`
- **Authentication**: Not required
- **Description**: Retrieves the embeddable widget script.
- **Response**: JavaScript file content.
- **Error Codes**:
    - `404`: File not found

---

This concludes the API reference for FeedbackFlow. For further details, refer to the source code in `src/pages/api/`.