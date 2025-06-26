# Sistema de Gestión de Transporte

## Descripción General

Este proyecto es un **Sistema de Gestión de Transporte** (Transportation Management System) - un sistema completo full-stack para la gestión de logística de transporte incluyendo clientes, sitios, rutas, vehículos, viajes y facturación. Cuenta con una API REST backend completamente migrada a TypeScript y un frontend moderno en desarrollo.

El sistema permite:
- Gestionar clientes y sus ubicaciones (sites)
- Administrar tramos y rutas de transporte
- Calcular tarifas complejas con fórmulas personalizadas por cliente
- Planificar y dar seguimiento a viajes con múltiples vehículos
- Gestión de geocodificación y cálculos de distancia
- Sistema de extras y modificaciones de precios
- Importar y exportar datos en formato Excel
- Autenticación JWT y autorización de usuarios

El sistema está construido con una arquitectura moderna de frontend y backend separados, siguiendo principios de programación funcional y con un enfoque en la seguridad, rate limiting y experiencia de usuario.

## Tecnologías Utilizadas

### Backend (TypeScript - Completamente migrado)
- **Node.js** y **Express.js**: Para el servidor API RESTful
- **MongoDB** con **Mongoose**: Como base de datos y ORM
- **JWT**: Para autenticación y autorización
- **bcryptjs**: Para el hash seguro de contraseñas
- **Swagger/OpenAPI**: Para documentación interactiva de la API
- **TypeScript**: ✅ **Migración 100% completa** con configuración estricta
- **MathJS**: Para cálculos dinámicos de fórmulas de precios
- **Rate Limiting**: Control de límites de peticiones
- **Geocoding API**: Integración para cálculos de distancia

### Frontend (En desarrollo activo)
- **React**: Biblioteca para construir la interfaz de usuario
- **Mantine**: Framework de componentes UI moderno
- **TypeScript**: Para tipado estático en el frontend
- **React Router**: Para la navegación entre páginas
- **Axios**: Para realizar peticiones HTTP
- **XLSX**: Para importación/exportación de datos Excel

### Estado de Migración TypeScript

✅ **MIGRACIÓN BACKEND COMPLETA (100%)**:
- `config/`, `middleware/`, `utils/`, `validators/` ✅
- `controllers/`, `services/`, `routes/` ✅
- **Todos los modelos**: Cliente, Empresa, Extra, Personal, OrdenCompra, Site, Tramo, Usuario, Vehiculo, Viaje ✅
- **Archivos principales**: server.ts, app.ts, index.ts ✅
- **33 controladores, 6 servicios, 17 rutas**: Todo migrado ✅

### Herramientas de Desarrollo
- **Nodemon**: Para reinicio automático del servidor durante desarrollo
- **TypeScript**: Configuración estricta completa
- **dotenv**: Para gestión de variables de entorno
- **Concurrently**: Para ejecutar múltiples comandos simultáneamente
- **Vite**: Build tool moderno para el frontend

## Arquitectura del Sistema

### Jerarquía del Dominio de Transporte
```
Cliente → Site → Tramo → Viaje
```

- **Cliente**: Empresas que necesitan servicios de transporte
- **Site**: Ubicaciones físicas de los clientes (con geocodificación)
- **Tramo**: Segmentos de ruta entre sitios con reglas de precios específicas
- **Viaje**: Viajes individuales usando tramos con cálculos de precios complejos
- **Vehículo**: Configuraciones de vehículos que soportan múltiples camiones por viaje

### Características Clave del Sistema de Negocio

1. **Sistema de Precios Complejo**:
   - Tarifas históricas con versionado
   - Fórmulas personalizadas por cliente usando MathJS
   - Múltiples métodos de cálculo (distancia, peso, tiempo)
   - Cargos extras y modificaciones

2. **Integración de Geocodificación**:
   - Servicio proxy para búsquedas de ubicación
   - Cálculos de distancia entre sitios
   - Llamadas a API externa con límite de tasa

3. **Importación/Exportación Excel**:
   - Operaciones masivas con plantillas personalizadas
   - Transformación y validación de datos
   - Preservación de datos históricos

## Estándares del Proyecto

### Documentación
Este proyecto sigue estrictos estándares de documentación para mantener el código mantenible y comprensible. Los estándares completos se encuentran en [docs/DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md).

Aspectos destacados:
- Documentación JSDoc completa para todos los componentes
- Ejemplos de uso y casos de prueba
- Documentación de APIs y endpoints
- Guías de estilo y convenciones
- Plantillas para diferentes tipos de archivos

Para contribuir al proyecto, asegúrate de revisar y seguir estos estándares de documentación.

## Instalación y Configuración

