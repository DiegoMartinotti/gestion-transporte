# Corrección para el problema de importación de tramos TRMI

Este directorio contiene archivos para corregir un problema en la importación de tramos TRMI. El problema ocurre porque el sistema no diferencia correctamente entre tramos TRMC y TRMI cuando tienen el mismo origen y destino.

## Problema

Cuando se importan tramos desde Excel, los tramos TRMI no se están cargando correctamente en la base de datos. El sistema solo está cargando los tramos como TRMC, aunque se especifique TRMI en el archivo Excel.

## Causa

El problema está en cómo se manejan los tramos en el backend. Cuando se crea un nuevo tramo, se está creando correctamente con el tipo especificado (TRMC o TRMI), pero cuando se buscan los tramos existentes para verificar conflictos, se está usando una clave que solo incluye el origen y destino, sin tener en cuenta el tipo.

## Solución

La solución consiste en modificar el archivo `tramoController.js` para que la clave del tramo incluya también el tipo, de modo que se puedan tener tramos TRMC y TRMI para el mismo par origen-destino sin que se consideren el mismo tramo.

## Instrucciones para aplicar la corrección

### Opción 1: Usar el script automático

1. Asegúrese de que el servidor esté detenido.
2. Ejecute el script `apply_fix.js` con Node.js:

```bash
cd backend
node temp/apply_fix.js
```

3. Reinicie el servidor.

### Opción 2: Aplicar los cambios manualmente

Si prefiere aplicar los cambios manualmente, siga estos pasos:

1. Abra el archivo `backend/controllers/tramoController.js`.
2. Busque y reemplace las siguientes secciones:

#### 1. Reemplazar la creación del mapa de tramos (alrededor de la línea 212)

```javascript
const mapaTramos = {};
tramosExistentes.forEach(tramo => {
    const key = `${tramo.origen}-${tramo.destino}`;
    mapaTramos[key] = tramo;
});
```

Reemplazar por:

```javascript
const mapaTramos = {};
tramosExistentes.forEach(tramo => {
    // Incluir el tipo en la clave para diferenciar entre TRMC y TRMI
    if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
        // Crear una entrada para cada tipo de tarifa histórica
        const tiposUnicos = new Set(tramo.tarifasHistoricas.map(t => t.tipo));
        tiposUnicos.forEach(tipo => {
            const key = `${tramo.origen}-${tramo.destino}-${tipo}`;
            mapaTramos[key] = tramo;
        });
    } else {
        // Si no tiene tarifas históricas, usar la clave básica
        const key = `${tramo.origen}-${tramo.destino}`;
        mapaTramos[key] = tramo;
    }
});
```

#### 2. Reemplazar la búsqueda del tramo existente (alrededor de la línea 275)

```javascript
const tramoKey = `${tramoData.origen}-${tramoData.destino}`;
const tramoExistente = mapaTramos[tramoKey];
```

Reemplazar por:

```javascript
// Verificar si ya existe un tramo con el mismo origen, destino y tipo
const tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';
const tramoKey = `${tramoData.origen}-${tramoData.destino}-${tipo}`;
const tramoExistente = mapaTramos[tramoKey];
```

#### 3. Reemplazar la actualización del mapa después de crear un nuevo tramo (alrededor de la línea 411)

```javascript
mapaTramos[tramoKey] = nuevoTramo;
```

Reemplazar por:

```javascript
// Actualizar el mapa de tramos existentes con el nuevo tipo específico
const nuevoTipo = tramoData.tarifaHistorica.tipo;
const nuevoTramoKey = `${tramoData.origen}-${tramoData.destino}-${nuevoTipo}`;
mapaTramos[nuevoTramoKey] = nuevoTramo;
```

3. Guarde el archivo y reinicie el servidor.

## Verificación

Para verificar que la corrección se ha aplicado correctamente, intente importar un archivo Excel que contenga tramos TRMC y TRMI para el mismo par origen-destino. Ambos tipos de tramos deberían cargarse correctamente en la base de datos. 