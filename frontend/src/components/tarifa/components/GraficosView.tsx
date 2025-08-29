import React from 'react';
import { Stack, Grid, Paper, Text } from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface ChartData {
  nombre: string;
  original: number;
  final: number;
  diferencia: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface GraficosViewProps {
  chartData: ChartData[];
  pieData: PieData[];
}

const GraficosView: React.FC<GraficosViewProps> = ({ chartData, pieData }) => {
  return (
    <Stack gap="md" mt="md">
      <Grid>
        {/* Gráfico de barras comparativo */}
        <Grid.Col span={8}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Comparación de Totales
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="original" fill="#868e96" name="Original" />
                <Bar dataKey="final" fill="#339af0" name="Final" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Gráfico circular de distribución */}
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Distribución de Cambios
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Gráfico de líneas de diferencias */}
        <Grid.Col span={12}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Evolución de Diferencias
            </Text>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="diferencia"
                  stroke="#f03e3e"
                  strokeWidth={2}
                  name="Diferencia"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default GraficosView;