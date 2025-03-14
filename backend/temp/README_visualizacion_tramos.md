# Corrección para la visualización de tramos TRMC y TRMI

## Problema

El sistema no estaba mostrando correctamente todos los tipos de tramos (TRMC y TRMI) para cada par origen-destino en la visualización del tarifario. Solo se mostraba un tipo de tramo (generalmente TRMC) para cada par origen-destino, aunque en la base de datos existieran ambos tipos.

## Causa

El problema estaba en la función `getTramosByCliente` del controlador de tramos. Esta función estaba procesando los tramos de manera que solo se mostraba el tramo más reciente para cada par origen-destino, sin tener en cuenta el tipo de tramo (TRMC o TRMI).

## Solución

Se ha modificado la función `getTramosByCliente` para que procese correctamente los tramos con tarifas históricas y muestre todos los tipos de tramos (TRMC y TRMI) para cada par origen-destino.

### Cambios realizados:

1. Se ha modificado la función para que procese cada tarifa histórica como un tramo separado, manteniendo la información del tipo de tramo.
2. Se ha cambiado la clave del mapa de tramos únicos para incluir el tipo de tramo, lo que permite tener un tramo TRMC y un tramo TRMI para el mismo par origen-destino.
3. Se ha mejorado el manejo de tramos con tarifas históricas, creando una copia del tramo para cada tarifa con la información específica de esa tarifa.

## Archivos modificados

- `backend/controllers/tramoController.js`: Se ha modificado la función `getTramosByCliente`.

## Instrucciones para aplicar la corrección

La corrección ya ha sido aplicada mediante el script `fix_visualizacion_tramos.js`. Se ha creado una copia de seguridad del archivo original en `tramoController.js.bak.visualizacion.[timestamp]`.

Para que los cambios surtan efecto, es necesario reiniciar el servidor.

## Verificación

Para verificar que la corrección se ha aplicado correctamente, acceda a la visualización del tarifario y compruebe que se muestran todos los tipos de tramos (TRMC y TRMI) para cada par origen-destino.

Por ejemplo, para el par origen-destino "CTE-CORRIENTES → SIASA", ahora deberían mostrarse tanto el tramo TRMC como el tramo TRMI, si ambos existen en la base de datos. 