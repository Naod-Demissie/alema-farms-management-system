"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlockWeightTrend } from "../../server/weight-sampling";
import { toast } from "sonner";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeightTrendChartProps {
  flockId: string;
  flockBatchCode: string;
  days?: number;
}

interface WeightData {
  date: string;
  averageWeight: number;
  sampleSize: number;
  totalWeight: number;
}

export function WeightTrendChart({ flockId, flockBatchCode, days = 30 }: WeightTrendChartProps) {
  const [data, setData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getFlockWeightTrend(flockId, days);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      toast.error("Failed to fetch weight trend data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [flockId, days]);

  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const firstWeight = data[0].averageWeight;
    const lastWeight = data[data.length - 1].averageWeight;
    const percentage = ((lastWeight - firstWeight) / firstWeight) * 100;
    
    if (percentage > 1) return { direction: 'up', percentage: Math.abs(percentage) };
    if (percentage < -1) return { direction: 'down', percentage: Math.abs(percentage) };
    return { direction: 'stable', percentage: Math.abs(percentage) };
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'averageWeight') {
      return [`${value.toFixed(2)} kg`, 'Average Weight'];
    }
    return [value, name];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Trend
          </CardTitle>
          <CardDescription>
            Flock: {flockBatchCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading weight trend...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Trend
          </CardTitle>
          <CardDescription>
            Flock: {flockBatchCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Weight Data</h3>
            <p className="text-muted-foreground">
              Record weight samples to see the growth trend for this flock.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    averageWeight: item.averageWeight,
    sampleSize: item.sampleSize,
    fullDate: item.date
  }));

  const minWeight = Math.min(...data.map(d => d.averageWeight));
  const maxWeight = Math.max(...data.map(d => d.averageWeight));
  const weightRange = maxWeight - minWeight;
  const yAxisMin = Math.max(0, minWeight - weightRange * 0.1);
  const yAxisMax = maxWeight + weightRange * 0.1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Trend
            </CardTitle>
            <CardDescription>
              Flock: {flockBatchCode} • Last {days} days
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trend.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                domain={[yAxisMin, yAxisMax]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.fullDate} • Sample: ${data.sampleSize} birds`;
                  }
                  return label;
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="averageWeight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              {data.length > 1 && (
                <ReferenceLine 
                  y={data[0].averageWeight} 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  label={{ value: "Start", position: "topRight" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {data[data.length - 1]?.averageWeight.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-muted-foreground">Latest Weight (kg)</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {data.length}
            </div>
            <div className="text-sm text-muted-foreground">Samples Recorded</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {data.length > 1 ? (data[data.length - 1].averageWeight - data[0].averageWeight).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-muted-foreground">Total Gain (kg)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

