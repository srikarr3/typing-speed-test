/**
 * LocalStorage utility for managing typing test results and settings
 */

const STORAGE_KEYS = {
  TEST_RESULTS: 'typeVelocity_testResults',
  SETTINGS: 'typeVelocity_settings',
  THEMES: 'typeVelocity_theme'
};

/**
 * Saves a test result to localStorage
 * @param {Object} result - Test result object
 */
export const saveTestResult = (result) => {
  try {
    const existingResults = getTestResults();
    const newResult = {
      ...result,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    const updatedResults = [...existingResults, newResult];
    
    // Keep only the last 100 results to prevent storage bloat
    if (updatedResults.length > 100) {
      updatedResults.splice(0, updatedResults.length - 100);
    }
    
    localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(updatedResults));
    return newResult;
  } catch (error) {
    console.error('Error saving test result:', error);
    return null;
  }
};

/**
 * Retrieves all test results from localStorage
 * @returns {Array} Array of test results
 */
export const getTestResults = () => {
  try {
    const results = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Error retrieving test results:', error);
    return [];
  }
};

/**
 * Clears all test results from localStorage
 */
export const clearTestResults = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TEST_RESULTS);
    return true;
  } catch (error) {
    console.error('Error clearing test results:', error);
    return false;
  }
};

/**
 * Gets test statistics
 * @returns {Object} Statistics object
 */
export const getTestStatistics = () => {
  const results = getTestResults();
  
  if (results.length === 0) {
    return {
      totalTests: 0,
      averageWPM: 0,
      averageAccuracy: 0,
      bestWPM: 0,
      bestAccuracy: 0,
      totalTimeTyped: 0,
      totalCharactersTyped: 0,
      totalMistakes: 0
    };
  }
  
  const totalWPM = results.reduce((sum, result) => sum + result.wpm, 0);
  const totalAccuracy = results.reduce((sum, result) => sum + result.accuracy, 0);
  const totalTime = results.reduce((sum, result) => sum + result.timeElapsed, 0);
  const totalChars = results.reduce((sum, result) => sum + result.totalCharacters, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.mistakes, 0);
  
  return {
    totalTests: results.length,
    averageWPM: Math.round(totalWPM / results.length),
    averageAccuracy: Math.round(totalAccuracy / results.length),
    bestWPM: Math.max(...results.map(r => r.wpm)),
    bestAccuracy: Math.max(...results.map(r => r.accuracy)),
    totalTimeTyped: Math.round(totalTime),
    totalCharactersTyped: totalChars,
    totalMistakes: totalErrors
  };
};

/**
 * Gets recent test results for charts
 * @param {number} limit - Number of recent results to return
 * @returns {Array} Recent test results
 */
export const getRecentResults = (limit = 10) => {
  const results = getTestResults();
  return results.slice(-limit).reverse(); // Most recent first
};

/**
 * Saves user settings
 * @param {Object} settings - Settings object
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Gets user settings
 * @returns {Object} Settings object
 */
export const getSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      timeLimit: 60,
      textMode: 'words',
      soundEnabled: true,
      showLiveWPM: true,
      showLiveAccuracy: true
    };
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return {
      timeLimit: 60,
      textMode: 'words',
      soundEnabled: true,
      showLiveWPM: true,
      showLiveAccuracy: true
    };
  }
};

/**
 * Saves theme preference
 * @param {string} theme - Theme name
 */
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEMES, theme);
    return true;
  } catch (error) {
    console.error('Error saving theme:', error);
    return false;
  }
};

/**
 * Gets theme preference
 * @returns {string} Theme name
 */
export const getTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEMES) || 'mauve';
  } catch (error) {
    console.error('Error retrieving theme:', error);
    return 'mauve';
  }
};

/**
 * Exports test results to CSV format
 * @returns {string} CSV formatted string
 */
export const exportResultsToCSV = () => {
  const results = getTestResults();
  
  if (results.length === 0) {
    return '';
  }
  
  const headers = [
    'Date',
    'Time',
    'WPM',
    'Accuracy (%)',
    'Mistakes',
    'Characters Typed',
    'Time Elapsed (s)',
    'Text Mode'
  ];
  
  const csvRows = [headers.join(',')];
  
  results.forEach(result => {
    const date = new Date(result.timestamp);
    const row = [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      result.wpm,
      result.accuracy,
      result.mistakes,
      result.totalCharacters,
      result.timeElapsed,
      result.textMode || 'words'
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Gets mistake frequency analysis
 * @returns {Array} Sorted array of top mistakes with counts
 */
export const getMistakeAnalysis = () => {
  const results = getTestResults();
  const mistakeFreq = {};
  
  results.forEach(result => {
    // Handle different possible formats of mistakeDetails
    const mistakeDetails = Array.isArray(result.mistakeDetails) 
      ? result.mistakeDetails 
      : [];
    
    mistakeDetails.forEach(mistake => {
      if (mistake && typeof mistake === 'object') {
        const expected = mistake.expected || '?';
        const typed = mistake.typed || '?';
        const key = `${expected} → ${typed}`;
        mistakeFreq[key] = (mistakeFreq[key] || 0) + 1;
      }
    });
  });
  
  // Convert to array, sort by frequency, and get top 10
  return Object.entries(mistakeFreq)
    .map(([mistake, count]) => ({
      mistake,
      count,
      expected: mistake.split(' → ')[0],
      typed: mistake.split(' → ')[1]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export default {
  saveTestResult,
  getTestResults,
  clearTestResults,
  getTestStatistics,
  getRecentResults,
  saveSettings,
  getSettings,
  saveTheme,
  getTheme,
  exportResultsToCSV,
  getMistakeAnalysis
};

