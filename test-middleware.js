// Test script for middleware functionality

// Since we can't import TypeScript directly, let's test the logic manually
function anonymizeIP(ip) {
  if (!ip) return 'unknown';
  
  // Handle IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
    }
  }
  
  // Handle IPv6 - anonymize last 64 bits
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}:XXXX:XXXX:XXXX:XXXX`;
    }
  }
  
  return 'unknown';
}

function shouldTrackPath(pathname) {
  const skipPatterns = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known/',
    '/health',
    '/status'
  ];
  
  return !skipPatterns.some(pattern => pathname.startsWith(pattern));
}

function getActionFromPath(pathname) {
  if (pathname === '/') return 'HOME_VISIT';
  if (pathname.startsWith('/dashboard')) return 'DASHBOARD_VISIT';
  if (pathname.startsWith('/feedback')) return 'FEEDBACK_VISIT';
  if (pathname.startsWith('/test-groups')) return 'TEST_GROUP_VISIT';
  if (pathname.startsWith('/admin')) return 'ADMIN_VISIT';
  if (pathname.startsWith('/auth')) return 'AUTH_VISIT';
  return 'PAGE_VISIT';
}

// Test IP anonymization
console.log('Testing IP Anonymization:');
console.log('192.168.1.100 ->', anonymizeIP('192.168.1.100')); // Should be 192.168.1.XXX
console.log('10.0.0.50 ->', anonymizeIP('10.0.0.50')); // Should be 10.0.0.XXX
console.log('2001:db8:85a3:8d3:1319:8a2e:370:7344 ->', anonymizeIP('2001:db8:85a3:8d3:1319:8a2e:370:7344')); // Should anonymize IPv6
console.log('undefined ->', anonymizeIP(undefined)); // Should be 'unknown'

// Test path tracking
console.log('\nTesting Path Tracking:');
console.log('/dashboard -> should track:', shouldTrackPath('/dashboard'));
console.log('/api/events -> should track:', shouldTrackPath('/api/events'));
console.log('/_next/static/css/app.css -> should track:', shouldTrackPath('/_next/static/css/app.css'));
console.log('/favicon.ico -> should track:', shouldTrackPath('/favicon.ico'));

// Test action mapping
console.log('\nTesting Action Mapping:');
console.log('/ ->', getActionFromPath('/'));
console.log('/dashboard ->', getActionFromPath('/dashboard'));
console.log('/feedback/submit ->', getActionFromPath('/feedback/submit'));
console.log('/admin/users ->', getActionFromPath('/admin/users'));
console.log('/some-random-page ->', getActionFromPath('/some-random-page'));
