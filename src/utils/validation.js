// src/utils/validation.js
// Проверка входных данных. Функции возвращают массив сообщений об ошибках:
// пустой массив — данные корректны.

export const REQUIRED_FIELDS = ["title", "description", "category", "price"];
export const UPDATABLE_FIELDS = [
  "title",
  "description",
  "category",
  "price",
  "author",
  "year",
];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidPrice = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isValidYear = (value) =>
  Number.isInteger(value) && value > 0 && value <= new Date().getFullYear();

// Проверяет значения только тех полей, которые переданы в data
const validateFieldValues = (data) => {
  const errors = [];
  const { title, description, category, author, price, year } = data;

  [
    ["title", title],
    ["description", description],
    ["category", category],
    ["author", author],
  ].forEach(([field, value]) => {
    if (value !== undefined && !isNonEmptyString(value)) {
      errors.push(`Поле "${field}" должно быть непустой строкой`);
    }
  });

  if (price !== undefined && !isValidPrice(price)) {
    errors.push('Поле "price" должно быть неотрицательным числом');
  }

  if (year !== undefined && !isValidYear(year)) {
    errors.push(
      `Поле "year" должно быть целым числом от 1 до ${new Date().getFullYear()}`
    );
  }

  return errors;
};

// Валидация для POST: все обязательные поля + корректные значения
export const validateCreate = (data = {}) => {
  const missing = REQUIRED_FIELDS.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ""
  );
  const missingErrors = missing.map(
    (field) => `Обязательное поле "${field}" отсутствует`
  );
  return [...missingErrors, ...validateFieldValues(data)];
};

// Валидация для PUT: хотя бы одно изменяемое поле + корректные значения
export const validateUpdate = (data = {}) => {
  const hasUpdatableField = UPDATABLE_FIELDS.some((field) => field in data);
  if (!hasUpdatableField) {
    return [
      `Передайте хотя бы одно изменяемое поле: ${UPDATABLE_FIELDS.join(", ")}`,
    ];
  }
  return validateFieldValues(data);
};

// Оставляет в объекте только разрешённые поля (id и createdAt менять нельзя)
export const pickFields = (data, allowedFields) =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

// Преобразует :id из URL в число; null — если id некорректный
export const parseId = (rawId) => {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
};
