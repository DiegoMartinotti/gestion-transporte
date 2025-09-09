import dayjs from 'dayjs';
import {
  DocumentValidationRule,
  DocumentValidationResult,
  DocumentoValidacion,
  CATEGORY_TYPES,
  ERROR_SEVERITY,
  DATE_FORMAT,
} from './DocumentValidationTypes';

// Constantes para strings repetidos
const RULE_IDS = {
  DOCUMENTOS_REQUERIDOS: 'documentos-requeridos',
  DOCUMENTOS_VENCIDOS: 'documentos-vencidos',
  FECHAS_CONSISTENTES: 'fechas-consistentes',
  NUMEROS_VALIDOS: 'numeros-validos',
} as const;

// Mensajes constantes para evitar duplicación
const MESSAGES = {
  DOCUMENTO_VENCIDO: (dias: number) => `Documento vencido hace ${Math.abs(dias)} días`,
  DOCUMENTO_VENCE: (dias: number) => `Documento vence en ${dias} días`,
  VENCE_EL: (fecha: string) => `vence el ${fecha}`,
  VENCIDO_EL: (fecha: string) => `vencido el ${fecha}`,
  FALTA_DOCUMENTO: (tipo: string) => `Falta documento requerido: ${tipo}`,
  NUMERO_FALTANTE: 'Número de documento faltante',
  NUMERO_CORTO: 'Número de documento muy corto',
  FECHAS_INCONSISTENTES: 'Fecha de vencimiento anterior a fecha de emisión',
  DURACION_LARGA: (años: number) => `Duración del documento muy larga: ${años.toFixed(1)} años`,
  DOCUMENTO_OBLIGATORIO: (tipo: string, entidad: string) =>
    `El documento ${tipo} es obligatorio para ${entidad}s`,
  AGREGAR_DOCUMENTO: (tipo: string) => `Agregue el documento ${tipo} para esta entidad`,
  NO_ESPECIFICADO: (tipo: string) => `El documento ${tipo} no tiene número especificado`,
};

