const express = require('express');
const router = express.Router();

module.exports = (systemController) => {
  // GET /api/systems
  router.get('/', (req, res) => {
    systemController.getSystems(req, res);
  });

  // POST /api/systems
  router.post('/', (req, res) => {
    systemController.createSystem(req, res);
  });

  // PUT /api/systems/:documentId
  router.put('/:documentId', (req, res) => {
    systemController.updateSystem(req, res);
  });

  // DELETE /api/systems/:documentId
  router.delete('/:documentId', (req, res) => {
    systemController.deleteSystem(req, res);
  });

  return router;
};