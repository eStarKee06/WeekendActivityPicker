/**
 * storage.js
 * Exports current in-memory state as a data.js file,
 * matching the format of the original data.js exactly.
 */

export function exportJS(categories, config) {
  const categoriesStr = JSON.stringify(categories, null, 2)
    .replace(/"([^"]+)":/g, '$1:');  // "key": -> key: for JS style

  const paletteStr    = JSON.stringify(config.palette);
  const splurgeStr    = JSON.stringify(config.splurgePalette);

  const contents = `export const CATEGORIES = ${categoriesStr};

export const CONFIG = {
  splurgeCategoryName: "${config.splurgeCategoryName}",
  splurgeYesWeight: ${config.splurgeYesWeight},
  splurgeNoWeight: ${config.splurgeNoWeight},
  palette: ${paletteStr},
  splurgePalette: ${splurgeStr},
  narrowBreakpoint: ${config.narrowBreakpoint}
};
`;

  const blob = new Blob([contents], { type: 'text/javascript' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'data.js';
  a.click();
  URL.revokeObjectURL(url);
}
