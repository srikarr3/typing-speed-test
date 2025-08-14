// Web Audio API setup
let audioContext;
let gainNode;

// Initialize audio context on user interaction
const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3; // Default volume
    gainNode.connect(audioContext.destination);
  }
};

// Generate simple beep sound using Web Audio API
const createBeep = (frequency = 440, duration = 0.1, type = 'sine') => {
  if (!audioContext) initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  oscillator.connect(gain);
  gain.connect(gainNode);
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  // Smooth fade in/out to avoid clicks
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
  
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  // Clean up
  oscillator.stop(audioContext.currentTime + duration);
  setTimeout(() => {
    oscillator.disconnect();
    gain.disconnect();
  }, duration * 1000);
};

// Sound effects
export const playSound = (soundName, volume = 0.3) => {
  try {
    // Initialize audio context on first interaction if needed
    if (!audioContext) {
      initAudio();
    }
    
    // Set volume
    if (gainNode) {
      gainNode.gain.value = volume;
    }
    
    // Play different sounds based on type
    switch (soundName) {
      case 'keyPress':
        createBeep(800, 0.05, 'sine');
        break;
      case 'keyError':
        createBeep(300, 0.15, 'sawtooth');
        break;
      case 'testComplete':
        // Play a little melody
        createBeep(784, 0.1, 'sine');
        setTimeout(() => createBeep(1046, 0.2, 'sine'), 100);
        break;
      case 'countdown':
        createBeep(523, 0.1, 'sine');
        break;
      default:
        createBeep(440, 0.1, 'sine');
    }
  } catch (e) {
    console.warn('Sound error:', e);
  }
};

// For backward compatibility
export const preloadSounds = () => {
  // No need to preload with Web Audio API
  initAudio();
};

export const sounds = {
  keyPress: {},
  keyError: {},
  testComplete: {},
  countdown: {}
};
