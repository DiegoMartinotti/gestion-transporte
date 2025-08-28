#!/usr/bin/env node

/**
 * Script para analizar errores ESLint y generar prompts para sub-agentes
 * Uso: node scripts/launch-eslint-agents.js [--dry-run] [--max-agents=5]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  maxAgents: parseInt(process.argv.find(arg => arg.startsWith('--max-agents='))?.split('=')[1] || '5'),
  dryRun: process.argv.includes('--dry-run'),
  frontend: path.join(__dirname, '..', 'frontend'),
  maxFilesPerAgent: 4,
  priorityErrors: [
    'TypeError',
    'ReferenceError',
    'undefined',
    'Cannot read'
  ]
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Ejecuta ESLint y obtiene reporte estructurado
 */
function runESLintAnalysis() {
  console.log(`${colors.cyan}🔍 Analizando errores ESLint...${colors.reset}`);
  
  try {
    // Ejecutar ESLint con formato JSON
    const eslintOutput = execSync(
      'npx eslint . --ext .ts,.tsx --format json',
      { 
        cwd: CONFIG.frontend,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'] // Ignorar stderr
      }
    );
    
    return JSON.parse(eslintOutput);
  } catch (error) {
    // ESLint retorna exit code 1 cuando hay errores, pero aún así devuelve JSON válido
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (parseError) {
        console.error(`${colors.red}Error parseando output de ESLint${colors.reset}`);
        process.exit(1);
      }
    }
    throw error;
  }
}

/**
 * Agrupa archivos por criterios inteligentes
 */
