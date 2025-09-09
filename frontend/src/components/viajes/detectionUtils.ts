import { VehicleDetectionResult, VehicleSpecs } from './VehicleTypeDetector';

export const TIPOS_UNIDAD = [
  { value: 'camion_simple', label: 'Camión Simple', capacidadMin: 1000, capacidadMax: 8000 },
  {
    value: 'camion_con_acoplado',
    label: 'Camión con Acoplado',
    capacidadMin: 8000,
    capacidadMax: 25000,
  },
  {
    value: 'tractocamion_semirremolque',
    label: 'Tractocamión con Semirremolque',
    capacidadMin: 15000,
    capacidadMax: 45000,
  },
  { value: 'bitrren', label: 'Bitrén', capacidadMin: 35000, capacidadMax: 75000 },
  { value: 'portacontenedor', label: 'Portacontenedor', capacidadMin: 10000, capacidadMax: 35000 },
  { value: 'furgon', label: 'Furgón', capacidadMin: 500, capacidadMax: 3500 },
  { value: 'utilitario', label: 'Utilitario', capacidadMin: 100, capacidadMax: 1500 },
];

export const CARROCERIA_MAPPING: Record<string, string[]> = {
  cerrado: ['furgon', 'camion_simple'],
  abierto: ['camion_simple', 'camion_con_acoplado'],
  plataforma: ['camion_con_acoplado', 'tractocamion_semirremolque'],
  contenedor: ['portacontenedor'],
  tanque: ['camion_simple', 'camion_con_acoplado'],
  refrigerado: ['camion_simple', 'tractocamion_semirremolque'],
};

export const getExpectedAxles = (tipoUnidad: string): number => {
  const axlesMap: Record<string, number> = {
    utilitario: 2,
    furgon: 2,
    camion_simple: 2,
    camion_con_acoplado: 4,
    tractocamion_semirremolque: 5,
    portacontenedor: 3,
    bitrren: 7,
  };
  return axlesMap[tipoUnidad] || 2;
};

export const getRouteCompatibility = (tipoUnidad: string, distancia: number, ruta: string) => {
  let score = 0;
  let reason = '';

  if (ruta === 'urbana') {
    if (['utilitario', 'furgon', 'camion_simple'].includes(tipoUnidad)) {
      score = 10;
      reason = 'Apto para circulación urbana';
    } else if (['bitrren', 'tractocamion_semirremolque'].includes(tipoUnidad)) {
      score = -5;
      reason = 'Limitaciones en circulación urbana';
    }
  } else if (ruta === 'ruta' && distancia > 500) {
    if (['tractocamion_semirremolque', 'bitrren', 'camion_con_acoplado'].includes(tipoUnidad)) {
      score = 10;
      reason = 'Eficiente para largas distancias';
    }
  }

  return { score, reason };
};

export const generateRecommendations = (
  results: Array<{ tipo: string; score: number; reasons: string[] }>,
  specs: VehicleSpecs,
  carga?: number
): string[] => {
  const recommendations: string[] = [];

  if (carga && specs.capacidadCarga) {
    const utilizacion = (carga / specs.capacidadCarga) * 100;
    if (utilizacion > 95) {
      recommendations.push('⚠️ Considere un vehículo de mayor capacidad para mayor seguridad');
    } else if (utilizacion < 50) {
      recommendations.push('💡 Podría optimizar costos con un vehículo de menor capacidad');
    }
  }

  if (results[0].score < 60) {
    recommendations.push('🔍 La detección tiene baja confianza, verifique los datos del vehículo');
  }

  if (!specs.tipoCarroceria) {
    recommendations.push('📋 Especificar tipo de carrocería mejoraría la precisión');
  }

  if (!specs.cantidadEjes) {
    recommendations.push('⚖️ Agregar cantidad de ejes para mejor clasificación');
  }

  return recommendations;
};

export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  return 'red';
};

export const getTipoLabel = (tipo: string) => {
  return TIPOS_UNIDAD.find((t) => t.value === tipo)?.label || tipo;
};

const analyzeCapacity = (vehicleSpecs: VehicleSpecs, tipo: (typeof TIPOS_UNIDAD)[0]) => {
  const { score, reasons } = { score: 0, reasons: [] as string[] };

  if (
    vehicleSpecs.capacidadCarga >= tipo.capacidadMin &&
    vehicleSpecs.capacidadCarga <= tipo.capacidadMax
  ) {
    return {
      score: 40,
      reasons: [
        `Capacidad ${vehicleSpecs.capacidadCarga}kg dentro del rango ${tipo.capacidadMin}-${tipo.capacidadMax}kg`,
      ],
    };
  }

  if (vehicleSpecs.capacidadCarga < tipo.capacidadMin) {
    const diff = (vehicleSpecs.capacidadCarga / tipo.capacidadMin) * 100;
    const capacityScore = Math.max(0, diff - 50);
    const capacityReasons =
      diff > 80
        ? [`Capacidad ${vehicleSpecs.capacidadCarga}kg cercana al mínimo ${tipo.capacidadMin}kg`]
        : [];

    return { score: capacityScore, reasons: capacityReasons };
  }

  return { score, reasons };
};

