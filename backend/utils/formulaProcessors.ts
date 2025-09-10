/**
 * Procesadores de funciones específicas para fórmulas tipo Excel
 */
import { FormulaContext } from './formulaParser';

/**
 * Procesa las funciones SI() en una expresión y las convierte a operadores ternarios
 */
export function procesarFuncionSI(expresion: string): string {
  // Implementación sin regex vulnerable - buscar y reemplazar manualmente
  const siIndex = expresion.indexOf('SI(');
  if (siIndex === -1) return expresion;

  const start = siIndex + 3;
  let level = 0;
  let end = start;

  // Encontrar el cierre del paréntesis balanceado
  for (let i = start; i < expresion.length; i++) {
    if (expresion[i] === '(') level++;
    else if (expresion[i] === ')') {
      if (level === 0) {
        end = i;
        break;
      }
      level--;
    }
  }

  const contenido = expresion.substring(start, end);
  const partes = contenido.split(';');

  if (partes.length === 3) {
    const reemplazo = `(${partes[0].trim()} ? ${partes[1].trim()} : ${partes[2].trim()})`;
    return expresion.substring(0, siIndex) + reemplazo + expresion.substring(end + 1);
  }

  return expresion;
}

/**
 * Procesa la función REDONDEAR para redondear a n decimales
 */
export function procesarFuncionREDONDEAR(expresion: string): string {
  // REDONDEAR(valor;decimales) - optimizado
  const patron = /REDONDEAR\s*\(\s*([^;]{1,50});\s*(\d{1,2})\s*\)/;

  return expresion.replace(patron, (match, valor, decimales) => {
    const factor = Math.pow(10, parseInt(decimales));
    return `(round(${valor} * ${factor}) / ${factor})`;
  });
}

/**
 * Procesa la función PROMEDIO para calcular el promedio
 */
export function procesarFuncionPROMEDIO(expresion: string): string {
  // Implementación sin regex vulnerable - buscar y reemplazar manualmente
  const promedioIndex = expresion.indexOf('PROMEDIO(');
  if (promedioIndex === -1) return expresion;

  const start = promedioIndex + 9;
  let level = 0;
  let end = start;

  // Encontrar el cierre del paréntesis balanceado
  for (let i = start; i < expresion.length; i++) {
    if (expresion[i] === '(') level++;
    else if (expresion[i] === ')') {
      if (level === 0) {
        end = i;
        break;
      }
      level--;
    }
  }

  const contenido = expresion.substring(start, end);
  const valoresArray = contenido.split(';').map((v: string) => v.trim());
  const suma = valoresArray.join(' + ');
  const reemplazo = `((${suma}) / ${valoresArray.length})`;

  return expresion.substring(0, promedioIndex) + reemplazo + expresion.substring(end + 1);
}

/**
 * Procesa funciones relacionadas con día de la semana
 */
export function procesarFuncionDIASEMANA(expresion: string, contexto?: FormulaContext): string {
  const patron = /DIASEMANA\s*\(\s*\)/;

  return expresion.replace(patron, () => {
    if (contexto?.DiaSemana !== undefined) {
      return contexto.DiaSemana.toString();
    }
    return new Date().getDay().toString();
  });
}

/**
 * Procesa funciones relacionadas con fechas
 */
export function procesarFuncionFECHA(expresion: string, contexto?: FormulaContext): string {
  // MES()
  expresion = expresion.replace(/MES\s*\(\s*\)/g, () => {
    if (contexto?.Mes !== undefined) {
      return contexto.Mes.toString();
    }
    return (new Date().getMonth() + 1).toString();
  });

  // TRIMESTRE()
  expresion = expresion.replace(/TRIMESTRE\s*\(\s*\)/g, () => {
    if (contexto?.Trimestre !== undefined) {
      return contexto.Trimestre.toString();
    }
    const mes = new Date().getMonth() + 1;
    return Math.ceil(mes / 3).toString();
  });

  // ESFINDESEMANA()
  expresion = expresion.replace(/ESFINDESEMANA\s*\(\s*\)/g, () => {
    if (contexto?.EsFinDeSemana !== undefined) {
      return contexto.EsFinDeSemana ? '1' : '0';
    }
    const dia = new Date().getDay();
    return dia === 0 || dia === 6 ? '1' : '0';
  });

  return expresion;
}

/**
 * Procesa la función TARIFAESCALONADA para cálculos por rangos
 */
export function procesarFuncionTARIFAESCALONADA(expresion: string): string {
  // TARIFAESCALONADA(valor;rango1:tarifa1;rango2:tarifa2;...) - optimizado
  const patron = /TARIFAESCALONADA\s*\(\s*([^;]{1,50});([^)]{1,200})\s*\)/;

  return expresion.replace(patron, (match, valor, rangos) => {
    const pares = rangos.split(';').map((r: string) => {
      const [rango, tarifa] = r.split(':').map((s: string) => s.trim());
      return { rango: parseFloat(rango), tarifa: parseFloat(tarifa) };
    });

    // Ordenar por rango
    pares.sort(
      (a: { rango: number; tarifa: number }, b: { rango: number; tarifa: number }) =>
        a.rango - b.rango
    );

    // Construir expresión condicional anidada
    let resultado = pares[0].tarifa.toString();
    for (let i = 1; i < pares.length; i++) {
      resultado = `(${valor} <= ${pares[i - 1].rango} ? ${pares[i - 1].tarifa} : ${resultado})`;
    }

    // Agregar el último escalón
    if (pares.length > 0) {
      const ultimo = pares[pares.length - 1];
      resultado = `(${valor} > ${ultimo.rango} ? ${ultimo.tarifa} : ${resultado})`;
    }

    return `(${resultado})`;
  });
}

/**
 * Procesa todas las funciones personalizadas en la expresión
 */
export function procesarFuncionesPersonalizadas(
  expresion: string,
  contexto?: FormulaContext
): string {
  let resultado = expresion;
  resultado = procesarFuncionSI(resultado);
  resultado = procesarFuncionREDONDEAR(resultado);
  resultado = procesarFuncionPROMEDIO(resultado);
  resultado = procesarFuncionDIASEMANA(resultado, contexto);
  resultado = procesarFuncionFECHA(resultado, contexto);
  resultado = procesarFuncionTARIFAESCALONADA(resultado);
  return resultado;
}
