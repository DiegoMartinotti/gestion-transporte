import React from 'react';
import { Card, Group, Text, Select } from '@mantine/core';
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
} from 'recharts';
import type { ChartConfig } from '../../types/reports';

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

interface ReportChartProps {
  chartConfig: ChartConfig;
  data: Record<string, string | number>[];
}

const ReportChart: React.FC<ReportChartProps> = ({ chartConfig, data }) => {
  const { type, title, xAxis, yAxis, height = 400 } = chartConfig;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data} height={height}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxis.map((key, index) => (
              <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data} height={height}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxis.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} height={height}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxis.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart height={height}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey={yAxis[0]}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <Text>Tipo de gráfico no soportado: {type}</Text>;
    }
  };

  return (
    <Card>
      <Text fw={500} mb="md">
        {title}
      </Text>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  );
};

interface ChartSelectorProps {
  charts: ChartConfig[];
  selectedChart: number;
  onChartChange: (index: number) => void;
}

export const ChartSelector: React.FC<ChartSelectorProps> = ({
  charts,
  selectedChart,
  onChartChange,
}) => (
  <Group justify="space-between" mb="md">
    <Text fw={500}>Visualización</Text>
    <Select
      value={String(selectedChart)}
      onChange={(value) => onChartChange(Number(value))}
      data={charts.map((chart, index) => ({
        value: String(index),
        label: chart.title,
      }))}
      w={250}
    />
  </Group>
);

interface ChartViewProps {
  chartConfigs: ChartConfig[];
  data: Record<string, string | number>[];
  selectedChart: number;
}

export const ChartView: React.FC<ChartViewProps> = ({ chartConfigs, data, selectedChart }) => {
  if (!chartConfigs.length) {
    return (
      <Card>
        <Text c="dimmed" ta="center" py="xl">
          No hay gráficos configurados para este reporte
        </Text>
      </Card>
    );
  }

  return <ReportChart chartConfig={chartConfigs[selectedChart]} data={data} />;
};

export { ReportChart };
