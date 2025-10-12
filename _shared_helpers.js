// ============================================================================
// File: _shared_helpers.gs  (СПІЛЬНЕ)
// Загальні утиліти для проєкту.
// ============================================================================

/**
 * Отримує значення властивості скрипта. Видає помилку, якщо не знайдено.
 * @param {string} k - Ключ властивості.
 * @returns {string} Значення властивості.
 */
function propGet_(k) {
  const v = PropertiesService.getScriptProperties().getProperty(k);
  if (!v) throw new Error('Missing Script Property: ' + k);
  return v;
}

/**
 * Встановлює значення властивості скрипта.
 * @param {string} k - Ключ властивості.
 * @param {string} v - Значення властивості.
 */
function propSet_(k, v) {
  PropertiesService.getScriptProperties().setProperty(k, v);
}

/**
 * Допоміжна функція для ручного встановлення властивостей через консоль.
 * @param {string} key - Ключ.
 * @param {string} value - Значення.
 */
function setSecret(key, value) {
  propSet_(key, value);
}

/**
 * Перевіряє і створює заголовок у таблиці черги.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Аркуш черги.
 */
function ensureQueueHeader_(sheet) {
  const cols = ['eventId', 'sourceSheetId', 'sheetName', 'rowIndex', 'colC', 'createdAt', 'status', 'processedAt', 'fileId', 'fileUrl', 'filledAt', 'errorMessage'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols);
    return;
  }
  const h = sheet.getRange(1, 1, 1, cols.length).getValues()[0];
  if (h[0] !== 'eventId' || h.length < cols.length) {
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
  }
}

/**
 * Завантажує існуючі eventId з черги, щоб уникнути дублювання.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Аркуш черги.
 * @returns {Set<string>} Набір існуючих eventId.
 */
function loadExistingEventIds_(sheet) {
  const ids = new Set();
  const last = sheet.getLastRow();
  if (last < 2) return ids;
  const vals = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    const v = String(vals[i][0] || '').trim();
    if (v) ids.add(v);
  }
  return ids;
}

/**
 * Створює об'єкт-карту для індексів колонок у черзі.
 * @returns {Object} Об'єкт, де ключ - назва колонки, а значення - її індекс (0-based).
 */
function idxMap_() {
  const cols = ['eventId', 'sourceSheetId', 'sheetName', 'rowIndex', 'colC', 'createdAt', 'status', 'processedAt', 'fileId', 'fileUrl', 'filledAt', 'errorMessage'];
  const m = {};
  cols.forEach((c, i) => m[c] = i);
  return m;
}

/**
 * Повертає першу батьківську теку файлу.
 * @param {GoogleAppsScript.Drive.File} file - Файл.
 * @returns {GoogleAppsScript.Drive.Folder|null} Батьківська тека або null.
 */
function firstParentFolder_(file) {
  const it = file.getParents();
  return it.hasNext() ? it.next() : null;
}

/**
 * Очищує рядок від символів, заборонених у назвах файлів.
 * @param {string} s - Вхідний рядок.
 * @returns {string} Очищений рядок.
 */
function sanitize_(s) {
  return s.replace(/[\/\\:*?"<>|]+/g, ' ').trim().substring(0, 120);
}