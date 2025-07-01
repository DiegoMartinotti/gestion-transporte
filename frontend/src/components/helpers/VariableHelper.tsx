import React from 'react';
import {
  Card,
  Text,
  Stack,
  Group,
  Badge,
  Divider,
  Code,
  List,
  ThemeIcon,
  Paper,
  Grid
} from '@mantine/core';
import { IconVariable, IconMathFunction, IconInfoCircle } from '@tabler/icons-react';

const VARIABLES_DISPONIBLES = [
  {
    nombre: 'Valor',
    descripcion: 'Valor base del tramo/tarifa configurado',
    tipo: 'Número',
    ejemplo: '1000'
  },
  {
    nombre: 'Palets',
    descripcion: 'Cantidad de palets del viaje',
    tipo: 'Número',
    ejemplo: '15'
  },
  {
    nombre: 'Peaje',
    descripcion: 'Valor del peaje del tramo',
    tipo: 'Número',
    ejemplo: '500'
  }
];

const FUNCIONES_DISPONIBLES = [
  {
    nombre: 'SI(condicion; verdadero; falso)',
    descripcion: 'Función condicional',
    ejemplo: 'SI(Palets > 10; Valor * 0.9; Valor)'
  },
  {
    nombre: 'max(a, b)',
    descripcion: 'Devuelve el valor máximo',
    ejemplo: 'max(Valor * Palets, 5000)'
  },
  {
    nombre: 'min(a, b)',
    descripcion: 'Devuelve el valor mínimo',
    ejemplo: 'min(Valor * Palets, 15000)'
  },
  {
    nombre: 'round(numero)',
    descripcion: 'Redondea al entero más cercano',
    ejemplo: 'round(Valor * 1.15)'
  },
  {
    nombre: 'sqrt(numero)',
    descripcion: 'Raíz cuadrada',
    ejemplo: 'sqrt(Palets) * 100'
  },
  {
    nombre: 'abs(numero)',
    descripcion: 'Valor absoluto',
    ejemplo: 'abs(Valor - 1000)'
  },
  {
    nombre: 'pow(base, exponente)',
    descripcion: 'Potencia',
    ejemplo: 'pow(Palets, 2) * 10'
  }
];

const OPERADORES = [
  { simbolo: '+', descripcion: 'Suma' },
  { simbolo: '-', descripcion: 'Resta' },
  { simbolo: '*', descripcion: 'Multiplicación' },
  { simbolo: '/', descripcion: 'División' },
  { simbolo: '^', descripcion: 'Potencia' },
  { simbolo: '>', descripcion: 'Mayor que' },
  { simbolo: '<', descripcion: 'Menor que' },
  { simbolo: '>=', descripcion: 'Mayor o igual' },
  { simbolo: '<=', descripcion: 'Menor o igual' },
  { simbolo: '==', descripcion: 'Igual' }
];

const EJEMPLOS_COMUNES = [
  {
    nombre: 'Descuento por volumen',
    formula: 'SI(Palets > 20; Valor * Palets * 0.85; Valor * Palets) + Peaje',
    descripcion: '15% descuento para más de 20 palets'
  },
  {
    nombre: 'Recargo por pocos palets',
    formula: 'SI(Palets < 5; Valor * Palets * 1.2; Valor * Palets) + Peaje',
    descripcion: '20% recargo para menos de 5 palets'
  },
  {
    nombre: 'Tarifa mínima',
    formula: 'max(Valor * Palets, 5000) + Peaje',
    descripcion: 'Garantiza un mínimo de $5000'
  },
  {
    nombre: 'Tarifa máxima',
    formula: 'min(Valor * Palets, 15000) + Peaje',
    descripcion: 'Limita a un máximo de $15000'
  },
  {
    nombre: 'Escala progresiva',
    formula: 'SI(Palets <= 10; Valor * Palets; SI(Palets <= 20; Valor * Palets * 0.9; Valor * Palets * 0.8)) + Peaje',
    descripcion: 'Descuentos progresivos por cantidad'
  }
];

