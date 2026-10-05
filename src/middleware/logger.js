// src/middleware/logger.js
// Собственное middleware логирования: метод, URL, статус и время обработки.

export const logger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(
      `  -> ${res.statusCode} (${Date.now() - start} ms)`
    );
  });

  next();
};
