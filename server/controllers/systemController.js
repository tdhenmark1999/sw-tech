const { getPaginatedResults } = require('../utils/pagination');
const { validateSystemData, sanitizeNumber } = require('../utils/validation');

class SystemController {
  constructor(db) {
    this.db = db;
  }

  getSystems(req, res) {
    const page = sanitizeNumber(req.query['pagination[page]'], 1);
    const pageSize = Math.min(sanitizeNumber(req.query['pagination[pageSize]'], 10), 100); // Limit max page size
    
    getPaginatedResults(
      this.db,
      'SELECT * FROM systems ORDER BY createdAt DESC',
      [],
      page,
      pageSize,
      (err, result) => {
        if (err) {
          console.error('Error fetching systems:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        result.data = result.data.map(item => ({
          ...item,
          documentId: item.documentId || item.id
        }));
        
        res.json(result);
      }
    );
  }

  createSystem(req, res) {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const validation = validateSystemData(data);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, baseUrl, authenticationMethod, authenticationPlace, key, value } = data;
    
    const query = `INSERT INTO systems (name, baseUrl, authenticationMethod, authenticationPlace, key, value, documentId, createdAt, updatedAt, publishedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`;
    
    const db = this.db; 
    this.db.run(query, [name, baseUrl, authenticationMethod, authenticationPlace, key, value, null], function(err) {
      if (err) {
        console.error('Error creating system:', err.message);
        return res.status(500).json({ error: 'Failed to create system' });
      }
      
      const systemId = this.lastID;
      
      db.run('UPDATE systems SET documentId = ? WHERE id = ?', [systemId, systemId], (updateErr) => {
        if (updateErr) {
          console.error('Error updating documentId:', updateErr.message);
          return res.status(500).json({ error: 'Failed to update system' });
        }
        
        res.status(201).json({
          data: {
            id: systemId,
            documentId: systemId,
            name,
            baseUrl,
            authenticationMethod,
            authenticationPlace,
            key,
            value
          }
        });
      });
    });
  }

  updateSystem(req, res) {
    const { documentId } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    if (!documentId || isNaN(parseInt(documentId))) {
      return res.status(400).json({ error: 'Valid documentId is required' });
    }

    const validation = validateSystemData(data);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, baseUrl, authenticationMethod, authenticationPlace, key, value } = data;
    
    const query = `UPDATE systems 
                   SET name = ?, baseUrl = ?, authenticationMethod = ?, authenticationPlace = ?, key = ?, value = ?, updatedAt = datetime('now')
                   WHERE documentId = ?`;
    
    this.db.run(query, [name, baseUrl, authenticationMethod, authenticationPlace, key, value, documentId], function(err) {
      if (err) {
        console.error('Error updating system:', err.message);
        return res.status(500).json({ error: 'Failed to update system' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'System not found' });
      }
      
      res.json({
        data: {
          documentId: parseInt(documentId),
          name,
          baseUrl,
          authenticationMethod,
          authenticationPlace,
          key,
          value
        }
      });
    });
  }

  deleteSystem(req, res) {
    const { documentId } = req.params;
    
    if (!documentId || isNaN(parseInt(documentId))) {
      return res.status(400).json({ error: 'Valid documentId is required' });
    }
    
    this.db.run('DELETE FROM systems WHERE documentId = ?', [documentId], function(err) {
      if (err) {
        console.error('Error deleting system:', err.message);
        return res.status(500).json({ error: 'Failed to delete system' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'System not found' });
      }
      
      res.json({ data: null });
    });
  }
}

module.exports = SystemController;