// src/server.js
// Точка входа: запуск HTTP-сервера.

import app from "./app.js";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`DataShare API запущен: http://localhost:${PORT}`);
});
