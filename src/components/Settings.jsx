import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Volume2, 
  Eye, 
  Download,
  Trash2,
  X
} from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  getTheme, 
  saveTheme,
  clearTestResults,
  exportResultsToCSV,
  getTestStatistics
} from '../utils/localStorage';

const Settings = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    timeLimit: 60,
    textMode: 'words',
    soundEnabled: true,
    showLiveWPM: true,
    showLiveAccuracy: true
  });
  
  const [currentTheme, setCurrentTheme] = useState('mauve');
  const [stats, setStats] = useState(null);

  // Initialize settings on mount or when settings panel is opened
  useEffect(() => {
    if (!isOpen) return;
    
    const savedSettings = getSettings();
    const savedTheme = getTheme();
    const testStats = getTestStatistics();
    
    // Set initial settings only if they haven't been set yet
    setSettings(prev => {
      // If we already have settings and they match the saved ones, don't update
      if (JSON.stringify(prev) === JSON.stringify(savedSettings)) {
        return prev;
      }
      
      // Otherwise, initialize with defaults and saved settings
      return {
        timeLimit: 60,
        textMode: 'words',
        soundEnabled: true,
        showLiveWPM: true,
        showLiveAccuracy: true,
        ...savedSettings
      };
    });
    
    setCurrentTheme(savedTheme || 'mauve');
    setStats(testStats);
  }, [isOpen]); // Only depend on isOpen
  
  // Notify parent when settings change
  const prevSettingsRef = useRef();
  useEffect(() => {
    if (onSettingsChange && JSON.stringify(settings) !== JSON.stringify(prevSettingsRef.current)) {
      onSettingsChange(settings);
    }
    prevSettingsRef.current = settings;
  }, [settings, onSettingsChange]);

  // Theme options
  const themes = [
    {
      name: 'mauve',
      label: 'Mauve Dream',
      colors: ['#8B5CF6', '#A855F7', '#C084FC'],
      description: 'Elegant purple tones'
    },
    {
      name: 'ocean',
      label: 'Ocean Breeze',
      colors: ['#0EA5E9', '#06B6D4', '#67E8F9'],
      description: 'Cool blue waves'
    },
    {
      name: 'forest',
      label: 'Forest Green',
      colors: ['#10B981', '#059669', '#34D399'],
      description: 'Natural green vibes'
    },
    {
      name: 'sunset',
      label: 'Sunset Glow',
      colors: ['#F59E0B', '#EF4444', '#F97316'],
      description: 'Warm orange sunset'
    }
  ];

  // Time limit options - consistent with TypingTest component
  const timeLimitOptions = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' }
  ];

  // Text mode options
  const textModes = [
    { value: 'words', label: 'Random Words', description: 'Common English words' },
    { value: 'sentences', label: 'Sentences', description: 'Complete sentences' }
  ];

  // Handle setting change
  const handleSettingChange = useCallback((key, value) => {
    setSettings(prevSettings => {
      // Only update if the value is actually changing
      if (prevSettings[key] === value) return prevSettings;
      
      // Create new settings object with the updated value
      const newSettings = { 
        ...prevSettings,
        [key]: value
      };
      
      // Save to localStorage
      saveSettings(newSettings);
      
      console.log('Setting changed:', key, value);
      return newSettings;
    });
  }, []);

  // Handle theme change
  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    saveTheme(themeName);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', themeName);
  };

  // Export results to CSV
  const handleExportResults = () => {
    const csvData = exportResultsToCSV();
    if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `typeVelocity_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // Clear all results
  const handleClearResults = () => {
    if (window.confirm('Are you sure you want to clear all test results? This action cannot be undone.')) {
      clearTestResults();
      setStats(getTestStatistics());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Settings</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center cursor-pointer hover:bg-accent/50 hover:text-foreground transition-colors duration-200"
              title="Close settings"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close settings</span>
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Test Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Test Configuration
              </h3>
              
              {/* Time Limit */}
              <div className="space-y-2">
                <Label>Default Time Limit</Label>
                <div className="flex flex-wrap gap-2">
                  {timeLimitOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={settings.timeLimit === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSettingChange('timeLimit', option.value)}
                      className={`cursor-pointer transition-all duration-200 ${
                        settings.timeLimit === option.value 
                          ? 'shadow-md' 
                          : 'hover:bg-accent/50 hover:border-primary/50 hover:text-foreground'
                      }`}
                      title={`Set time limit to ${option.label}`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Text Mode */}
              <div className="space-y-2">
                <Label>Default Text Mode</Label>
                <div className="space-y-2">
                  {textModes.map((mode) => (
                    <div
                      key={mode.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        settings.textMode === mode.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSettingChange('textMode', mode.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{mode.label}</div>
                          <div className="text-sm text-muted-foreground">{mode.description}</div>
                        </div>
                        {settings.textMode === mode.value && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Display Options
              </h3>
              
              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleSettingChange('showLiveWPM', !settings.showLiveWPM)}
                >
                  <div>
                    <Label className="cursor-pointer">Show Live WPM</Label>
                    <p className="text-sm text-muted-foreground">Display real-time typing speed</p>
                  </div>
                  <Switch
                    checked={settings.showLiveWPM}
                    onCheckedChange={(checked) => handleSettingChange('showLiveWPM', checked)}
                    className="cursor-pointer"
                  />
                </div>
                
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleSettingChange('showLiveAccuracy', !settings.showLiveAccuracy)}
                >
                  <div>
                    <Label className="cursor-pointer">Show Live Accuracy</Label>
                    <p className="text-sm text-muted-foreground">Display real-time accuracy percentage</p>
                  </div>
                  <Switch
                    checked={settings.showLiveAccuracy}
                    onCheckedChange={(checked) => handleSettingChange('showLiveAccuracy', checked)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Audio Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Audio Options
              </h3>
              
              <div 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              >
                <div>
                  <Label className="cursor-pointer">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Enable typing sound feedback</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme Selection
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <div
                    key={theme.name}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      currentTheme === theme.name
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange(theme.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{theme.label}</span>
                      {currentTheme === theme.name && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 mb-2">
                      {theme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Management</h3>
              
              {stats && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Tests:</span>
                      <span className="ml-2 font-medium">{stats.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average WPM:</span>
                      <span className="ml-2 font-medium">{stats.averageWPM}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Best WPM:</span>
                      <span className="ml-2 font-medium">{stats.bestWPM}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average Accuracy:</span>
                      <span className="ml-2 font-medium">{stats.averageAccuracy}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleExportResults}
                  variant="outline"
                  className="flex-1 justify-center sm:justify-start gap-2 cursor-pointer transition-colors hover:bg-muted/50"
                  disabled={!stats || stats.totalTests === 0}
                  title="Export all test results to CSV"
                >
                  <Download className="h-4 w-4" />
                  Export Results
                </Button>
                
                <Button 
                  onClick={handleClearResults}
                  variant="outline"
                  className="flex-1 justify-center sm:justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                  disabled={!stats || stats.totalTests === 0}
                  title="Permanently delete all test data"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={onClose} 
                className="w-full cursor-pointer transition-colors hover:bg-primary/90"
                title="Save changes and close settings"
              >
                Save & Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

