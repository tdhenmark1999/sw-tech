const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const qs = require('qs');
const Database = require('./config/database');
const DropdownController = require('./controllers/dropdownController');
const SystemController = require('./controllers/systemController');
const dropdownRoutes = require('./routes/dropdownRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { getPaginatedResults } = require('./utils/pagination');
const { validatePlannerData, sanitizeNumber } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 1337;

const database = new Database();
const db = database.getDB();

const dropdownController = new DropdownController(db);
const systemController = new SystemController(db);

app.use(cors({
  origin: ['http://localhost:4200'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.set('query parser', (str) => qs.parse(str, { depth: 5 }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('/api/dropdown', dropdownRoutes(dropdownController));
app.use('/api/systems', systemRoutes(systemController));

app.get('/api/planners', (req, res) => {
  const page = sanitizeNumber(req.query.pagination?.page || req.query.page || 1, 1);
  const pageSize = Math.min(sanitizeNumber(req.query.pagination?.pageSize || req.query.pageSize || 10, 10), 100);
  const search = req.query.search ? req.query.search.trim() : '';
  
  let query = 'SELECT * FROM planners';
  let params = [];
  
  if (search) {
    query += ' WHERE name LIKE ? OR description LIKE ? OR plannerType LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  query += ' ORDER BY createdAt DESC';
  
  getPaginatedResults(
    db,
    query,
    params,
    page,
    pageSize,
    (err, result) => {
      if (err) {
        console.error('Error fetching planners:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      result.data = result.data.map(item => {
        try {
          return {
            ...item,
            documentId: item.documentId || item.id,
            externalSystemConfig: item.externalSystemConfig ? JSON.parse(item.externalSystemConfig) : null,
            funds: item.funds ? JSON.parse(item.funds) : [],
            trigger: item.trigger ? JSON.parse(item.trigger) : { sources: false, runs: false, reports: false },
            sources: item.sources ? JSON.parse(item.sources) : [],
            runs: item.runs ? JSON.parse(item.runs) : [],
            reports: item.reports ? JSON.parse(item.reports) : []
          };
        } catch (parseError) {
          console.error('Error parsing JSON fields:', parseError);
          return {
            ...item,
            documentId: item.documentId || item.id,
            externalSystemConfig: null,
            funds: [],
            trigger: { sources: false, runs: false, reports: false },
            sources: [],
            runs: [],
            reports: []
          };
        }
      });
      
      res.json(result);
    }
  );
});

app.post('/api/planners', (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  const validation = validatePlannerData(data);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, description, plannerType, externalSystemConfig, funds, trigger, sources, runs, reports } = data;
  
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
      console.error('Error creating planner:', err.message);
      return res.status(500).json({ error: 'Failed to create planner' });
    }
    
    const plannerId = this.lastID;
    
    // Update documentId to be same as id
    db.run('UPDATE planners SET documentId = ? WHERE id = ?', [plannerId, plannerId], (updateErr) => {
      if (updateErr) {
        console.error('Error updating planner documentId:', updateErr.message);
        return res.status(500).json({ error: 'Failed to update planner' });
      }
      
      res.status(201).json({
        data: {
          id: plannerId,
          documentId: plannerId,
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
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  if (!documentId || isNaN(parseInt(documentId))) {
    return res.status(400).json({ error: 'Valid documentId is required' });
  }

  const validation = validatePlannerData(data);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, description, plannerType, externalSystemConfig, funds, trigger, sources, runs, reports } = data;
  
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
      console.error('Error updating planner:', err.message);
      return res.status(500).json({ error: 'Failed to update planner' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Planner not found' });
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
  
  if (!documentId || isNaN(parseInt(documentId))) {
    return res.status(400).json({ error: 'Valid documentId is required' });
  }
  
  db.run('DELETE FROM planners WHERE documentId = ?', [documentId], function(err) {
    if (err) {
      console.error('Error deleting planner:', err.message);
      return res.status(500).json({ error: 'Failed to delete planner' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Planner not found' });
    }
    
    res.json({ data: null });
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Systems API: http://localhost:${PORT}/api/systems`);
  console.log(`Planners API: http://localhost:${PORT}/api/planners`);
  console.log(`Dropdown API: http://localhost:${PORT}/api/dropdown/:category`);
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(async () => {
    try {
      await database.close();
      console.log('Server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));