function groupFilesByDomain(files) {
  const groups = {
    validators: [],
    hooks: [],
    components_forms: [],
    components_tables: [],
    components_base: [],
    components_other: [],
    services: [],
    pages: [],
    utils: [],
    types: [],
    other: []
  };

  files.forEach(file => {
    const relativePath = file.filePath.replace(/.*\/frontend\//, '');
    
    if (relativePath.includes('/validators/')) {
      groups.validators.push(file);
    } else if (relativePath.includes('/hooks/')) {
      groups.hooks.push(file);
    } else if (relativePath.includes('/components/forms/')) {
      groups.components_forms.push(file);
    } else if (relativePath.includes('/components/tables/')) {
      groups.components_tables.push(file);
    } else if (relativePath.includes('/components/base/')) {
      groups.components_base.push(file);
    } else if (relativePath.includes('/components/')) {
      groups.components_other.push(file);
    } else if (relativePath.includes('/services/')) {
      groups.services.push(file);
    } else if (relativePath.includes('/pages/')) {
      groups.pages.push(file);
    } else if (relativePath.includes('/utils/')) {
      groups.utils.push(file);
    } else if (relativePath.includes('/types/')) {
      groups.types.push(file);
    } else {
      groups.other.push(file);
    }
  });

  return groups;
}

/**
 * Crea asignaciones para sub-agentes
 */
function createAgentAssignments(groups) {
  const assignments = [];
  let agentNumber = 1;

  // Ordenar grupos por prioridad (más errores primero)
  const sortedGroups = Object.entries(groups)
    .filter(([_, files]) => files.length > 0)
    .sort((a, b) => {
      const errorsA = a[1].reduce((sum, f) => sum + f.errorCount + f.warningCount, 0);
      const errorsB = b[1].reduce((sum, f) => sum + f.errorCount + f.warningCount, 0);
      return errorsB - errorsA;
    });

  sortedGroups.forEach(([domain, files]) => {
    // Dividir en chunks si hay muchos archivos
    const chunks = [];
    for (let i = 0; i < files.length; i += CONFIG.maxFilesPerAgent) {
      chunks.push(files.slice(i, i + CONFIG.maxFilesPerAgent));
    }

    chunks.forEach((chunk, index) => {
      if (agentNumber <= CONFIG.maxAgents) {
        const branchName = chunks.length > 1 
          ? `fix/${domain.replace('_', '-')}-${index + 1}`
          : `fix/${domain.replace('_', '-')}`;

        assignments.push({
          agentNumber: agentNumber++,
          domain,
          branchName,
          files: chunk,
          totalErrors: chunk.reduce((sum, f) => sum + f.errorCount, 0),
          totalWarnings: chunk.reduce((sum, f) => sum + f.warningCount, 0)
        });
      }
    });
  });

  return assignments.slice(0, CONFIG.maxAgents);
}

/**
 * Genera prompt para un sub-agente específico
 */
function generateAgentPrompt(assignment) {
  const filesList = assignment.files.map(f => {
    const relativePath = f.filePath.replace(/.*\/frontend\//, 'frontend/');
    return `  - ${relativePath} (${f.errorCount} errors, ${f.warningCount} warnings)`;
  }).join('\n');

  const errorDetails = assignment.files.map(file => {
    const relativePath = file.filePath.replace(/.*\/frontend\//, 'frontend/');
    const messages = file.messages.slice(0, 5).map(m => 
      `    - Line ${m.line}: ${m.ruleId} - ${m.message}`
    ).join('\n');
    
    return `  ${relativePath}:\n${messages}`;
  }).join('\n\n');

  return `
## Sub-agente ${assignment.agentNumber}: ${assignment.domain}

**IMPORTANTE**: Eres el sub-agente eslint-fixer. Sigue EXACTAMENTE las instrucciones en tu configuración.

**PRIMERA ACCIÓN OBLIGATORIA**:
\`\`\`bash
git checkout -b ${assignment.branchName}
\`\`\`

**ARCHIVOS ASIGNADOS** (${assignment.totalErrors} errors, ${assignment.totalWarnings} warnings):
${filesList}

**PRINCIPALES PROBLEMAS IDENTIFICADOS**:
${errorDetails}

**PROCESO A SEGUIR**:
1. Crear y cambiar a rama: \`${assignment.branchName}\`
2. Corregir cada archivo usando Edit/MultiEdit
3. Verificar con: \`npx eslint --max-warnings 0 [archivo]\`
4. Verificar tipos: \`npm run type-check:files [archivos]\`
5. Hacer commit cuando todo esté limpio

**ESTRATEGIAS RECOMENDADAS**:
- Para complejidad cognitiva: Extraer funciones helper y hooks
- Para max-params: Agrupar en objetos de configuración
- Para strings duplicados: Crear constantes
- Para unused vars: Eliminar o prefijar con _

**COMMIT MESSAGE**:
\`\`\`
fix(eslint): corregir ${assignment.domain.replace('_', ' ')}

- Resolver ${assignment.totalErrors} errores y ${assignment.totalWarnings} warnings
- Aplicar principios DRY y SOLID
- [Describir refactorizaciones específicas]
\`\`\`

RECUERDA: NO uses --no-verify, NO uses eslint-disable, SIEMPRE trabaja en tu rama.
`;
}

/**
 * Guarda los prompts en archivos
 */
function savePrompts(assignments) {
  const outputDir = path.join(__dirname, '..', 'eslint-fixes');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  assignments.forEach(assignment => {
    const prompt = generateAgentPrompt(assignment);
    const filename = path.join(outputDir, `agent-${assignment.agentNumber}-${assignment.domain}.md`);
    fs.writeFileSync(filename, prompt);
    console.log(`${colors.green}✅ Prompt guardado: ${filename}${colors.reset}`);
  });

  // Crear resumen general
  const summary = generateSummary(assignments);
  fs.writeFileSync(path.join(outputDir, 'RESUMEN.md'), summary);
}

/**
 * Genera resumen de asignaciones
 */
function generateSummary(assignments) {
  const totalFiles = assignments.reduce((sum, a) => sum + a.files.length, 0);
  const totalErrors = assignments.reduce((sum, a) => sum + a.totalErrors, 0);
  const totalWarnings = assignments.reduce((sum, a) => sum + a.totalWarnings, 0);

  const assignmentTable = assignments.map(a => 
    `| ${a.agentNumber} | ${a.branchName} | ${a.files.length} | ${a.totalErrors} | ${a.totalWarnings} |`
  ).join('\n');

  return `# Resumen de Asignaciones ESLint

## Estadísticas Generales
- **Total de archivos**: ${totalFiles}
- **Total de errores**: ${totalErrors}
- **Total de warnings**: ${totalWarnings}
- **Sub-agentes asignados**: ${assignments.length}

## Asignaciones por Sub-agente

| Agente | Rama | Archivos | Errors | Warnings |
|--------|------|----------|--------|----------|
${assignmentTable}

## Comando para lanzar sub-agentes

Para cada agente, usa el Task tool con:
\`\`\`
subagent_type: "eslint-fixer"
description: "Corregir ESLint grupo X"
prompt: [contenido del archivo agent-X-domain.md]
\`\`\`

## Verificación post-corrección

\`\`\`bash
# Ver todas las ramas creadas
git branch | grep "fix/"

# Verificar que no quedan errores
cd frontend && npm run lint

# Merge de ramas (después de verificar)
git checkout main
${assignments.map(a => `git merge ${a.branchName}`).join('\n')}
\`\`\`

## Notas
- Cada sub-agente debe trabajar independientemente
- Verificar que cada uno crea su propia rama
- No permitir commits con --no-verify
- Asegurar 0 warnings antes de completar
`;
}

/**
 * Muestra resumen en consola
 */
function displaySummary(assignments) {
  console.log(`\n${colors.bright}${colors.blue}📊 RESUMEN DE ANÁLISIS${colors.reset}`);
  console.log('═'.repeat(50));
  
  const totalFiles = assignments.reduce((sum, a) => sum + a.files.length, 0);
  const totalErrors = assignments.reduce((sum, a) => sum + a.totalErrors, 0);
  const totalWarnings = assignments.reduce((sum, a) => sum + a.totalWarnings, 0);

  console.log(`${colors.yellow}📁 Archivos a procesar:${colors.reset} ${totalFiles}`);
  console.log(`${colors.red}❌ Errores totales:${colors.reset} ${totalErrors}`);
  console.log(`${colors.yellow}⚠️  Warnings totales:${colors.reset} ${totalWarnings}`);
  console.log(`${colors.green}🤖 Sub-agentes necesarios:${colors.reset} ${assignments.length}`);
  
  console.log(`\n${colors.bright}ASIGNACIONES:${colors.reset}`);
  assignments.forEach(a => {
    console.log(`  ${colors.cyan}Agent ${a.agentNumber}${colors.reset} → ${a.branchName}`);
    console.log(`    Archivos: ${a.files.length}, Errors: ${a.totalErrors}, Warnings: ${a.totalWarnings}`);
  });
}

/**
 * Main
 */
async function main() {
  console.log(`${colors.bright}${colors.magenta}🚀 ESLint Agent Launcher${colors.reset}`);
  console.log('═'.repeat(50));

  try {
    // Analizar con ESLint
    const eslintResults = runESLintAnalysis();
    
    // Filtrar solo archivos con errores/warnings
    const filesWithIssues = eslintResults.filter(f => 
      f.errorCount > 0 || f.warningCount > 0
    );

    if (filesWithIssues.length === 0) {
      console.log(`${colors.green}✨ ¡No hay errores ni warnings! Todo limpio.${colors.reset}`);
      process.exit(0);
    }

    // Agrupar archivos por dominio
    const groups = groupFilesByDomain(filesWithIssues);
    
    // Crear asignaciones para sub-agentes
    const assignments = createAgentAssignments(groups);
    
    // Mostrar resumen
    displaySummary(assignments);

    if (!CONFIG.dryRun) {
      // Guardar prompts
      savePrompts(assignments);
      console.log(`\n${colors.green}✅ Prompts generados en: eslint-fixes/${colors.reset}`);
      console.log(`${colors.yellow}📝 Usa los archivos generados con el Task tool para lanzar sub-agentes${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Modo dry-run: No se generaron archivos${colors.reset}`);
      console.log(`${colors.cyan}Ejecuta sin --dry-run para generar prompts${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}