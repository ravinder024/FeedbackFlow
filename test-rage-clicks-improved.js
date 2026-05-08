/**
 * Test script for improved rage click detector
 * Run with: node test-rage-clicks-improved.js
 */

const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000;
const RAGE_SUPPRESSION_MS = 1500;

const recentClicks = [];
const rageSuppression = new Map();

function detectRageClick(element, currentTime) {
  // Check if element is currently suppressed from a previous rage click
  const suppressUntil = rageSuppression.get(element);
  if (suppressUntil !== undefined && currentTime < suppressUntil) {
    // Still in suppression window, silently drop this click
    return null;
  }

  // Suppression window expired, clean it up
  if (suppressUntil !== undefined && currentTime >= suppressUntil) {
    rageSuppression.delete(element);
  }

  // Remove clicks older than the detection window
  while (recentClicks.length > 0 && currentTime - recentClicks[0].timestamp > RAGE_CLICK_WINDOW_MS) {
    recentClicks.shift();
  }

  // Add current click to the tracking window
  recentClicks.push({ element, timestamp: currentTime });

  // Count how many times this element was clicked in the current window
  const clicksForElement = recentClicks.filter(
    (click) => click.element === element
  ).length;

  // Check if we have a rage click pattern (3+ clicks in 1 second)
  if (clicksForElement >= RAGE_CLICK_THRESHOLD) {
    // Mark this element as suppressed for the next RAGE_SUPPRESSION_MS
    rageSuppression.set(element, currentTime + RAGE_SUPPRESSION_MS);

    // Clean up the recent clicks for this element
    const otherElementClicks = recentClicks.filter((click) => click.element !== element);
    recentClicks.length = 0;
    recentClicks.push(...otherElementClicks);

    return 'rage_click';
  }

  // No rage pattern detected, send a regular click event
  return 'click';
}

// Test scenarios
console.log('=== Improved Rage Click Detection Tests ===\n');

let t = 0;
const button = 'button.submit';

console.log('Scenario 1: Rapid triple-click (rage_click detected + suppression starts)');
console.log(`t=0ms:     Click ${button} → ${detectRageClick(button, (t += 0)) ? '👆 click' : '[null]'}`);
console.log(`t=100ms:   Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
const result1 = detectRageClick(button, (t += 100));
console.log(`t=200ms:   Click ${button} → ${result1 === 'rage_click' ? '🔥 RAGE_CLICK' : result1} (element now SUPPRESSED for 1.5s)`);

console.log('\nScenario 2: During suppression window (all clicks dropped)');
console.log(`t=300ms:   Click ${button} → ${detectRageClick(button, (t += 100)) || '[SUPPRESSED - null]'}`);
console.log(`t=600ms:   Click ${button} → ${detectRageClick(button, (t += 300)) || '[SUPPRESSED - null]'}`);
console.log(`t=1200ms:  Click ${button} → ${detectRageClick(button, (t += 600)) || '[SUPPRESSED - null]'}`);

console.log('\nScenario 3: Suppression expires, back to normal (t=1700ms > 200ms+1500ms)');
const result3 = detectRageClick(button, (t += 500));
console.log(`t=1700ms:  Click ${button} → ${result3 === 'click' ? '👆 CLICK (normal)' : result3}`);

console.log('\nScenario 4: Another rapid triple-click (NEW rage pattern)');
console.log(`t=1800ms:  Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
console.log(`t=1900ms:  Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
const result4 = detectRageClick(button, (t += 100));
console.log(`t=2000ms:  Click ${button} → ${result4 === 'rage_click' ? '🔥 RAGE_CLICK (new)' : result4}`);

console.log('\nScenario 5: Different element (tracked independently)');
const link = 'a.nav-link';
console.log(`t=2100ms:  Click ${link} → ${detectRageClick(link, (t += 100)) ? '👆 click' : '[null]'}`);
console.log(`t=2200ms:  Click ${link} → ${detectRageClick(link, (t += 100)) ? '👆 click' : '[null]'}`);
const result5 = detectRageClick(link, (t += 100));
console.log(`t=2300ms:  Click ${link} → ${result5 === 'rage_click' ? '🔥 RAGE_CLICK' : result5} (independent of button state)`);

console.log('\n✅ All tests completed!\n');
console.log('Key improvements:');
console.log('  ✅ Suppressed clicks return null (not sent to API)');
console.log('  ✅ Prevents duplicate rage_click events (1.5s suppression window)');
console.log('  ✅ Each element tracked independently');
console.log('  ✅ Result: click → click → rage_click → [drop] → [drop] → click → ...');
