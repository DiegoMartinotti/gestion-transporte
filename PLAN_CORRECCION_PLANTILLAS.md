# Plan de Corrección: Plantillas Excel vs Modelos Backend

## Objetivo
Sincronizar completamente las plantillas Excel en `ExcelTemplateService.ts` con los modelos reales del backend, eliminando adaptaciones arbitrarias y asegurando correspondencia exacta con la lógica de negocio. 

Al completar cada punto marcar [] como completado.

---

## 1. Cliente

### Campos Actuales en Plantilla:
- RUC ❌ 
- Nombre ✅
- Email ❌
- Teléfono ❌
- Dirección ❌

### Campos del Modelo:
- nombre ✅ (required, unique)
- cuit ✅ (required)
- activo ✅ (boolean, default: true)

### Acciones Requeridas:
- [x] Cambiar `RUC` → `CUIT`
- [x] Remover campos: `Email`, `Teléfono`, `Dirección`
- [x] Al dar de alta, el campo activo es por default true
- [x] Actualizar validaciones en instrucciones para CUIT argentino
- [x] Marcar campos obligatorios con `*`

### Observaciones:
Los campos `createdAt` y `updatedAt` se generan automáticamente por Mongoose.

---

## 2. Empresa

### Campos Actuales en Plantilla:
- RUC ❌
- Nombre ✅
- Email ❌
- Teléfono ❌
- Dirección ❌

### Campos del Modelo:
- nombre ✅ (required, unique)
- tipo ✅ (enum: 'Propia' | 'Subcontratada', required)
- razonSocial ❌ (opcional)
- direccion ❌ (opcional)
- telefono ❌ (opcional)
- mail ❌ (opcional, validation email)
- cuit ❌ (opcional, validation CUIT)
- contactoPrincipal ❌ (opcional)
- activa ✅ (boolean, default: true)
- observaciones ❌ (opcional)
- flota ❌ (auto-managed por sistema)
- personal ❌ (auto-managed por sistema)

### Acciones Requeridas:
- [x] Cambiar `RUC` → `CUIT` (opcional)
- [x] Cambiar `Email` → `Mail`
- [x] Agregar campo: `Tipo *` (dropdown: Propia/Subcontratada)
- [x] Agregar campo: `Razón Social`
- [x] Agregar campo: `Contacto Principal`
- [x] campo: `Activa` por defecto true al dar de alta
- [x] Agregar campo: `Observaciones`
- [x] Mantener: `Nombre *`, `Dirección`, `Teléfono`, `Mail`
- [x] Actualizar validaciones para CUIT y email
- [x] NO incluir campos auto-managed: `flota`, `personal`

---

## 3. Personal

### Campos Actuales en Plantilla:
- DNI ✅
- Nombres ❌ → debe ser `Nombre`
- Apellidos ❌ → debe ser `Apellido`
- Email ❌ → debe estar en sub-objeto `contacto`
- Teléfono ❌ → debe estar en sub-objeto `contacto`
- Cargo ❌ → debe ser `Tipo`
- Empresa RUC ❌ → debe ser referencia a nombre de empresa

