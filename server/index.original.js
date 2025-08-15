const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 1337;

app.use(cors({
  origin: ['http://localhost:4200'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId INTEGER UNIQUE,
    name TEXT NOT NULL,
    baseUrl TEXT NOT NULL,
    authenticationMethod TEXT NOT NULL,
    authenticationPlace TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    publishedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS planners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId INTEGER UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    plannerType TEXT NOT NULL,
    externalSystemConfig TEXT,
    funds TEXT,
    trigger TEXT,
    sources TEXT,
    runs TEXT,
    reports TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    publishedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dropdown_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dropdown_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dropdown_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dropdown_funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dropdown_fund_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    fundId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fundId) REFERENCES dropdown_funds (id) ON DELETE SET NULL
  )`);

  db.run(`INSERT OR IGNORE INTO dropdown_sources (name, value) VALUES 
    ('Bloomberg Terminal', 'bloomberg'),
    ('Reuters Eikon', 'reuters'),
    ('Market Data Feed', 'market-feed')`);

  db.run(`INSERT OR IGNORE INTO dropdown_runs (name, value) VALUES 
    ('Daily Run', 'daily-run'),
    ('Weekly Run', 'weekly-run'),
    ('Monthly Run', 'monthly-run')`);

  db.run(`INSERT OR IGNORE INTO dropdown_reports (name, value, type) VALUES 
    ('Portfolio Summary', 'portfolio-summary', 'financial'),
    ('Risk Analysis', 'risk-analysis', 'risk'),
    ('Performance Review', 'performance-review', 'performance')`);

  db.run(`INSERT OR IGNORE INTO dropdown_funds (name, value) VALUES 
    ('Equity Growth Fund', 'equity-growth'),
    ('Bond Income Fund', 'bond-income'),
    ('Balanced Fund', 'balanced-fund')`);

  db.run(`INSERT OR IGNORE INTO dropdown_fund_aliases (name, value) VALUES 
    ('EGF', 'egf'),
    ('BIF', 'bif'),
    ('BAL', 'bal')`);
});

const getPaginatedResults = (query, params, page = 1, pageSize = 10, callback) => {
  const offset = (page - 1) * pageSize;
  const limitQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`;
  
  const countQuery = query.replace(/SELECT \*/, 'SELECT COUNT(*) as count');
  
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    db.all(limitQuery, params, (err, rows) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      const total = countResult.count;
      const pageCount = Math.ceil(total / pageSize);
      
      callback(null, {
        data: rows,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount,
            total
          }
        }
      });
    });
  });
};

app.get('/api/systems', (req, res) => {
  const page = parseInt(req.query['pagination[page]']) || 1;
  const pageSize = parseInt(req.query['pagination[pageSize]']) || 10;
  
  getPaginatedResults(
    'SELECT * FROM systems ORDER BY createdAt DESC',
    [],
    page,
    pageSize,
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      result.data = result.data.map(item => ({
        ...item,
        documentId: item.documentId || item.id
      }));
      
      res.json(result);
    }
  );
});

app.post('/api/systems', (req, res) => {
  const { name, baseUrl, authenticationMethod, authenticationPlace, key, value } = req.body.data;
  
  const query = `INSERT INTO systems (name, baseUrl, authenticationMethod, authenticationPlace, key, value, documentId, createdAt, updatedAt, publishedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`;
  
  db.run(query, [name, baseUrl, authenticationMethod, authenticationPlace, key, value, null], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.run('UPDATE systems SET documentId = ? WHERE id = ?', [this.lastID, this.lastID], (updateErr) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }
      
      res.status(201).json({
        data: {
          id: this.lastID,
          documentId: this.lastID,
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
});

app.put('/api/systems/:documentId', (req, res) => {
  const { documentId } = req.params;
  const { name, baseUrl, authenticationMethod, authenticationPlace, key, value } = req.body.data;
  
  const query = `UPDATE systems 
                 SET name = ?, baseUrl = ?, authenticationMethod = ?, authenticationPlace = ?, key = ?, value = ?, updatedAt = datetime('now')
                 WHERE documentId = ?`;
  
  db.run(query, [name, baseUrl, authenticationMethod, authenticationPlace, key, value, documentId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'System not found' });
      return;
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
});

app.delete('/api/systems/:documentId', (req, res) => {
  const { documentId } = req.params;
  
  db.run('DELETE FROM systems WHERE documentId = ?', [documentId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'System not found' });
      return;
    }
    
    res.json({ data: null });
  });
});

app.get('/api/planners', (req, res) => {
  const page = parseInt(req.query['pagination[page]']) || 1;
  const pageSize = parseInt(req.query['pagination[pageSize]']) || 10;
  
  getPaginatedResults(
    'SELECT * FROM planners ORDER BY createdAt DESC',
    [],
    page,
    pageSize,
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      result.data = result.data.map(item => ({
        ...item,
        documentId: item.documentId || item.id,
        externalSystemConfig: item.externalSystemConfig ? JSON.parse(item.externalSystemConfig) : null,
        funds: item.funds ? JSON.parse(item.funds) : [],
        trigger: item.trigger ? JSON.parse(item.trigger) : { sources: false, runs: false, reports: false },
        sources: item.sources ? JSON.parse(item.sources) : [],
        runs: item.runs ? JSON.parse(item.runs) : [],
        reports: item.reports ? JSON.parse(item.reports) : []
      }));
      
      res.json(result);
    }
  );
});

