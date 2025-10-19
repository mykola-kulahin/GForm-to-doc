// ============================================================================
// File: B_Копіюємо_шаблон_презентації.js  (КОНСЮМЕР №1 - КОПІЮВАЛЬНИК)
// Роль: бере NEW з Queue, створює копію шаблону, оновлює рядок до COPIED.
// Використовує налаштування з файлу _config.js
// ============================================================================

function setupConsumer() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'consumeQueueAndCopy')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('consumeQueueAndCopy').timeBased().everyMinutes(CONFIG.POLL_MINUTES).create();
  Logger.log('✅ Consumer (Copier) scheduled every %s minutes', CONFIG.POLL_MINUTES);
}

function consumeQueueAndCopy() {
  const templateId = propGet_('TEMPLATE_ID');
  const queueId = propGet_('QUEUE_SHEET_ID');
  // Отримуємо ID папки для збереження, якщо він є
  const destinationFolderId = PropertiesService.getScriptProperties().getProperty('DESTINATION_FOLDER_ID');

  const qss = SpreadsheetApp.openById(queueId);
  const q = qss.getSheetByName(CONFIG.QUEUE_SHEET_NAME) || qss.getSheets()[0];
  ensureQueueHeader_(q);

  const lastRow = q.getLastRow();
  if (lastRow < 2) return;

  const range = q.getRange(2, 1, lastRow - 1, q.getLastColumn());
  const rows = range.getValues();
  const idx = idxMap_();

  let jobs = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][idx.status]).trim() === CONFIG.STATUS_NEW) {
      jobs.push({ i, r: rows[i] });
      if (jobs.length >= CONFIG.BATCH_LIMIT) break;
    }
  }
  if (!jobs.length) return;

  const templateFile = DriveApp.getFileById(templateId);
  
  // --- ОНОВЛЕНА ЛОГІКА ВИБОРУ ПАПКИ ---
  let destinationFolder;
  if (destinationFolderId) {
    try {
      destinationFolder = DriveApp.getFolderById(destinationFolderId);
    } catch (e) {
      Logger.log(`Помилка: не вдалося знайти папку для збереження з ID "${destinationFolderId}". Буде використано папку шаблону. Помилка: ${e.message}`);
      destinationFolder = firstParentFolder_(templateFile);
    }
  } else {
    destinationFolder = firstParentFolder_(templateFile);
  }

  if (!destinationFolder) throw new Error('Не вдалося визначити папку для збереження файлів. Перевірте, чи існує папка, та чи знаходиться шаблон усередині якоїсь папки.');
  // --- КІНЕЦЬ ОНОВЛЕНОЇ ЛОГІКИ ---

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.OUTPUT_FILENAME_DATE_FORMAT);

  jobs.forEach(({ i, r }) => {
    try {
      const colC = (r[idx.colC] || '').toString().trim();
      const name = sanitize_((colC || 'Unnamed') + ' - ' + today);
      
      const copy = HANDLERS.copy[CONFIG.TARGET_APP](templateFile, name, destinationFolder);

      rows[i][idx.status] = CONFIG.STATUS_COPIED;
      rows[i][idx.fileId] = copy.getId();
      rows[i][idx.fileUrl] = copy.getUrl();
      rows[i][idx.processedAt] = new Date();
    } catch (e) {
      rows[i][idx.status] = CONFIG.STATUS_ERROR_COPYING;
      rows[i][idx.errorMessage] = e.message;
      Logger.log('Помилка копіювання для eventId %s: %s', rows[i][idx.eventId], e.message);
    }
  });

  range.setValues(rows);
}