### Requisitos Previos
- Node.js (v14 o superior)
- MongoDB (v4.4 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-gestion-viajes.git
   cd sistema-gestion-viajes
   ```

2. **Instalar dependencias**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend (si está disponible)
   cd ../frontend
   npm install
   ```

3. **Configurar variables de entorno**
   
   En el directorio raíz del backend, crea un archivo `.env` con el siguiente contenido:
   ```
   MONGODB_URI=mongodb://localhost:27017/gestion-viajes
   JWT_SECRET=tu_clave_secreta_jwt
   PORT=5000
   NODE_ENV=development
   ```

4. **Iniciar la aplicación en modo desarrollo**
   ```bash
   # Solo backend
   cd backend
   npm run dev
   
   # Full-stack (cuando el frontend esté disponible)
   npm run dev:all
   ```

## Estructura del Proyecto

```
gestion-transporte/
├── backend/                        # API REST del servidor (TypeScript ✅)
│   ├── config/                     # Configuración (TypeScript ✅)
│   ├── controllers/                # Controladores de la API (TypeScript ✅ - 33 archivos)
│   ├── middleware/                 # Middleware (TypeScript ✅)
│   ├── models/                     # Modelos Mongoose (TypeScript ✅)
│   ├── routes/                     # Rutas de la API (TypeScript ✅ - 17 archivos)
│   ├── services/                   # Servicios y lógica de negocio (TypeScript ✅ - 6 archivos)
│   ├── utils/                      # Utilidades y helpers (TypeScript ✅)
│   ├── validators/                 # Validadores de entrada (TypeScript ✅)
│   ├── server.ts                   # Aplicación Express y punto de entrada
│   ├── tsconfig.json               # Configuración TypeScript
│   └── package.json                # Dependencias del backend
│
├── frontend/                       # Aplicación React (En desarrollo)
│   ├── src/                        # Código fuente del frontend
│   ├── public/                     # Archivos estáticos
│   ├── package.json                # Dependencias del frontend
│   └── vite.config.ts              # Configuración de Vite
│
├── CLAUDE.md                       # Instrucciones para Claude Code
├── README.md                       # Este archivo
└── .gitignore                      # Archivos ignorados por Git
```

## Uso

### Acceso a la Aplicación
- Frontend: http://localhost:3000 (cuando esté disponible)
- API Backend: http://localhost:5000/api
- Documentación API (Swagger): http://localhost:5000/api-docs

### Endpoints Principales

Principales endpoints siguiendo patrones RESTful:
- `/api/auth` - Autenticación JWT
- `/api/clientes` - Gestión de clientes  
- `/api/sites` - Gestión de ubicaciones con geocodificación
- `/api/tramos` - Segmentos de ruta con precios complejos
- `/api/viajes` - Gestión de viajes y cálculos
- `/api/vehiculos` - Gestión de flota de vehículos
- `/api/extras` - Cargos adicionales

### Autenticación
Para acceder al sistema, utiliza las siguientes credenciales de prueba:
- Email: admin@ejemplo.com
- Contraseña: password123

## Comandos de Desarrollo

```bash
# Backend
cd backend
npm run dev                 # Iniciar servidor de desarrollo con nodemon
npm run build              # Compilar TypeScript a JavaScript
npm start                  # Ejecutar build de producción
npm run setup-env          # Configurar variables de entorno

# Frontend (cuando esté disponible)
cd frontend
npm run dev                 # Iniciar servidor de desarrollo
npm run build              # Build de producción
npm run preview            # Preview del build

# Full-stack
npm run dev:all            # Iniciar backend y frontend simultáneamente
```

## Seguridad y Rate Limiting

- Autenticación JWT con expiración configurable
- Rate limiting: 100 req/15min general, 10 req/min para proxy de geocodificación
- Validación de entrada usando validadores personalizados (TypeScript)
- Headers CORS y de seguridad configurados

## Base de Datos (MongoDB)

Usando Mongoose ODM con:
- Relaciones complejas entre entidades de transporte
- Preservación de datos históricos para precios
- Indexación geoespacial para datos de ubicación
- Validación personalizada y middleware

## Pruebas

Para ejecutar las pruebas del backend:
```bash
cd backend
npm test
```

## Cómo Contribuir

1. **Fork** el repositorio
2. Crea una **rama** para tu funcionalidad (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios y asegúrate de seguir las convenciones de código
4. Ejecuta las pruebas para asegurar que todo funciona correctamente
5. Haz **commit** de tus cambios (`git commit -m 'Add some amazing feature'`)
6. **Push** a la rama (`git push origin feature/amazing-feature`)
7. Abre un **Pull Request**

### Convenciones de Código
- Utiliza programación funcional cuando sea posible
- Sigue las convenciones de estilo estándar de JavaScript/TypeScript
- Documenta todas las funciones públicas con JSDoc
- Escribe pruebas unitarias para toda la funcionalidad nueva
- Valida y sanitiza todas las entradas de usuario
- Mantén la funcionalidad JavaScript existente durante la migración

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Si tienes preguntas o sugerencias, por favor abre un issue en el repositorio o contacta al equipo de desarrollo.

## Configuración de Variables de Entorno

Para proteger las claves de acceso a la base de datos y otras credenciales, sigue estos pasos:

1. En el directorio backend, ejecuta el script de configuración:

```bash
cd backend
npm run setup-env
```

2. El script te solicitará la información necesaria para conectarte a la base de datos y generará un archivo .env con las credenciales protegidas.

3. Nunca compartas el archivo .env en el repositorio o con otros desarrolladores. Cada desarrollador debe configurar su propio archivo .env.

4. Para entornos de producción, configura las variables de entorno directamente en el servidor, sin usar archivos .env.

### Ejemplo de Variables de Entorno

El archivo .env.example muestra la estructura de las variables de entorno necesarias:

```
MONGODB_URI=mongodb+srv://usuario:${DB_PASSWORD}@host/database?options
JWT_SECRET=${JWT_SECRET_KEY}
PORT=3001
SERVER_URL=http://localhost:3001
NODE_ENV=production
DB_PASSWORD=tu_contraseña_aquí
JWT_SECRET_KEY=tu_clave_secreta_aquí
```