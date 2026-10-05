// src/middleware/errorHandlers.js

// Неизвестный endpoint -> 404 JSON
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Маршрут ${req.method} ${req.originalUrl} не найден`,
  });
};

// Централизованный обработчик ошибок. Express распознаёт его по 4 аргументам.
// Ошибка клиента не роняет сервер — клиент получает JSON с описанием.
export const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Некорректный JSON в теле запроса",
    });
  }

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    error: status >= 500 ? "Внутренняя ошибка сервера" : err.message,
  });
};
