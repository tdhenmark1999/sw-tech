const express = require('express');
const router = express.Router();

module.exports = (dropdownController) => {
  // GET /api/dropdown/:category
  router.get('/:category', (req, res) => {
    dropdownController.getDropdownData(req, res);
  });

  // POST /api/dropdown/:category
  router.post('/:category', (req, res) => {
    dropdownController.saveDropdownData(req, res);
  });

  return router;
};