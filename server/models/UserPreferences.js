const mongoose = require('mongoose');

const { Schema } = mongoose;

const userPreferencesSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'singleton' },
    customCategories: { type: Schema.Types.Mixed, default: [] },
    overrides: { type: Schema.Types.Mixed, default: {} },
    categoryOrder: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
