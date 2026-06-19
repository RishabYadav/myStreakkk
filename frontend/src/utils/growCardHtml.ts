import { Customer } from '../types';
import { getTimeGreeting } from './timeGreeting';

/** Escape user-controlled values before injecting into HTML templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface GrowCardTokens {
  NAME: string;
  FIRST_NAME: string;
  DAYS: string;
  SCORE: string;
  GREETING: string;
}

export function buildGrowCardTokens(customer: Customer): GrowCardTokens {
  return {
    NAME: escapeHtml(customer.name),
    FIRST_NAME: escapeHtml(customer.name.split(' ')[0] ?? customer.name),
    DAYS: escapeHtml(String(customer.renewsInDays)),
    SCORE: escapeHtml(String(customer.protection_intelligence_score)),
    GREETING: escapeHtml(getTimeGreeting()),
  };
}

/** Replace {NAME}, {FIRST_NAME}, {DAYS}, {SCORE}, {GREETING} in backend HTML or share text. */
export function personalizeGrowTemplate(template: string, customer: Customer): string {
  const tokens = buildGrowCardTokens(customer);
  return template
    .replace(/\{NAME\}/g, tokens.NAME)
    .replace(/\{FIRST_NAME\}/g, tokens.FIRST_NAME)
    .replace(/\{DAYS\}/g, tokens.DAYS)
    .replace(/\{SCORE\}/g, tokens.SCORE)
    .replace(/\{GREETING\}/g, tokens.GREETING);
}

const HTML_SHELL = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=400, height=400, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    html, body { width: 400px; height: 400px; overflow: hidden; background: transparent; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body>${body}</body>
</html>`;

/** Wrap partial HTML from API into a fixed-size document for WebView rendering. */
export function wrapGrowCardHtml(fragment: string): string {
  const trimmed = fragment.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return trimmed;
  }
  return HTML_SHELL(trimmed);
}

export function personalizeGrowCardHtml(html: string, customer: Customer, message?: string): string {
  return renderGrowCardHtml(html, customer, message ?? '');
}

/** Build final HTML with customer tokens + editable card body message. */
export function renderGrowCardHtml(templateHtml: string, customer: Customer, message: string): string {
  const withTokens = personalizeGrowTemplate(templateHtml, customer);
  const withMessage = withTokens.replace(/\{MESSAGE\}/g, escapeHtml(message));
  return wrapGrowCardHtml(withMessage);
}
