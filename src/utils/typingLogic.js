/**
 * Typing test logic utilities
 */

/**
 * Calculates Words Per Minute (WPM)
 * @param {number} charactersTyped - Total characters typed (including spaces)
 * @param {number} timeElapsed - Time elapsed in seconds
 * @returns {number} WPM rounded to nearest integer
 */
export const calculateWPM = (charactersTyped, timeElapsed) => {
  if (timeElapsed === 0) return 0;
  
  // Standard WPM calculation: (characters typed / 5) / (time in minutes)
  // Divide by 5 because average word length is considered 5 characters
  const minutes = timeElapsed / 60;
  const words = charactersTyped / 5;
  return Math.round(words / minutes);
};

/**
 * Calculates typing accuracy percentage
 * @param {number} correctCharacters - Number of correctly typed characters
 * @param {number} totalCharacters - Total characters attempted
 * @returns {number} Accuracy percentage rounded to 1 decimal place
 */
export const calculateAccuracy = (correctCharacters, totalCharacters) => {
  if (totalCharacters === 0) return 100;
  return Math.round((correctCharacters / totalCharacters) * 1000) / 10;
};

/**
 * Calculates net WPM (accounting for errors)
 * @param {number} grossWPM - Gross WPM (without error penalty)
 * @param {number} mistakes - Number of mistakes made
 * @param {number} timeElapsed - Time elapsed in seconds
 * @returns {number} Net WPM
 */
export const calculateNetWPM = (grossWPM, mistakes, timeElapsed) => {
  const minutes = timeElapsed / 60;
  const errorPenalty = mistakes / minutes;
  return Math.max(0, Math.round(grossWPM - errorPenalty));
};

/**
 * Analyzes typed text against original text
 * @param {string} originalText - The text that should be typed
 * @param {string} typedText - The text that was actually typed
 * @returns {Object} Analysis results
 */
export const analyzeTypedText = (originalText, typedText) => {
  const analysis = {
    correctCharacters: 0,
    incorrectCharacters: 0,
    totalCharacters: typedText.length,
    mistakes: [],
    characterStates: [] // 'correct', 'incorrect', 'missed', 'extra'
  };
  
  const maxLength = Math.max(originalText.length, typedText.length);
  
  for (let i = 0; i < maxLength; i++) {
    const originalChar = originalText[i] || '';
    const typedChar = typedText[i] || '';
    
    if (i < typedText.length && i < originalText.length) {
      if (originalChar === typedChar) {
        analysis.correctCharacters++;
        analysis.characterStates.push('correct');
      } else {
        analysis.incorrectCharacters++;
        analysis.characterStates.push('incorrect');
        analysis.mistakes.push({
          position: i,
          expected: originalChar,
          typed: typedChar,
          type: 'substitution'
        });
      }
    } else if (i >= typedText.length) {
      // Characters not yet typed
      analysis.characterStates.push('missed');
    } else {
      // Extra characters typed
      analysis.incorrectCharacters++;
      analysis.characterStates.push('extra');
      analysis.mistakes.push({
        position: i,
        expected: '',
        typed: typedChar,
        type: 'insertion'
      });
    }
  }
  
  return analysis;
};

/**
 * Gets the current character state for highlighting
 * @param {string} originalText - Original text
 * @param {string} typedText - Currently typed text
 * @param {number} currentPosition - Current cursor position
 * @returns {Array} Array of character states for rendering
 */
export const getCharacterStates = (originalText, typedText, currentPosition) => {
  const states = [];
  
  for (let i = 0; i < originalText.length; i++) {
    if (i < typedText.length) {
      // Character has been typed
      if (originalText[i] === typedText[i]) {
        states.push('correct');
      } else {
        states.push('incorrect');
      }
    } else if (i === currentPosition) {
      // Current character to type
      states.push('current');
    } else {
      // Not yet typed
      states.push('pending');
    }
  }
  
  return states;
};

/**
 * Calculates real-time statistics during typing
 * @param {string} originalText - Original text
 * @param {string} typedText - Currently typed text
 * @param {number} timeElapsed - Time elapsed in seconds
 * @returns {Object} Real-time statistics
 */
export const calculateRealTimeStats = (originalText, typedText, timeElapsed) => {
  const analysis = analyzeTypedText(originalText, typedText);
  const wpm = calculateWPM(analysis.correctCharacters, timeElapsed);
  const accuracy = calculateAccuracy(analysis.correctCharacters, analysis.totalCharacters);
  
  return {
    wpm,
    accuracy,
    correctCharacters: analysis.correctCharacters,
    incorrectCharacters: analysis.incorrectCharacters,
    totalCharacters: analysis.totalCharacters,
    mistakes: analysis.mistakes.length,
    progress: Math.min(100, (typedText.length / originalText.length) * 100)
  };
};

/**
 * Determines if the test should end
 * @param {string} originalText - Original text
 * @param {string} typedText - Currently typed text
 * @param {number} timeLimit - Time limit in seconds
 * @param {number} timeElapsed - Time elapsed in seconds
 * @returns {Object} End condition information
 */
export const checkEndConditions = (originalText, typedText, timeLimit, timeElapsed) => {
  const timeUp = timeElapsed >= timeLimit;
  const textCompleted = typedText.length >= originalText.length && 
                       typedText.trim() === originalText.substring(0, typedText.length).trim();
  
  return {
    shouldEnd: timeUp || textCompleted,
    reason: timeUp ? 'time' : textCompleted ? 'completed' : null,
    timeUp,
    textCompleted
  };
};

/**
 * Formats time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculates typing speed trend
 * @param {Array} wpmHistory - Array of WPM values over time
 * @returns {string} Trend direction ('up', 'down', 'stable')
 */
export const calculateTrend = (wpmHistory) => {
  if (wpmHistory.length < 2) return 'stable';
  
  const recent = wpmHistory.slice(-3); // Last 3 measurements
  const average = recent.reduce((sum, wpm) => sum + wpm, 0) / recent.length;
  const previousAverage = wpmHistory.slice(-6, -3).reduce((sum, wpm) => sum + wpm, 0) / 3;
  
  if (average > previousAverage + 2) return 'up';
  if (average < previousAverage - 2) return 'down';
  return 'stable';
};

export default {
  calculateWPM,
  calculateAccuracy,
  calculateNetWPM,
  analyzeTypedText,
  getCharacterStates,
  calculateRealTimeStats,
  checkEndConditions,
  formatTime,
  calculateTrend
};

