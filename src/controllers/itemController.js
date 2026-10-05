// src/controllers/itemController.js
// Контроллер: обработка HTTP-запросов к /api/items.
// Получает данные из req (params, query, body), работает с массивом
// и формирует ответ с нужным HTTP-статусом.

import { items as initialItems } from "../data/items.js";
import {
  validateCreate,
  validateUpdate,
  pickFields,
  parseId,
  UPDATABLE_FIELDS,
} from "../utils/validation.js";

// Хранилище в памяти. Копия, чтобы не мутировать исходный модуль с данными.
let items = [...initialItems];

const generateId = () =>
  items.length === 0 ? 1 : Math.max(...items.map(({ id }) => id)) + 1;

const sendNotFound = (res, id) =>
  res.status(404).json({
    success: false,
    error: `Книга с id ${id} не найдена`,
  });

const sendBadRequest = (res, errors) =>
  res.status(400).json({
    success: false,
    error: "Некорректные данные",
    details: errors,
  });

// Находит запись по :id из URL. При ошибке сам отправляет ответ и возвращает null.
const findItemOrRespond = (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, [`Некорректный id: "${req.params.id}"`]);
    return null;
  }
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    sendNotFound(res, id);
    return null;
  }
  return item;
};

const SORT_FIELDS = ["price", "createdAt", "title", "year"];

const compareBy = (field) => (a, b) =>
  typeof a[field] === "string"
    ? a[field].localeCompare(b[field], "ru")
    : a[field] - b[field];

// GET /api/items
// Query: search, category, minPrice, maxPrice, sort, order, page, limit
export const getItems = (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    order = "asc",
    page,
    limit,
  } = req.query;

  const errors = [];
  const min = minPrice !== undefined ? Number(minPrice) : null;
  const max = maxPrice !== undefined ? Number(maxPrice) : null;
  if (min !== null && Number.isNaN(min)) errors.push("minPrice должен быть числом");
  if (max !== null && Number.isNaN(max)) errors.push("maxPrice должен быть числом");
  if (sort !== undefined && !SORT_FIELDS.includes(sort)) {
    errors.push(`sort может быть одним из: ${SORT_FIELDS.join(", ")}`);
  }
  if (!["asc", "desc"].includes(order)) errors.push("order может быть asc или desc");
  if (errors.length > 0) return sendBadRequest(res, errors);

  let result = [...items];

  if (search) {
    const query = search.trim().toLowerCase();
    result = result.filter(({ title, description }) =>
      `${title} ${description}`.toLowerCase().includes(query)
    );
  }

  if (category) {
    result = result.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (min !== null) result = result.filter(({ price }) => price >= min);
  if (max !== null) result = result.filter(({ price }) => price <= max);

  if (sort) {
    result.sort(compareBy(sort));
    if (order === "desc") result.reverse();
  }

  const total = result.length;
  const response = { success: true, count: total, data: result };

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 5, 1);
    const start = (pageNum - 1) * limitNum;
    const pageData = result.slice(start, start + limitNum);
    Object.assign(response, {
      count: pageData.length,
      data: pageData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }

  return res.status(200).json(response);
};

// GET /api/items/stats — индивидуальное усложнение (вариант H)
export const getStats = (req, res) => {
  if (items.length === 0) {
    return res.status(200).json({
      success: true,
      data: { count: 0, totalPrice: 0, minPrice: null, maxPrice: null, averagePrice: null, categories: [] },
    });
  }

  const prices = items.map(({ price }) => price);
  const totalPrice = prices.reduce((sum, price) => sum + price, 0);

  const byCategory = items.reduce((acc, { category, price }) => {
    const current = acc[category] ?? { count: 0, totalPrice: 0 };
    return {
      ...acc,
      [category]: { count: current.count + 1, totalPrice: current.totalPrice + price },
    };
  }, {});

  return res.status(200).json({
    success: true,
    data: {
      count: items.length,
      totalPrice,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      averagePrice: Math.round(totalPrice / items.length),
      categories: Object.keys(byCategory),
      byCategory,
    },
  });
};

// GET /api/items/:id
export const getItemById = (req, res) => {
  const item = findItemOrRespond(req, res);
  if (!item) return;
  res.status(200).json({ success: true, data: item });
};

// POST /api/items
export const createItem = (req, res) => {
  const body = req.body ?? {};
  const errors = validateCreate(body);
  if (errors.length > 0) return sendBadRequest(res, errors);

  const newItem = {
    id: generateId(),
    author: "Неизвестный автор",
    ...pickFields(body, UPDATABLE_FIELDS),
    createdAt: new Date().toISOString(),
  };
  items = [...items, newItem];

  return res.status(201).json({ success: true, data: newItem });
};

// PUT /api/items/:id — частичное обновление: меняются только переданные поля
export const updateItem = (req, res) => {
  const item = findItemOrRespond(req, res);
  if (!item) return;

  const body = req.body ?? {};
  const errors = validateUpdate(body);
  if (errors.length > 0) return sendBadRequest(res, errors);

  const updatedItem = {
    ...item,
    ...pickFields(body, UPDATABLE_FIELDS),
    updatedAt: new Date().toISOString(),
  };
  items = items.map((entry) => (entry.id === item.id ? updatedItem : entry));

  return res.status(200).json({ success: true, data: updatedItem });
};

// DELETE /api/items/:id
export const deleteItem = (req, res) => {
  const item = findItemOrRespond(req, res);
  if (!item) return;

  items = items.filter((entry) => entry.id !== item.id);

  return res.status(200).json({
    success: true,
    message: `Книга с id ${item.id} удалена`,
    data: item,
  });
};
