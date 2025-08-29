import React from 'react';
import { Center, Text } from '@mantine/core';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';
import type { ChartConfig } from '../../../types/reports';

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#ff00ff',
  '#00ffff',
  '#ff0000',
  '#0000ff',
  '#ffff00',
];

interface ChartCommonProps {
  data: Record<string, string | number>[];
  margin: { top: number; right: number; left: number; bottom: number };
}

export const renderBarChart = (chartConfig: ChartConfig, commonProps: ChartCommonProps) => (
  <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
    <BarChart {...commonProps}>
      {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={chartConfig.xAxis} />
      <YAxis />
      {chartConfig.showTooltip && <Tooltip />}
      {chartConfig.showLegend && <Legend />}
      {chartConfig.yAxis.map((yField, yIndex) => (
        <Bar key={yField} dataKey={yField} fill={CHART_COLORS[yIndex % CHART_COLORS.length]} />
      ))}
    </BarChart>
  </ResponsiveContainer>
);

export const renderLineChart = (chartConfig: ChartConfig, commonProps: ChartCommonProps) => (
  <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
    <LineChart {...commonProps}>
      {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={chartConfig.xAxis} />
      <YAxis />
      {chartConfig.showTooltip && <Tooltip />}
      {chartConfig.showLegend && <Legend />}
      {chartConfig.yAxis.map((yField, yIndex) => (
        <Line
          key={yField}
          type="monotone"
          dataKey={yField}
          stroke={CHART_COLORS[yIndex % CHART_COLORS.length]}
          strokeWidth={2}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

export const renderAreaChart = (chartConfig: ChartConfig, commonProps: ChartCommonProps) => (
  <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
    <AreaChart {...commonProps}>
      {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={chartConfig.xAxis} />
      <YAxis />
      {chartConfig.showTooltip && <Tooltip />}
      {chartConfig.showLegend && <Legend />}
      {chartConfig.yAxis.map((yField, yIndex) => (
        <Area
          key={yField}
          type="monotone"
          dataKey={yField}
          stackId="1"
          stroke={CHART_COLORS[yIndex % CHART_COLORS.length]}
          fill={CHART_COLORS[yIndex % CHART_COLORS.length]}
        />
      ))}
    </AreaChart>
  </ResponsiveContainer>
);

export const renderPieChart = (
  chartConfig: ChartConfig,
  processedChartData: Record<string, string | number>[]
) => {
  const pieData = processedChartData.slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey={chartConfig.yAxis[0]}
          nameKey={chartConfig.xAxis}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {pieData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        {chartConfig.showTooltip && <Tooltip />}
        {chartConfig.showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
};

export const renderScatterChart = (chartConfig: ChartConfig, commonProps: ChartCommonProps) => (
  <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
    <ScatterChart {...commonProps}>
      {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={chartConfig.xAxis} />
      <YAxis dataKey={chartConfig.yAxis[0]} />
      {chartConfig.showTooltip && <Tooltip />}
      {chartConfig.showLegend && <Legend />}
      <Scatter data={commonProps.data} fill={CHART_COLORS[0]} />
    </ScatterChart>
  </ResponsiveContainer>
);

export const renderChart = (
  chartConfig: ChartConfig,
  processedChartData: Record<string, string | number>[]
) => {
  const commonProps = {
    data: processedChartData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  switch (chartConfig.type) {
    case 'bar':
      return renderBarChart(chartConfig, commonProps);
    case 'line':
      return renderLineChart(chartConfig, commonProps);
    case 'area':
      return renderAreaChart(chartConfig, commonProps);
    case 'pie':
      return renderPieChart(chartConfig, processedChartData);
    case 'scatter':
      return renderScatterChart(chartConfig, commonProps);
    default:
      return (
        <Center h={200}>
          <Text c="dimmed">Tipo de gráfico no soportado: {chartConfig.type}</Text>
        </Center>
      );
  }
};
