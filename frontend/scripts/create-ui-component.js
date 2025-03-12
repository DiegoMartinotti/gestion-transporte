#!/usr/bin/env node

/**
 * Script para crear un nuevo componente UI
 * Uso: node scripts/create-ui-component.js NombreComponente
 */

const fs = require('fs');
const path = require('path');

// Obtener el nombre del componente desde los argumentos
const componentName = process.argv[2];

if (!componentName) {
  console.error('Error: Debes proporcionar un nombre para el componente.');
  console.log('Uso: node scripts/create-ui-component.js NombreComponente');
  process.exit(1);
}

// Verificar que el nombre del componente comience con mayúscula
if (componentName[0] !== componentName[0].toUpperCase()) {
  console.error('Error: El nombre del componente debe comenzar con mayúscula (PascalCase).');
  process.exit(1);
}

// Rutas
const componentsDir = path.join(__dirname, '..', 'src', 'ui', 'components');
const componentPath = path.join(componentsDir, `${componentName}.js`);
const indexPath = path.join(componentsDir, 'index.js');

// Verificar si el componente ya existe
if (fs.existsSync(componentPath)) {
  console.error(`Error: El componente ${componentName} ya existe.`);
  process.exit(1);
}

// Plantilla para el nuevo componente
const componentTemplate = `import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente ${componentName} reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {React.Component} Componente ${componentName}
 */
const ${componentName} = (props) => {
  return (
    <div>
      {/* Implementa tu componente aquí */}
    </div>
  );
};

${componentName}.propTypes = {
  // Define las propiedades del componente aquí
};

${componentName}.defaultProps = {
  // Define los valores por defecto de las propiedades aquí
};

export default ${componentName};
`;

// Crear el archivo del componente
fs.writeFileSync(componentPath, componentTemplate);
console.log(`✅ Componente ${componentName} creado en ${componentPath}`);

// Leer el archivo index.js
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Agregar la exportación del nuevo componente
if (indexContent.includes(`export { default as ${componentName} }`)) {
  console.log(`⚠️ El componente ${componentName} ya está exportado en index.js`);
} else {
  // Buscar el último export o comentario
  const lastExportMatch = indexContent.match(/export.*;\n/g);
  const lastExport = lastExportMatch ? lastExportMatch[lastExportMatch.length - 1] : null;
  
  if (lastExport) {
    // Insertar después del último export
    indexContent = indexContent.replace(
      lastExport,
      `${lastExport}export { default as ${componentName} } from './${componentName}';\n`
    );
  } else {
    // Agregar al final del archivo
    indexContent += `\nexport { default as ${componentName} } from './${componentName}';\n`;
  }
  
  // Escribir el archivo actualizado
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Componente ${componentName} exportado en index.js`);
}

console.log(`
🎉 ¡Componente ${componentName} creado con éxito!

Próximos pasos:
1. Implementa la funcionalidad del componente en ${componentPath}
2. Documenta las propiedades con JSDoc
3. Asegúrate de que el componente siga el estilo definido en el tema

Para más información, consulta la guía de estilo en docs/guia-estilo.md
`); 