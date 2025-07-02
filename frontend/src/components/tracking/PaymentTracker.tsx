import React, { useState, useEffect } from 'react';
import { 
  Paper, Title, Group, Card, Text, Badge, Timeline, Progress, 
  Select, Button, Grid, Alert, ActionIcon, Modal, Stack, Textarea,
  NumberInput, Switch, Tabs
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconCreditCard, IconHistory, IconBell, IconCheck, IconX, 
  IconClock, IconAlertTriangle, IconPlus, IconEdit, IconEye,
  IconMail, IconPhone, IconFileText, IconCurrency
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { EstadoPartida } from '../../types/ordenCompra';

interface PagoRegistrado {
  id: string;
  fecha: Date;
  monto: number;
  metodoPago: 'transferencia' | 'cheque' | 'efectivo' | 'otro';
  referencia?: string;
  observaciones?: string;
  comprobante?: string;
}

interface SeguimientoPago {
  partidaId: string;
  numeroPartida: string;
  ordenCompra: string;
  cliente: string;
  descripcion: string;
  montoTotal: number;
  montoAcumulado: number;
  montoPendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
  diasVencimiento?: number;
  proximoSeguimiento?: Date;
  pagosRegistrados: PagoRegistrado[];
  contactosRealizados: ContactoSeguimiento[];
  prioridad: 'alta' | 'media' | 'baja';
  observaciones?: string;
}

interface ContactoSeguimiento {
  id: string;
  fecha: Date;
  tipo: 'email' | 'telefono' | 'visita' | 'otro';
  descripcion: string;
  resultado: 'exitoso' | 'pendiente' | 'sin_respuesta';
  proximaAccion?: string;
  fechaProximaAccion?: Date;
}

interface FiltrosSeguimiento {
  estado?: EstadoPartida | '';
  prioridad?: string;
  cliente?: string;
  vencimientoDesde?: Date;
  vencimientoHasta?: Date;
  soloVencidos?: boolean;
}

export const PaymentTracker: React.FC = () => {
  const [seguimientos, setSeguimientos] = useState<SeguimientoPago[]>([]);
  const [seguimientosFiltrados, setSeguimientosFiltrados] = useState<SeguimientoPago[]>([]);
  const [filtros, setFiltros] = useState<FiltrosSeguimiento>({});
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<SeguimientoPago | null>(null);
  const [nuevoPago, setNuevoPago] = useState<Partial<PagoRegistrado>>({});
  const [nuevoContacto, setNuevoContacto] = useState<Partial<ContactoSeguimiento>>({});
  const [activeTab, setActiveTab] = useState('todos');

  const [modalPagoOpened, { open: openModalPago, close: closeModalPago }] = useDisclosure(false);
  const [modalContactoOpened, { open: openModalContacto, close: closeModalContacto }] = useDisclosure(false);
  const [modalDetalleOpened, { open: openModalDetalle, close: closeModalDetalle }] = useDisclosure(false);

  // Datos de ejemplo
  useEffect(() => {
    const seguimientosEjemplo: SeguimientoPago[] = [
      {
        partidaId: 'P-001',
        numeroPartida: 'P-001',
        ordenCompra: 'OC-2024-001',
        cliente: 'TECPETROL S.A.',
        descripcion: 'Transporte de equipos - Enero',
        montoTotal: 850000,
        montoAcumulado: 400000,
        montoPendiente: 450000,
        estado: 'abierta',
        fechaVencimiento: new Date('2024-03-15'),
        proximoSeguimiento: new Date('2024-02-20'),
        prioridad: 'media',
        pagosRegistrados: [
          {
            id: '1',
            fecha: new Date('2024-02-01'),
            monto: 400000,
            metodoPago: 'transferencia',
            referencia: 'TRF-240201-001',
            observaciones: 'Pago parcial recibido'
          }
        ],
        contactosRealizados: [
          {
            id: '1',
            fecha: new Date('2024-02-15'),
            tipo: 'email',
            descripcion: 'Recordatorio de saldo pendiente',
            resultado: 'exitoso',
            proximaAccion: 'Seguimiento telefónico',
            fechaProximaAccion: new Date('2024-02-20')
          }
        ]
      },
      {
        partidaId: 'P-002',
        numeroPartida: 'P-002',
        ordenCompra: 'OC-2024-002',
        cliente: 'YPF S.A.',
        descripcion: 'Servicios de transporte - Febrero',
        montoTotal: 1200000,
        montoAcumulado: 0,
        montoPendiente: 1200000,
        estado: 'vencida',
        fechaVencimiento: new Date('2024-02-10'),
        diasVencimiento: 10,
        proximoSeguimiento: new Date('2024-02-18'),
        prioridad: 'alta',
        pagosRegistrados: [],
        contactosRealizados: [
          {
            id: '1',
            fecha: new Date('2024-02-12'),
            tipo: 'telefono',
            descripcion: 'Contacto para recordatorio de vencimiento',
            resultado: 'sin_respuesta'
          },
          {
            id: '2',
            fecha: new Date('2024-02-16'),
            tipo: 'email',
            descripcion: 'Envío de estado de cuenta',
            resultado: 'pendiente'
          }
        ],
        observaciones: 'Cliente con historial de pagos tardíos'
      }
    ];
    
    setSeguimientos(seguimientosEjemplo);
    setSeguimientosFiltrados(seguimientosEjemplo);
  }, []);

  const aplicarFiltros = () => {
    let resultado = [...seguimientos];
    
    if (filtros.estado) {
      resultado = resultado.filter(s => s.estado === filtros.estado);
    }
    
    if (filtros.prioridad) {
      resultado = resultado.filter(s => s.prioridad === filtros.prioridad);
    }
    
    if (filtros.cliente) {
      resultado = resultado.filter(s => 
        s.cliente.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }
    
    if (filtros.soloVencidos) {
      resultado = resultado.filter(s => s.estado === 'vencida');
    }
    
    setSeguimientosFiltrados(resultado);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, seguimientos]);

  const registrarPago = () => {
    if (!seguimientoSeleccionado || !nuevoPago.monto || !nuevoPago.fecha) {
      notifications.show({
        title: 'Error',
        message: 'Debe completar todos los campos requeridos',
        color: 'red'
      });
      return;
    }

    const pagoCompleto: PagoRegistrado = {
      id: Date.now().toString(),
      fecha: nuevoPago.fecha,
      monto: nuevoPago.monto,
      metodoPago: nuevoPago.metodoPago || 'transferencia',
      referencia: nuevoPago.referencia,
      observaciones: nuevoPago.observaciones
    };

    const seguimientosActualizados = seguimientos.map(s => {
      if (s.partidaId === seguimientoSeleccionado.partidaId) {
        const nuevoMontoAcumulado = s.montoAcumulado + pagoCompleto.monto;
        const nuevoMontoPendiente = s.montoTotal - nuevoMontoAcumulado;
        
        return {
          ...s,
          montoAcumulado: nuevoMontoAcumulado,
          montoPendiente: nuevoMontoPendiente,
          estado: nuevoMontoPendiente <= 0 ? 'pagada' as EstadoPartida : s.estado,
          pagosRegistrados: [...s.pagosRegistrados, pagoCompleto]
        };
      }
      return s;
    });

    setSeguimientos(seguimientosActualizados);
    setNuevoPago({});
    closeModalPago();
    
    notifications.show({
      title: 'Pago Registrado',
      message: 'El pago ha sido registrado exitosamente',
      color: 'green'
    });
  };

  const registrarContacto = () => {
    if (!seguimientoSeleccionado || !nuevoContacto.descripcion) {
      notifications.show({
        title: 'Error',
        message: 'Debe completar la descripción del contacto',
        color: 'red'
      });
      return;
    }

    const contactoCompleto: ContactoSeguimiento = {
      id: Date.now().toString(),
      fecha: nuevoContacto.fecha || new Date(),
      tipo: nuevoContacto.tipo || 'email',
      descripcion: nuevoContacto.descripcion,
      resultado: nuevoContacto.resultado || 'pendiente',
      proximaAccion: nuevoContacto.proximaAccion,
      fechaProximaAccion: nuevoContacto.fechaProximaAccion
    };

    const seguimientosActualizados = seguimientos.map(s => {
      if (s.partidaId === seguimientoSeleccionado.partidaId) {
        return {
          ...s,
          contactosRealizados: [...s.contactosRealizados, contactoCompleto],
          proximoSeguimiento: contactoCompleto.fechaProximaAccion
        };
      }
      return s;
    });

    setSeguimientos(seguimientosActualizados);
    setNuevoContacto({});
    closeModalContacto();
    
    notifications.show({
      title: 'Contacto Registrado',
      message: 'El contacto ha sido registrado exitosamente',
      color: 'green'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'red';
      case 'media': return 'yellow';
      case 'baja': return 'green';
      default: return 'gray';
    }
  };

  const getEstadoColor = (estado: EstadoPartida) => {
    switch (estado) {
      case 'abierta': return 'blue';
      case 'pagada': return 'green';
      case 'vencida': return 'red';
      default: return 'gray';
    }
  };

  const getResultadoContactoColor = (resultado: string) => {
    switch (resultado) {
      case 'exitoso': return 'green';
      case 'sin_respuesta': return 'red';
      case 'pendiente': return 'yellow';
      default: return 'gray';
    }
  };

  const getSeguimientosPorTab = () => {
    switch (activeTab) {
      case 'urgentes':
        return seguimientosFiltrados.filter(s => s.prioridad === 'alta' || s.estado === 'vencida');
      case 'hoy':
        const hoy = new Date();
        return seguimientosFiltrados.filter(s => 
          s.proximoSeguimiento && 
          s.proximoSeguimiento.toDateString() === hoy.toDateString()
        );
      case 'pagadas':
        return seguimientosFiltrados.filter(s => s.estado === 'pagada');
      default:
        return seguimientosFiltrados;
    }
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconCreditCard size={20} />
          <Title order={4}>Seguimiento de Pagos</Title>
        </Group>
      </Group>

      {/* Filtros */}
      <Card withBorder mb="md">
        <Title order={6} mb="sm">Filtros</Title>
        <Grid>
          <Grid.Col span={3}>
            <Select
              label="Estado"
              placeholder="Todos los estados"
              data={[
                { value: 'abierta', label: 'Abierta' },
                { value: 'pagada', label: 'Pagada' },
                { value: 'vencida', label: 'Vencida' }
              ]}
              value={filtros.estado || ''}
              onChange={(value) => setFiltros({...filtros, estado: (value as EstadoPartida) || undefined})}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Prioridad"
              placeholder="Todas las prioridades"
              data={[
                { value: 'alta', label: 'Alta' },
                { value: 'media', label: 'Media' },
                { value: 'baja', label: 'Baja' }
              ]}
              value={filtros.prioridad || ''}
              onChange={(value) => setFiltros({...filtros, prioridad: value || undefined})}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <div style={{ marginTop: '25px' }}>
              <Switch
                label="Solo vencidas"
                checked={filtros.soloVencidos || false}
                onChange={(event) => setFiltros({...filtros, soloVencidos: event.currentTarget.checked})}
              />
            </div>
          </Grid.Col>
        </Grid>
      </Card>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'todos')}>
        <Tabs.List>
          <Tabs.Tab value="todos" leftSection={<IconHistory size={16} />}>
            Todos ({seguimientosFiltrados.length})
          </Tabs.Tab>
          <Tabs.Tab value="urgentes" leftSection={<IconAlertTriangle size={16} />}>
            Urgentes ({seguimientosFiltrados.filter(s => s.prioridad === 'alta' || s.estado === 'vencida').length})
          </Tabs.Tab>
          <Tabs.Tab value="hoy" leftSection={<IconClock size={16} />}>
            Seguimiento Hoy
          </Tabs.Tab>
          <Tabs.Tab value="pagadas" leftSection={<IconCheck size={16} />}>
            Pagadas ({seguimientosFiltrados.filter(s => s.estado === 'pagada').length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={activeTab} pt="md">
          <Stack gap="sm">
            {getSeguimientosPorTab().map((seguimiento) => (
              <Card key={seguimiento.partidaId} withBorder>
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <Text fw={500}>{seguimiento.numeroPartida}</Text>
                    <Badge color={getEstadoColor(seguimiento.estado)} size="sm">
                      {seguimiento.estado.toUpperCase()}
                    </Badge>
                    <Badge color={getPrioridadColor(seguimiento.prioridad)} size="sm">
                      {seguimiento.prioridad.toUpperCase()}
                    </Badge>
                    {seguimiento.diasVencimiento && (
                      <Badge color="red" size="sm">
                        Vencida {seguimiento.diasVencimiento} días
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="blue"
                      onClick={() => {
                        setSeguimientoSeleccionado(seguimiento);
                        openModalDetalle();
                      }}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="green"
                      onClick={() => {
                        setSeguimientoSeleccionado(seguimiento);
                        openModalPago();
                      }}
                    >
                      <IconCurrency size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="orange"
                      onClick={() => {
                        setSeguimientoSeleccionado(seguimiento);
                        openModalContacto();
                      }}
                    >
                      <IconPhone size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed" mb="xs">{seguimiento.cliente}</Text>
                    <Text size="sm" mb="xs">{seguimiento.descripcion}</Text>
                    
                    {/* Progreso de Pagos */}
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" c="dimmed">
                        Pagado: {formatCurrency(seguimiento.montoAcumulado)} / {formatCurrency(seguimiento.montoTotal)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {((seguimiento.montoAcumulado / seguimiento.montoTotal) * 100).toFixed(1)}%
                      </Text>
                    </Group>
                    <Progress 
                      value={(seguimiento.montoAcumulado / seguimiento.montoTotal) * 100}
                      color={seguimiento.estado === 'pagada' ? 'green' : 'blue'}
                      size="sm"
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <Text size="sm" c="dimmed">Pendiente</Text>
                    <Text size="lg" fw={700} c={seguimiento.montoPendiente > 0 ? 'orange' : 'green'}>
                      {formatCurrency(seguimiento.montoPendiente)}
                    </Text>
                    
                    {seguimiento.proximoSeguimiento && (
                      <>
                        <Text size="xs" c="dimmed" mt="xs">Próximo seguimiento</Text>
                        <Text size="sm">{seguimiento.proximoSeguimiento.toLocaleDateString()}</Text>
                      </>
                    )}
                  </Grid.Col>
                </Grid>

                {/* Último contacto */}
                {seguimiento.contactosRealizados.length > 0 && (
                  <Group gap="xs" mt="sm">
                    <Text size="xs" c="dimmed">Último contacto:</Text>
                    <Badge 
                      size="xs" 
                      color={getResultadoContactoColor(seguimiento.contactosRealizados[seguimiento.contactosRealizados.length - 1].resultado)}
                    >
                      {seguimiento.contactosRealizados[seguimiento.contactosRealizados.length - 1].tipo}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {seguimiento.contactosRealizados[seguimiento.contactosRealizados.length - 1].fecha.toLocaleDateString()}
                    </Text>
                  </Group>
                )}
              </Card>
            ))}

            {getSeguimientosPorTab().length === 0 && (
              <Alert color="blue" title="Sin resultados">
                No se encontraron seguimientos que coincidan con los filtros seleccionados.
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal Registrar Pago */}
      <Modal 
        opened={modalPagoOpened} 
        onClose={closeModalPago}
        title="Registrar Pago"
        size="md"
      >
        <Stack gap="md">
          {seguimientoSeleccionado && (
            <Alert color="blue" title={seguimientoSeleccionado.numeroPartida}>
              Pendiente: {formatCurrency(seguimientoSeleccionado.montoPendiente)}
            </Alert>
          )}
          
          <DatePickerInput
            label="Fecha de Pago"
            placeholder="Seleccionar fecha"
            value={nuevoPago.fecha || null}
            onChange={(date: any) => setNuevoPago({...nuevoPago, fecha: date || undefined})}
            required
          />
          
          <NumberInput
            label="Monto"
            placeholder="Ingrese el monto"
            value={nuevoPago.monto}
            onChange={(value) => setNuevoPago({...nuevoPago, monto: Number(value)})}
            prefix="$"
            thousandSeparator="."
            decimalSeparator=","
            required
          />
          
          <Select
            label="Método de Pago"
            data={[
              { value: 'transferencia', label: 'Transferencia Bancaria' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'otro', label: 'Otro' }
            ]}
            value={nuevoPago.metodoPago}
            onChange={(value) => setNuevoPago({...nuevoPago, metodoPago: value as any})}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <Text component="label" size="sm" fw={500}>Referencia</Text>
              <input
                type="text"
                placeholder="Número de referencia"
                value={nuevoPago.referencia || ''}
                onChange={(e) => setNuevoPago({...nuevoPago, referencia: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
          
          <Textarea
            label="Observaciones"
            placeholder="Observaciones adicionales..."
            value={nuevoPago.observaciones}
            onChange={(e) => setNuevoPago({...nuevoPago, observaciones: e.target.value})}
          />
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeModalPago}>
              Cancelar
            </Button>
            <Button onClick={registrarPago}>
              Registrar Pago
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Registrar Contacto */}
      <Modal 
        opened={modalContactoOpened} 
        onClose={closeModalContacto}
        title="Registrar Contacto"
        size="md"
      >
        <Stack gap="md">
          {seguimientoSeleccionado && (
            <Alert color="blue" title={seguimientoSeleccionado.numeroPartida}>
              {seguimientoSeleccionado.cliente}
            </Alert>
          )}
          
          <DatePickerInput
            label="Fecha del Contacto"
            placeholder="Seleccionar fecha"
            value={nuevoContacto.fecha || new Date()}
            onChange={(date: any) => setNuevoContacto({...nuevoContacto, fecha: date || new Date()})}
          />
          
          <Select
            label="Tipo de Contacto"
            data={[
              { value: 'email', label: 'Email' },
              { value: 'telefono', label: 'Teléfono' },
              { value: 'visita', label: 'Visita' },
              { value: 'otro', label: 'Otro' }
            ]}
            value={nuevoContacto.tipo}
            onChange={(value) => setNuevoContacto({...nuevoContacto, tipo: value as any})}
          />
          
          <Textarea
            label="Descripción"
            placeholder="Describa el contacto realizado..."
            value={nuevoContacto.descripcion}
            onChange={(e) => setNuevoContacto({...nuevoContacto, descripcion: e.target.value})}
            required
          />
          
          <Select
            label="Resultado"
            data={[
              { value: 'exitoso', label: 'Exitoso' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'sin_respuesta', label: 'Sin Respuesta' }
            ]}
            value={nuevoContacto.resultado}
            onChange={(value) => setNuevoContacto({...nuevoContacto, resultado: value as any})}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <Text component="label" size="sm" fw={500}>Próxima Acción</Text>
              <input
                type="text"
                placeholder="Describa la próxima acción..."
                value={nuevoContacto.proximaAccion || ''}
                onChange={(e) => setNuevoContacto({...nuevoContacto, proximaAccion: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
          
          <DatePickerInput
            label="Fecha Próxima Acción"
            placeholder="Seleccionar fecha"
            value={nuevoContacto.fechaProximaAccion || null}
            onChange={(date: any) => setNuevoContacto({...nuevoContacto, fechaProximaAccion: date || undefined})}
          />
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeModalContacto}>
              Cancelar
            </Button>
            <Button onClick={registrarContacto}>
              Registrar Contacto
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Detalle */}
      <Modal 
        opened={modalDetalleOpened} 
        onClose={closeModalDetalle}
        title="Detalle de Seguimiento"
        size="lg"
      >
        {seguimientoSeleccionado && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500} size="lg">{seguimientoSeleccionado.numeroPartida}</Text>
              <Badge color={getEstadoColor(seguimientoSeleccionado.estado)}>
                {seguimientoSeleccionado.estado.toUpperCase()}
              </Badge>
            </Group>
            
            <Text>{seguimientoSeleccionado.cliente}</Text>
            <Text size="sm" c="dimmed">{seguimientoSeleccionado.descripcion}</Text>
            
            {/* Resumen Financiero */}
            <Grid>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Monto Total</Text>
                <Text fw={500}>{formatCurrency(seguimientoSeleccionado.montoTotal)}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Monto Pagado</Text>
                <Text fw={500} c="green">{formatCurrency(seguimientoSeleccionado.montoAcumulado)}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Monto Pendiente</Text>
                <Text fw={500} c="orange">{formatCurrency(seguimientoSeleccionado.montoPendiente)}</Text>
              </Grid.Col>
            </Grid>
            
            {/* Historial de Pagos */}
            {seguimientoSeleccionado.pagosRegistrados.length > 0 && (
              <div>
                <Text fw={500} mb="sm">Historial de Pagos</Text>
                <Timeline active={seguimientoSeleccionado.pagosRegistrados.length}>
                  {seguimientoSeleccionado.pagosRegistrados.map((pago, index) => (
                    <Timeline.Item key={pago.id} title={formatCurrency(pago.monto)}>
                      <Text size="sm" c="dimmed">
                        {pago.fecha.toLocaleDateString()} - {pago.metodoPago}
                      </Text>
                      {pago.referencia && (
                        <Text size="sm">Ref: {pago.referencia}</Text>
                      )}
                      {pago.observaciones && (
                        <Text size="sm" c="dimmed">{pago.observaciones}</Text>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
            
            {/* Historial de Contactos */}
            {seguimientoSeleccionado.contactosRealizados.length > 0 && (
              <div>
                <Text fw={500} mb="sm">Historial de Contactos</Text>
                <Timeline active={seguimientoSeleccionado.contactosRealizados.length}>
                  {seguimientoSeleccionado.contactosRealizados.map((contacto, index) => (
                    <Timeline.Item 
                      key={contacto.id} 
                      title={contacto.tipo.charAt(0).toUpperCase() + contacto.tipo.slice(1)}
                    >
                      <Text size="sm">{contacto.descripcion}</Text>
                      <Text size="sm" c="dimmed">
                        {contacto.fecha.toLocaleDateString()} - 
                        <Badge 
                          size="xs" 
                          color={getResultadoContactoColor(contacto.resultado)}
                          ml="xs"
                        >
                          {contacto.resultado}
                        </Badge>
                      </Text>
                      {contacto.proximaAccion && (
                        <Text size="sm" c="blue">
                          Próxima acción: {contacto.proximaAccion}
                          {contacto.fechaProximaAccion && (
                            <> ({contacto.fechaProximaAccion.toLocaleDateString()})</>
                          )}
                        </Text>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Paper>
  );
};