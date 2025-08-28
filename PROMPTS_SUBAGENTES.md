# Prompts para Gestión de ESLint con Sub-Agentes

## 📢 ARQUITECTURA SIMPLIFICADA

**Cómo funciona**:

1. **Claude Code (TÚ)** - Analizas, agrupas y coordinas desde la sesión principal
2. **@eslint-fixer (Sub-agentes)** - Ejecutan correcciones en paralelo, cada uno en su rama
3. **Claude Code (TÚ)** - Consolidas resultados y haces merge

**Nota**: Solo existe un tipo de sub-agente (`eslint-fixer`) que usa Sonnet para eficiencia.

## 📋 Prompt 1: Hacer Commit de Archivos Modificados con Sub-Agentes

```markdown
Mi proyecto utiliza Husky con hooks de pre-commit que ejecutan linters y tests.
OBJETIVO: Hacer commit de archivos modificados usando sub-agentes en paralelo.

CONTEXTO:

- Hooks pre-commit estrictos (--max-warnings 0) que bloquean commits con warnings
- Archivos modificados pendientes de commit
- Necesidad de correcciones paralelas para agilizar el proceso

TU TRABAJO (Claude Code - Sesión Principal):

1. Intentar commit inicial para identificar errores específicos
2. Si falla: agrupar archivos por tipo de problema/funcionalidad relacionada
3. Lanzar sub-agentes @eslint-fixer EN PARALELO usando Task tool

REGLAS ESTRICTAS para sub-agentes @eslint-fixer:

- CREAR RAMA PROPIA antes de empezar (ej: fix/eslint-grupo-1, fix/validators, etc.)
- NO usar --no-verify ni métodos para omitir hooks
- NO usar eslint-disable, prettier-ignore ni directivas similares
- SOLO modificar lo necesario para pasar validaciones
- EJECUTAR correcciones reales, no solo planificar
- VERIFICAR con ESLint/TypeScript que pasan sin warnings
- TRABAJAR SOLO en su rama asignada

INSTRUCCIONES PARA LANZAR SUB-AGENTES:
Para cada grupo de archivos, usa Task tool con:

{
subagent_type: "eslint-fixer",
description: "Corregir [tipo de archivos]",
prompt: `
Sub-agente [N] - Grupo: [descripción]

    PRIMERA ACCIÓN OBLIGATORIA:
    git checkout -b fix/[descripción-grupo]

    ARCHIVOS ASIGNADOS:
    - [archivo1]: [errores/warnings identificados]
    - [archivo2]: [errores/warnings identificados]

    PROCESO:
    1. Crear y cambiar a rama 'fix/[descripción-grupo]'
    2. Ejecutar npx eslint --max-warnings 0 [archivo] para cada archivo
    3. CORREGIR problemas usando Edit/MultiEdit/Write
    4. VERIFICAR que pasan validaciones después de corrección
    5. Hacer commit en tu rama cuando termines
    6. REPORTAR cambios específicos realizados y nombre de rama

    TÉCNICAS A APLICAR:
    - [técnica específica según tipo de error]

`
}

ESTRATEGIA DE AGRUPACIÓN:

- Agrupar archivos relacionados (ej: selectors, validators, forms, pages)
- Un sub-agente por grupo de 2-5 archivos relacionados
- Priorizar archivos con pocos warnings primero
- Para funciones largas: extraer helpers/componentes
- Para max-params: agrupar en objetos de configuración
- Para complejidad alta: dividir lógica en funciones más simples

RESULTADO ESPERADO:

- Múltiples ramas con commits incrementales de archivos corregidos
- Código refactorizado siguiendo principios DRY/SOLID
- 0 warnings ESLint en archivos commiteados
- Funcionalidad original preservada
- Al final: merge de ramas o cherry-pick de commits necesarios

IMPORTANTE:

- Lanzar sub-agentes EN PARALELO (múltiples Task tool en un solo mensaje)
- Cada sub-agente DEBE crear su propia rama antes de modificar archivos
- Monitorear progreso y consolidar resultados al final
```

## 📋 Prompt 2: Corregir Errores/Warnings de npm run lint

````markdown
Mi proyecto utiliza Husky con hooks de pre-commit que ejecutan linters y tests.
OBJETIVO: Corregir errores/warnings de `npm run lint` en el frontend usando sub-agentes en paralelo.

TU TRABAJO (Claude Code - Sesión Principal):

1. Ejecutar `cd frontend && npm run lint` para obtener lista completa de errores/warnings
2. Analizar y agrupar archivos por tipo de problema y funcionalidad relacionada
3. Priorizar archivos críticos (errors > warnings)
4. Identificar dependencias entre archivos (imports/exports)
5. Lanzar sub-agentes @eslint-fixer especializados con Task tool

PROCESO DE ANÁLISIS Y AGRUPACIÓN:

1. Ejecutar lint y capturar output
2. Crear grupos coherentes:
   - Grupo validators: todos los archivos en /validators/
   - Grupo hooks: todos los hooks custom
   - Grupo components-forms: formularios relacionados
   - Grupo components-tables: tablas y listas
   - Grupo services: lógica de negocio
   - Grupo pages: componentes de página

3. Para cada grupo, preparar prompt específico con:
   - Lista exacta de archivos
   - Errores/warnings específicos por archivo
   - Técnicas de corrección recomendadas

