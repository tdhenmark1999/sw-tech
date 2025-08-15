/**
 * Validation utilities
 */

const validateDropdownCategory = (category) => {
  const validCategories = ['sources', 'runs', 'reports', 'funds', 'fundAliases'];
  return validCategories.includes(category);
};

const validateDropdownItems = (items, hasType = false) => {
  if (!Array.isArray(items)) {
    return { isValid: false, error: 'Items must be an array' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      return { isValid: false, error: `Item ${i + 1}: Name is required and must be a non-empty string` };
    }
    
    if (!item.value || typeof item.value !== 'string' || item.value.trim().length === 0) {
      return { isValid: false, error: `Item ${i + 1}: Value is required and must be a non-empty string` };
    }
    
    if (hasType && (!item.type || typeof item.type !== 'string' || item.type.trim().length === 0)) {
      return { isValid: false, error: `Item ${i + 1}: Type is required for reports` };
    }
  }

  return { isValid: true };
};

const validateSystemData = (data) => {
  const required = ['name', 'baseUrl', 'authenticationMethod', 'authenticationPlace', 'key', 'value'];
  
  for (const field of required) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
      return { isValid: false, error: `${field} is required and must be a non-empty string` };
    }
  }

  try {
    let url = data.baseUrl.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes('.')) {
      throw new Error('Invalid hostname');
    }
    
  } catch (e) {
    console.log('URL validation failed for:', data.baseUrl, 'Error:', e.message);
    return { isValid: false, error: 'baseUrl must be a valid URL (e.g., https://api.example.com or api.example.com)' };
  }

  return { isValid: true };
};

const validatePlannerData = (data) => {
  const required = ['name', 'description', 'plannerType'];
  
  for (const field of required) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
      return { isValid: false, error: `${field} is required and must be a non-empty string` };
    }
  }

  const arrayFields = ['funds', 'sources', 'runs', 'reports'];
  for (const field of arrayFields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      return { isValid: false, error: `${field} must be an array` };
    }
  }

  if (data.trigger && typeof data.trigger !== 'object') {
    return { isValid: false, error: 'trigger must be an object' };
  }

  return { isValid: true };
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, 255); 
};

const sanitizeNumber = (num, defaultValue = 0) => {
  const parsed = parseInt(num);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
};

module.exports = {
  validateDropdownCategory,
  validateDropdownItems,
  validateSystemData,
  validatePlannerData,
  sanitizeString,
  sanitizeNumber
};