# Sistema de Gestión de Viajes

## Descripción General

Este proyecto es un sistema completo para la gestión de viajes, rutas de transporte, clientes y sitios. Está diseñado para empresas de logística y transporte que necesitan administrar eficientemente sus operaciones.

El sistema permite:
- Gestionar clientes y sus ubicaciones (sites)
- Administrar tramos y rutas de transporte
- Calcular tarifas para diferentes rutas
- Planificar y dar seguimiento a viajes
- Importar y exportar datos en formato Excel
- Autenticación y autorización de usuarios

La aplicación está construida con una arquitectura moderna de frontend y backend separados, siguiendo principios de programación funcional y con un enfoque en la seguridad y la experiencia de usuario.

## Tecnologías Utilizadas

### Backend
- **Node.js** y **Express.js**: Para el servidor API RESTful
- **MongoDB** con **Mongoose**: Como base de datos y ORM
- **JWT**: Para autenticación y autorización
- **bcryptjs**: Para el hash seguro de contraseñas
- **Swagger/OpenAPI**: Para documentación interactiva de la API

### Frontend
- **React 19**: Biblioteca para construir la interfaz de usuario
- **React Router 7**: Para la navegación entre páginas
- **Material-UI (MUI)**: Framework de componentes UI
- **Axios**: Para realizar peticiones HTTP
- **XLSX**: Para importación/exportación de datos Excel
- **TanStack Table**: Para tablas de datos avanzadas

### Herramientas de Desarrollo
- **Nodemon**: Para reinicio automático del servidor durante desarrollo
- **Concurrently**: Para ejecutar múltiples comandos simultáneamente
- **dotenv**: Para gestión de variables de entorno

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

2. **Instalar todas las dependencias**
   ```bash
   npm run install-all
   ```
   Este comando instalará las dependencias del proyecto principal, frontend y backend.

3. **Configurar variables de entorno**
   
   En el directorio raíz del backend, crea un archivo `.env` con el siguiente contenido:
   ```
   MONGODB_URI=mongodb://localhost:27017/gestion-viajes
   JWT_SECRET=tu_clave_secreta_jwt
   PORT=5000
   NODE_ENV=development
   ```

   En el directorio raíz del frontend, crea un archivo `.env` con:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_ENV=development
   ```

4. **Iniciar la aplicación en modo desarrollo**
   ```bash
   npm run dev
   ```
   Este comando iniciará tanto el servidor backend como el frontend.

## Estructura del Proyecto

```
sistema-gestion-viajes/
├── backend/                # Servidor API
│   ├── config/             # Configuración (base de datos, etc.)
│   ├── controllers/        # Controladores de la API
│   ├── middleware/         # Middleware (autenticación, validación)
│   ├── models/             # Modelos de datos Mongoose
│   ├── routes/             # Rutas de la API
│   ├── services/           # Servicios y lógica de negocio
│   ├── utils/              # Utilidades y helpers
│   ├── validators/         # Validadores de entrada
│   ├── app.js              # Aplicación Express
│   └── server.js           # Punto de entrada del servidor
│
├── frontend/               # Aplicación React
│   ├── public/             # Archivos estáticos
│   ├── src/                # Código fuente
│   │   ├── components/     # Componentes React
│   │   ├── context/        # Contextos de React (Auth, etc.)
│   │   ├── services/       # Servicios para API
│   │   ├── theme/          # Configuración de tema MUI
│   │   ├── ui/             # Componentes UI reutilizables
│   │   └── utils/          # Utilidades y helpers
│   └── package.json        # Dependencias del frontend
│
├── docs/                   # Documentación del proyecto
│   ├── API.md              # Documentación de la API
│   └── technical/          # Documentación técnica detallada
│
├── scripts/                # Scripts de utilidad
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Dependencias del proyecto principal
└── README.md               # Este archivo
```

## Uso

### Acceso a la Aplicación
- Frontend: http://localhost:3000
- API Backend: http://localhost:5000/api
- Documentación API (Swagger): http://localhost:5000/api-docs

### Autenticación
Para acceder al sistema, utiliza las siguientes credenciales de prueba:
- Email: admin@ejemplo.com
- Contraseña: password123

## Pruebas

Para ejecutar las pruebas del backend:
```bash
cd backend
npm test
```

Para ejecutar las pruebas del frontend:
```bash
cd frontend
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
- Sigue las convenciones de estilo estándar de JavaScript/React
- Documenta todas las funciones públicas con JSDoc
- Escribe pruebas unitarias para toda la funcionalidad nueva
- Valida y sanitiza todas las entradas de usuario

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Si tienes preguntas o sugerencias, por favor abre un issue en el repositorio o contacta al equipo de desarrollo.
