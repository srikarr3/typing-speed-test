import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  Trophy,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowLeft,
  Play
} from 'lucide-react';
import {
  getTestStatistics,
  getRecentResults,
  getMistakeAnalysis
} from '../utils/localStorage';
import { formatTime } from '../utils/typingLogic';

const Dashboard = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [mistakeAnalysis, setMistakeAnalysis] = useState([]);
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      const testStats = getTestStatistics();
      const recent = getRecentResults(20); // Get last 20 results
      
      // Get and validate mistake analysis
      let mistakes = [];
      try {
        const analysis = getMistakeAnalysis();
        mistakes = Array.isArray(analysis) ? analysis : [];
      } catch (error) {
        console.error('Error loading mistake analysis:', error);
        mistakes = [];
      }

      setStats(testStats);
      setRecentResults(recent);
      setMistakeAnalysis(mistakes);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values in case of error
      setStats({
        totalTests: 0,
        averageWPM: 0,
        averageAccuracy: 0,
        bestWPM: 0,
        bestAccuracy: 0,
        totalTimeTyped: 0,
        totalCharactersTyped: 0,
        totalMistakes: 0
      });
      setRecentResults([]);
      setMistakeAnalysis([]);
    }
  };

  // Generate sample data if no results exist
  const getSampleData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      wpm: Math.floor(Math.random() * 40) + 30,
      accuracy: Math.floor(Math.random() * 20) + 80,
      mistakes: Math.floor(Math.random() * 10) + 2,
      timeElapsed: 60,
      timestamp: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toISOString(),
      date: `Test ${i + 1}`
    }));
  };

  // Prepare chart data with trend information
  const chartData = useMemo(() => {
    const results = recentResults.length > 0 
      ? recentResults.map((result, index) => ({
          name: `Test ${recentResults.length - index}`,
          wpm: result.wpm,
          accuracy: result.accuracy,
          mistakes: result.mistakes || 0,
          date: new Date(result.timestamp).toLocaleDateString()
        })).reverse()
      : getSampleData();

    // Add trend information
    return results.map((item, index) => ({
      ...item,
      trend: index > 0 ? results[index].wpm - results[index - 1].wpm : 0
    }));
  }, [recentResults]);

  // WPM trend data for charts
  const wpmTrendData = useMemo(() => 
    chartData.map(item => ({
      name: item.name,
      wpm: item.wpm,
      accuracy: item.accuracy,
      trend: item.trend
    })),
    [chartData]
  );
  
  // Use wpmTrendData in the component to prevent unused variable warning

  // Accuracy distribution data
  const accuracyDistribution = [
    {
      name: 'Excellent (95-100%)',
      value: chartData.filter(d => d.accuracy >= 95).length,
      color: '#10B981'
    },
    {
      name: 'Good (90-94%)',
      value: chartData.filter(d => d.accuracy >= 90 && d.accuracy < 95).length,
      color: '#3B82F6'
    },
    {
      name: 'Fair (80-89%)',
      value: chartData.filter(d => d.accuracy >= 80 && d.accuracy < 90).length,
      color: '#F59E0B'
    },
    {
      name: 'Poor (<80%)',
      value: chartData.filter(d => d.accuracy < 80).length,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0);

  // Speed distribution data
  const speedDistribution = [
    {
      name: 'Expert (70+ WPM)',
      value: chartData.filter(d => d.wpm >= 70).length,
      color: '#10B981'
    },
    {
      name: 'Advanced (50-69 WPM)',
      value: chartData.filter(d => d.wpm >= 50 && d.wpm < 70).length,
      color: '#3B82F6'
    },
    {
      name: 'Intermediate (30-49 WPM)',
      value: chartData.filter(d => d.wpm >= 30 && d.wpm < 50).length,
      color: '#F59E0B'
    },
    {
      name: 'Beginner (<30 WPM)',
      value: chartData.filter(d => d.wpm < 30).length,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0);

  // Get top 10 most common mistakes with proper formatting
  const mistakeFrequencyData = useMemo(() => {
    if (!mistakeAnalysis || !Array.isArray(mistakeAnalysis) || mistakeAnalysis.length === 0) {
      console.log('No mistake analysis data available');
      return [];
    }
    
    // Process and format the mistake data
    const processedMistakes = mistakeAnalysis
      .filter(mistake => mistake && typeof mistake === 'object')
      .map(mistake => ({
        ...mistake,
        // Format the mistake display
        formattedMistake: `${mistake.expected || '?'} → ${mistake.typed || '?'}`,
        // Ensure count is a number
        count: typeof mistake.count === 'number' ? mistake.count : 1
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
      
    console.log('Processed mistakes:', processedMistakes);
    return processedMistakes;
  }, [mistakeAnalysis]);

  // Calculate trend data for metrics
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { change: 'N/A', type: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    const rounded = Math.round(change * 10) / 10;
    return {
      change: `${change >= 0 ? '+' : ''}${rounded}%`,
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    };
  };

  // Get previous period stats for comparison
  const previousPeriodStats = useMemo(() => {
    if (recentResults.length <= 1) return null;
    
    const half = Math.floor(recentResults.length / 2);
    const previousResults = recentResults.slice(0, half);
    const totalWPM = previousResults.reduce((sum, r) => sum + r.wpm, 0);
    const totalAccuracy = previousResults.reduce((sum, r) => sum + r.accuracy, 0);
    
    return {
      avgWPM: Math.round(totalWPM / previousResults.length),
      bestWPM: Math.max(...previousResults.map(r => r.wpm)),
      avgAccuracy: Math.round(totalAccuracy / previousResults.length)
    };
  }, [recentResults]);

  // Performance summary cards with real trend data
  const summaryCards = [
    {
      title: 'Total Tests',
      value: stats?.totalTests || 0,
      icon: BarChart3,
      color: 'text-blue-500',
      change: 'N/A',
      changeType: 'neutral'
    },
    {
      title: 'Average WPM',
      value: stats?.averageWPM || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      ...(previousPeriodStats ? calculateTrend(stats?.averageWPM || 0, previousPeriodStats.avgWPM) : {
        change: 'N/A',
        changeType: 'neutral'
      })
    },
    {
      title: 'Best WPM',
      value: stats?.bestWPM || 0,
      icon: Trophy,
      color: 'text-yellow-500',
      ...(previousPeriodStats ? calculateTrend(stats?.bestWPM || 0, previousPeriodStats.bestWPM) : {
        change: 'N/A',
        changeType: 'neutral'
      })
    },
    {
      title: 'Average Accuracy',
      value: `${stats?.averageAccuracy || 0}%`,
      icon: Target,
      color: 'text-purple-500',
      ...(previousPeriodStats ? calculateTrend(stats?.averageAccuracy || 0, previousPeriodStats.avgAccuracy) : {
        change: 'N/A',
        changeType: 'neutral'
      })
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
              {entry.dataKey === 'accuracy' && '%'}
              {entry.dataKey === 'wpm' && ' WPM'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!stats || recentResults.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} />
            Back to Test
          </Button>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        
        <Card className="text-center p-12">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted mb-4">
            <BarChart3 size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Test Results Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto px-4 break-words">
            Complete your first typing test to see detailed statistics and track your progress over time.
          </p>
          <Button onClick={onBack} className="gap-2 cursor-pointer">
            <Play size={16} />
            Start Your First Typing Test
          </Button>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Don't worry, it's easy and fun! Our typing tests are designed to help you improve your typing skills and track your progress.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} />
            Back to Test
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your typing performance over time</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity size={12} />
            {recentResults.length > 0 ? 'Live Data' : 'Sample Data'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index}
              className="transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className={`text-xs ${
                      card.changeType === 'positive' ? 'text-green-500' : 
                      card.changeType === 'negative' ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {card.change}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/20 p-1 rounded-lg">
          <TabsTrigger 
            value="progress" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-muted/50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger 
            value="accuracy" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-muted/50"
          >
            <Target className="h-4 w-4 mr-2" />
            Accuracy
          </TabsTrigger>
          <TabsTrigger 
            value="mistakes" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-muted/50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Mistakes
          </TabsTrigger>
          <TabsTrigger 
            value="distribution" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-muted/50"
          >
            <PieChartIcon className="h-4 w-4 mr-2" />
            Distribution
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                WPM Progress Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={wpmTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="wpm"
                    name="WPM"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="trend"
                    name="Trend"
                    stroke="#82ca9d"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WPM vs Accuracy Correlation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="wpm"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="WPM"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accuracy Tab */}
        <TabsContent value="accuracy" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Accuracy Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accuracyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {accuracyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Accuracy Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      name="Accuracy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mistakes Tab */}
        <TabsContent value="mistakes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Most Common Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mistakeFrequencyData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mistake Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={mistakeFrequencyData}
                        layout="vertical"
                        margin={{ left: 80, right: 20, top: 20 }}
                        barCategoryGap={8}
                      >
                        <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => Math.round(value)}
                        />
                        <YAxis 
                          dataKey="formattedMistake" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} occurrence${value !== 1 ? 's' : ''}`, 'Count']}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#EF4444"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Mistake Analysis List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Mistakes</h3>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {mistakeFrequencyData.map((mistake, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <div>
                              <div className="font-mono text-sm bg-background px-2 py-1 rounded border inline-block">
                                {mistake.formattedMistake}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Expected: '{mistake.expected}', Typed: '{mistake.typed}'
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{mistake.count}</div>
                            <div className="text-xs text-muted-foreground">
                              {mistake.count === 1 ? 'occurrence' : 'occurrences'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No mistakes found in your recent tests. Keep up the good work!</p>
                  <p className="text-sm mt-2">Complete more tests to see your mistake analysis here.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Mistakes Per Test Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Mistakes Per Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="mistakes" 
                    fill="#F59E0B"
                    name="Mistakes"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Speed Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={speedDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        labelLineStyle={{
                          stroke: '#999',
                          strokeWidth: 1,
                          strokeDasharray: '3 3'
                        }}
                        label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = 25 + innerRadius + (outerRadius - innerRadius);
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#666"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="text-xs"
                            >
                              {`${name}: ${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        className="cursor-pointer"
                        onClick={(data) => console.log('Selected distribution:', data)}
                      >
                        {speedDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, _, props) => [
                          `${(props.payload.percent * 100).toFixed(1)}%`,
                          props.payload.name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">
                      {stats?.bestWPM || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Best WPM</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">
                      {stats?.bestAccuracy || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Best Accuracy</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Time Typed:</span>
                    <span className="font-medium">{formatTime(stats?.totalTimeTyped || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Characters:</span>
                    <span className="font-medium">{stats?.totalCharactersTyped || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Mistakes:</span>
                    <span className="font-medium">{stats?.totalMistakes || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

