const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../database.sqlite');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
    this.db.serialize(() => {
      // Systems table
      this.db.run(`CREATE TABLE IF NOT EXISTS systems (
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

      // Planners table
      this.db.run(`CREATE TABLE IF NOT EXISTS planners (
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

      // Dropdown data tables
      this.createDropdownTables();
      this.insertDefaultData();
    });
  }

  createDropdownTables() {
    const dropdownTables = [
      {
        name: 'dropdown_sources',
        columns: `
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        `
      },
      {
        name: 'dropdown_runs',
        columns: `
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        `
      },
      {
        name: 'dropdown_reports',
        columns: `
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        `
      },
      {
        name: 'dropdown_funds',
        columns: `
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        `
      },
      {
        name: 'dropdown_fund_aliases',
        columns: `
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          fundId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fundId) REFERENCES dropdown_funds (id) ON DELETE SET NULL
        `
      }
    ];

    dropdownTables.forEach(table => {
      this.db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns})`);
    });
  }

  insertDefaultData() {
    // Insert default data with error handling
    const insertStatements = [
      {
        sql: `INSERT OR IGNORE INTO dropdown_sources (name, value) VALUES (?, ?)`,
        data: [
          ['Bloomberg Terminal', 'bloomberg'],
          ['Reuters Eikon', 'reuters'],
          ['Market Data Feed', 'market-feed']
        ]
      },
      {
        sql: `INSERT OR IGNORE INTO dropdown_runs (name, value) VALUES (?, ?)`,
        data: [
          ['Daily Run', 'daily-run'],
          ['Weekly Run', 'weekly-run'],
          ['Monthly Run', 'monthly-run']
        ]
      },
      {
        sql: `INSERT OR IGNORE INTO dropdown_reports (name, value, type) VALUES (?, ?, ?)`,
        data: [
          ['Portfolio Summary', 'portfolio-summary', 'financial'],
          ['Risk Analysis', 'risk-analysis', 'risk'],
          ['Performance Review', 'performance-review', 'performance']
        ]
      },
      {
        sql: `INSERT OR IGNORE INTO dropdown_funds (name, value) VALUES (?, ?)`,
        data: [
          ['Equity Growth Fund', 'equity-growth'],
          ['Bond Income Fund', 'bond-income'],
          ['Balanced Fund', 'balanced-fund']
        ]
      },
      {
        sql: `INSERT OR IGNORE INTO dropdown_fund_aliases (name, value) VALUES (?, ?)`,
        data: [
          ['EGF', 'egf'],
          ['BIF', 'bif'],
          ['BAL', 'bal']
        ]
      }
    ];

    insertStatements.forEach(statement => {
      const stmt = this.db.prepare(statement.sql);
      statement.data.forEach(row => {
        stmt.run(row, (err) => {
          if (err) console.error(`Error inserting default data: ${err.message}`);
        });
      });
      stmt.finalize();
    });
  }

  getDB() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    });
  }
}

module.exports = Database;