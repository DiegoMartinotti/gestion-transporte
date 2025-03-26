# Guía de Importación Excel

Esta guía describe cómo usar las plantillas Excel estandarizadas para importar datos masivamente en el sistema.

## Índice

1. [Introducción](#introducción)
2. [Instrucciones Generales](#instrucciones-generales)
3. [Módulos con Importación Excel](#módulos-con-importación-excel)
   - [Vehículos](#vehículos)
   - [Tramos](#tramos)
   - [Clientes](#clientes)
   - [Personal](#personal)
   - [Viajes](#viajes)
   - [Sitios](#sitios)
   - [Empresas](#empresas)
4. [Solución de Problemas](#solución-de-problemas)

## Introducción

El sistema permite la importación masiva de datos mediante plantillas Excel estandarizadas. Estas plantillas incluyen validaciones y formatos predefinidos para facilitar la carga de información sin errores.

## Instrucciones Generales

1. **Descargar la plantilla**: Cada módulo proporciona un botón para descargar la plantilla específica.
2. **Completar la plantilla**: Rellene todos los campos requeridos siguiendo el formato indicado.
3. **Revisar los datos**: Verifique que la información sea correcta antes de importar.
4. **Importar el archivo**: Suba el archivo Excel completado.
5. **Revisar resultados**: El sistema mostrará un resumen de los datos importados y posibles errores.

### Notas importantes:

- Los campos marcados como obligatorios no pueden dejarse en blanco.
- Respete los formatos de fecha (DD/MM/YYYY) y números.
- La primera fila contiene los encabezados y no debe modificarse.
- Utilice las hojas de ayuda incluidas en el archivo para consultar valores válidos.

## Módulos con Importación Excel

### Vehículos

La plantilla de vehículos permite importar múltiples vehículos a la vez.

**Campos requeridos:**
- Matrícula/Placa
- Marca
- Modelo
- Capacidad
- Estado

**Consideraciones especiales:**
- Las matrículas deben ser únicas.
- El estado debe ser uno de los siguientes: "Activo", "Inactivo", "En Mantenimiento".
- La capacidad debe ser un número entero positivo.

### Tramos

La plantilla de tramos permite cargar rutas entre sitios con sus tarifas asociadas.

**Campos requeridos:**
- Origen
- Destino
- Distancia (km)
- Tarifa Base
- Fecha de Vigencia

**Consideraciones especiales:**
- El origen y destino deben ser sitios ya registrados en el sistema.
- La distancia debe ser un número positivo con hasta 2 decimales.
- La fecha de vigencia determina desde cuándo aplica la tarifa.
- Si ya existe un tramo con el mismo origen y destino, se actualizará la información.

### Clientes

La plantilla de clientes permite cargar múltiples clientes con su información de contacto.

**Campos requeridos:**
- Nombre/Razón Social
- Tipo de Documento
- Número de Documento
- Dirección
- Teléfono
- Email

**Consideraciones especiales:**
- El número de documento debe ser único en el sistema.
- El email debe tener formato válido.
- El tipo de documento debe ser uno de los siguientes: "DNI", "RUC", "CE", "Pasaporte".

### Personal

La plantilla de personal permite importar conductores y otro personal.

**Campos requeridos:**
- Nombre Completo
- Tipo de Documento
- Número de Documento
- Cargo
- Fecha de Contratación
- Empresa

**Consideraciones especiales:**
- El número de documento debe ser único.
- La empresa debe existir previamente en el sistema.
- Los cargos válidos se encuentran en la hoja "Catálogo" de la plantilla.
- La fecha de contratación debe estar en formato DD/MM/YYYY.

### Viajes

La plantilla de viajes permite cargar múltiples registros de viajes realizados.

**Campos requeridos:**
- Fecha
- Origen
- Destino
- Vehículo
- Conductor
- Cliente
- Estado

**Consideraciones especiales:**
- El origen y destino deben ser sitios ya registrados.
- El vehículo y conductor deben existir previamente en el sistema.
- El cliente debe estar registrado en el sistema.
- Los estados válidos son: "Programado", "En Curso", "Completado", "Cancelado".

### Sitios

La plantilla de sitios permite cargar ubicaciones geográficas.

**Campos requeridos:**
- Nombre
- Dirección
- Ciudad
- Provincia/Estado
- País

**Campos opcionales:**
- Latitud
- Longitud
- Referencia
- Tipo de Sitio

**Consideraciones especiales:**
- Si se proporcionan coordenadas, deben ser válidas (latitud entre -90 y 90, longitud entre -180 y 180).
- Si no se proporcionan coordenadas, el sistema intentará geocodificarlas a partir de la dirección.
- El tipo de sitio debe ser uno de los valores predefinidos en la hoja "Catálogo".

### Empresas

La plantilla de empresas permite importar múltiples empresas.

**Campos requeridos:**
- Razón Social
- RUC/Identificación Fiscal
- Dirección
- Teléfono

**Campos opcionales:**
- Email
- Sitio Web
- Contacto Principal
- Teléfono de Contacto

**Consideraciones especiales:**
- El RUC/Identificación Fiscal debe ser único en el sistema.
- Si se proporciona email, debe tener formato válido.

## Solución de Problemas

### Errores comunes y soluciones:

1. **"Campo requerido vacío"**
   - Asegúrese de completar todos los campos marcados como obligatorios.

2. **"Formato de fecha inválido"**
   - Use el formato DD/MM/YYYY para todas las fechas.

3. **"Registro duplicado"**
   - Verifique que no esté intentando importar un elemento que ya existe con el mismo identificador.

4. **"Referencia no existente"**
   - Cuando un campo hace referencia a otro elemento (como un sitio, vehículo o conductor), asegúrese de que ese elemento ya existe en el sistema.

5. **"Valor fuera de rango"**
   - Algunos campos tienen restricciones de valor. Consulte las hojas de ayuda para conocer los rangos válidos.

Si persisten los problemas, contacte al administrador del sistema para obtener asistencia. 