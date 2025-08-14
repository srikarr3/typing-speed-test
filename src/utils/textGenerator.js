import { commonWords, sentences } from './wordList.js';

/**
 * Generates random text based on the specified mode
 * @param {string} mode - 'words', 'sentences', or 'mixed'
 * @param {number} length - Target length (words for word mode, characters for others)
 * @returns {string} Generated text
 */
export const generateText = (mode = 'words', length = 50) => {
  switch (mode) {
    case 'words':
      return generateRandomWords(length);
    case 'sentences':
      return generateRandomSentences(length);
    case 'mixed':
      return generateMixedText(length);
    default:
      return generateRandomWords(length);
  }
};

/**
 * Generates random words from the common words list
 * @param {number} wordCount - Number of words to generate
 * @returns {string} Space-separated words
 */
const generateRandomWords = (wordCount) => {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * commonWords.length);
    words.push(commonWords[randomIndex]);
  }
  return words.join(' ');
};

/**
 * Generates text using predefined sentences
 * @param {number} targetLength - Target character length
 * @returns {string} Concatenated sentences
 */
const generateRandomSentences = (targetLength) => {
  let text = '';
  const usedSentences = new Set();
  
  while (text.length < targetLength && usedSentences.size < sentences.length) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * sentences.length);
    } while (usedSentences.has(randomIndex));
    
    usedSentences.add(randomIndex);
    const sentence = sentences[randomIndex];
    
    if (text.length + sentence.length + 1 <= targetLength + 50) { // Allow some buffer
      text += (text ? ' ' : '') + sentence;
    } else {
      break;
    }
  }
  
  return text || sentences[0]; // Fallback to first sentence if nothing generated
};

/**
 * Generates mixed text combining words and sentences
 * @param {number} targetLength - Target character length
 * @returns {string} Mixed text
 */
const generateMixedText = (targetLength) => {
  let text = '';
  let useWords = Math.random() > 0.5;
  
  while (text.length < targetLength) {
    if (useWords) {
      const wordCount = Math.floor(Math.random() * 10) + 5; // 5-14 words
      const words = generateRandomWords(wordCount);
      text += (text ? ' ' : '') + words;
    } else {
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      text += (text ? ' ' : '') + randomSentence;
    }
    
    useWords = !useWords; // Alternate between words and sentences
    
    // Prevent infinite loop
    if (text.length > targetLength + 100) break;
  }
  
  return text.substring(0, targetLength + text.substring(targetLength).indexOf(' '));
};

/**
 * Gets a random quote from the sentences array
 * @returns {string} Random quote
 */
export const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
};

/**
 * Generates text based on time limit (estimates words needed)
 * @param {number} timeLimit - Time limit in seconds
 * @param {string} mode - Text generation mode
 * @returns {string} Generated text
 */
export const generateTextForTime = (timeLimit, mode = 'words') => {
  // Estimate words needed based on average typing speed (40 WPM)
  // Add buffer for slower typists
  const estimatedWPM = 40;
  const bufferMultiplier = 1.5;
  const estimatedWords = Math.ceil((timeLimit / 60) * estimatedWPM * bufferMultiplier);
  
  if (mode === 'words') {
    return generateText('words', estimatedWords);
  } else if (mode === 'sentences') {
    const estimatedChars = estimatedWords * 5; // Average word length
    return generateText('sentences', estimatedChars);
  } else {
    const estimatedChars = estimatedWords * 5;
    return generateText('mixed', estimatedChars);
  }
};

export default {
  generateText,
  getRandomQuote,
  generateTextForTime
};

