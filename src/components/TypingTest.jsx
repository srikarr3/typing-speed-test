import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RotateCcw, Play, Pause, Settings, Volume2, VolumeX } from 'lucide-react';
import { playSound, preloadSounds, sounds } from '../utils/sounds';
import { generateTextForTime } from '../utils/textGenerator';
import { 
  calculateRealTimeStats, 
  getCharacterStates, 
  checkEndConditions,
  formatTime,
  calculateNetWPM,
  analyzeTypedText
} from '../utils/typingLogic';
import { saveTestResult } from '../utils/localStorage';
import './TypingTest.css';

const TypingTest = ({ onTestComplete, settings, onOpenSettings }) => {
  // Test configuration
  const [timeLimit, setTimeLimit] = useState(settings?.timeLimit || 60);
  const [textMode, setTextMode] = useState(settings?.textMode || 'words');
  
  // Test state
  const [testText, setTestText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(settings?.soundEnabled ?? true);
  
  // Real-time stats
  const [currentStats, setCurrentStats] = useState({
    wpm: 0,
    accuracy: 100,
    correctCharacters: 0,
    incorrectCharacters: 0,
    totalCharacters: 0,
    mistakes: 0,
    progress: 0
  });
  
  // Character states for highlighting
  const [characterStates, setCharacterStates] = useState([]);
  
  // Refs
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Time limit options with consistent format
  const timeLimitOptions = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' }
  ];
  
  const textModes = [
    { value: 'words', label: 'Words' },
    { value: 'sentences', label: 'Sentences' }
  ];
  
  // Update local state when settings change
  useEffect(() => {
    if (settings) {
      setTimeLimit(settings.timeLimit || 60);
      setTextMode(settings.textMode || 'words');
    }
  }, [settings]);

  // Generate new test text
  const generateNewText = useCallback(() => {
    const newText = generateTextForTime(timeLimit, textMode);
    setTestText(newText);
    setCharacterStates(getCharacterStates(newText, '', 0));
  }, [timeLimit, textMode]);

  // Play sound if enabled
  const playEffect = useCallback((soundName, volume = 0.3) => {
    if (isSoundEnabled) {
      playSound(soundName, volume);
    }
  }, [isSoundEnabled]);

  // Initialize test and preload sounds
  useEffect(() => {
    generateNewText();
    preloadSounds();
    
    // Cleanup
    return () => {
      // Stop any playing sounds
      Object.values(sounds).forEach(sound => {
        if (sound.audio) {
          sound.audio.pause();
          sound.audio.currentTime = 0;
        }
      });
    };
  }, [generateNewText]);

  // Handle test completion
  const handleTestComplete = useCallback(() => {
    if (isComplete) return; // Prevent multiple completions
    
    const finalTimeElapsed = timeElapsed || timeLimit;
    const finalStats = calculateRealTimeStats(testText, typedText, finalTimeElapsed);
    
    // Play completion sound
    if (isSoundEnabled) {
      playSound('testComplete', 0.4);
    }
    
    // Calculate additional metrics
    const netWPM = calculateNetWPM(
      finalStats.wpm,
      finalStats.mistakes,
      finalTimeElapsed
    );
    
    // Get character analysis
    const analysis = analyzeTypedText(testText, typedText);
    
    // Create result object with all metrics
    const result = {
      wpm: finalStats.wpm,
      netWPM: netWPM,
      accuracy: finalStats.accuracy,
      mistakes: analysis.mistakes.length,
      totalCharacters: finalStats.totalCharacters,
      correctCharacters: finalStats.correctCharacters,
      incorrectCharacters: finalStats.incorrectCharacters,
      timeElapsed: finalTimeElapsed,
      timeLimit: timeLimit,
      textMode: textMode,
      testText: testText.substring(0, 100) + (testText.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString(),
      characterStates: getCharacterStates(testText, typedText, typedText.length),
      mistakeDetails: analysis.mistakes || [] // Ensure this is always an array
    };
    
    // Save and update state
    const savedResult = saveTestResult(result);
    setCurrentStats(finalStats);
    setIsActive(false);
    setIsComplete(true);
    clearInterval(intervalRef.current);
    
    // Notify parent component
    if (onTestComplete) {
      onTestComplete(savedResult);
    }
  }, [testText, typedText, timeElapsed, timeLimit, textMode, onTestComplete, isComplete, isSoundEnabled]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && !isComplete) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setTimeElapsed(elapsed);
        
        // Check if time is up
        if (elapsed >= timeLimit) {
          handleTestComplete();
        }
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused, isComplete, timeLimit, handleTestComplete]);

  // Update real-time stats
  useEffect(() => {
    if (isActive && testText) {
      const stats = calculateRealTimeStats(testText, typedText, timeElapsed);
      setCurrentStats(stats);
      
      // Update character states
      const states = getCharacterStates(testText, typedText, typedText.length);
      setCharacterStates(states);
      
      // Check end conditions
      const endCheck = checkEndConditions(testText, typedText, timeLimit, timeElapsed);
      if (endCheck.shouldEnd && !isComplete) {
        handleTestComplete();
      }
    }
  }, [typedText, timeElapsed, testText, isActive, timeLimit, isComplete, handleTestComplete]);

  // Toggle sound
  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    
    // Play a sound when toggling
    if (newState) {
      playSound('keyPress', 0.2);
    }
    
    // Update settings if needed
    if (settings && typeof settings.onChange === 'function') {
      settings.onChange({ ...settings, soundEnabled: newState });
    }
  };

  // Handle test start
  const startTest = () => {
    if (isActive) return;
    
    playEffect('countdown', 0.5);
    
    // Small delay for countdown sound
    setTimeout(() => {
      setIsActive(true);
      setTimeElapsed(0);
      setTypedText('');
      setIsComplete(false);
      startTimeRef.current = Date.now();
      
      // Start the timer
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 0.1;
          // Check if time's up
          if (newTime >= timeLimit) {
            clearInterval(intervalRef.current);
            handleTestComplete();
            return timeLimit;
          }
          return newTime;
        });
      }, 100);
    }, 800); // Wait for countdown sound to play
  };

  // Pause/Resume test
  const togglePause = () => {
    if (isActive) {
      setIsPaused(!isPaused);
      if (isPaused) {
        // Resuming - adjust start time
        startTimeRef.current = Date.now() - (timeElapsed * 1000);
        inputRef.current?.focus();
      }
    }
  };

  // Restart test
  const restartTest = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setIsComplete(false);
    setTimeElapsed(0);
    setTypedText('');
    setCurrentStats({
      wpm: 0,
      accuracy: 100,
      correctCharacters: 0,
      incorrectCharacters: 0,
      totalCharacters: 0,
      mistakes: 0,
      progress: 0
    });
    generateNewText();
    inputRef.current?.focus();
  }, [generateNewText]);

  // Handle text input
  const handleInputChange = (e) => {
    if (!isActive || isPaused || isComplete) return;
    
    const value = e.target.value;
    
    // Check if this is a new character (not deletion)
    if (value.length > typedText.length) {
      const newChar = value[value.length - 1];
      const expectedChar = testText[value.length - 1];
      
      // Play appropriate sound
      if (newChar === expectedChar) {
        if (isSoundEnabled) {
          playSound('keyPress', 0.2);
        }
      } else {
        if (isSoundEnabled) {
          playSound('keyError', 0.3);
        }
      }
    }
    
    // Prevent typing beyond the test text length
    if (value.length <= testText.length) {
      setTypedText(value);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (!isActive && !isComplete && e.key === ' ') {
      e.preventDefault();
      startTest();
    }
  };

  // Focus input when clicking on text area
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Render character with appropriate styling
  const renderCharacter = (char, index, state) => {
    let className = 'character inline-block transition-colors duration-100 ';
    
    switch (state) {
      case 'correct':
        className += 'text-green-600 dark:text-green-400 font-medium relative after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-green-500/20';
        break;
      case 'incorrect':
        className += 'text-red-500 bg-red-100/50 dark:bg-red-900/20 rounded-sm';
        break;
      case 'current':
        className += 'relative after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-blue-500 after:animate-pulse';
        break;
      case 'pending':
        className += 'text-muted-foreground';
        break;
      default:
        className += 'text-muted-foreground';
    }
    
    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  };

  const remainingTime = Math.max(0, timeLimit - timeElapsed);
  const progressPercentage = (timeElapsed / timeLimit) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time:</span>
              {timeLimitOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeLimit === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => !isActive && setTimeLimit(option.value)}
                  disabled={isActive}
                  className={!isActive ? 'cursor-pointer' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode:</span>
              {textModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant={textMode === mode.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => !isActive && setTextMode(mode.value)}
                  disabled={isActive}
                  className={!isActive ? 'cursor-pointer' : ''}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings size={16} />
              Settings
            </Button>
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div 
              className="text-center p-3 rounded-lg transition-colors duration-200 hover:bg-accent/20 cursor-pointer"
              title="Words Per Minute"
            >
              <div className="text-2xl font-bold text-primary">{currentStats.wpm}</div>
              <div className="text-sm text-muted-foreground">WPM</div>
            </div>
            <div 
              className="text-center p-3 rounded-lg transition-colors duration-200 hover:bg-accent/20 cursor-pointer"
              title="Typing Accuracy"
            >
              <div className="text-2xl font-bold text-primary">{currentStats.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div 
              className="text-center p-3 rounded-lg transition-colors duration-200 hover:bg-accent/20 cursor-pointer"
              title="Total Mistakes"
            >
              <div className="text-2xl font-bold text-primary">{currentStats.mistakes}</div>
              <div className="text-sm text-muted-foreground">Mistakes</div>
            </div>
            <div 
              className="text-center p-3 rounded-lg transition-colors duration-200 hover:bg-accent/20 cursor-pointer"
              title="Time Remaining"
            >
              <div className="text-2xl font-bold text-primary">{formatTime(remainingTime)}</div>
              <div className="text-sm text-muted-foreground">Time Left</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Text Display */}
          <div 
            className="relative p-6 bg-background rounded-lg border border-border shadow-sm min-h-[200px] cursor-text font-mono text-lg leading-relaxed"
            onClick={focusInput}
          >
            <div className="whitespace-pre-wrap break-words tracking-wide text-foreground/90">
              {testText.split('').map((char, index) => 
                renderCharacter(char, index, characterStates[index] || 'pending')
              )}
            </div>
            
            {/* Hidden input */}
            <input
              ref={inputRef}
              type="text"
              value={typedText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="absolute opacity-0 pointer-events-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex-1 flex justify-start">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSound}
                className="text-muted-foreground hover:text-foreground"
                title={isSoundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              >
                {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              {!isActive && !isComplete && (
                <Button onClick={startTest} className="flex items-center gap-2 cursor-pointer">
                  <Play size={16} />
                  Start Test
                </Button>
              )}
              
              {isActive && !isComplete && (
                <Button onClick={togglePause} variant="outline" className="flex items-center gap-2 cursor-pointer">
                  <Pause size={16} />
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
              
              <Button onClick={restartTest} variant="outline" className="flex items-center gap-2 cursor-pointer">
                <RotateCcw size={16} />
                {isComplete ? 'New Test' : 'Restart'}
              </Button>
            </div>
            
            <div className="flex-1"></div> {/* Spacer for alignment */}
          </div>

          {/* Instructions */}
          {!isActive && !isComplete && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Click "Start Test" or press Space to begin typing
            </div>
          )}
          
          {isPaused && (
            <div className="text-center mt-4">
              <Badge variant="secondary">Test Paused</Badge>
            </div>
          )}
          
          {isComplete && (
            <div className="text-center mt-4">
              <Badge variant="default">Test Complete!</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TypingTest;

