// src/app.js
// Конфигурация Express-приложения: middleware, маршруты, обработка ошибок.
// Сервер здесь НЕ запускается — это делает server.js.

import express from "express";
import itemRoutes from "./routes/itemRoutes.js";
import { logger } from "./middleware/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandlers.js";

const app = express();

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.status(200).json({
    name: "DataShare API",
    message: "API is working",
  });
});

app.use("/api/items", itemRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