const analyzeCarroceria = (vehicleSpecs: VehicleSpecs, tipo: (typeof TIPOS_UNIDAD)[0]) => {
  if (!vehicleSpecs.tipoCarroceria || !CARROCERIA_MAPPING[vehicleSpecs.tipoCarroceria]) {
    return { score: 0, reasons: [] };
  }

  if (CARROCERIA_MAPPING[vehicleSpecs.tipoCarroceria]?.includes(tipo.value)) {
    return {
      score: 20,
      reasons: [`Carrocería ${vehicleSpecs.tipoCarroceria} compatible`],
    };
  }

  return { score: 0, reasons: [] };
};

const analyzeAxles = (vehicleSpecs: VehicleSpecs, tipo: (typeof TIPOS_UNIDAD)[0]) => {
  if (!vehicleSpecs.cantidadEjes) {
    return { score: 0, reasons: [] };
  }

  const expectedAxles = getExpectedAxles(tipo.value);
  if (vehicleSpecs.cantidadEjes === expectedAxles) {
    return {
      score: 15,
      reasons: [`${vehicleSpecs.cantidadEjes} ejes coincide con tipo esperado`],
    };
  }

  if (Math.abs(vehicleSpecs.cantidadEjes - expectedAxles) === 1) {
    return {
      score: 8,
      reasons: [`${vehicleSpecs.cantidadEjes} ejes cercano al esperado (${expectedAxles})`],
    };
  }

  return { score: 0, reasons: [] };
};

const analyzeCarga = (vehicleSpecs: VehicleSpecs, cargaEstimada?: number) => {
  if (!cargaEstimada) {
    return { score: 0, reasons: [] };
  }

  const utilizacion = (cargaEstimada / vehicleSpecs.capacidadCarga) * 100;

  if (utilizacion >= 70 && utilizacion <= 95) {
    return {
      score: 15,
      reasons: [`Utilización óptima: ${utilizacion.toFixed(1)}%`],
    };
  }

  if (utilizacion >= 50 && utilizacion < 70) {
    return {
      score: 10,
      reasons: [`Utilización aceptable: ${utilizacion.toFixed(1)}%`],
    };
  }

  return { score: 0, reasons: [] };
};

export const detectVehicleType = (
  vehicleSpecs: VehicleSpecs,
  cargaEstimada?: number,
  distanciaViaje?: number,
  tipoRuta?: string
): VehicleDetectionResult => {
  const results: Array<{ tipo: string; score: number; reasons: string[] }> = [];

  TIPOS_UNIDAD.forEach((tipo) => {
    const capacityAnalysis = analyzeCapacity(vehicleSpecs, tipo);
    const carroceriaAnalysis = analyzeCarroceria(vehicleSpecs, tipo);
    const axlesAnalysis = analyzeAxles(vehicleSpecs, tipo);
    const cargaAnalysis = analyzeCarga(vehicleSpecs, cargaEstimada);

    let score =
      capacityAnalysis.score + carroceriaAnalysis.score + axlesAnalysis.score + cargaAnalysis.score;

    const reasons = [
      ...capacityAnalysis.reasons,
      ...carroceriaAnalysis.reasons,
      ...axlesAnalysis.reasons,
      ...cargaAnalysis.reasons,
    ];

    // Análisis por tipo de ruta
    if (distanciaViaje && tipoRuta) {
      const routeScore = getRouteCompatibility(tipo.value, distanciaViaje, tipoRuta);
      score += routeScore.score;
      if (routeScore.reason) {
        reasons.push(routeScore.reason);
      }
    }

    results.push({ tipo: tipo.value, score, reasons });
  });

  results.sort((a, b) => b.score - a.score);

  const bestMatch = results[0];
  const confidence = Math.min(100, bestMatch.score);
  const recommendations = generateRecommendations(results, vehicleSpecs, cargaEstimada);

  const alternativeTypes = results.slice(1, 4).map((r) => ({
    tipo: r.tipo,
    confidence: Math.min(100, r.score),
    reason: r.reasons[0] || 'Alternativa viable',
  }));

  return {
    tipoUnidad: bestMatch.tipo,
    confidence,
    reasons: bestMatch.reasons,
    recommendations,
    alternativeTypes,
  };
};
