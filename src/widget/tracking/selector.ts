const STABLE_ATTRS = ['data-testid', 'data-qa', 'data-cy', 'name', 'aria-label'];

function cssEscape(value: string): string {
  if (typeof (window as any).CSS !== 'undefined' && typeof (window as any).CSS.escape === 'function') {
    return (window as any).CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function getNthOfTypeIndex(element: Element): number {
  const tag = element.tagName;
  let index = 1;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.tagName === tag) {
      index += 1;
    }
    sibling = sibling.previousElementSibling;
  }

  return index;
}

export function getStableSelector(target: EventTarget | null): string {
  if (!(target instanceof Element)) {
    return 'unknown';
  }

  for (const attr of STABLE_ATTRS) {
    const value = target.getAttribute(attr);
    if (value) {
      return `${target.tagName.toLowerCase()}[${attr}="${cssEscape(value)}"]`;
    }
  }

  if (target.id) {
    return `#${cssEscape(target.id)}`;
  }

  const classes = Array.from(target.classList).slice(0, 2);
  if (classes.length > 0) {
    return `${target.tagName.toLowerCase()}.${classes.map(cssEscape).join('.')}`;
  }

  const parts: string[] = [];
  let current: Element | null = target;
  let depth = 0;

  while (current && depth < 5) {
    const tag = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${cssEscape(current.id)}`);
      break;
    }

    const nth = getNthOfTypeIndex(current);
    parts.unshift(`${tag}:nth-of-type(${nth})`);

    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || target.tagName.toLowerCase();
}
