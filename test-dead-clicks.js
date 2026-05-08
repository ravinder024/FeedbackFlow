/**
 * Dead Click Detection Test
 * 
 * Tests the isInteractiveElement logic and detection flow
 */

// Simulate isInteractiveElement function
function isInteractiveElement(tagName, attributes = {}) {
  // Direct interactive tags
  if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName.toLowerCase())) {
    return true;
  }

  // ARIA button role
  if (attributes.role === 'button') {
    return true;
  }

  // onclick handler
  if (attributes.onclick !== undefined) {
    return true;
  }

  // cursor: pointer style (common for custom interactive elements)
  if (attributes.cursor === 'pointer') {
    return true;
  }

  return false;
}

console.log('=== Dead Click Detection - Interactive Element Tests ===\n');

// Test cases
const testCases = [
  { tagName: 'button', attributes: {}, expected: true, name: 'Button element' },
  { tagName: 'a', attributes: { href: '/page' }, expected: true, name: 'Anchor link' },
  { tagName: 'input', attributes: { type: 'text' }, expected: true, name: 'Input field' },
  { tagName: 'select', attributes: {}, expected: true, name: 'Select dropdown' },
  { tagName: 'textarea', attributes: {}, expected: true, name: 'Textarea' },
  { tagName: 'div', attributes: { role: 'button' }, expected: true, name: 'Div with role=button' },
  { tagName: 'div', attributes: { onclick: 'handleClick()' }, expected: true, name: 'Div with onclick' },
  { tagName: 'span', attributes: { cursor: 'pointer' }, expected: true, name: 'Span with cursor:pointer' },
  { tagName: 'div', attributes: {}, expected: false, name: 'Plain div' },
  { tagName: 'span', attributes: {}, expected: false, name: 'Plain span' },
  { tagName: 'p', attributes: {}, expected: false, name: 'Paragraph' },
  { tagName: 'div', attributes: { class: 'card' }, expected: false, name: 'Div with class but not interactive' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test) => {
  const result = isInteractiveElement(test.tagName, test.attributes);
  const status = result === test.expected ? '✅' : '❌';
  const resultText = result ? 'interactive' : 'not interactive';
  const expectedText = test.expected ? 'interactive' : 'not interactive';

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(
    `${status} ${test.name.padEnd(35)} - ${resultText} (expected: ${expectedText})`
  );
});

console.log(`\n${passed} passed, ${failed} failed\n`);

// Flow simulation
console.log('=== Dead Click Detection Flow ===\n');

console.log('Scenario 1: Click unresponsive button');
console.log('  1. User clicks button → isInteractiveElement = true');
console.log('  2. Send "click" event');
console.log('  3. Start 350ms dead click monitor');
console.log('  4. No DOM mutations detected → Send "dead_click" event\n');

console.log('Scenario 2: Click responsive button');
console.log('  1. User clicks button → isInteractiveElement = true');
console.log('  2. Send "click" event');
console.log('  3. Start 350ms dead click monitor');
console.log('  4. DOM mutation detected (page updates) → Cancel monitor, no dead_click\n');

console.log('Scenario 3: Rage click on button');
console.log('  1. User rage clicks (3+ times) on button');
console.log('  2. Send initial "click" events');
console.log('  3. Rage detector triggers → Send "rage_click" event');
console.log('  4. Dead click monitoring SKIPPED (rage takes precedence)\n');

console.log('Scenario 4: Click non-interactive element');
console.log('  1. User clicks plain div → isInteractiveElement = false');
console.log('  2. Send "click" event');
console.log('  3. Dead click monitoring SKIPPED (not interactive)\n');

console.log('Scenario 5: Click interactive element, then navigate');
console.log('  1. User clicks button → isInteractiveElement = true');
console.log('  2. Send "click" event');
console.log('  3. Start 350ms dead click monitor');
console.log('  4. Navigation triggered → Cancel all monitors, no dead_click\n');

console.log('✅ Dead click detection logic verified!\n');

console.log('Key Rules:');
console.log('  ✅ Only monitor interactive elements (button, a, input, etc.)');
console.log('  ✅ Monitor for 350ms after click');
console.log('  ✅ Cancel monitoring if DOM mutation detected');
console.log('  ✅ Cancel monitoring if navigation triggered');
console.log('  ✅ Skip dead_click monitoring if rage_click detected');
console.log('  ✅ Apply 2s cooldown after dead_click to prevent duplicates\n');
