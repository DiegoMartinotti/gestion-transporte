import {
  IconWeight,
  IconBox,
  IconRoad,
  IconClock,
  IconCurrency,
  IconMath,
} from '@tabler/icons-react';

export type TipoCalculo = 'peso' | 'volumen' | 'distancia' | 'tiempo' | 'fija' | 'formula';

export interface CalculoConfig {
  tipo: TipoCalculo;
  parametros?: {
    // Para cálculos simples
    factorMultiplicador?: number;
    valorMinimo?: number;
    valorMaximo?: number;

    // Para fórmula personalizada
    formula?: string;
    variables?: string[];

    // Para tarifa fija
    montoFijo?: number;

    // Configuraciones adicionales
    redondeo?: 'ninguno' | 'centavos' | 'pesos';
    aplicarIVA?: boolean;
    porcentajeIVA?: number;
  };
}

export const TIPOS_CALCULO = [
  {
    value: 'peso',
    label: 'Por Peso (Toneladas)',
    icon: IconWeight,
    description: 'Tarifa basada en el peso de la carga',
    formula: 'peso × tarifa_por_tonelada',
    color: 'blue',
  },
  {
    value: 'volumen',
    label: 'Por Volumen (m³)',
    icon: IconBox,
    description: 'Tarifa basada en el volumen de la carga',
    formula: 'volumen × tarifa_por_m3',
    color: 'green',
  },
  {
    value: 'distancia',
    label: 'Por Distancia (Km)',
    icon: IconRoad,
    description: 'Tarifa basada en la distancia del viaje',
    formula: 'distancia × tarifa_por_km',
    color: 'orange',
  },
  {
    value: 'tiempo',
    label: 'Por Tiempo (Horas)',
    icon: IconClock,
    description: 'Tarifa basada en el tiempo de viaje',
    formula: 'tiempo × tarifa_por_hora',
    color: 'purple',
  },
  {
    value: 'fija',
    label: 'Tarifa Fija',
    icon: IconCurrency,
    description: 'Monto fijo independiente de otros factores',
    formula: 'monto_fijo',
    color: 'gray',
  },
  {
    value: 'formula',
    label: 'Fórmula Personalizada',
    icon: IconMath,
    description: 'Fórmula matemática personalizada',
    formula: 'expresión_personalizada',
    color: 'red',
  },
] as const;

export const VARIABLES_DISPONIBLES = [
  { name: 'peso', description: 'Peso de la carga en toneladas' },
  { name: 'volumen', description: 'Volumen de la carga en m³' },
  { name: 'distancia', description: 'Distancia del viaje en km' },
  { name: 'tiempo', description: 'Tiempo estimado en horas' },
  { name: 'cantidadCamiones', description: 'Número de camiones' },
  { name: 'tarifaBase', description: 'Tarifa base del tramo' },
  { name: 'factorTipoCamion', description: 'Factor según tipo de camión' },
] as const;
