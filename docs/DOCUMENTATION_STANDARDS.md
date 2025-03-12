# Estándares de Documentación

## Índice
1. [Estructura General](#estructura-general)
2. [Documentación de Módulos](#documentación-de-módulos)
3. [Documentación de Componentes React](#documentación-de-componentes-react)
4. [Documentación de Controladores](#documentación-de-controladores)
5. [Documentación de Modelos](#documentación-de-modelos)
6. [Documentación de Utilidades](#documentación-de-utilidades)
7. [Convenciones Generales](#convenciones-generales)

## Estructura General

Cada archivo debe comenzar con un bloque de documentación que describa el módulo:

```javascript
/**
 * @module nombre/del/modulo
 * @description Descripción concisa del propósito del módulo
 * @author [Opcional] Nombre del autor o equipo
 * @version [Opcional] Versión del módulo
 */
```

## Documentación de Componentes React

### Estructura Básica
```javascript
/**
 * @module components/NombreComponente
 * @description Descripción breve del componente
 */

/**
 * Componente que [descripción de la funcionalidad]
 * 
 * @component
 * @example
 * // Ejemplo básico de uso
 * return (
 *   <ComponenteName prop1="valor" prop2={valor} />
 * )
 * 
 * @description
 * Características principales:
 * - Punto 1
 * - Punto 2
 * 
 * Decisiones de diseño:
 * 1. Razón 1
 * 2. Razón 2
 */
```

### Estados y Efectos
```javascript
/**
 * Estado para [propósito]
 * @type {[tipo, Function]} Par de estado y función actualizadora
 */
const [estado, setEstado] = useState(valorInicial);

/**
 * Efecto que [propósito]
 * @effect
 * @dependencies [dependencia1, dependencia2]
 */
useEffect(() => {}, [dependencias]);
```

### Props
```javascript
/**
 * Validación de props del componente
 */
ComponentName.propTypes = {
  /** Descripción de la prop */
  propName: PropTypes.type.isRequired
};
```

## Documentación de Controladores

### Estructura Básica
```javascript
/**
 * @module controllers/nombreControlador
 * @description Propósito del controlador
 */

/**
 * [Verbo] [Recurso] - Descripción de la acción
 * 
 * @async
 * @function nombreFuncion
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {Object} req.params - Parámetros de la URL
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Descripción de la respuesta
 * @throws {Error} Descripción de posibles errores
 */
```

## Documentación de Modelos

### Estructura Básica
```javascript
/**
 * @module models/nombreModelo
 * @description Propósito del modelo
 */

/**
 * Esquema de [nombre]
 * 
 * @typedef {Object} NombreSchema
 * @property {tipo} campo - Descripción del campo
 */
```

### Métodos del Modelo
```javascript
/**
 * [Acción que realiza el método]
 * 
 * @method nombreMetodo
 * @param {tipo} parametro - Descripción del parámetro
 * @returns {Promise<tipo>} Descripción del retorno
 * @throws {Error} Descripción del error
 */
```

## Documentación de Utilidades

### Estructura Básica
```javascript
/**
 * @module utils/nombreUtilidad
 * @description Propósito de la utilidad
 */

/**
 * [Descripción de la función]
 * 
 * @function nombreFuncion
 * @param {tipo} parametro - Descripción del parámetro
 * @returns {tipo} Descripción del retorno
 * @example
 * // Ejemplo de uso
 * const resultado = nombreFuncion(parametro);
 */
```

## Convenciones Generales

### 1. Niveles de Detalle

- **Nivel 1 (Básico)**
  - Descripción breve del propósito
  - Parámetros principales
  - Tipo de retorno

- **Nivel 2 (Intermedio)**
  - Todo lo del nivel 1
  - Ejemplos de uso
  - Manejo de errores
  - Dependencias principales

- **Nivel 3 (Detallado)**
  - Todo lo del nivel 2
  - Casos de uso específicos
  - Decisiones de diseño
  - Advertencias y notas
  - Referencias a otros componentes

### 2. Etiquetas JSDoc Comunes

| Etiqueta | Uso |
|----------|-----|
| @module | Definir el módulo |
| @description | Describir el propósito |
| @param | Documentar parámetros |
| @returns | Documentar valor de retorno |
| @throws | Documentar errores |
| @example | Proporcionar ejemplos |
| @type | Especificar tipos |
| @typedef | Definir tipos personalizados |
| @async | Marcar funciones asíncronas |
| @deprecated | Marcar elementos obsoletos |

### 3. Reglas de Estilo

1. **Consistencia**
   - Usar el mismo formato en todo el proyecto
   - Mantener el mismo nivel de detalle para elementos similares

2. **Claridad**
   - Usar oraciones completas
   - Evitar abreviaturas no estándar
   - Explicar acrónimos en su primera aparición

3. **Concisión**
   - Ser breve pero informativo
   - Evitar redundancias
   - Usar listas para múltiples puntos

4. **Actualización**
   - Mantener la documentación sincronizada con el código
   - Marcar secciones obsoletas
   - Revisar y actualizar ejemplos

### 4. Cuándo Documentar

1. **Siempre Documentar:**
   - Módulos
   - Componentes públicos
   - APIs expuestas
   - Interfaces de usuario
   - Funciones exportadas
   - Tipos personalizados

2. **Documentación Opcional:**
   - Funciones privadas simples
   - Implementaciones obvias
   - Variables locales
   - Lógica de rutina

3. **Documentación Especial:**
   - Código complejo
   - Algoritmos
   - Workarounds
   - Decisiones arquitectónicas

### 5. Mantenimiento

- Revisar la documentación en cada PR
- Actualizar cuando el código cambie
- Validar ejemplos periódicamente
- Eliminar documentación obsoleta
- Mantener consistencia entre archivos relacionados

## Ejemplos Prácticos

Ver ejemplos en:
- `components/Login.js` - Documentación de componente React
- `controllers/authController.js` - Documentación de controlador
- `models/Usuario.js` - Documentación de modelo
- `utils/tramoValidator.js` - Documentación de utilidad 