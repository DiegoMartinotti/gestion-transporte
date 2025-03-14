# Migración del Modelo Tramo

Este documento describe el proceso de migración del modelo Tramo a una nueva estructura que utiliza un array de tarifas históricas.

## Cambios en el Modelo

### Modelo Anterior

En el modelo anterior, cada combinación de origen-destino-cliente-tipo-metodoCalculo con diferentes períodos de vigencia generaba un documento completo en la colección `tramos`.

### Nuevo Modelo

El nuevo modelo agrupa los tramos por origen-destino-cliente y almacena los datos variables (tipo, metodoCalculo, valor, valorPeaje, vigenciaDesde, vigenciaHasta) en un array de tarifas históricas dentro del documento principal.

Beneficios:
- Estructura más lógica y eficiente
- Mejor gestión histórica de tarifas
- Consultas más eficientes
- Reducción del tamaño de la colección

## Proceso de Migración

La migración se realiza en los siguientes pasos:

1. Se crea un backup de la colección `tramos` actual
2. Se agrupan los tramos por origen, destino y cliente
3. Para cada grupo, se crea un nuevo documento con los campos fijos
4. Los datos variables se convierten en elementos del array `tarifasHistoricas`
5. Se reemplaza la colección actual con los nuevos documentos

## Instrucciones para la Migración

### Preparación

Antes de ejecutar la migración:

1. Realice un backup completo de la base de datos
2. Verifique que no haya usuarios activos en el sistema
3. Pruebe la migración en un entorno de desarrollo primero

### Ejecución

Para ejecutar la migración:

```bash
# Desde el directorio raíz del proyecto
node backend/scripts/ejecutarMigracion.js
```

El script solicitará confirmación antes de proceder y creará automáticamente un backup de la colección `tramos` con el formato `tramos_backup_[timestamp]`.

#### Especificar la URI de MongoDB

Si el script no puede detectar automáticamente la URI de MongoDB, puede especificarla como argumento:

```bash
node backend/scripts/ejecutarMigracion.js "mongodb://usuario:contraseña@host:puerto/basedatos"
```

El script intentará detectar la URI de MongoDB de las siguientes maneras:

1. Desde el archivo `config.js` si existe
2. Desde un archivo `.env` en el directorio raíz o en el directorio `backend`
3. Desde las variables de entorno `MONGODB_URI` o `MONGO_URI`

### Verificación

Después de la migración:

1. Verifique que la cantidad de documentos en la colección `tramos` sea menor que antes
2. Compruebe que las consultas de tramos funcionen correctamente
3. Verifique que las tarifas históricas se muestren correctamente en la interfaz

## Rollback

Si es necesario revertir la migración:

1. Elimine la colección `tramos` actual
2. Restaure la colección desde el backup creado durante la migración (`tramos_backup_[timestamp]`)

## Nuevas Funcionalidades

El nuevo modelo incluye:

- Método `getTarifaVigente(fecha, tipo)` para obtener la tarifa vigente a una fecha dada
- Método `getTarifasVigentes(fecha)` para obtener todas las tarifas vigentes a una fecha
- Virtual `tarifaVigente` para acceso directo a la tarifa actual
- Virtual `tarifasVigentes` para acceso a todas las tarifas vigentes

## Consideraciones Adicionales

- El campo `tipo` ahora forma parte del histórico, permitiendo que un mismo tramo tenga diferentes tipos en diferentes períodos
- Las validaciones se han actualizado para evitar superposición de fechas entre tarifas del mismo tipo y método de cálculo
- El índice compuesto ahora solo incluye origen, destino y cliente 