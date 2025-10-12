// ============================================================================
// File: _setup.js  (НАЛАШТУВАННЯ)
// Роль: надати користувачеві зручний інтерфейс для початкового налаштування
// скрипта через діалогові вікна.
// ============================================================================

/**
 * Запускає покроковий процес налаштування для користувача.
 * Запитує необхідні ID та зберігає їх у властивостях скрипта.
 * Цю функцію потрібно запустити вручну один раз.
 */
function initialSetup() {
  const ui = SpreadsheetApp.getUi();

  ui.alert('Майстер налаштування автоматизації', 'Зараз вам буде запропоновано ввести кілька ID для налаштування скрипта. Будь ласка, підготуйте їх.', ui.ButtonSet.OK);

  const propertiesToSet = {
    'SOURCE_SHEET_ID': 'ID вихідної Google Таблиці (звідки брати дані)',
    'TEMPLATE_ID': `ID файлу-шаблону (${CONFIG.TARGET_APP})`,
  };

  for (const key in propertiesToSet) {
    const promptText = `Крок ${Object.keys(propertiesToSet).indexOf(key) + 1}/${Object.keys(propertiesToSet).length}: Введіть ${propertiesToSet[key]}`;
    const result = ui.prompt(promptText, 'Поле для введення ID', ui.ButtonSet.OK_CANCEL);

    if (result.getSelectedButton() == ui.Button.OK) {
      const value = result.getResponseText().trim();
      if (value) {
        PropertiesService.getScriptProperties().setProperty(key, value);
        Logger.log(`Властивість ${key} збережено.`);
      } else {
        ui.alert('Помилка', 'Поле не може бути порожнім. Налаштування скасовано.', ui.ButtonSet.OK);
        return;
      }
    } else {
      ui.alert('Скасовано', 'Налаштування було скасовано користувачем.', ui.ButtonSet.OK);
      return;
    }
  }

  // --- НОВИЙ КРОК: ЗАПИТ ПРО ПАПКУ ДЛЯ ЗБЕРЕЖЕННЯ ---
  const folderResponse = ui.prompt(
    'Папка для збереження файлів (опціонально)',
    'Введіть ID папки з Google Drive, куди зберігати створені файли. Якщо залишити поле порожнім, файли будуть зберігатися в тій самій папці, де лежить ваш шаблон.',
    ui.ButtonSet.OK_CANCEL
  );

  if (folderResponse.getSelectedButton() == ui.Button.OK) {
    const folderId = folderResponse.getResponseText().trim();
    if (folderId) {
      PropertiesService.getScriptProperties().setProperty('DESTINATION_FOLDER_ID', folderId);
      Logger.log(`Властивість DESTINATION_FOLDER_ID збережено.`);
    } else {
      // Якщо користувач нічого не ввів, видаляємо старе значення, щоб активувати логіку за замовчуванням
      PropertiesService.getScriptProperties().deleteProperty('DESTINATION_FOLDER_ID');
    }
  }
  // --- КІНЕЦЬ НОВОГО КРОКУ ---

  const queueResponse = ui.alert('Створення черги', 'Створити нову таблицю для черги завдань?', ui.ButtonSet.YES_NO);
  if (queueResponse == ui.Button.YES) {
    const ss = SpreadsheetApp.create(`Queue - Automation Script`);
    const sheet = ss.getSheets()[0];
    sheet.setName(CONFIG.QUEUE_SHEET_NAME);
    ensureQueueHeader_(sheet);
    PropertiesService.getScriptProperties().setProperty('QUEUE_SHEET_ID', ss.getId());
    ui.alert('Успіх', `Створено нову таблицю для черги. Її ID: ${ss.getId()}`, ui.ButtonSet.OK);
  } else {
     const result = ui.prompt('Введіть ID існуючої таблиці для черги:', ui.ButtonSet.OK_CANCEL);
     if(result.getSelectedButton() == ui.Button.OK && result.getResponseText().trim()) {
        PropertiesService.getScriptProperties().setProperty('QUEUE_SHEET_ID', result.getResponseText().trim());
     } else {
        ui.alert('Скасовано', 'Налаштування черги було скасовано.', ui.ButtonSet.OK);
        return;
     }
  }

  ui.alert('Налаштування завершено!', 'Тепер потрібно налаштувати тригери. Запустіть функції setupProducer, setupConsumer та setupFiller з редактора, щоб запланувати автоматичне виконання.', ui.ButtonSet.OK);
}