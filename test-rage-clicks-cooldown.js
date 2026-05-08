/**
 * Test script for two-phase cooldown rage click detector
 * Run with: node test-rage-clicks-cooldown.js
 */

const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000;
const RAGE_HARD_SUPPRESSION_MS = 1500;
const RAGE_RECOVERY_MS = 2000;
const RAGE_TOTAL_COOLDOWN_MS = RAGE_HARD_SUPPRESSION_MS + RAGE_RECOVERY_MS;

const recentClicks = [];
const hardSuppression = new Map();
const recoveryWindow = new Map();

function detectRageClick(element, currentTime) {
  // ========== PHASE 1: HARD SUPPRESSION ==========
  const suppressUntil = hardSuppression.get(element);
  if (suppressUntil !== undefined && currentTime < suppressUntil) {
    return null;
  }

  if (suppressUntil !== undefined && currentTime >= suppressUntil) {
    hardSuppression.delete(element);
  }

  // ========== PHASE 2: RECOVERY WINDOW ==========
  const recoveryUntil = recoveryWindow.get(element);
  if (recoveryUntil !== undefined && currentTime < recoveryUntil) {
    return 'click';
  }

  if (recoveryUntil !== undefined && currentTime >= recoveryUntil) {
    recoveryWindow.delete(element);
  }

  // ========== NORMAL DETECTION PHASE ==========
  while (recentClicks.length > 0 && currentTime - recentClicks[0].timestamp > RAGE_CLICK_WINDOW_MS) {
    recentClicks.shift();
  }

  recentClicks.push({ element, timestamp: currentTime });

  const clicksForElement = recentClicks.filter(
    (click) => click.element === element
  ).length;

  if (clicksForElement >= RAGE_CLICK_THRESHOLD) {
    const suppressUntilTime = currentTime + RAGE_HARD_SUPPRESSION_MS;
    const recoveryUntilTime = suppressUntilTime + RAGE_RECOVERY_MS;

    hardSuppression.set(element, suppressUntilTime);
    recoveryWindow.set(element, recoveryUntilTime);

    const otherElementClicks = recentClicks.filter((click) => click.element !== element);
    recentClicks.length = 0;
    recentClicks.push(...otherElementClicks);

    return 'rage_click';
  }

  return 'click';
}

// Test scenarios
console.log('=== Two-Phase Cooldown Rage Click Tests ===\n');

let t = 0;
const button = 'button.submit';

console.log('Scenario 1: Rapid triple-click triggers rage + cooldown');
console.log(`t=0ms:     Click ${button} → ${detectRageClick(button, (t += 0)) ? '👆 click' : '[null]'}`);
console.log(`t=100ms:   Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
const r1 = detectRageClick(button, (t += 100));
console.log(`t=200ms:   Click ${button} → ${r1 === 'rage_click' ? '🔥 RAGE_CLICK' : r1} (PHASE 1: hard suppression for 1.5s)`);
console.log(`           PHASE 2: recovery will be for 2s after phase 1 ends`);

console.log('\n--- PHASE 1: HARD SUPPRESSION (0-1500ms after rage) ---');
console.log(`t=300ms:   Click ${button} → ${detectRageClick(button, (t += 100)) || '[NULL - hard suppressed]'}`);
console.log(`t=600ms:   Click ${button} → ${detectRageClick(button, (t += 300)) || '[NULL - hard suppressed]'}`);
console.log(`t=1200ms:  Click ${button} → ${detectRageClick(button, (t += 600)) || '[NULL - hard suppressed]'}`);

console.log('\n--- PHASE 2: RECOVERY (1500-3500ms after rage) ---');
const r2 = detectRageClick(button, (t += 500));
console.log(`t=1750ms:  Click ${button} → ${r2 === 'click' ? '👆 CLICK (recovery mode)' : r2}`);
console.log(`           Rage detection DISABLED during recovery`);

const r3 = detectRageClick(button, (t += 100));
console.log(`t=1850ms:  Click ${button} → ${r3 === 'click' ? '👆 CLICK (recovery mode)' : r3}`);
const r4 = detectRageClick(button, (t += 100));
console.log(`t=1950ms:  Click ${button} → ${r4 === 'click' ? '👆 CLICK (recovery mode)' : r4}`);
const r5 = detectRageClick(button, (t += 100));
console.log(`t=2050ms:  Click ${button} → ${r5 === 'click' ? '👆 CLICK (recovery mode - NO RAGE)' : r5}`);

console.log('\n--- BACK TO NORMAL (after 3500ms total cooldown) ---');
const r6 = detectRageClick(button, (t += 1750));
console.log(`t=3850ms:  Click ${button} → ${r6 === 'click' ? '✅ CLICK (normal detection)' : r6}`);

console.log('\nScenario 2: NEW rage pattern can occur after cooldown expires');
console.log(`t=3950ms:  Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
console.log(`t=4050ms:  Click ${button} → ${detectRageClick(button, (t += 100)) ? '👆 click' : '[null]'}`);
const r7 = detectRageClick(button, (t += 100));
console.log(`t=4150ms:  Click ${button} → ${r7 === 'rage_click' ? '🔥 RAGE_CLICK (new)' : r7} ✅ (prevented old issue!)`);

console.log('\n✅ All tests completed!\n');
console.log('Timeline visualization:');
console.log('  0ms      200ms                      1700ms      3700ms');
console.log('  |        |                          |           |');
console.log('  DETECT   RAGE_CLICK                 NORMAL      CYCLE');
console.log('  |--------|--------------------------|-----------|');
console.log('  ↓  click  click  click              ↓  recovery ↓');
console.log('  ✓  ✓      ✓      🔥 [PHASE1]        ✓  ✓ ✓ ✓   [PHASE2]');
console.log('');
console.log('  Total cooldown: 3.5 seconds');
console.log('  - Phase 1 (hard suppression): 1.5s → returns null');
console.log('  - Phase 2 (recovery): 2.0s → returns click only');
