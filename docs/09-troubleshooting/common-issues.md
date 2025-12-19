# Troubleshooting Guide

## Widget Issues

### Widget Not Appearing on Test Domain
**Symptoms:** Feedback button doesn't show after starting test session  
**Diagnosis:**  
- Check browser console for 404 on `/api/widget/feedback-widget.js`.  
- Verify domain validation passed.  
- Check if widget script tag was injected.  
**Solution:**  
- Restart Next.js dev server.  
- Verify API route exists at the correct path.  
- Check domain whitelist in test group settings.  

### Widget Script 404 Error
**Symptoms:** GET `/api/widget/feedback-widget.js` returns 404.  
**Diagnosis:**  
- API route file missing or misnamed.  
- Static file conflict.  
- Dev server needs restart.  
**Solution:**  
- Check `src/pages/api/widget/feedback-widget.ts` exists.  
- Run `npm run build:widget`.  
- Restart dev server with `npm run dev`.  

### Pins Not Saving
**Symptoms:** Pin form submits but doesn't appear in observer mode.  
**Diagnosis:**  
- Check network tab for API errors.  
- Verify authentication token validity.  
- Check database connection.  
**Solution:**  
- Verify `POST /api/pins` endpoint is responding.  
- Check Prisma client connection.  
- Validate JWT token is not expired.  

## Authentication Issues

### Session Not Persisting
**Symptoms:** User logs in but session expires immediately.  
**Diagnosis:**  
- Check session cookie settings.  
- Verify `getServerSession` implementation.  
**Solution:**  
- Ensure `authOptions` are correctly configured.  
- Check middleware for session handling issues.  

### OAuth Redirect Fails
**Symptoms:** User redirected to an error page after OAuth login.  
**Diagnosis:**  
- Check OAuth provider configuration.  
- Verify callback URL matches provider settings.  
**Solution:**  
- Update OAuth provider settings to match app URLs.  
- Inspect logs for provider-specific error codes.  

### Unauthorized API Access
**Symptoms:** API requests return 401 or 403 errors.  
**Diagnosis:**  
- Missing or invalid session token.  
- RBAC rules blocking access.  
**Solution:**  
- Verify `getServerSession` is called in API handlers.  
- Check `src/lib/rbac.ts` for role-based access rules.  

## Database Issues

### Prisma Connection Errors
**Symptoms:** API handlers fail with database connection errors.  
**Diagnosis:**  
- Check `.env` for correct database URL.  
- Verify database server is running.  
**Solution:**  
- Update `.env` with correct credentials.  
- Restart database server and retry.  

### Migration Failures
**Symptoms:** `prisma migrate` fails with schema errors.  
**Diagnosis:**  
- Conflicting schema changes.  
- Missing migration files.  
**Solution:**  
- Inspect `prisma/migrations` for conflicts.  
- Run `prisma migrate reset` (use cautiously).  

## Performance Issues

### Widget Slow to Load
**Symptoms:** Widget takes several seconds to appear.  
**Diagnosis:**  
- Large bundle size.  
- Network latency.  
**Solution:**  
- Optimize widget build with `npm run build:widget`.  
- Use a CDN for faster script delivery.  

### Observer Mode Lag
**Symptoms:** Observer mode updates are delayed.  
**Diagnosis:**  
- High server load.  
- Inefficient database queries.  
**Solution:**  
- Scale server resources.  
- Optimize queries in `src/lib/prisma.ts`.  

## Error Codes Reference Table

| Error Code | Description                     | Suggested Fix                          |
|------------|---------------------------------|----------------------------------------|
| 401        | Unauthorized                   | Check session or token validity.       |
| 403        | Forbidden                      | Verify RBAC rules in `src/lib/rbac.ts`.|
| 404        | Not Found                      | Check API route or static file paths.  |
| 500        | Internal Server Error          | Inspect server logs for stack traces.  |
