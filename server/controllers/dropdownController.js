const { validateDropdownCategory, validateDropdownItems, sanitizeString } = require('../utils/validation');

class DropdownController {
  constructor(db) {
    this.db = db;
    this.tableMap = {
      sources: 'dropdown_sources',
      runs: 'dropdown_runs',
      reports: 'dropdown_reports',
      funds: 'dropdown_funds',
      fundAliases: 'dropdown_fund_aliases'
    };
  }

  getDropdownData(req, res) {
    const { category } = req.params;
    const search = sanitizeString(req.query.search || '');

    if (!validateDropdownCategory(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const tableName = this.tableMap[category];
    let query = `SELECT * FROM ${tableName}`;
    let params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR value LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY name ASC';

    this.db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error fetching ${category}:`, err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ data: rows || [] });
    });
  }

  saveDropdownData(req, res) {
    const { category } = req.params;
    const { items } = req.body;

    if (!validateDropdownCategory(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (!items) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const hasType = category === 'reports';
    const validation = validateDropdownItems(items, hasType);
    
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const tableName = this.tableMap[category];
    
    this.db.serialize(() => {
      this.db.run('BEGIN TRANSACTION');
      
      this.db.run(`DELETE FROM ${tableName}`, (err) => {
        if (err) {
          this.db.run('ROLLBACK');
          console.error(`Error clearing ${category}:`, err.message);
          return res.status(500).json({ error: 'Failed to clear existing data' });
        }

        if (!items || items.length === 0) {
          this.db.run('COMMIT');
          return res.json({ data: [], message: `${category} cleared successfully` });
        }

        let insertQuery;
        let insertParams;

        if (category === 'reports') {
          insertQuery = `INSERT INTO ${tableName} (name, value, type) VALUES (?, ?, ?)`;
          insertParams = items.map(item => [
            sanitizeString(item.name),
            sanitizeString(item.value),
            sanitizeString(item.type)
          ]);
        } else if (category === 'fundAliases') {
          insertQuery = `INSERT INTO ${tableName} (name, value, fundId) VALUES (?, ?, ?)`;
          insertParams = items.map(item => [
            sanitizeString(item.name),
            sanitizeString(item.value),
            item.fundId || null
          ]);
        } else {
          insertQuery = `INSERT INTO ${tableName} (name, value) VALUES (?, ?)`;
          insertParams = items.map(item => [
            sanitizeString(item.name),
            sanitizeString(item.value)
          ]);
        }

        const stmt = this.db.prepare(insertQuery);
        let completed = 0;
        let hasError = false;

        insertParams.forEach((params, index) => {
          stmt.run(params, function(err) {
            if (err && !hasError) {
              hasError = true;
              stmt.finalize();
              this.db.run('ROLLBACK');
              console.error(`Error inserting ${category} item:`, err.message);
              return res.status(500).json({ error: 'Failed to save items' });
            }
            
            completed++;
            if (completed === insertParams.length && !hasError) {
              stmt.finalize();
              this.db.run('COMMIT');
              res.json({ 
                data: items,
                message: `${items.length} ${category} saved successfully` 
              });
            }
          }.bind(this));
        });
      });
    });
  }
}

module.exports = DropdownController;