PLANTILLA PARA LANZAR CADA SUB-AGENTE:

```javascript
{
  subagent_type: "eslint-fixer",
  description: "Fix [grupo]",
  prompt: `
    GRUPO: [nombre-grupo]
    RAMA OBLIGATORIA: fix/[nombre-grupo]

    PRIMERA ACCIÓN:
    git checkout -b fix/[nombre-grupo]

    ARCHIVOS Y ERRORES:
    [archivo1.tsx]:
    - Line X: [tipo error] - [mensaje]
    - Line Y: [tipo warning] - [mensaje]

    [archivo2.ts]:
    - Line Z: [tipo error] - [mensaje]

    ESTRATEGIA:
    1. Crear rama fix/[nombre-grupo]
    2. Corregir cada archivo con Edit/MultiEdit
    3. Verificar: npx eslint --max-warnings 0 [archivo]
    4. Si aparecen nuevos errores, corregirlos también
    5. Commit cuando grupo esté limpio

    TÉCNICAS ESPECÍFICAS:
    - [técnica según tipo de error predominante]

    NO usar --no-verify, NO usar eslint-disable
    Reportar cambios realizados y confirmar rama creada
  `
}
```
````

REGLAS ESTRICTAS:

- OBLIGATORIO: Cada sub-agente crea su propia rama
- NO trabajar en main/master directamente
- Solo corregir errores/warnings asignados
- NO modificar archivos de otros sub-agentes

TÉCNICAS DE CORRECCIÓN:

- Variables no usadas → eliminar o prefijar con \_
- Funciones largas → extraer helpers/componentes
- Max-params → agrupar en objetos config
- Complejidad alta → dividir lógica
- Imports duplicados → combinar
- Tipos 'any' → tipos específicos

RESULTADO ESPERADO:

- Múltiples ramas paralelas con correcciones independientes
- `npm run lint` pasa completamente sin errores
- Commits incrementales por grupos corregidos
- Funcionalidad original preservada

POST-PROCESAMIENTO:
Después de que todos los sub-agentes terminen:

1. Verificar cada rama: git checkout [rama] && npm run lint
2. Merge secuencial o crear PRs
3. Reportar resumen final con todas las ramas creadas

````

## 🚀 Ejemplo Práctico de Uso

```markdown
# Paso 1: Análisis
cd frontend && npm run lint

# Paso 2: Identificar grupos (ejemplo)
Grupo 1 - Calculators (3 archivos, 15 warnings):
- ExtraCalculator.tsx
- FormulaProcessor.tsx
- PartidaCalculator.tsx

Grupo 2 - Base Components (2 archivos, 8 warnings):
- DataTable.tsx
- SearchInput.tsx

# Paso 3: Lanzar sub-agentes EN PARALELO
[Usar Task tool múltiples veces en un solo mensaje]

Task 1: {
  subagent_type: "eslint-fixer",
  description: "Fix calculators",
  prompt: "[prompt específico grupo 1]"
}

Task 2: {
  subagent_type: "eslint-fixer",
  description: "Fix base components",
  prompt: "[prompt específico grupo 2]"
}

# Paso 4: Monitorear y consolidar
- Esperar reportes de cada sub-agente
- Verificar ramas creadas
- Preparar estrategia de merge
````

## 📝 Script Auxiliar de Análisis

Puedes usar el script incluido para análisis automático:

```bash
# Genera agrupaciones y prompts automáticamente
node scripts/launch-eslint-agents.js --max-agents=5

# Los prompts generados en eslint-fixes/ pueden ser usados
# directamente en el Task tool para cada sub-agente
```

## ⚠️ Notas Importantes

### Flujo de Trabajo Correcto:

1. **Claude Code (sesión principal)**: Analiza, agrupa y coordina
2. **Sub-agentes @eslint-fixer**: Ejecutan correcciones en paralelo
3. **Claude Code (sesión principal)**: Consolida y hace merge

### Ventajas de este enfoque:

- Control centralizado desde Claude Code
- Ejecución paralela eficiente con múltiples Sonnet workers
- Cada sub-agente trabaja aislado en su rama (sin conflictos)
- Simplicidad: un solo tipo de sub-agente especializado

### Configuración del Sub-agente:

- **@eslint-fixer**: Usa Sonnet (eficiente para desarrollo y refactorización)
- Cada instancia trabaja en su contexto independiente
- No comparten información entre instancias paralelas

## 🎯 Plantilla Simplificada

Para uso rápido sin análisis detallado:

```markdown
Necesito corregir todos los errores de ESLint en el frontend.

PROCESO:

1. Ejecuta cd frontend && npm run lint
2. Agrupa archivos relacionados (máximo 5 grupos)
3. Lanza un @eslint-fixer para cada grupo usando Task tool
4. Cada sub-agente debe crear su propia rama fix/[grupo]
5. Cuando todos terminen, reporta las ramas creadas

USA Task tool en paralelo para máxima eficiencia.
NO uses --no-verify en ningún momento.
```

## 🔧 Comandos Post-Corrección

```bash
# Ver todas las ramas creadas
git branch | grep "fix/"

# Verificar cada rama
for branch in $(git branch | grep "fix/"); do
  echo "=== Verificando $branch ==="
  git checkout $branch
  npm run lint
done

# Merge todas las ramas
git checkout main
for branch in $(git branch | grep "fix/"); do
  git merge $branch
done
```
