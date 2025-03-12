# Sistema de Componentes UI

Este directorio contiene un sistema de componentes UI reutilizables para mantener un estilo consistente en toda la aplicación.

## Estructura

- `components/`: Componentes UI reutilizables
- `theme/`: Configuración del tema de la aplicación

## Uso

### Importar componentes

Para usar los componentes UI en tu código, impórtalos desde el directorio `ui/components`:

```jsx
import { Table, Select } from '../ui/components';

// Ejemplo de uso de Table
const MyComponent = () => {
  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'email', label: 'Email' },
  ];

  const data = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, nombre: 'María López', email: 'maria@example.com' },
  ];

  return (
    <Table 
      columns={columns} 
      data={data} 
      title="Usuarios" 
      enableSearch={true}
    />
  );
};

// Ejemplo de uso de Select
const MyForm = () => {
  const [value, setValue] = React.useState('');
  
  const options = [
    { value: 'option1', label: 'Opción 1' },
    { value: 'option2', label: 'Opción 2' },
    { value: 'option3', label: 'Opción 3' },
  ];
  
  return (
    <Select
      id="my-select"
      label="Selecciona una opción"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      options={options}
    />
  );
};
```

### Tema

El tema de la aplicación está definido en `theme/theme.js` y se aplica a toda la aplicación a través del `ThemeProvider` en `App.js`.

Para acceder al tema en tus componentes, puedes usar el hook `useTheme` de Material UI:

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

## Agregar nuevos componentes

Para agregar un nuevo componente al sistema:

1. Crea un nuevo archivo en `ui/components/` con el nombre del componente
2. Implementa el componente siguiendo el patrón de los componentes existentes
3. Exporta el componente en `ui/components/index.js`

## Actualizar el tema

Para actualizar el tema de la aplicación:

1. Modifica el archivo `theme/theme.js`
2. Todos los componentes que usen el tema se actualizarán automáticamente

## Ventajas

- **Consistencia**: Todos los componentes siguen el mismo estilo
- **Mantenibilidad**: Los cambios en el tema se aplican a toda la aplicación
- **Reutilización**: Evita duplicar código para componentes comunes
- **Documentación**: Cada componente está documentado con JSDoc 