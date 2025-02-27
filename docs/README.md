# Sistema de Gestión de Viajes - Documentación

## Estructura de la Documentación

```
docs/
├── API.md               # Documentación general de la API
└── technical/          # Documentación técnica detallada
    ├── README.md       # Guía de la documentación técnica
    ├── architecture.md # Arquitectura del sistema
    └── endpoints.md    # Especificación detallada de endpoints
```

## Documentación de API

La documentación de la API está disponible en tres formatos:

1. [Guía rápida de la API](./API.md) - Documentación básica para empezar
2. [Documentación técnica](./technical/) - Detalles técnicos profundos
3. Documentación interactiva - Disponible en `/api-docs` al ejecutar el servidor

## Documentación Swagger

La documentación interactiva de la API está implementada usando OpenAPI/Swagger y está disponible en:
- Desarrollo: http://localhost:5000/api-docs
- Producción: https://tu-dominio.com/api-docs

### Características Documentadas

- Autenticación JWT
- Endpoints RESTful
- Modelos de datos
- Códigos de respuesta
- Ejemplos de uso
- Manejo de errores

## Contribuir a la Documentación

1. Mantén la documentación actualizada con cada cambio de código
2. Sigue el formato establecido en los archivos existentes
3. Incluye ejemplos prácticos cuando sea posible
4. Documenta todos los cambios que rompan compatibilidad
5. Actualiza la documentación de Swagger junto con los cambios de API

## Recursos Adicionales

- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [Changelog](../CHANGELOG.md)