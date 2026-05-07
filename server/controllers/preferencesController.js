const UserPreferences = require('../models/UserPreferences');

async function getPreferences(req, res, next) {
  try {
    const doc = await UserPreferences.findOne({ key: 'singleton' }).lean();
    if (!doc) {
      return res.json({
        customCategories: [],
        overrides: {},
        categoryOrder: [],
      });
    }
    return res.json({
      customCategories: Array.isArray(doc.customCategories) ? doc.customCategories : [],
      overrides: doc.overrides && typeof doc.overrides === 'object' ? doc.overrides : {},
      categoryOrder: Array.isArray(doc.categoryOrder) ? doc.categoryOrder : [],
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return next(err);
  }
}

async function putPreferences(req, res, next) {
  try {
    const { customCategories, overrides, categoryOrder } = req.body;

    const doc = await UserPreferences.findOneAndUpdate(
      { key: 'singleton' },
      {
        $set: {
          customCategories: Array.isArray(customCategories) ? customCategories : [],
          overrides: overrides && typeof overrides === 'object' ? overrides : {},
          categoryOrder: Array.isArray(categoryOrder) ? categoryOrder : [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({ ok: true, updatedAt: doc.updatedAt });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPreferences,
  putPreferences,
};
