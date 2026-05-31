/**
 * storage.js
 * Exports current in-memory state as a data.js file,
 * matching the format of the original data.js exactly.
 */

export function exportJS(categories, config) {
  const lines = [];

  // ── CATEGORIES ───────────────────────────────────────────
  lines.push('export const CATEGORIES = {');
  const catKeys = Object.keys(categories);
  catKeys.forEach((cat, ci) => {
    lines.push(`  "${cat}": [`);
    categories[cat].forEach((item, ii) => {
      const comma = ii < categories[cat].length - 1 ? ',' : '';
      lines.push(`    { label: "${item.label}", weight: ${item.weight} }${comma}`);
    });
    const catComma = ci < catKeys.length - 1 ? ',' : '';
    lines.push(`  ]${catComma}`);
  });
  lines.push('};');
  lines.push('');

  // ── CONFIG ────────────────────────────────────────────────
  lines.push('export const CONFIG = {');
  lines.push(`  splurgeCategoryName: "${config.splurgeCategoryName}",`);
  lines.push(`  splurgeYesWeight: ${config.splurgeYesWeight},`);
  lines.push(`  splurgeNoWeight: ${config.splurgeNoWeight},`);
  lines.push(`  palette: ${JSON.stringify(config.palette)},`);
  lines.push(`  splurgePalette: ${JSON.stringify(config.splurgePalette)},`);
  lines.push(`  narrowBreakpoint: ${config.narrowBreakpoint}`);
  lines.push('};');

  const contents = lines.join('\n');
  const blob = new Blob([contents], { type: 'text/javascript' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.js';
  a.click();
  URL.revokeObjectURL(url);
}
