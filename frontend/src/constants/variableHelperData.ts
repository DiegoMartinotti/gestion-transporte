export interface Variable {
  nombre: string;
  descripcion: string;
  tipo: string;
  ejemplo: string;
}

export interface Funcion {
  nombre: string;
  descripcion: string;
  ejemplo: string;
}

export interface Operador {
  simbolo: string;
  descripcion: string;
}

export interface Ejemplo {
  nombre: string;
  formula: string;
  descripcion: string;
}

export const VARIABLES_DISPONIBLES: Variable[] = [
  {
    nombre: 'Valor',
    descripcion: 'Valor base del tramo/tarifa configurado',
    tipo: 'Número',
    ejemplo: '1000',
  },
  {
    nombre: 'Palets',
    descripcion: 'Cantidad de palets del viaje',
    tipo: 'Número',
    ejemplo: '15',
  },
  {
    nombre: 'Peaje',
    descripcion: 'Valor del peaje del tramo',
    tipo: 'Número',
    ejemplo: '500',
  },
];

export const FUNCIONES_DISPONIBLES: Funcion[] = [
  {
    nombre: 'SI(condicion; verdadero; falso)',
    descripcion: 'Función condicional',
    ejemplo: 'SI(Palets > 10; Valor * 0.9; Valor)',
  },
  {
    nombre: 'max(a, b)',
    descripcion: 'Devuelve el valor máximo',
    ejemplo: 'max(Valor * Palets, 5000)',
  },
  {
    nombre: 'min(a, b)',
    descripcion: 'Devuelve el valor mínimo',
    ejemplo: 'min(Valor * Palets, 15000)',
  },
  {
    nombre: 'round(numero)',
    descripcion: 'Redondea al entero más cercano',
    ejemplo: 'round(Valor * 1.15)',
  },
  {
    nombre: 'sqrt(numero)',
    descripcion: 'Raíz cuadrada',
    ejemplo: 'sqrt(Palets) * 100',
  },
  {
    nombre: 'abs(numero)',
    descripcion: 'Valor absoluto',
    ejemplo: 'abs(Valor - 1000)',
  },
  {
    nombre: 'pow(base, exponente)',
    descripcion: 'Potencia',
    ejemplo: 'pow(Palets, 2) * 10',
  },
];

export const OPERADORES: Operador[] = [
  { simbolo: '+', descripcion: 'Suma' },
  { simbolo: '-', descripcion: 'Resta' },
  { simbolo: '*', descripcion: 'Multiplicación' },
  { simbolo: '/', descripcion: 'División' },
  { simbolo: '^', descripcion: 'Potencia' },
  { simbolo: '>', descripcion: 'Mayor que' },
  { simbolo: '<', descripcion: 'Menor que' },
  { simbolo: '>=', descripcion: 'Mayor o igual' },
  { simbolo: '<=', descripcion: 'Menor o igual' },
  { simbolo: '==', descripcion: 'Igual' },
];

export const EJEMPLOS_COMUNES: Ejemplo[] = [
  {
    nombre: 'Descuento por volumen',
    formula: 'SI(Palets > 20; Valor * Palets * 0.85; Valor * Palets) + Peaje',
    descripcion: '15% descuento para más de 20 palets',
  },
  {
    nombre: 'Recargo por pocos palets',
    formula: 'SI(Palets < 5; Valor * Palets * 1.2; Valor * Palets) + Peaje',
    descripcion: '20% recargo para menos de 5 palets',
  },
  {
    nombre: 'Tarifa mínima',
    formula: 'max(Valor * Palets, 5000) + Peaje',
    descripcion: 'Garantiza un mínimo de $5000',
  },
  {
    nombre: 'Tarifa máxima',
    formula: 'min(Valor * Palets, 15000) + Peaje',
    descripcion: 'Limita a un máximo de $15000',
  },
  {
    nombre: 'Escala progresiva',
    formula:
      'SI(Palets <= 10; Valor * Palets; SI(Palets <= 20; Valor * Palets * 0.9; Valor * Palets * 0.8)) + Peaje',
    descripcion: 'Descuentos progresivos por cantidad',
  },
];
