// ============================================================================
// File: C_Заповнюємо_презентацію.js  (КОНСЮМЕР №2 - ЗАПОВНЮВАЧ)
// Роль: бере COPIED з Queue, заповнює плейсхолдери, оновлює статус на FILLED.
// Використовує налаштування з файлу _config.js
// ============================================================================

function setupFiller() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'consumeAndFill')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('consumeAndFill').timeBased().everyMinutes(CONFIG.POLL_MINUTES).create();
  Logger.log('✅ Consumer (Filler) scheduled every %s minutes', CONFIG.POLL_MINUTES);
}

function consumeAndFill() {
  const queueId = propGet_('QUEUE_SHEET_ID');

  const qss = SpreadsheetApp.openById(queueId);
  const q = qss.getSheetByName(CONFIG.QUEUE_SHEET_NAME) || qss.getSheets()[0];
  if (q.getLastRow() < 2) return;

  const range = q.getRange(2, 1, q.getLastRow() - 1, q.getLastColumn());
  const rows = range.getValues();
  const idx = idxMap_();

  let jobs = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][idx.status]).trim() === CONFIG.STATUS_COPIED) {
      jobs.push({ i, r: rows[i] });
      if (jobs.length >= CONFIG.BATCH_LIMIT) break;
    }
  }
  if (!jobs.length) return;

  const headersCache = {};
  const sheetDataCache = {};

  jobs.forEach(({ i, r }) => {
    try {
      const sourceSheetId = r[idx.sourceSheetId];
      const sheetName = r[idx.sheetName];
      const rowIndex = r[idx.rowIndex];
      const fileId = r[idx.fileId];

      if (!sourceSheetId || !sheetName || !rowIndex || !fileId) {
        throw new Error('Не вистачає даних у черзі для заповнення.');
      }

      const cacheKey = `${sourceSheetId}:${sheetName}`;

      if (!headersCache[cacheKey]) {
        const ss = SpreadsheetApp.openById(sourceSheetId);
        const sh = ss.getSheetByName(sheetName);
        headersCache[cacheKey] = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      }
      const headers = headersCache[cacheKey];

      if (!sheetDataCache[cacheKey]) {
        const ss = SpreadsheetApp.openById(sourceSheetId);
        const sh = ss.getSheetByName(sheetName);
        sheetDataCache[cacheKey] = sh.getDataRange().getValues();
      }
      const dataRow = sheetDataCache[cacheKey][rowIndex - 1];
      
      const replacements = {};
      headers.forEach((header, colIndex) => {
        if (header) {
          replacements[`{{${header}}}`] = dataRow[colIndex];
        }
      });

      // Тут у майбутньому можна буде додати HANDLERS
      const presentation = SlidesApp.openById(fileId);
      for (const placeholder in replacements) {
        presentation.replaceAllText(placeholder, replacements[placeholder]);
      }

      rows[i][idx.status] = CONFIG.STATUS_FILLED;
      rows[i][idx.filledAt] = new Date();

    } catch (e) {
      rows[i][idx.status] = CONFIG.STATUS_ERROR_FILLING;
      rows[i][idx.errorMessage] = e.message;
      Logger.log('Помилка заповнення для eventId %s: %s', rows[i][idx.eventId], e.message);
    }
  });

  range.setValues(rows);
}