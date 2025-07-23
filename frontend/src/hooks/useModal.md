# useModal Hook

Hook reutilizable para gestionar el estado de modales en la aplicación. Centraliza la lógica común de apertura/cierre y gestión de elementos seleccionados.

## API

### Parámetros

```typescript
interface ModalConfig<T = any> {
  onOpen?: (item?: T) => void;     // Callback al abrir el modal
  onClose?: () => void;            // Callback al cerrar el modal
  onSuccess?: () => void;          // Callback de éxito (típicamente para formularios)
  resetOnClose?: boolean;          // Si resetear selectedItem al cerrar (default: true)
}
```

### Retorno

```typescript
interface ModalReturn<T = any> {
  // Estado
  isOpen: boolean;                 // Si el modal está abierto
  selectedItem: T | null;          // Elemento seleccionado (null para crear, objeto para editar)
  loading: boolean;                // Estado de carga

  // Acciones específicas  
  openCreate: () => void;          // Abrir modal para crear (selectedItem = null)
  openEdit: (item: T) => void;     // Abrir modal para editar (selectedItem = item)
  openView: (item: T) => void;     // Abrir modal para ver (selectedItem = item)
  openDelete: (item: T) => void;   // Abrir modal para eliminar (selectedItem = item)
  
  // Acciones genéricas
  open: (item?: T) => void;        // Abrir modal genérico
  close: () => void;               // Cerrar modal
  setLoading: (loading: boolean) => void; // Controlar estado de carga
  
  // Acción de éxito
  onSuccess: () => void;           // Ejecutar callback de éxito y cerrar
}
```

## Ejemplos de Uso

### 1. Modal Básico

```typescript
import { useModal } from '../../hooks/useModal';
import { Modal, Button } from '@mantine/core';

interface User {
  id: string;
  name: string;
  email: string;
}

function UsersPage() {
  const modal = useModal<User>();

  return (
    <>
      <Button onClick={modal.openCreate}>
        Nuevo Usuario
      </Button>
      
      <Modal 
        opened={modal.isOpen} 
        onClose={modal.close}
        title={modal.selectedItem ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <UserForm 
          user={modal.selectedItem}
          onSuccess={modal.close}
        />
      </Modal>
    </>
  );
}
```

### 2. Modal con Callbacks

```typescript
function VehiculosPage() {
  const formModal = useModal<Vehiculo>({
    onSuccess: () => loadVehiculos(), // Recargar datos al éxito
    onClose: () => console.log('Modal cerrado')
  });

  const handleEdit = (vehiculo: Vehiculo) => {
    formModal.openEdit(vehiculo);
  };

  return (
    <>
      <VehiculosList onEdit={handleEdit} />
      
      <Modal 
        opened={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.selectedItem ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      >
        <VehiculoForm
          vehiculo={formModal.selectedItem}
          onSubmit={formModal.onSuccess} // Usa callback de éxito
        />
      </Modal>
    </>
  );
}
```

### 3. Múltiples Modales

```typescript
function PersonalPage() {
  const formModal = useModal<Personal>({
    onSuccess: () => loadPersonal()
  });
  
  const detailModal = useModal<Personal>();
  const deleteModal = useModal<Personal>();

  const handleEdit = (person: Personal) => {
    formModal.openEdit(person);
  };

  const handleView = (person: Personal) => {
    detailModal.openView(person);
  };

  const handleDelete = (person: Personal) => {
    deleteModal.openDelete(person);
  };

  return (
    <>
      <PersonalList 
        onEdit={handleEdit}
        onView={handleView} 
        onDelete={handleDelete}
      />

      {/* Modal de Formulario */}
      <Modal opened={formModal.isOpen} onClose={formModal.close}>
        <PersonalForm 
          personal={formModal.selectedItem}
          onSubmit={formModal.onSuccess}
        />
      </Modal>

      {/* Modal de Detalle */}
      <Modal opened={detailModal.isOpen} onClose={detailModal.close}>
        <PersonalDetail personal={detailModal.selectedItem} />
      </Modal>

      {/* Modal de Confirmación */}
      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => handleConfirmDelete(deleteModal.selectedItem)}
        message={`¿Eliminar a ${deleteModal.selectedItem?.nombre}?`}
      />
    </>
  );
}
```

### 4. Modal con Estado de Carga

```typescript
function ClientesPage() {
  const deleteModal = useModal<Cliente>();

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;
    
    try {
      deleteModal.setLoading(true);
      await clienteService.delete(deleteModal.selectedItem.id);
      deleteModal.close();
      loadClientes();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      deleteModal.setLoading(false);
    }
  };

  return (
    <ConfirmModal
      opened={deleteModal.isOpen}
      onClose={deleteModal.close}
      onConfirm={handleDelete}
      loading={deleteModal.loading} // Mostrar spinner
      message="¿Está seguro de eliminar este cliente?"
    />
  );
}
```

