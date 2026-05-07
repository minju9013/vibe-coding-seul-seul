const { VALID_CATEGORY_IDS } = require('../constants/categories');

function isValidCategoryId(categoryId) {
  if (!categoryId || typeof categoryId !== 'string') return false;
  const id = categoryId.trim();
  if (!id) return false;
  if (VALID_CATEGORY_IDS.includes(id)) return true;
  return /^custom_[a-zA-Z0-9_]+$/.test(id);
}

module.exports = { isValidCategoryId };
