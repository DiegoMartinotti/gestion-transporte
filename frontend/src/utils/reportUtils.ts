export const getReportTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    financial: 'green',
    operations: 'blue',
    vehicle: 'orange',
    client: 'purple',
    partidas: 'red',
    trips: 'cyan',
    routes: 'yellow',
    custom: 'gray',
  };
  return colors[type] || 'gray';
};

export const getReportTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    financial: 'Financiero',
    operations: 'Operaciones',
    vehicle: 'Vehículos',
    client: 'Clientes',
    partidas: 'Partidas',
    trips: 'Viajes',
    routes: 'Rutas',
    custom: 'Personalizado',
  };
  return labels[type] || type;
};
