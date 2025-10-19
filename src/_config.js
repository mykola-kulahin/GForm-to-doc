const CONFIG = {
  // --- Загальні налаштування ---
  QUEUE_SHEET_NAME: 'Queue',       // Назва аркуша для черги
  POLL_MINUTES: 120,                 // Як часто перевіряти наявність нових завдань (в хвилинах)
  BATCH_LIMIT: 5,                 // Максимальна кількість завдань за один запуск

  // --- Налаштування Продюсера (зчитування даних) ---
  SOURCE_SHEET_NAME: 'Відповіді форми (1)', // Назва аркуша з даними. Залиште '' для першого аркуша.

  // --- Налаштування Консюмера (створення та заповнення файлів) ---
  TARGET_APP: 'SLIDES',            // Цільовий додаток: 'SLIDES' або 'DOCS'
  OUTPUT_FILENAME_DATE_FORMAT: 'dd.MM.yy', // Формат дати для назви файлу

  // --- Статуси завдань ---
  STATUS_NEW: 'NEW',
  STATUS_COPIED: 'COPIED',
  STATUS_FILLED: 'FILLED',
  STATUS_ERROR_COPYING: 'ERROR_COPYING',
  STATUS_ERROR_FILLING: 'ERROR_FILLING'
};