### Campos del Modelo (simplificados para importación):
- nombre ✅ (required)
- apellido ✅ (required)
- dni ✅ (required, unique, validation)
- cuil ❌ (opcional, validation)
- tipo ✅ (enum: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro', required)
- fechaNacimiento ❌ (opcional)
- empresa ✅ (ObjectId referencia, required)
- activo ✅ (boolean, default: true)
- contacto.telefono ❌ (opcional)
- contacto.email ❌ (opcional, validation)
- numeroLegajo ❌ (auto-generated por sistema)

### Acciones Requeridas:
- [x] Cambiar `Nombres` → `Nombre *`
- [x] Cambiar `Apellidos` → `Apellido *`
- [x] Cambiar `Cargo` → `Tipo *` (enum: Conductor/Administrativo/Mecánico/Supervisor/Otro)
- [x] Cambiar `Empresa RUC` → `Empresa *` (nombre de empresa, no RUC)
- [x] Agregar campo: `CUIL`
- [x] Agregar campo: `Fecha Nacimiento` (DD/MM/AAAA)
- [x] campo: `Activo` por defecto true al dar de alta
- [x] Mantener: `DNI *`, `Email`, `Teléfono`
- [x] NO incluir: `numeroLegajo` (auto-generated)
- [x] Actualizar validaciones para DNI y CUIL

- [x] La plantilla debe tener una hoja con las empresas disponibles en la BD

---

## 4. Site

### Campos Actuales en Plantilla:
- Nombre ✅
- Dirección ❌ → opcional
- Latitud ❌ → debe ser coordenadas GeoJSON
- Longitud ❌ → debe ser coordenadas GeoJSON
- Cliente RUC ❌ → debe ser nombre de cliente
- Descripción ❌ → no existe en modelo

### Campos del Modelo:
- nombre ✅ (required)
- cliente ✅ (ObjectId referencia, required)
- codigo ❌ (opcional)
- location ✅ (GeoJSON Point, required)
- direccion ❌ (opcional, default: '-')
- localidad ❌ (opcional)
- provincia ❌ (opcional)

### Acciones Requeridas:
- [x] Cambiar `Cliente RUC` → `Cliente *` (nombre de cliente)
- [x] Cambiar `Latitud/Longitud` → `Coordenadas` (formato: "lng,lat")
- [x] Remover campo: `Descripción`
- [x] Agregar campo: `Código`
- [x] Agregar campo: `Localidad`
- [x] Agregar campo: `Provincia`
- [x] Mantener: `Nombre *`, `Dirección`
- [x] Actualizar instrucciones para formato de coordenadas
- [x] La plantilla debe tener una hoja con los clientes disponibles en la BD
---

## 5. Vehículo

### Campos Actuales en Plantilla:
- Placa ❌ → debe ser `Dominio`
- Marca ✅
- Modelo ✅
- Año ❌ → debe ser `Año`
- Capacidad Carga ❌ → debe estar en sub-objeto `caracteristicas`
- Empresa RUC ❌ → debe ser nombre de empresa
- Estado ❌ → debe ser `Activo` (boolean)

### Campos del Modelo (simplificados para importación):
- dominio ✅ (required, unique, validation patente argentina)
- tipo ✅ (enum, required)
- marca ❌ (opcional)
- modelo ❌ (opcional)
- año ❌ (opcional, validation range)
- numeroChasis ❌ (opcional)
- numeroMotor ❌ (opcional)
- empresa ✅ (ObjectId referencia, required)
- caracteristicas.capacidadCarga ❌ (opcional)
- activo ✅ (boolean, default: true)

### Acciones Requeridas:
- [x] Cambiar `Placa` → `Dominio *`
- [x] Cambiar `Año` → `Año`
- [x] Cambiar `Empresa RUC` → `Empresa *` (nombre de empresa)
- [x] Agregar campo: `Tipo *` (enum: Camión/Acoplado/Semirremolque/Bitren/Furgón/Utilitario)
- [x] Agregar campo: `Número Chasis`
- [x] Agregar campo: `Número Motor`
- [x] Mantener: `Marca`, `Modelo`, `Capacidad Carga`
- [x] Actualizar validaciones para formato de patente argentina
- [x] Remover campo: `Activo` (se da de alta automáticamente como true)

- [x] La plantilla debe tener una hoja con las empresas disponibles en la BD

---

## 6. Tramo

### Campos Actuales en Plantilla:
- Nombre ❌ → no existe en modelo
- Site Origen ✅ → debe ser nombre de site
- Site Destino ✅ → debe ser nombre de site
- Cliente RUC ❌ → debe ser nombre de cliente
- Distancia KM ❌ → se calcula automáticamente
- Precio Base ❌ → no existe, se maneja en tarifas históricas
- Activo ❌ → no existe en modelo

### Campos del Modelo:
- origen ✅ (ObjectId referencia Site, required)
- destino ✅ (ObjectId referencia Site, required)
- cliente ✅ (ObjectId referencia Cliente, required)
- distancia ❌ (se calcula automáticamente)
- tarifasHistoricas ❌ (complejo, no para importación básica)

### Acciones Requeridas:
- [ ] Remover campo: `Nombre`
- [ ] Cambiar `Cliente RUC` → `Cliente *` (nombre de cliente)
- [ ] Cambiar `Site Origen` → `Site Origen *` (nombre de site)
- [ ] Cambiar `Site Destino` → `Site Destino *` (nombre de site)
- [ ] Remover campos: `Distancia KM`, `Precio Base`, `Activo`
- [ ] Actualizar instrucciones: la distancia se calcula automáticamente
- [ ] El usuario puede subir las tarifas en este momento. Incluir campos valor, valorPeaje, vigenciaDesde, vigenciaHasta,tipo y metodoCalculo. No son obligatorios, pero si agrega un de ellos tiene que completarlos todos.
- [ ] La plantilla debe tener una hoja con los clientes disponibles en la BD
- [ ] La plantilla debe tener una hoja con los sites disponibles en la BD (en esta hoja, cada site debe indicar a que cliente pertenece en otra columna)


---

## 7. Viaje

### Campos Actuales en Plantilla:
- Tramo ❌ → debe separarse en Cliente, Origen, Destino
- Vehículo Placa ❌ → debe ser dominio de vehículo
- Conductor DNI ❌ → debe ser referencia a personal
- Fecha Inicio ❌ → debe ser `Fecha`
- Fecha Fin ❌ → no existe en modelo
- Carga KG ❌ → no existe directamente
- Observaciones ✅

### Campos del Modelo (simplificados para importación):
- cliente ✅ (ObjectId referencia, required)
- fecha ✅ (Date, required)
- origen ✅ (ObjectId referencia Site, required)
- destino ✅ (ObjectId referencia Site, required)
- tipoTramo ✅ (enum: 'TRMC' | 'TRMI', required)
- chofer ✅ (ObjectId referencia Personal, required)
- vehiculos ✅ (array con al menos 1 vehículo)
- tipoUnidad ✅ (enum: 'Sider' | 'Bitren', auto-calculado)
- paletas ✅ (number, default: 0)
- dt ✅ (string, required, unique por cliente)
- estado ✅ (enum, default: 'Pendiente')
- observaciones ❌ (opcional)

### Acciones Requeridas:
- [ ] Cambiar `Tramo` → separar en `Cliente *`, `Site Origen *`, `Site Destino *`
- [ ] Cambiar `Vehículo Placa` → `Vehículo Principal *` (dominio)
- [ ] Cambiar `Conductor DNI` → `Chofer *` (DNI o nombre)
- [ ] Cambiar `Fecha Inicio` → `Fecha *` (DD/MM/AAAA)
- [ ] Remover campo: `Fecha Fin`, `Carga KG`
- [ ] Agregar campo: `Tipo Tramo *` (TRMC/TRMI)
- [ ] Agregar campo: `Paletas` (número)
- [ ] Agregar campo: `DT *` (código único)
- [ ] Agregar campo: `Estado` (Pendiente/En Curso/Completado/Cancelado)
- [ ] Mantener: `Observaciones`
- [ ] Nota: `tipoUnidad` se calcula automáticamente del vehículo principal

---

## 8. Extra

### Campos Actuales en Plantilla:
- Nombre ❌ → debe ser `Tipo`
- Descripción ✅
- Precio ❌ → debe ser `Valor`
- Tipo ❌ → no existe en modelo
- Activo ❌ → no existe, se maneja por vigencia

### Campos del Modelo:
- tipo ✅ (string, required, uppercase)
- cliente ✅ (ObjectId referencia, required)
- descripcion ❌ (opcional)
- vigenciaDesde ✅ (Date, required)
- vigenciaHasta ✅ (Date, required)
- valor ✅ (number, required, min: 0)

### Acciones Requeridas:
- [ ] Cambiar `Nombre` → `Tipo *`
- [ ] Cambiar `Precio` → `Valor *`
- [ ] Remover campo: `Tipo`, `Activo`
- [ ] Agregar campo: `Cliente *` (nombre de cliente)
- [ ] Agregar campo: `Vigencia Desde *` (DD/MM/AAAA)
- [ ] Agregar campo: `Vigencia Hasta *` (DD/MM/AAAA)
- [ ] Mantener: `Descripción`
- [ ] Actualizar validaciones para fechas y valores

---

## Consideraciones Generales

### Campos Auto-Generados (NO incluir en plantillas):
- `_id`, `createdAt`, `updatedAt` (todos los modelos)
- `numeroLegajo` (Personal - auto-generated)
- `distancia` (Tramo - auto-calculated)
- `tipoUnidad` (Viaje - auto-calculated from vehicle)
- `tarifa`, `peaje`, `total` (Viaje - auto-calculated)
- `flota`, `personal` (Empresa - auto-managed)

### Referencias entre Entidades:
- Usar **nombres** en lugar de IDs en las plantillas
- El sistema debe resolver las referencias durante la importación
- Validar que las entidades referenciadas existan

### Validaciones Especiales:
- CUIT: formato argentino
- DNI: 7-8 dígitos
- CUIL: formato 11-11111111-1
- Patente: formato argentino (ABC123 o AB123CD)
- Email: formato válido
- Fechas: formato DD/MM/AAAA

### Instrucciones Mejoradas:
- [ ] Explicar qué campos son obligatorios (*)
- [ ] Documentar formatos esperados
- [ ] Incluir ejemplos de valores válidos
- [ ] Explicar qué campos se calculan automáticamente
- [ ] Documentar relaciones entre entidades

---

## Próximos Pasos

1. **Revisar este plan** y ajustar según necesidades específicas
2. **Implementar las correcciones** en `ExcelTemplateService.ts`
3. **Probar la generación** de cada plantilla
4. **Verificar la compatibilidad** con el sistema de importación
5. **Actualizar documentación** del usuario final

---

*Nota: Este plan se basa en el análisis de los modelos actuales. Algunos ajustes pueden ser necesarios según la lógica de negocio específica y los requerimientos del usuario.*