// Reglas de validación predefinidas
export const VALIDATION_RULES: DocumentValidationRule[] = [
  // Reglas de obligatoriedad
  {
    id: RULE_IDS.DOCUMENTOS_REQUERIDOS,
    name: 'Documentos Requeridos',
    description: 'Verifica que todos los documentos obligatorios estén presentes',
    category: CATEGORY_TYPES.OBLIGATORIEDAD,
    enabled: true,
    severity: ERROR_SEVERITY,
    required: true,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];
      const entidades = new Map<string, DocumentoValidacion[]>();

      // Agrupar por entidad
      documentos.forEach((doc) => {
        const key = `${doc.entidadTipo}-${doc.entidadId}`;
        const existingDocs = entidades.get(key);
        if (!existingDocs) {
          entidades.set(key, []);
        }
        const docs = entidades.get(key);
        if (docs) {
          docs.push(doc);
        }
      });

      // Validar cada entidad
      entidades.forEach((docs, key) => {
        const [tipo, id] = key.split('-');
        const requeridos = tipo === 'vehiculo' ? config.reglasVehiculos : config.reglasPersonal;
        const tiposPresentes = docs.filter((d) => d.activo).map((d) => d.tipo);

        requeridos.forEach((tipoRequerido) => {
          if (!tiposPresentes.includes(tipoRequerido)) {
            results.push({
              ruleId: RULE_IDS.DOCUMENTOS_REQUERIDOS,
              passed: false,
              message: MESSAGES.FALTA_DOCUMENTO(tipoRequerido),
              documentoId: '',
              entidadId: id,
              entidadNombre: docs[0].entidadNombre,
              entidadTipo: tipo as 'vehiculo' | 'personal',
              mensaje: MESSAGES.FALTA_DOCUMENTO(tipoRequerido),
              detalles: MESSAGES.DOCUMENTO_OBLIGATORIO(tipoRequerido, tipo),
              sugerencia: MESSAGES.AGREGAR_DOCUMENTO(tipoRequerido),
            });
          }
        });
      });

      return results;
    },
  },

  // Reglas de vencimiento
  {
    id: RULE_IDS.DOCUMENTOS_VENCIDOS,
    name: 'Documentos Vencidos',
    description: 'Identifica documentos vencidos o próximos a vencer',
    category: CATEGORY_TYPES.VENCIMIENTO,
    enabled: true,
    severity: ERROR_SEVERITY,
    required: true,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];
      const hoy = new Date();

      documentos.forEach((doc) => {
        if (!doc.fechaVencimiento || !doc.activo) return;

        const diasRestantes = dayjs(doc.fechaVencimiento).diff(dayjs(hoy), 'day');

        if (diasRestantes < 0 && !config.permitirDocumentosVencidos) {
          const fechaFormateada = dayjs(doc.fechaVencimiento).format(DATE_FORMAT);
          results.push({
            ruleId: RULE_IDS.DOCUMENTOS_VENCIDOS,
            passed: false,
            message: MESSAGES.DOCUMENTO_VENCIDO(diasRestantes),
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.DOCUMENTO_VENCIDO(diasRestantes),
            detalles: `${doc.tipo} ${MESSAGES.VENCIDO_EL(fechaFormateada)}`,
            sugerencia: 'Renueve el documento lo antes posible',
          });
        } else if (diasRestantes <= config.diasCritico) {
          const fechaFormateada = dayjs(doc.fechaVencimiento).format(DATE_FORMAT);
          results.push({
            ruleId: RULE_IDS.DOCUMENTOS_VENCIDOS,
            passed: false,
            message: MESSAGES.DOCUMENTO_VENCE(diasRestantes),
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.DOCUMENTO_VENCE(diasRestantes),
            detalles: `${doc.tipo} ${MESSAGES.VENCE_EL(fechaFormateada)}`,
            sugerencia: 'Planifique la renovación del documento',
          });
        }
      });

      return results;
    },
  },

  // Reglas de consistencia
  {
    id: RULE_IDS.FECHAS_CONSISTENTES,
    name: 'Consistencia de Fechas',
    description: 'Verifica que las fechas de emisión y vencimiento sean lógicas',
    category: CATEGORY_TYPES.CONSISTENCIA,
    enabled: true,
    severity: 'warning',
    required: false,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos) => {
      const results: DocumentValidationResult[] = [];

      documentos.forEach((doc) => {
        if (!doc.fechaEmision || !doc.fechaVencimiento || !doc.activo) return;

        const emision = dayjs(doc.fechaEmision);
        const vencimiento = dayjs(doc.fechaVencimiento);

        if (vencimiento.isBefore(emision)) {
          const fechaEmision = emision.format(DATE_FORMAT);
          const fechaVencimiento = vencimiento.format(DATE_FORMAT);
          results.push({
            ruleId: RULE_IDS.FECHAS_CONSISTENTES,
            passed: false,
            message: MESSAGES.FECHAS_INCONSISTENTES,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.FECHAS_INCONSISTENTES,
            detalles: `Emisión: ${fechaEmision}, Vencimiento: ${fechaVencimiento}`,
            sugerencia: 'Verifique y corrija las fechas del documento',
          });
        }

        // Verificar si el documento tiene una duración lógica
        const duracionAnios = vencimiento.diff(emision, 'year', true);
        if (duracionAnios > 10) {
          results.push({
            ruleId: RULE_IDS.FECHAS_CONSISTENTES,
            passed: false,
            message: MESSAGES.DURACION_LARGA(duracionAnios),
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.DURACION_LARGA(duracionAnios),
            detalles: 'La duración del documento parece inusualmente larga',
            sugerencia: 'Verifique si las fechas son correctas',
          });
        }
      });

      return results;
    },
  },

  // Reglas de integridad
  {
    id: RULE_IDS.NUMEROS_VALIDOS,
    name: 'Números de Documento',
    description: 'Verifica que los números de documento tengan formato válido',
    category: 'integridad',
    enabled: true,
    severity: 'warning',
    required: false,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];

      documentos.forEach((doc) => {
        if (!config.requiereNumeroDocumento || !doc.activo) return;

        if (!doc.numero || doc.numero.trim() === '') {
          results.push({
            ruleId: RULE_IDS.NUMEROS_VALIDOS,
            passed: false,
            message: MESSAGES.NUMERO_FALTANTE,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.NUMERO_FALTANTE,
            detalles: MESSAGES.NO_ESPECIFICADO(doc.tipo),
            sugerencia: 'Agregue el número del documento',
          });
        } else if (doc.numero.length < 3) {
          results.push({
            ruleId: RULE_IDS.NUMEROS_VALIDOS,
            passed: false,
            message: MESSAGES.NUMERO_CORTO,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: MESSAGES.NUMERO_CORTO,
            detalles: `El número "${doc.numero}" parece demasiado corto`,
            sugerencia: 'Verifique que el número esté completo',
          });
        }
      });

      return results;
    },
  },
];
