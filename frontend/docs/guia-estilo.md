# Guía de Estilo para el Frontend

Esta guía establece los estándares y mejores prácticas para mantener un estilo consistente en toda la aplicación frontend.

## Índice

1. [Sistema de Componentes UI](#sistema-de-componentes-ui)
2. [Tema y Estilos](#tema-y-estilos)
3. [Convenciones de Código](#convenciones-de-código)
4. [Migración de Componentes Existentes](#migración-de-componentes-existentes)
5. [Checklist de Revisión](#checklist-de-revisión)

## Sistema de Componentes UI

### Componentes Disponibles

Todos los componentes UI reutilizables se encuentran en el directorio `src/ui/components`. Siempre debes usar estos componentes en lugar de crear nuevos o usar directamente los de Material UI.

Componentes disponibles:

- **Table**: Tabla con funcionalidades de ordenación, paginación y búsqueda
- **Select**: Desplegable para selección de opciones

### Cómo Usar los Componentes

Importa los componentes desde el directorio `ui/components`:

```jsx
import { Table, Select } from '../ui/components';
```

### Agregar Nuevos Componentes

Si necesitas un componente que no existe en el sistema:

1. Verifica si realmente es necesario o si se puede adaptar uno existente
2. Consulta con el equipo para asegurarte de que no haya duplicación
3. Crea el nuevo componente en `src/ui/components/`
4. Exporta el componente en `src/ui/components/index.js`
5. Documenta el componente con JSDoc
6. Actualiza esta guía de estilo

## Tema y Estilos

### Configuración del Tema

El tema de la aplicación está definido en `src/theme/theme.js`. Cualquier cambio en este archivo afectará a toda la aplicación.

### Uso del Tema

Para acceder al tema en tus componentes:

```jsx
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <div style={{ color: theme.palette.primary.main }}>
      Este texto usa el color primario del tema
    </div>
  );
};
```

### Estilos Inline vs. Estilos del Tema

- **Preferir**: Usar el sistema de `sx` de Material UI que respeta el tema
- **Evitar**: Estilos inline con valores hardcodeados
- **Prohibido**: CSS global o estilos que sobrescriban los del tema

Ejemplo correcto:
```jsx
<Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
  Contenido
</Box>
```

Ejemplo incorrecto:
```jsx
<div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#ffffff' }}>
  Contenido
</div>
```

## Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase (ej. `UserProfile.js`)
- **Funciones**: camelCase (ej. `handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (ej. `MAX_ITEMS`)
- **Variables**: camelCase (ej. `userData`)

### Estructura de Archivos

- Un componente por archivo
- Exportación por defecto para componentes principales
- Exportaciones nombradas para utilidades y componentes secundarios

### Importaciones

Orden de importaciones:
1. React y bibliotecas de terceros
2. Componentes de UI propios
3. Utilidades y helpers
4. Estilos y assets

## Migración de Componentes Existentes

Para migrar componentes existentes al nuevo sistema:

1. Identifica los componentes de Material UI que estás usando directamente
2. Reemplázalos por los componentes equivalentes de nuestro sistema
3. Actualiza los estilos para usar el tema en lugar de valores hardcodeados
4. Prueba que todo funcione correctamente

### Ejemplo de Migración

Antes:
```jsx
import { Table, TableBody, TableCell, /* ... */ } from '@mui/material';

// Componente con Material UI directo
```

Después:
```jsx
import { Table } from '../ui/components';

// Componente con nuestro sistema de componentes
```

## Checklist de Revisión

Antes de enviar un PR, verifica que:

- [ ] Se usan los componentes del sistema UI en lugar de los de Material UI directamente
- [ ] No hay estilos hardcodeados, se usa el tema
- [ ] El código sigue las convenciones de nomenclatura
- [ ] Los componentes están documentados con JSDoc
- [ ] Se han realizado pruebas en diferentes tamaños de pantalla
- [ ] No hay warnings en la consola

## Recursos Adicionales

- [Documentación de Material UI](https://mui.com/material-ui/getting-started/)
- [Guía de Accesibilidad Web](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [React Patterns](https://reactpatterns.com/) 