export const VariableHelper: React.FC = () => {
  return (
    <Card withBorder p="md" bg="blue.0">
      <Stack gap="md">
        <Group>
          <ThemeIcon color="blue" variant="light">
            <IconInfoCircle size={16} />
          </ThemeIcon>
          <Text fw={500}>Ayuda para Fórmulas Personalizadas</Text>
        </Group>

        <Grid>
          {/* Variables */}
          <Grid.Col span={6}>
            <Paper withBorder p="sm">
              <Group mb="xs">
                <ThemeIcon size="sm" color="green" variant="light">
                  <IconVariable size={14} />
                </ThemeIcon>
                <Text fw={500} size="sm">Variables Disponibles</Text>
              </Group>
              
              <Stack gap="xs">
                {VARIABLES_DISPONIBLES.map((variable, index) => (
                  <div key={index}>
                    <Group justify="apart" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Code fz="xs" c="green">{variable.nombre}</Code>
                          <Badge size="xs" variant="light">{variable.tipo}</Badge>
                        </Group>
                        <Text size="xs" c="dimmed" mt={2}>
                          {variable.descripcion}
                        </Text>
                      </div>
                      <Code fz="xs">{variable.ejemplo}</Code>
                    </Group>
                    {index < VARIABLES_DISPONIBLES.length - 1 && <Divider size="xs" />}
                  </div>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Operadores */}
          <Grid.Col span={6}>
            <Paper withBorder p="sm">
              <Text fw={500} size="sm" mb="xs">Operadores</Text>
              <Grid>
                {OPERADORES.map((op, index) => (
                  <Grid.Col key={index} span={6}>
                    <Group gap="xs">
                      <Code fz="xs">{op.simbolo}</Code>
                      <Text size="xs" c="dimmed">{op.descripcion}</Text>
                    </Group>
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Funciones */}
        <Paper withBorder p="sm">
          <Group mb="xs">
            <ThemeIcon size="sm" color="blue" variant="light">
              <IconMathFunction size={14} />
            </ThemeIcon>
            <Text fw={500} size="sm">Funciones Disponibles</Text>
          </Group>
          
          <Stack gap="xs">
            {FUNCIONES_DISPONIBLES.map((func, index) => (
              <div key={index}>
                <Text size="sm" fw={500} c="blue">
                  {func.nombre}
                </Text>
                <Text size="xs" c="dimmed" mb={2}>
                  {func.descripcion}
                </Text>
                <Code fz="xs" block>
                  {func.ejemplo}
                </Code>
                {index < FUNCIONES_DISPONIBLES.length - 1 && <Divider size="xs" />}
              </div>
            ))}
          </Stack>
        </Paper>

        {/* Ejemplos */}
        <Paper withBorder p="sm">
          <Text fw={500} size="sm" mb="xs">Ejemplos Comunes</Text>
          <Stack gap="sm">
            {EJEMPLOS_COMUNES.map((ejemplo, index) => (
              <div key={index}>
                <Group gap="xs" mb={4}>
                  <Badge size="sm" variant="light">{ejemplo.nombre}</Badge>
                </Group>
                <Code block fz="xs" mb={4}>
                  {ejemplo.formula}
                </Code>
                <Text size="xs" c="dimmed">
                  {ejemplo.descripcion}
                </Text>
                {index < EJEMPLOS_COMUNES.length - 1 && <Divider size="xs" />}
              </div>
            ))}
          </Stack>
        </Paper>

        {/* Notas importantes */}
        <Paper withBorder p="sm" bg="yellow.0">
          <Text fw={500} size="sm" mb="xs" c="orange">Notas Importantes</Text>
          <List size="xs" spacing={2}>
            <List.Item>Las variables son case-sensitive: usa <Code>Valor</Code>, <Code>Palets</Code>, <Code>Peaje</Code></List.Item>
            <List.Item>En la función SI, usa punto y coma (;) como separador</List.Item>
            <List.Item>Los números decimales se escriben con punto (.)</List.Item>
            <List.Item>El resultado siempre debe ser un número positivo</List.Item>
            <List.Item>Las fórmulas se evalúan en tiempo real durante la creación de viajes</List.Item>
          </List>
        </Paper>
      </Stack>
    </Card>
  );
};