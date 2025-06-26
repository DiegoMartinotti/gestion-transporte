import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text } from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

// Mapeo de rutas a títulos legibles
const routeToTitle: Record<string, string> = {
  '': 'Dashboard',
  'clientes': 'Clientes',
  'empresas': 'Empresas', 
  'personal': 'Personal',
  'sites': 'Ubicaciones',
  'tramos': 'Tramos',
  'vehiculos': 'Vehículos',
  'viajes': 'Viajes',
  'extras': 'Extras',
  'ordenes-compra': 'Órdenes de Compra',
  'reportes': 'Reportes',
  'configuracion': 'Configuración'
};

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const location = useLocation();

  // Si se proporcionan items personalizados, usarlos
  if (items) {
    return (
      <MantineBreadcrumbs 
        separator={<IconChevronRight size={14} stroke={1.5} />}
        separatorMargin="xs"
        mb="md"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          if (isLast || !item.href) {
            return (
              <Text key={index} c="dimmed" size="sm">
                {item.title}
              </Text>
            );
          }

          return (
            <Anchor 
              key={index} 
              component={Link} 
              to={item.href}
              size="sm"
            >
              {item.title}
            </Anchor>
          );
        })}
      </MantineBreadcrumbs>
    );
  }

  // Generar breadcrumbs automáticamente basado en la ruta actual
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Si estamos en la raíz, no mostrar breadcrumbs
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/' }
  ];

  // Construir breadcrumbs basado en los segmentos de la ruta
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const title = routeToTitle[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // El último item no debe tener href (está activo)
    const isLast = index === pathSegments.length - 1;
    breadcrumbItems.push({
      title,
      href: isLast ? undefined : currentPath
    });
  });

  return (
    <MantineBreadcrumbs 
      separator={<IconChevronRight size={14} stroke={1.5} />}
      separatorMargin="xs"
      mb="md"
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        if (isLast || !item.href) {
          return (
            <Text key={index} c="dimmed" size="sm">
              {item.title}
            </Text>
          );
        }

        return (
          <Anchor 
            key={index} 
            component={Link} 
            to={item.href}
            size="sm"
          >
            {item.title}
          </Anchor>
        );
      })}
    </MantineBreadcrumbs>
  );
};

export default Breadcrumbs;