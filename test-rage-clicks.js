/**
 * Test script for rage click detector
 * Run with: node test-rage-clicks.js
 */

// Simulate the rage click detector
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000;

const recentClicks = [];
const lastRageClickTime = new Map();

function detectRageClick(element, currentTime) {
  while (recentClicks.length > 0 && currentTime - recentClicks[0].timestamp > RAGE_CLICK_WINDOW_MS) {
    recentClicks.shift();
  }

  recentClicks.push({ element, timestamp: currentTime });

  const clicksForElement = recentClicks.filter(
    (click) => click.element === element
  ).length;

  if (clicksForElement >= RAGE_CLICK_THRESHOLD) {
    // Default to negative infinity so first detection always succeeds
    const lastReportTime = lastRageClickTime.get(element) ?? -Infinity;

    if (currentTime - lastReportTime >= RAGE_CLICK_WINDOW_MS) {
      lastRageClickTime.set(element, currentTime);
      return true;
    }
  }

  return false;
}

// Test scenarios
console.log('=== Rage Click Detection Tests ===\n');

let t = 0;
const button = 'button.submit';

console.log('Scenario 1: Rapid triple-click (rage click)');
console.log(`t=0ms:   Click ${button} → ${detectRageClick(button, (t += 0)) ? '🔥 RAGE' : '👆 click'}`);
console.log(`t=100ms: Click ${button} → ${detectRageClick(button, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);
console.log(`t=200ms: Click ${button} → ${detectRageClick(button, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);

console.log('\nScenario 2: Another click on same element (should not trigger within time window)');
console.log(`t=300ms: Click ${button} → ${detectRageClick(button, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);

console.log('\nScenario 3: Wait > 1 second, then click again');
console.log(`t=1300ms: Click ${button} → ${detectRageClick(button, (t += 1000)) ? '🔥 RAGE' : '👆 click'}`);
console.log(`t=1400ms: Click ${button} → ${detectRageClick(button, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);
console.log(`t=1500ms: Click ${button} → ${detectRageClick(button, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);

console.log('\nScenario 4: Different element should not trigger rage');
const link = 'a.nav-link';
console.log(`t=1600ms: Click ${link} → ${detectRageClick(link, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);
console.log(`t=1700ms: Click ${link} → ${detectRageClick(link, (t += 100)) ? '🔥 RAGE' : '👆 click'}`);

console.log('\n✅ All tests completed!');
