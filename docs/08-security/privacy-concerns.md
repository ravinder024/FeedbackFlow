# Security & Privacy Documentation  

## 1. Data Collection  

### What Data Is Collected  
- Pins (feedback markers on the page)  
- DOM selectors (to identify elements)  
- Coordinates (relative positions of pins)  
- Comments (user-provided feedback text)  

### What Is NOT Collected  
- Screenshots or screen recordings  
- Raw HTML content of the page  
- Personally Identifiable Information (PII)  

### Data Retention Policies  
- Feedback data is retained for 12 months by default.  
- Users can request data deletion at any time.  

---

## 2. Privacy Features  

- **Consent Banner**: A consent banner is displayed on the first widget load to inform users about data collection.  
- **Auto-Masking**: Sensitive input fields (e.g., passwords, credit card fields) are auto-detected and excluded from feedback.  
- **Anonymous Feedback**: Users can submit feedback anonymously without providing personal details.  
- **Data Deletion Requests**: Users can request deletion of their data to comply with GDPR.  

---

## 3. Security Measures  

- **HTTPS**: All API communication is encrypted using HTTPS.  
- **JWT Authentication**: The widget uses short-lived JWT tokens for secure authentication.  
- **Secure Cookies**: Session cookies are flagged as `httpOnly` and `secure`.  
- **Domain Validation**: Only authorized domains can embed the widget.  
- **RBAC Checks**: Role-based access control (RBAC) is enforced on all API routes.  
- **Request Anonymization**: Middleware masks IP addresses to protect user privacy.  

---

## 4. Compliance  

- **GDPR Readiness**:  
    - Supports data portability and the right to deletion.  
    - Tracks user consent in the database.  
- **CCPA Compliance**: Provides mechanisms for users to opt out of data collection.  
- **SOC 2**: Future plans include SOC 2 certification for enhanced trust.  

---

## 5. Audit & Logging  

- **Event Logging**: All user actions are logged for auditing purposes.  
- **Access Logs**: Tracks moderator access to feedback data.  
- **Consent Tracking**: User consent is recorded and stored in the database.  

---

## 6. Probing Questions from Enterprise Users  

- **Where is data stored?**  
    - Data is stored in a PostgreSQL database, encrypted at rest.  
- **Who can access my team's feedback?**  
    - Only team admins and moderators have access.  
- **How do you handle data breaches?**  
    - An incident response plan is in place to address breaches.  
- **Can you sign a DPA/BAA?**  
    - Data Processing Agreements (DPAs) and Business Associate Agreements (BAAs) are available for enterprise customers.  

---

## Security Best Practices Checklist  

- [x] Use HTTPS for all communications.  
- [x] Validate domains before allowing widget embedding.  
- [x] Enforce RBAC on all API endpoints.  
- [x] Mask sensitive fields in feedback submissions.  
- [x] Encrypt data at rest and in transit.  
- [x] Log all significant user actions for auditing.  
- [x] Provide users with data deletion and portability options.  
- [x] Regularly review and update the incident response plan.  
