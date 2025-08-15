/**
 * Helper function for pagination
 * @param {sqlite3.Database} db - Database connection
 * @param {string} query - Base SQL query
 * @param {Array} params - Query parameters
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {Function} callback - Callback function
 */
const getPaginatedResults = (db, query, params = [], page = 1, pageSize = 10, callback) => {
  // Validate inputs
  if (!db || !query || typeof callback !== 'function') {
    return callback(new Error('Invalid parameters for pagination'));
  }

  const offset = Math.max(0, (page - 1) * pageSize);
  const limitQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`;
  
  let countQuery = query;
  countQuery = countQuery.replace(/ORDER BY .*/i, '');
  countQuery = countQuery.replace(/SELECT .*? FROM/i, 'SELECT COUNT(*) as count FROM');
  
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error('Count query error:', err);
      return callback(err, null);
    }
    
    db.all(limitQuery, params, (err, rows) => {
      if (err) {
        console.error('Paginated query error:', err);
        return callback(err, null);
      }
      
      const total = countResult?.count || 0;
      const pageCount = Math.ceil(total / pageSize);
      
      callback(null, {
        data: rows || [],
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

module.exports = { getPaginatedResults };