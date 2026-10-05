// src/routes/itemRoutes.js
// Маршруты /api/items. Роутер только сопоставляет метод + URL с функцией контроллера.

import { Router } from "express";
import {
  getItems,
  getStats,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

const router = Router();

router.get("/", getItems);
// /stats объявлен раньше /:id, иначе "stats" был бы принят за id
router.get("/stats", getStats);
router.get("/:id", getItemById);
router.post("/", createItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
