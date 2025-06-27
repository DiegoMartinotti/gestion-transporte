import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text, Skeleton } from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useEntityNames } from '../../contexts/EntityNamesContext';

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
  'configuracion': 'Configuración',
  'edit': 'Editar'
};

// Función para detectar si un string es un ID de MongoDB
const isMongoId = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const location = useLocation();
  const { getClienteName, getEmpresaName } = useEntityNames();
  const [resolvedBreadcrumbs, setResolvedBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Generar breadcrumbs automáticamente basado en la ruta actual
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Efecto para resolver nombres de entidades
  useEffect(() => {
    const resolveBreadcrumbs = async () => {
      setLoading(true);
      
      const breadcrumbItems: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/' }
      ];

      let currentPath = '';
      for (let index = 0; index < pathSegments.length; index++) {
        const segment = pathSegments[index];
        const previousSegment = index > 0 ? pathSegments[index - 1] : null;
        currentPath += `/${segment}`;
        
        let title = routeToTitle[segment];
        
        // Si no hay título predefinido, intentar resolver ID a nombre
        if (!title) {
          if (isMongoId(segment)) {
            try {
              if (previousSegment === 'clientes') {
                title = await getClienteName(segment);
              } else if (previousSegment === 'empresas') {
                title = await getEmpresaName(segment);
              } else {
                title = segment.charAt(0).toUpperCase() + segment.slice(1);
              }
            } catch (error) {
              title = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          } else {
            title = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
        }
        
        // El último item no debe tener href (está activo)
        const isLast = index === pathSegments.length - 1;
        breadcrumbItems.push({
          title,
          href: isLast ? undefined : currentPath
        });
      }

      setResolvedBreadcrumbs(breadcrumbItems);
      setLoading(false);
    };

    // Solo resolver breadcrumbs si no hay items personalizados y hay segmentos
    if (!items && pathSegments.length > 0) {
      resolveBreadcrumbs();
    }
  }, [location.pathname, getClienteName, getEmpresaName, pathSegments, items]);

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

  // Si estamos en la raíz, no mostrar breadcrumbs
  if (pathSegments.length === 0) {
    return null;
  }

  if (loading && resolvedBreadcrumbs.length === 0) {
    return (
      <MantineBreadcrumbs 
        separator={<IconChevronRight size={14} stroke={1.5} />}
        separatorMargin="xs"
        mb="md"
      >
        <Skeleton height={16} width={80} />
        <Skeleton height={16} width={100} />
      </MantineBreadcrumbs>
    );
  }

  return (
    <MantineBreadcrumbs 
      separator={<IconChevronRight size={14} stroke={1.5} />}
      separatorMargin="xs"
      mb="md"
    >
      {resolvedBreadcrumbs.map((item, index) => {
        const isLast = index === resolvedBreadcrumbs.length - 1;
        
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