# Multi-Domain Pin Persistence Testing Guide

## Overview
The pin persistence system now supports any domain/URL that's part of a test group, providing complete isolation between different test scenarios.

## Key Features

### 1. **Test Group Isolation**
- Pins are scoped by `testGroupId` for complete test isolation
- Different test groups can have pins on the same domain without interference
- Example: `test-group-alpha` and `test-group-beta` can both test SauceDemo independently

### 2. **Domain-Aware Storage**
- Pins are automatically scoped by domain (extracted from URL)
- Each domain maintains separate pin storage
- Example: Pins on `saucedemo.com` are separate from pins on `example.com`

### 3. **URL-Specific Persistence**
- Pins can be further scoped by specific page URLs
- Supports testing different pages within the same domain
- Example: Login page pins separate from dashboard page pins

### 4. **Composite Storage Key Format**
```
feedback-pins-group-{testGroupId}_domain-{domain}_page-{pageUrl}
```

## Testing Scenarios

### **Test 1: Basic Pin Persistence (Single Domain)**
1. Set test group: `saucedemo-basic-test`
2. Set target URL: `https://www.saucedemo.com`
3. Place pins on login button, product images, cart icon
4. Refresh page → ✅ Pins should reappear

### **Test 2: Multi-Domain Isolation**
1. Set test group: `multi-domain-test`
2. Place pins on SauceDemo
3. Switch URL to `https://the-internet.herokuapp.com`
4. Verify no pins are visible (domain isolation)
5. Switch back to SauceDemo → ✅ Original pins should reappear

### **Test 3: Test Group Isolation**
1. Set test group: `group-a`, place pins on SauceDemo
2. Change test group to: `group-b`
3. Verify no pins are visible (test group isolation)
4. Switch back to `group-a` → ✅ Original pins should reappear

### **Test 4: Cross-Page Persistence**
1. Set test group: `page-test`
2. Set URL: `https://www.saucedemo.com`
3. Place pins and verify they persist on refresh
4. Change URL to `https://www.saucedemo.com/inventory.html`
5. Verify separate pin storage for different pages

### **Test 5: Backend Fallback**
1. With backend API running: Place pins → Refresh → Pins load from backend
2. With backend API offline: Place pins → Refresh → Pins load from localStorage
3. Backend comes back online: New pins sync to backend

## Storage Architecture

### **LocalStorage Keys**
- Primary: `feedback-pins-group-{testGroupId}_domain-{domain}_page-{pageUrl}`
- Fallback: `feedback-pins-default` (if no parameters provided)

### **Backend API Integration**
- Attempts backend first: `GET /api/pins?testGroupId=X&domain=Y&pageUrl=Z`
- Falls back to localStorage if backend unavailable
- All pin operations (create, update, delete) sync to both backend and localStorage

### **Data Structure**
```typescript
interface FeedbackPin {
  id: string;
  x: number;
  y: number;
  emoji?: string;
  severity?: string;
  comment?: string;
  comments: Comment[];
  pageUrl?: string;
  testGroupId?: string;
  domain?: string;
  timestamp: Date;
}
```

## Usage Example

```tsx
<FeedbackCollector
  ref={feedbackRef}
  onFeedbackSubmit={handleFeedbackSubmit}
  pageUrl="https://www.saucedemo.com"
  testGroupId="automation-test-group-1"
  domain="saucedemo.com"
/>
```

## Benefits for Automation Testing

1. **Complete Test Isolation**: Different test runs don't interfere with each other
2. **Multi-Domain Support**: Test any website, not just hardcoded domains
3. **Persistent Test State**: Pins survive browser refreshes and session restarts
4. **Flexible Scoping**: Scope by test group, domain, and/or specific page
5. **Robust Fallbacks**: Works with or without backend API availability

## Debug Tools

### **Browser Console Commands**
```javascript
// View all stored pin data
Object.keys(localStorage).filter(k => k.startsWith('feedback-pins-')).forEach(key => {
  console.log(key, JSON.parse(localStorage.getItem(key)));
});

// Clear specific test group pins
localStorage.removeItem('feedback-pins-group-test1_domain-saucedemo-com_page-https---www-saucedemo-com');

// Clear all pin data
Object.keys(localStorage).filter(k => k.startsWith('feedback-pins-')).forEach(key => {
  localStorage.removeItem(key);
});
```

### **Component Debug Props**
The FeedbackCollector component logs detailed information about:
- Storage key generation
- Pin save/load operations
- Backend API attempts and fallbacks
- localStorage operations

## Testing Checklist

- [ ] Pins persist across page refreshes
- [ ] Pins are isolated by test group
- [ ] Pins are isolated by domain
- [ ] Pins are isolated by page URL
- [ ] Backend API integration works
- [ ] localStorage fallback works when backend is offline
- [ ] Pin CRUD operations (create, read, update, delete) work correctly
- [ ] Multiple test groups can run simultaneously without interference
- [ ] Clearing pins only affects the current scope (test group + domain + page)

This system ensures that any domain mentioned in any test group will have properly isolated and persistent pin functionality, making it suitable for comprehensive automation testing across multiple websites and test scenarios.