app.post('/api/planners', (req, res) => {
  const { name, description, plannerType, externalSystemConfig, funds, trigger, sources, runs, reports } = req.body.data;
  
  const query = `INSERT INTO planners (name, description, plannerType, externalSystemConfig, funds, trigger, sources, runs, reports, documentId, createdAt, updatedAt, publishedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`;
  
  const jsonFields = [
    JSON.stringify(externalSystemConfig),
    JSON.stringify(funds || []),
    JSON.stringify(trigger || { sources: false, runs: false, reports: false }),
    JSON.stringify(sources || []),
    JSON.stringify(runs || []),
    JSON.stringify(reports || [])
  ];
  
  db.run(query, [name, description, plannerType, ...jsonFields, null], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.run('UPDATE planners SET documentId = ? WHERE id = ?', [this.lastID, this.lastID], (updateErr) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }
      
      res.status(201).json({
        data: {
          id: this.lastID,
          documentId: this.lastID,
          name,
          description,
          plannerType,
          externalSystemConfig,
          funds: funds || [],
          trigger: trigger || { sources: false, runs: false, reports: false },
          sources: sources || [],
          runs: runs || [],
          reports: reports || []
        }
      });
    });
  });
});

app.put('/api/planners/:documentId', (req, res) => {
  const { documentId } = req.params;
  const { name, description, plannerType, externalSystemConfig, funds, trigger, sources, runs, reports } = req.body.data;
  
  const query = `UPDATE planners 
                 SET name = ?, description = ?, plannerType = ?, externalSystemConfig = ?, funds = ?, trigger = ?, sources = ?, runs = ?, reports = ?, updatedAt = datetime('now')
                 WHERE documentId = ?`;
  
  const jsonFields = [
    JSON.stringify(externalSystemConfig),
    JSON.stringify(funds || []),
    JSON.stringify(trigger || { sources: false, runs: false, reports: false }),
    JSON.stringify(sources || []),
    JSON.stringify(runs || []),
    JSON.stringify(reports || [])
  ];
  
  db.run(query, [name, description, plannerType, ...jsonFields, documentId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Planner not found' });
      return;
    }
    
    res.json({
      data: {
        documentId: parseInt(documentId),
        name,
        description,
        plannerType,
        externalSystemConfig,
        funds: funds || [],
        trigger: trigger || { sources: false, runs: false, reports: false },
        sources: sources || [],
        runs: runs || [],
        reports: reports || []
      }
    });
  });
});

app.delete('/api/planners/:documentId', (req, res) => {
  const { documentId } = req.params;
  
  db.run('DELETE FROM planners WHERE documentId = ?', [documentId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Planner not found' });
      return;
    }
    
    res.json({ data: null });
  });
});

app.get('/api/dropdown/:category', (req, res) => {
  const { category } = req.params;
  const search = req.query.search || '';
  
  const validCategories = ['sources', 'runs', 'reports', 'funds', 'fundAliases'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const tableMap = {
    sources: 'dropdown_sources',
    runs: 'dropdown_runs', 
    reports: 'dropdown_reports',
    funds: 'dropdown_funds',
    fundAliases: 'dropdown_fund_aliases'
  };

  const tableName = tableMap[category];
  let query = `SELECT * FROM ${tableName}`;
  let params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR value LIKE ?';
    params = [`%${search}%`, `%${search}%`];
  }

  query += ' ORDER BY name ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.post('/api/dropdown/:category', (req, res) => {
  const { category } = req.params;
  const { items } = req.body;
  
  const validCategories = ['sources', 'runs', 'reports', 'funds', 'fundAliases'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const tableMap = {
    sources: 'dropdown_sources',
    runs: 'dropdown_runs',
    reports: 'dropdown_reports', 
    funds: 'dropdown_funds',
    fundAliases: 'dropdown_fund_aliases'
  };

  const tableName = tableMap[category];
  
  db.serialize(() => {
    db.run(`DELETE FROM ${tableName}`, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!items || items.length === 0) {
        return res.json({ data: [] });
      }

      let insertQuery;
      let insertParams;

      if (category === 'reports') {
        insertQuery = `INSERT INTO ${tableName} (name, value, type) VALUES (?, ?, ?)`;
        insertParams = items.map(item => [item.name, item.value, item.type]);
      } else if (category === 'fundAliases') {
        insertQuery = `INSERT INTO ${tableName} (name, value, fundId) VALUES (?, ?, ?)`;
        insertParams = items.map(item => [item.name, item.value, item.fundId || null]);
      } else {
        insertQuery = `INSERT INTO ${tableName} (name, value) VALUES (?, ?)`;
        insertParams = items.map(item => [item.name, item.value]);
      }

      const stmt = db.prepare(insertQuery);
      let completed = 0;
      let hasError = false;

      insertParams.forEach((params, index) => {
        stmt.run(params, function(err) {
          if (err && !hasError) {
            hasError = true;
            stmt.finalize();
            return res.status(500).json({ error: err.message });
          }
          
          completed++;
          if (completed === insertParams.length && !hasError) {
            stmt.finalize();
            res.json({ 
              data: items,
              message: `${items.length} ${category} saved successfully` 
            });
          }
        });
      });
    });
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Systems API: http://localhost:${PORT}/api/systems`);
  console.log(`Planners API: http://localhost:${PORT}/api/planners`);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});