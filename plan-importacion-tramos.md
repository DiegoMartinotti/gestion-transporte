# Plan de Solución: Errores en Importación Masiva de Tramos

## Problema Inicial Identificado

Durante la importación masiva de tramos desde Excel, se producían errores indicando "Sitio de origen/destino no encontrado". La investigación inicial sugirió que `ExcelImportTemplate.js` enviaba un mapa (`optimizedContext`) al worker en lugar de un array (`validationContext`), lo que causaba fallos en la construcción del `sitesMap` interno del worker.

## Nuevos Problemas Identificados (Post-Corrección Inicial)

A pesar de corregir el envío del `validationContext` (asegurando que se envía el array), los logs más recientes muestran:

1.  **Persistencia del Error "Sitio no encontrado":** La validación de sitios en el worker sigue fallando. La causa más probable ahora es que las funciones auxiliares (`normalizeText`, `findSiteInContext`) definidas en `TramoBulkImporter.js` (fuera de `validateRow`) no están disponibles en el scope del worker cuando `validateRow` se reconstruye y ejecuta allí.
2.  **Error 404 en `POST /tramo/bulk`:** El frontend intenta enviar los datos procesados al backend mediante `POST /tramo/bulk` (según `tramoService.js`), pero recibe un error 404 (No Encontrado). La investigación del backend (`backend/routes/tramos.js` y `backend/routes/index.js`) muestra que la ruta correcta es `POST /api/tramos/bulk` (con 's'). Hay una discrepancia en la URL llamada por el frontend.
3.  **Error 404 en `GET /api/tramo/cliente/:clienteId`:** Los logs también muestran errores 404 para esta ruta al intentar cargar tramos existentes. La ruta correcta definida en el backend es `/api/tramos/cliente/:clienteId` (con 's'). Esta llamada incorrecta parece originarse en otra parte del código (posiblemente `TarifarioViewer.js` o `tarifarioService.js`).

## Plan de Solución Revisado (Priorizado)

Se abordarán los problemas en el siguiente orden:

1.  **Corregir Error 404 en Importación (`POST /tramos/bulk`):**
    *   **Archivo:** `frontend/src/services/tramoService.js`
    *   **Acción:** Modificar la función `bulkImportTramos`. Cambiar la URL de la llamada `api.post` de `/tramo/bulk` a `/tramos/bulk`.

2.  **Corregir Error de Validación ("Sitio no encontrado"):**
    *   **Archivo:** `frontend/src/components/tramos/TramoBulkImporter.js`
    *   **Acción:** Mover las definiciones completas de las funciones auxiliares `normalizeText` y `findSiteInContext` para que estén *dentro* del cuerpo de la función `validateRow`. Esto asegura que se incluyan cuando la función se envíe como string al worker.

3.  **Investigar y Corregir Error 404 en Carga de Tramos (`GET /api/tramo/cliente/:clienteId`):**
    *   **Archivo(s) Probable(s):** `frontend/src/components/tarifario/TarifarioViewer.js`, `frontend/src/services/tarifarioService.js` (o donde se origine la llamada incorrecta).
    *   **Acción:** Localizar la llamada a `GET /api/tramo/cliente/...` y corregir la URL a `/api/tramos/cliente/...`.

## Diagrama del Flujo Corregido (Intención Final)

```mermaid
graph TD
    subgraph Frontend Principal
        A[Tramos.js: Obtiene 'sites' de API] --> B(Pasa 'sites' a TramoBulkImporter);
        B --> C[TramoBulkImporter: Define validateRow CON helpers];
        C --> D[Pasa 'sites' y 'validateRow' string a ExcelImportTemplate];
        D --> E{ExcelImportTemplate: Inicia Worker};
    end

    subgraph Worker
        F[excelWorker.js: onmessage recibe 'sites' array y 'validateRow' string];
        F --> G(Construye sitesMap desde array 'sites');
        G --> H{evaluateValidation: Reconstruye validateRow DESDE string};
        H -- Ejecuta validateRow(..., sitesMap) --> I[validateRow (en worker) CON helpers disponibles];
        I -- Usa sitesMap y helpers --> J(Búsqueda de sitio exitosa);
    end

    subgraph Frontend Principal
        E -- Worker termina, devuelve validRows --> K[ExcelImportTemplate: Recibe validRows];
        K --> L[Llama a processDataCallback (TramoBulkImporter)];
        L --> M[TramoBulkImporter: Llama a tramoService.bulkImportTramos];
        M -- Llama a POST /api/tramos/bulk --> N{Backend};
    end

    E -- Envía { data, validateRowFn (con helpers), validationContext: sites (array) } --> F;

    style J fill:#9f9,stroke:#333,stroke-width:2px
    style N fill:#f9f,stroke:#333,stroke-width:2px
```

## Próximos Pasos

1.  Aplicar la corrección de la URL en `frontend/src/services/tramoService.js`.
2.  Aplicar la corrección moviendo las funciones auxiliares en `frontend/src/components/tramos/TramoBulkImporter.js`.
3.  Probar la importación masiva. Si funciona, proceder a investigar y corregir el error 404 de `GET /api/tramo/cliente/:clienteId`.