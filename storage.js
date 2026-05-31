/**
 * storage.js
 * Exports current in-memory state as a data.json file,
 * matching the format of the original data.json exactly.
 */

export function exportJS(categories, config) {
  const payload = JSON.stringify({ categories, config }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
}
