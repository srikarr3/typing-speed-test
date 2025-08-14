import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { formatTime } from '../utils/typingLogic';

const TestResults = ({ result, onNewTest, onViewDashboard }) => {
  if (!result) return null;

  // Calculate performance level
  const getPerformanceLevel = (wpm) => {
    if (wpm >= 70) return { level: 'Expert', color: 'bg-green-500', icon: Trophy };
    if (wpm >= 50) return { level: 'Advanced', color: 'bg-blue-500', icon: TrendingUp };
    if (wpm >= 30) return { level: 'Intermediate', color: 'bg-yellow-500', icon: Target };
    return { level: 'Beginner', color: 'bg-gray-500', icon: Clock };
  };

  const performance = getPerformanceLevel(result.wpm);
  const PerformanceIcon = performance.icon;

  // Calculate accuracy color
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'text-green-500';
    if (accuracy >= 90) return 'text-blue-500';
    if (accuracy >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get insights based on performance
  const getInsights = () => {
    const insights = [];
    
    if (result.accuracy < 90) {
      insights.push({
        type: 'warning',
        message: 'Focus on accuracy over speed. Slow down and make fewer mistakes.',
        icon: AlertTriangle
      });
    }
    
    if (result.wpm < 30) {
      insights.push({
        type: 'tip',
        message: 'Practice regularly to improve your typing speed. Aim for 10-15 minutes daily.',
        icon: TrendingUp
      });
    }
    
    if (result.mistakes > 10) {
      insights.push({
        type: 'warning',
        message: 'Too many mistakes detected. Consider practicing touch typing fundamentals.',
        icon: AlertTriangle
      });
    }
    
    if (result.wpm >= 50 && result.accuracy >= 95) {
      insights.push({
        type: 'success',
        message: 'Excellent performance! You\'re typing at a professional level.',
        icon: Trophy
      });
    }
    
    return insights;
  };

  const insights = getInsights();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Results Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1 ${performance.color}`} />
        
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PerformanceIcon className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-lg px-3 py-1">
              {performance.level}
            </Badge>
          </div>
          <CardTitle className="text-2xl">Test Complete!</CardTitle>
          <p className="text-muted-foreground">
            You typed at <span className="font-semibold text-foreground">{result.wpm} WPM</span> with{' '}
            <span className={`font-semibold ${getAccuracyColor(result.accuracy)}`}>
              {result.accuracy}%
            </span>{' '}
            accuracy
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">{result.wpm}</div>
              <div className="text-sm text-muted-foreground">Words Per Minute</div>
              <Progress value={Math.min((result.wpm / 100) * 100, 100)} className="h-2" />
            </div>
            
            <div className="text-center space-y-2">
              <div className={`text-3xl font-bold ${getAccuracyColor(result.accuracy)}`}>
                {result.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <Progress value={result.accuracy} className="h-2" />
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">{result.mistakes}</div>
              <div className="text-sm text-muted-foreground">Mistakes</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.totalCharacters} chars typed
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                {formatTime(result.timeElapsed)}
              </div>
              <div className="text-sm text-muted-foreground">Time Taken</div>
              <div className="text-xs text-muted-foreground mt-1">
                {result.timeLimit}s limit
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{result.correctCharacters}</div>
              <div className="text-sm text-green-500">Correct Characters</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">
                {result.totalCharacters - result.correctCharacters}
              </div>
              <div className="text-sm text-red-500">Incorrect Characters</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">
                {((result.correctCharacters / result.totalCharacters) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Character Accuracy</div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-lg">Performance Insights</h3>
              {insights.map((insight, index) => {
                const InsightIcon = insight.icon;
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      insight.type === 'warning' 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                        : insight.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <InsightIcon className={`h-5 w-5 mt-0.5 ${
                      insight.type === 'warning' 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : insight.type === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <p className="text-sm">{insight.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Test Details */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Test Mode:</span>
                <span className="ml-2 font-medium capitalize">{result.textMode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(result.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={onNewTest} 
              className="flex-1 sm:flex-none cursor-pointer transition-colors"
              title="Start a new typing test"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={onViewDashboard}
              className="flex-1 sm:flex-none cursor-pointer transition-colors"
              title="View your typing statistics"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Statistics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResults;

