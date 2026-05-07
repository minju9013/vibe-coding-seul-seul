const express = require('express');
const {
  getPreferences,
  putPreferences,
} = require('../controllers/preferencesController');

const router = express.Router();

router.get('/', getPreferences);
router.put('/', putPreferences);

module.exports = router;
