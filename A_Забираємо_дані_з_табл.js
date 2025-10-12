// ============================================================================
// File: A_Забираємо_дані_з_табл.js  (ПРОДЮСЕР)
// Роль: зчитує НОВІ рядки з джерельного Sheets і додає їх у Queue.
// Використовує налаштування з файлу _config.js
// ============================================================================

function setupProducer() {
  // Видаляємо старі тригери цієї функції
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'produceNewRows')
    .forEach(t => ScriptApp.deleteTrigger(t));
  
  // Створюємо новий тригер з інтервалом з конфігурації
  ScriptApp.newTrigger('produceNewRows').timeBased().everyMinutes(CONFIG.POLL_MINUTES).create();
  Logger.log('✅ Producer scheduled every %s minutes', CONFIG.POLL_MINUTES);
}

function produceNewRows() {
  const sourceId = propGet_('SOURCE_SHEET_ID');
  const queueId  = propGet_('QUEUE_SHEET_ID');
  
  // Беремо назву аркуша з CONFIG
  const sheetName = CONFIG.SOURCE_SHEET_NAME || '';

  const ss = SpreadsheetApp.openById(sourceId);
  const sh = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
  if (!sh) throw new Error(`Аркуш "${sheetName}" не знайдено в таблиці-джерелі.`);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return; // Немає даних для обробки

  const stateKey = `A:lastRowEnqueued:${ss.getId()}:${sh.getSheetId()}`;
  const props = PropertiesService.getScriptProperties();
  const prev = Number(props.getProperty(stateKey) || 1);

  const startRow = Math.max(prev + 1, 2);
  if (startRow > lastRow) return; // Все вже оброблено

  // Беремо ліміт з CONFIG
  const endRow = Math.min(lastRow, startRow - 1 + CONFIG.BATCH_LIMIT);
  const width = sh.getLastColumn();
  const values = sh.getRange(startRow, 1, endRow - startRow + 1, width).getValues();

  const qss = SpreadsheetApp.openById(queueId);
  // Беремо назву аркуша черги з CONFIG
  const q = qss.getSheetByName(CONFIG.QUEUE_SHEET_NAME) || qss.getSheets()[0];
  ensureQueueHeader_(q);

  const existingIds = loadExistingEventIds_(q);
  const rows = [];
  const colC_idx = 2; // Індекс колонки C (A=0, B=1, C=2)

  for (let i = 0; i < values.length; i++) {
    const rowIndex = startRow + i;
    const colC = String(values[i][colC_idx] ?? '').trim(); // Значення з колонки C
    const eventId = `${ss.getId()}:${sh.getName()}:${rowIndex}`;
    
    if (existingIds.has(eventId)) continue; // Уникаємо дубляжу
    
    // Використовуємо статус з CONFIG
    rows.push([eventId, ss.getId(), sh.getName(), rowIndex, colC, new Date(), CONFIG.STATUS_NEW, '', '', '', '', '']);
  }

  if (rows.length > 0) {
    q.getRange(q.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  }
  
  props.setProperty(stateKey, String(endRow));
}

function diagnoseProducer() {
  const miss = [];
  try { propGet_('SOURCE_SHEET_ID'); } catch (_){ miss.push('SOURCE_SHEET_ID'); }
  try { propGet_('QUEUE_SHEET_ID'); } catch (_){ miss.push('QUEUE_SHEET_ID (запустіть initialSetup)'); }
  if (miss.length) throw new Error('Не вистачає властивостей скрипта: ' + miss.join(', '));
  Logger.log('✅ Producer props OK');
}