### 5. Modal con Persistencia de Estado

```typescript
function ReportsPage() {
  // No resetear selectedItem al cerrar (útil para formularios en pasos)
  const wizardModal = useModal<ReportConfig>({ 
    resetOnClose: false 
  });

  return (
    <Modal opened={wizardModal.isOpen} onClose={wizardModal.close}>
      <ReportWizard 
        initialData={wizardModal.selectedItem} // Persiste entre aperturas
        onComplete={(data) => {
          // Actualizar datos sin cerrar
          wizardModal.selectedItem = data;
        }}
      />
    </Modal>
  );
}
```

### 6. Integración con DataTable

```typescript
function TramosPage() {
  const formModal = useModal<Tramo>({ onSuccess: () => loadTramos() });
  const deleteModal = useModal<Tramo>();

  const columns = [
    {
      key: 'actions',
      render: (tramo: Tramo) => (
        <Group>
          <ActionIcon onClick={() => formModal.openEdit(tramo)}>
            <IconEdit />
          </ActionIcon>
          <ActionIcon onClick={() => deleteModal.openDelete(tramo)}>
            <IconTrash />
          </ActionIcon>
        </Group>
      )
    }
  ];

  return (
    <>
      <DataTable data={tramos} columns={columns} />
      
      {/* Modales */}
      <Modal opened={formModal.isOpen} onClose={formModal.close}>
        <TramoForm tramo={formModal.selectedItem} onSuccess={formModal.onSuccess} />
      </Modal>
      
      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => handleDelete(deleteModal.selectedItem)}
      />
    </>
  );
}
```

## Patrones de Uso

### ✅ Recomendado

```typescript
// ✅ Usar nombres descriptivos para múltiples modales
const formModal = useModal<Entity>();
const detailModal = useModal<Entity>();  
const deleteModal = useModal<Entity>();

// ✅ Usar onSuccess para acciones post-formulario
const modal = useModal<Entity>({
  onSuccess: () => {
    loadData();
    showNotification('Éxito');
  }
});

// ✅ Verificar selectedItem antes de usar
if (modal.selectedItem) {
  await service.delete(modal.selectedItem.id);
}
```

### ❌ Evitar

```typescript
// ❌ No usar nombres genéricos para múltiples modales
const modal1 = useModal<Entity>();
const modal2 = useModal<Entity>();
const modal3 = useModal<Entity>();

// ❌ No asumir que selectedItem existe
await service.delete(modal.selectedItem.id); // Puede ser null

// ❌ No manejar estado loading manualmente si el hook lo provee
const [loading, setLoading] = useState(false); // Usar modal.setLoading()
```

## Migración desde Patrón Anterior

### Antes (Duplicado)

```typescript
// ❌ Código duplicado en cada página
const [formOpened, setFormOpened] = useState(false);
const [selectedItem, setSelectedItem] = useState<Entity | null>(null);
const [deleteOpened, setDeleteOpened] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Entity | null>(null);

const handleEdit = (item: Entity) => {
  setSelectedItem(item);
  setFormOpened(true);
};

const handleDelete = (item: Entity) => {
  setItemToDelete(item);
  setDeleteOpened(true);
};

const handleFormClose = () => {
  setFormOpened(false);
  setSelectedItem(null);
};
```

### Después (useModal)

```typescript
// ✅ Código reutilizable y conciso
const formModal = useModal<Entity>({ onSuccess: () => loadData() });
const deleteModal = useModal<Entity>();

const handleEdit = (item: Entity) => formModal.openEdit(item);
const handleDelete = (item: Entity) => deleteModal.openDelete(item);
```

## Beneficios

- ✅ **Elimina duplicación**: ~10-15 líneas de código por página
- ✅ **Tipado fuerte**: TypeScript garantiza tipo correcto
- ✅ **API consistente**: Mismo patrón en toda la app
- ✅ **Callbacks flexibles**: onOpen, onClose, onSuccess
- ✅ **Fácil testing**: Hook aislado y testeable
- ✅ **Mantenibilidad**: Cambios centralizados

## Tests

El hook incluye tests completos que cubren:
- Estados iniciales
- Apertura de modales (create, edit, view, delete)
- Cierre y reset de estado
- Callbacks personalizados  
- Estado de loading
- Configuración de resetOnClose
- Type safety

Ver: `tests/hooks/useModal.test.tsx`