import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { 
  Keyboard, 
  BarChart3, 
  Settings as SettingsIcon, 
  Moon, 
  Sun,
  Github,
  Heart
} from 'lucide-react';
import TypingTest from './components/TypingTest';
import TestResults from './components/TestResults';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getSettings, getTheme } from './utils/localStorage';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('test'); // 'test', 'results', 'dashboard'
  const [testResult, setTestResult] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState('light');
  const [currentTheme, setCurrentTheme] = useState('mauve');
  const [isReloading, setIsReloading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle logo click with animation
  const handleLogoClick = () => {
    setIsReloading(true);
    // Wait for animation to complete before reloading
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Load settings and theme on mount
  useEffect(() => {
    const savedSettings = getSettings();
    const savedTheme = getTheme();
    
    // Ensure we have default settings if none exist
    const defaultSettings = {
      timeLimit: 60,
      textMode: 'words',
      soundEnabled: true,
      showLiveWPM: true,
      showLiveAccuracy: true
    };
    
    // Merge saved settings with defaults
    const mergedSettings = { ...defaultSettings, ...savedSettings };
    
    setSettings(mergedSettings);
    setCurrentTheme(savedTheme || 'mauve');
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', savedTheme || 'mauve');
    
    // Check system theme preference only if no theme is saved
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Handle test completion
  const handleTestComplete = (result) => {
    setTestResult(result);
    setCurrentView('results');
  };

  // Handle new test
  const handleNewTest = () => {
    setTestResult(null);
    setCurrentView('test');
  };

  // Handle view dashboard
  const handleViewDashboard = () => {
    setCurrentView('dashboard');
  };

  // Handle back to test from dashboard
  const handleBackToTest = () => {
    setCurrentView('test');
  };

  // Handle settings change - only update if settings actually changed
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(prevSettings => {
      // Only update if settings actually changed
      const settingsChanged = JSON.stringify(prevSettings) !== JSON.stringify(newSettings);
      if (settingsChanged) {
        console.log('Settings changed:', newSettings);
        // Save to localStorage
        localStorage.setItem('typeVelocitySettings', JSON.stringify(newSettings));
        return newSettings;
      }
      return prevSettings;
    });
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Get theme colors based on current theme
  const getThemeColors = () => {
    const themes = {
      mauve: {
        primary: '#8B5CF6',
        secondary: '#A855F7',
        accent: '#C084FC'
      },
      ocean: {
        primary: '#0EA5E9',
        secondary: '#06B6D4',
        accent: '#67E8F9'
      },
      forest: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#34D399'
      },
      sunset: {
        primary: '#F59E0B',
        secondary: '#EF4444',
        accent: '#F97316'
      }
    };
    return themes[currentTheme] || themes.mauve;
  };

  const themeColors = getThemeColors();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Scroll Indicator */}
      <div className="fixed right-0 top-0 h-full w-1.5 bg-muted z-50">
        <div 
          className="w-full bg-primary transition-all duration-200 ease-out"
          style={{ 
            height: `${scrollProgress}%`,
            background: 'linear-gradient(to bottom, #8B5CF6, #7C3AED)'
          }}
        />
      </div>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <Keyboard 
                  className="h-6 w-6" 
                  style={{ color: themeColors.primary }}
                />
              </div>
              <div className="relative overflow-hidden">
                <div className="relative z-10">
                  <h1 
                    className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer transition-transform hover:scale-105"
                    onClick={handleLogoClick}
                  >
                    TypeVelocity
                  </h1>
                  <p className="text-xs text-muted-foreground">Master Your Typing Speed</p>
                </div>
                <div 
                  className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 transform -translate-x-full transition-transform duration-500 ease-in-out ${
                    isReloading ? 'translate-x-full' : ''
                  }`}
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button 
                variant={currentView === 'test' ? 'default' : 'ghost'} 
                onClick={() => setCurrentView('test')}
                className="flex items-center gap-2 cursor-pointer transition-colors"
                title="Start Typing Test"
              >
                <Keyboard size={16} />
                Test
              </Button>
              
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'} 
                onClick={handleViewDashboard}
                className="flex items-center gap-2 cursor-pointer transition-colors"
                title="View Statistics"
              >
                <BarChart3 size={16} />
                Analytics
              </Button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-full h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-accent/50 hover:text-foreground transition-colors duration-200"
                title="Open settings"
              >
                <SettingsIcon size={18} />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2 mt-4">
            <Button
              variant={currentView === 'test' ? 'default' : 'outline'}
              size="sm"
              onClick={handleNewTest}
              className="flex items-center gap-2 flex-1"
            >
              <Keyboard size={16} />
              Test
            </Button>
            
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={handleViewDashboard}
              className="flex items-center gap-2 flex-1"
            >
              <BarChart3 size={16} />
              Analytics
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'test' && (
          <TypingTest
            onTestComplete={handleTestComplete}
            settings={settings}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {currentView === 'results' && testResult && (
          <TestResults
            result={testResult}
            onNewTest={handleNewTest}
            onViewDashboard={handleViewDashboard}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard onBack={handleBackToTest} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart size={14} className="text-red-500" />
              <span>by TypeVelocity</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
              
              <div className="flex items-center gap-2">
                <a 
                  href="https://github.com/srikarr3" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent/50 transition-colors duration-200"
                  title="View on GitHub"
                >
                  <Github size={16} className="text-muted-foreground hover:text-foreground" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>© 2025 TypeVelocity. All rights reserved. Built with ❤️</p>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;
