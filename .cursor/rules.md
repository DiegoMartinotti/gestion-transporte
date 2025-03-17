# RULES.md

## Descripción del Proyecto
Desarrollo de una aplicación web para gestión administrativa y operativa de empresas logísticas. Centraliza registro, planificación de viajes, cálculo automático de tarifas, control de facturación, generación dinámica de reportes y manejo seguro de usuarios. Integración básica con Excel y foco en rendimiento, seguridad y escalabilidad.

## 1. STACK TECNOLÓGICO
- **Frontend:** React, Material UI, TanStack
- **Backend:** Node.js, Express.js
- **Base de Datos:** MongoDB con Mongoose
- **HTTP Cliente:** Axios

## Estándares Tecnológicos
- Autenticación robusta con JWT.
- Infraestructura escalable en servicios cloud.

## 1. TECNOLOGÍA
- **Frontend:** React v18+, Material UI
- **Backend:** Node.js v18+ con Express.js
- **Base de datos:** MongoDB (última versión estable).
- **Control de versiones:** Git (ramas protegidas: main, dev).

## 2. ESTÁNDARES TÉCNICOS

### Convenciones de Nombres
- Archivos/componentes React: PascalCase (Ej: `ListaClientes.jsx`)
- Funciones, métodos: camelCase (Ej: `calcularTarifa()`)
- Variables locales/estado: camelCase (Ej: `estadoPago`)
- Constantes globales: UPPERCASE (Ej: `MAX_VIAJES_POR_DIA`)

### Organización del Código
```
src/
├── components
├── pages
├── api
├── services
├── utils
├── hooks
├── context
├── config
└── assets
```

### Arquitectura
- Utilizar patrón MVC en backend.
- Componentes reutilizables en frontend.
- Implementación de arquitectura RESTful para APIs.

### Gestión de Estado
- React Context para estados globales.
- React Query (TanStack) para manejo eficiente de estado asíncrono.

### Gestión de Datos y APIs
- Validar todas las entradas con esquemas definidos (Mongoose schemas).
- Estandarizar respuestas HTTP (códigos y estructuras consistentes).

### Rendimiento y Optimización
- Tiempo de respuesta máximo: 3 segundos.
- Uso optimizado de índices en MongoDB.
- Caché eficiente para consultas frecuentes.

### Seguridad
- Tokens JWT con expiración y renovación segura.
- Protección contra inyección (SQL/NoSQL).
- Validaciones estrictas de inputs.
- Manejo seguro de contraseñas (bcrypt).

## 3. ESTÁNDARES DE DESARROLLO

### Testing
- Tests unitarios y de integración (Jest/Mocha).
- Cobertura mínima: 80%.

### Documentación
- Comentarios claros y concisos en código.
- Documentación API con Swagger.

## 2. ESTÁNDARES GENERALES

### Seguimiento de Requisitos
- Cumplir estrictamente con requisitos del PRD.
- Revisar edge cases indicados en las features.

### Calidad del Código
- Código limpio y legible.
- Evitar código duplicado; promover DRY (Don't Repeat Yourself).

### Completitud
- No dejar TODOs ni placeholders.
- Código debe estar listo para producción.

### Comunicación
- Preguntar claramente ante ambigüedades.
- Mantener actualizada la documentación de cambios.

## 3. ESTÁNDARES DE DESPLIEGUE
- CI/CD automatizado con pruebas integradas.
- Despliegues en entorno aislado antes de producción.

## 4. ESTÁNDARES DE CALIDAD Y PRUEBAS
- Performance audit con herramientas (Lighthouse).
- Pruebas unitarias, de integración y e2e obligatorias.

## 5. IMPLEMENTACIÓN Y CALIDAD

### Umbrales de Calidad
- Cumplimiento de requisitos funcionales al 100%.
- Validación exhaustiva de edge cases indicados.

### Priorización del Desarrollo
- Completar MVP según fases indicadas en el PRD.
- Priorizar rendimiento y seguridad desde el inicio.

## 4. GUIAS GENERALES DE DESARROLLO

### Calidad del Código
- Código fácilmente legible y modular.
- Sin placeholders o TODOs en código final.

### Compleción
- No dejar pendientes que no estén documentados o aprobados explícitamente.
- Código limpio, organizado y bien estructurado.

## 4. MANEJO DE DATOS
- Integración robusta con Excel (importación/exportación).
- Formatos validados y consistentes para intercambio de información.

## 5. REPORTES
- Reportes dinámicos y configurables.
- Exportación confiable a Excel.
- Optimización de consultas para grandes volúmenes de datos.

## PREGUNTAS ABIERTAS (A resolver)
- Especificaciones futuras sobre integraciones con sistemas externos.
- Detalles específicos sobre restricciones regulatorias aplicables.