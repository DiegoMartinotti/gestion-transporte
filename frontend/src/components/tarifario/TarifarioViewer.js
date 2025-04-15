import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import {
    Paper, 
    Button, 
    Box, 
    Alert, 
    Typography, 
    Toolbar, 
    Grid, 
    Snackbar, 
    Chip,
    CircularProgress,
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    DialogContentText,
    Pagination
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon,
    FilterAlt as FilterIcon,
    CloudUpload as CloudUploadIcon,
    Info as InfoIcon,
    FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import logger from '../../utils/logger';
import errorService from '../../services/errorService';

// Componentes extraídos - Usando lazy loading para componentes pesados
const AddTramoDialog = lazy(() => import('./AddTramoDialog'));
const FilterDialog = lazy(() => import('./FilterDialog'));
const VigenciaMasivaDialog = lazy(() => import('./VigenciaMasivaDialog'));
import TramosTable from './TramosTable'; // Este se mantiene con importación normal por ser crítico
const ExcelExporter = lazy(() => import('./ExcelExporter'));
const TramoBulkImporter = lazy(() => import('../tramos/TramoBulkImporter'));

// Utilidades
import { parseDate, obtenerTarifasVigentes } from './utils';

// Servicios
import tarifarioService from '../../services/tarifarioService';

// Configurar dayjs para usar español y formato de fecha preferido
dayjs.locale('es');
dayjs.extend(utc);
dayjs.extend(timezone);

const TarifarioViewer = ({ cliente, onBack }) => {
    // Estado principal
    const [tramos, setTramos] = useState([]);
    const [tramosOriginal, setTramosOriginal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingOperation, setLoadingOperation] = useState(false); // Nuevo estado para operaciones asíncronas
    const [sites, setSites] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [permisos, setPermisos] = useState(['editar_tramos', 'eliminar_tramos']);
    
    // Metadatos
    const [metadata, setMetadata] = useState({
        totalTramos: 0,
        tramosUnicos: 0,
        combinacionesUnicas: 0
    });
    
    // Estado para selección y filtrado
    const [filtroVigencia, setFiltroVigencia] = useState({
        desde: '',
        hasta: ''
    });
    const [selectedTramos, setSelectedTramos] = useState([]);
    const [filteredTramos, setFilteredTramos] = useState([]);
    
    // Estado para diálogos
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isVigenciaMasivaOpen, setIsVigenciaMasivaOpen] = useState(false);
    const [vigenciaMasivaLoading, setVigenciaMasivaLoading] = useState(false);
    
    // Estado para edición
    const [tramoToDelete, setTramoToDelete] = useState(null);
    const [tramoToEdit, setTramoToEdit] = useState(null);
    
    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const tramosPorPagina = 50; // Ajustar según necesidad
    
    // Tramos paginados para mostrar solo una parte a la vez
    const tramosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * tramosPorPagina;
        return filteredTramos.slice(inicio, inicio + tramosPorPagina);
    }, [filteredTramos, paginaActual, tramosPorPagina]);
    
    // Total de páginas calculado una sola vez
    const totalPaginas = useMemo(() => {
        return Math.ceil(filteredTramos.length / tramosPorPagina);
    }, [filteredTramos.length, tramosPorPagina]);
    
    // Manejador de cambio de página
    const handleChangePage = (event, newPage) => {
        setPaginaActual(newPage);
        // Resetear selección al cambiar de página para evitar confusiones
        setSelectedTramos([]);
    };
    
    // Optimizar el procesamiento de tramos con debounce para grandes conjuntos
    const procesarTramos = useCallback((tramosData, filtroDesde, filtroHasta) => {
        if (!tramosData || !Array.isArray(tramosData) || tramosData.length === 0) {
            return [];
        }
        
        // Para conjuntos grandes, procesamos por lotes para evitar bloquear el hilo principal
        if (tramosData.length > 1000) {
            logger.debug('Procesando conjunto grande de tramos por lotes');
            return procesarTramosPorLotes(tramosData, filtroDesde, filtroHasta);
        }
        
        // Usar flatMap para mejor rendimiento (reduce una iteración)
        return tramosData.flatMap(tramo => {
            // Si el tramo no tiene ID, lo omitimos para evitar errores
            if (!tramo._id) return [];
            
            // Obtener tarifa actual o histórica según filtro
            const tarifasActuales = obtenerTarifasVigentes(
                tramo,
                filtroDesde,
                filtroHasta
            );
            
            // Si no hay tarifas, no generamos filas
            if (!tarifasActuales || tarifasActuales.length === 0) {
                return [];
            }
            
            // Por cada tarifa actual, crear una fila
            return tarifasActuales.map(tarifaActual => ({
                ...tramo,
                tarifaActual,
                _idCompuesto: `${tramo._id}-${tarifaActual._id || tarifaActual.tipo || 'TRMC'}`
            }));
        });
    }, []);
    
    // Procesamiento por lotes para conjuntos grandes
    const procesarTramosPorLotes = useCallback((tramosData, filtroDesde, filtroHasta) => {
        const resultado = [];
        // Reducir el tamaño del lote para mejorar la respuesta de la UI
        const tamanoLote = 100; 
        let procesados = 0;
        
        // Usar un enfoque más eficiente para conjuntos muy grandes
        const procesarSiguienteLote = (indice) => {
            if (indice >= tramosData.length) return;
            
            const fin = Math.min(indice + tamanoLote, tramosData.length);
            const lote = tramosData.slice(indice, fin);
            
            // Procesar este lote
            const tramosLote = lote.flatMap(tramo => {
                if (!tramo._id) return [];
                
                const tarifasActuales = obtenerTarifasVigentes(
                    tramo,
                    filtroDesde,
                    filtroHasta
                );
                
                if (!tarifasActuales || tarifasActuales.length === 0) {
                    return [];
                }
                
                return tarifasActuales.map(tarifaActual => ({
                    ...tramo,
                    tarifaActual,
                    _idCompuesto: `${tramo._id}-${tarifaActual._id || tarifaActual.tipo || 'TRMC'}`
                }));
            });
            
            resultado.push(...tramosLote);
            procesados += lote.length;
            
            // Si aún quedan lotes, procesarlos en el siguiente ciclo
            if (fin < tramosData.length) {
                setTimeout(() => procesarSiguienteLote(fin), 0);
            }
        };
        
        // Iniciar el procesamiento con el primer lote
        procesarSiguienteLote(0);
        
        return resultado;
    }, []);
    
    // Filtrado por lotes para conjuntos muy grandes
    const filtrarTramosPorLotes = useCallback((tramosData, desdeStr, hastaStr) => {
        const tramosEnRango = [];
        const tamanoLote = 200;
        const tramosFiltrados = new Map();
        
        for (let i = 0; i < tramosData.length; i += tamanoLote) {
            const lote = tramosData.slice(i, i + tamanoLote);
            
            // Filtrar este lote
            const tramosLoteEnRango = lote.filter(tramo => {
                const tramoId = tramo._id;
                if (!tramoId) return false;
                
                if (tramosFiltrados.has(tramoId)) {
                    return tramosFiltrados.get(tramoId);
                }
                
                let enRango = false;
                
                if (tramo.tarifasHistoricas?.length) {
                    for (const tarifa of tramo.tarifasHistoricas) {
                        if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) continue;
                        
                        const [tarifaDesde] = tarifa.vigenciaDesde.split('T');
                        const [tarifaHasta] = tarifa.vigenciaHasta.split('T');
                        
                        if (tarifaDesde <= hastaStr && tarifaHasta >= desdeStr) {
                            enRango = true;
                            break;
                        }
                    }
                } else if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
                    const [tramoDesde] = tramo.vigenciaDesde.split('T');
                    const [tramoHasta] = tramo.vigenciaHasta.split('T');
                    enRango = tramoDesde <= hastaStr && tramoHasta >= desdeStr;
                }
                
                tramosFiltrados.set(tramoId, enRango);
                return enRango;
            });
            
            tramosEnRango.push(...tramosLoteEnRango);
        }
        
        // Verificar si hay resultados
        if (tramosEnRango.length === 0) {
            setError(`No se encontraron tramos para el período ${desdeStr} - ${hastaStr}`);
        } else {
            setError(null);
        }
        
        return procesarTramos(tramosEnRango, desdeStr, hastaStr);
    }, [procesarTramos]);
    
    // Aplicar filtros optimizados
    const applyFilters = useCallback(() => {
        logger.debug('Aplicando filtros a', tramos.length, 'tramos');
        if (!tramos || tramos.length === 0) {
            return [];
        }
        
        // Resetear a la primera página al aplicar filtros
        setPaginaActual(1);
        
        // Si no hay filtros de fecha, mostrar todos los tramos sin procesar
        if (!filtroVigencia.desde || !filtroVigencia.hasta) {
            const tramosConId = procesarTramos(tramos, null, null);
            
            // Eliminar duplicados usando Map para mayor eficiencia
            const tramosUnicos = new Map();
            
            // Usar un identificador único para cada tramo
            tramosConId.forEach(tramo => {
                if (!tramo._idCompuesto) return;
                
                // Crear un identificador único que combine origen, destino y tipo
                const idUnico = `${tramo.origen?._id || 'unknown'}-${tramo.destino?._id || 'unknown'}-${tramo.tarifaActual?.tipo || 'TRMC'}`;
                
                // Solo guardar la primera ocurrencia de cada tramo único
                if (!tramosUnicos.has(idUnico)) {
                    tramosUnicos.set(idUnico, tramo);
                }
            });
            
            // Convertir de vuelta a array
            const resultado = Array.from(tramosUnicos.values());
            logger.debug(`Filtrado de duplicados completado: ${resultado.length} tramos únicos de ${tramosConId.length} totales`);
            return resultado;
        }
        
        // Convertir las fechas de filtro a formato YYYY-MM-DD
        const desdeStr = filtroVigencia.desde;
        const hastaStr = filtroVigencia.hasta;

        logger.debug(`Filtrando tramos por rango de fechas: ${desdeStr} - ${hastaStr}`);

        // Memorización temporal para mejorar rendimiento
        const tramosFiltrados = new Map();
        
        // Para conjuntos muy grandes, usamos un enfoque de lotes
        if (tramos.length > 1000) {
            const tramosConFiltro = filtrarTramosPorLotes(tramos, desdeStr, hastaStr);
            
            // Eliminar duplicados
            const tramosUnicos = new Map();
            
            tramosConFiltro.forEach(tramo => {
                if (!tramo._idCompuesto) return;
                
                const idUnico = `${tramo.origen?._id || 'unknown'}-${tramo.destino?._id || 'unknown'}-${tramo.tarifaActual?.tipo || 'TRMC'}`;
                
                if (!tramosUnicos.has(idUnico)) {
                    tramosUnicos.set(idUnico, tramo);
                }
            });
            
            const resultado = Array.from(tramosUnicos.values());
            logger.debug(`Filtrado de duplicados completado: ${resultado.length} tramos únicos de ${tramosConFiltro.length} totales`);
            return resultado;
        }
        
        // Optimización: filtrar tramos de manera más eficiente
        const tramosEnRango = tramos.filter(tramo => {
            // Usamos un identificador único para el tramo
            const tramoId = tramo._id;
            
            // Si no tiene ID, lo omitimos
            if (!tramoId) return false;
            
            // Si ya procesamos este tramo, usamos el resultado memorizado
            if (tramosFiltrados.has(tramoId)) {
                return tramosFiltrados.get(tramoId);
            }
            
            let enRango = false;
            
            // Para tramos con tarifas históricas
            if (tramo.tarifasHistoricas?.length) {
                // Optimización: salir temprano si encontramos coincidencia
                for (const tarifa of tramo.tarifasHistoricas) {
                    if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) continue;
                    
                    const [tarifaDesde] = tarifa.vigenciaDesde.split('T');
                    const [tarifaHasta] = tarifa.vigenciaHasta.split('T');
                    
                    if (tarifaDesde <= hastaStr && tarifaHasta >= desdeStr) {
                        enRango = true;
                        break; // Salir del bucle al encontrar coincidencia
                    }
                }
            }
            // Para tramos con formato antiguo
            else if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
                const [tramoDesde] = tramo.vigenciaDesde.split('T');
                const [tramoHasta] = tramo.vigenciaHasta.split('T');
                enRango = tramoDesde <= hastaStr && tramoHasta >= desdeStr;
            }
            
            // Guardar resultado para futuros usos
            tramosFiltrados.set(tramoId, enRango);
            return enRango;
        });
        
        logger.debug(`Filtrado completado: ${tramosEnRango.length} tramos coinciden con el filtro de fecha`);
        
        // Mostrar un mensaje claro al usuario cuando no hay resultados
        if (tramosEnRango.length === 0) {
            setError(`No se encontraron tramos para el período ${desdeStr} - ${hastaStr}`);
            return [];
        } else {
            setError(null);
        }
        
        // Procesar los tramos filtrados y eliminar duplicados
        const tramosConId = procesarTramos(tramosEnRango, desdeStr, hastaStr);
        
        // Eliminar duplicados
        const tramosUnicos = new Map();
        
        tramosConId.forEach(tramo => {
            if (!tramo._idCompuesto) return;
            
            const idUnico = `${tramo.origen?._id || 'unknown'}-${tramo.destino?._id || 'unknown'}-${tramo.tarifaActual?.tipo || 'TRMC'}`;
            
            if (!tramosUnicos.has(idUnico)) {
                tramosUnicos.set(idUnico, tramo);
            }
        });
        
        const resultado = Array.from(tramosUnicos.values());
        logger.debug(`Filtrado de duplicados completado: ${resultado.length} tramos únicos de ${tramosConId.length} totales`);
        return resultado;
    }, [tramos, filtroVigencia, procesarTramos, filtrarTramosPorLotes]);
    
    // Memoizamos los resultados filtrados para evitar recálculos innecesarios
    const memoizedFilteredTramos = useMemo(() => {
        return applyFilters();
    }, [applyFilters]);

    // Actualizar filteredTramos cuando cambian los tramos o filtros
    useEffect(() => {
        setFilteredTramos(memoizedFilteredTramos);
    }, [memoizedFilteredTramos]);

    // Actualizar metadatos para mostrar información correcta
    useEffect(() => {
        // Actualizar metadatos cuando se tengan los filteredTramos
        if (filteredTramos) {
            setMetadata({
                totalTramos: tramos.length,
                tramosUnicos: filteredTramos.length,
                combinacionesUnicas: new Set(filteredTramos.map(t => 
                    `${t.origen?._id || 'unknown'}-${t.destino?._id || 'unknown'}`
                )).size
            });
        }
    }, [filteredTramos, tramos.length]);

    // Cargar sitios
    const fetchSites = useCallback(async () => {
        if (!cliente) return;
        
        try {
            logger.debug('Obteniendo sitios para cliente:', cliente);
            setLoading(true);
            const sitesData = await tarifarioService.getSitesByCliente(cliente);
            setSites(sitesData);
            logger.debug(`${sitesData.length} sitios obtenidos`);
        } catch (error) {
            // Usar el servicio de errores para procesar y mostrar un mensaje amigable
            const processedError = errorService.processError(error, {
                context: 'TarifarioViewer.cargarSitios'
            });
            
            logger.error('Error al obtener sitios:', processedError);
            
            // Mostrar mensaje amigable para el usuario
            const errorMessage = errorService.getUserFriendlyMessage(processedError);
            setError(`No se pudieron cargar los sitios: ${errorMessage}`);
            setSites([]);
        } finally {
            setLoading(false);
        }
    }, [cliente]);

    // Cargar tramos con optimización
    const fetchTramos = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (!cliente) {
                setError('Cliente no especificado');
                setTramos([]);
                return;
            }
            
            // Intentamos obtener los tramos con manejo de errores mejorado
            logger.debug(`Llamando a tarifarioService.getTramosByCliente(${cliente}, ${JSON.stringify(filtroVigencia)})`);
            
            const response = await tarifarioService.getTramosByCliente(cliente, filtroVigencia);
            logger.debug('Respuesta recibida:', { success: response.success, dataLength: response.data?.length });
            
            // La respuesta ahora es el objeto completo con los datos
            if (response && response.success) {
                const tramosRecibidos = response.data || [];
                logger.debug(`Recibidos ${tramosRecibidos.length} tramos del servidor`);
                
                // Procesar tramos recibidos con validación para evitar errores
                const tramosValidos = tramosRecibidos.filter(t => t && t.origen && t.destino);

                if (tramosValidos.length === 0) {
                    logger.info('No se encontraron tramos válidos para mostrar después del filtro frontend.');
                    setTramos([]);
                    setTramosOriginal([]);
                    setFilteredTramos([]);
                    // Mostrar mensaje informativo usando el estado de error existente
                    setError('No se encontraron tramos con origen y destino definidos para mostrar.'); 
                    return; // Salir temprano
                }
                
                // Si hay tramos válidos, ordenarlos
                const tramosOrdenados = [...tramosValidos].sort((a, b) => {
                    // Ordenar primero por origen y luego por destino
                    if (a.origen?.nombre === b.origen?.nombre) {
                        return a.destino?.nombre?.localeCompare(b.destino?.nombre || '') || 0;
                    }
                    return a.origen?.nombre?.localeCompare(b.origen?.nombre || '') || 0;
                });
                
                logger.debug('Tramos ordenados:', tramosOrdenados.map(t => `${t.origen?.nombre || 'N/A'} -> ${t.destino?.nombre || 'N/A'}`).slice(0, 5).join(', ') + (tramosOrdenados.length > 5 ? '...' : ''));
                
                setTramos(tramosOrdenados);
                setTramosOriginal(tramosOrdenados);
                setError(null); // Limpiar cualquier mensaje/error previo si hay tramos válidos

            } else if (Array.isArray(response)) { // Manejo del formato antiguo si aún es necesario
                logger.debug(`Recibidos ${response.length} tramos del servidor (formato array)`);

                // Procesar tramos recibidos con validación
                const tramosValidos = response.filter(t => t && t.origen && t.destino);

                if (tramosValidos.length === 0) {
                    logger.info('No se encontraron tramos válidos para mostrar después del filtro frontend (formato array).');
                    setTramos([]);
                    setTramosOriginal([]);
                    setFilteredTramos([]);
                    setError('No se encontraron tramos con origen y destino definidos para mostrar.');
                    return; // Salir temprano
                }
                
                // Si hay tramos válidos, ordenarlos
                const tramosOrdenados = [...tramosValidos].sort((a, b) => {
                    // Ordenar primero por origen y luego por destino
                    if (a.origen?.nombre === b.origen?.nombre) {
                        return a.destino?.nombre?.localeCompare(b.destino?.nombre || '') || 0;
                    }
                    return a.origen?.nombre?.localeCompare(b.origen?.nombre || '') || 0;
                });
                
                setTramos(tramosOrdenados);
                setTramosOriginal(tramosOrdenados);
                setError(null); // Limpiar cualquier mensaje/error previo

            } else {
                // La respuesta no fue exitosa o el formato es incorrecto
                const errorMessage = response?.message || 'Formato de respuesta no reconocido o error en la solicitud';
                logger.error(`Error o formato no reconocido: ${errorMessage}`);
                setError(`No se pudieron cargar los tramos: ${errorMessage}`);
                setTramos([]);
                setTramosOriginal([]);
                setFilteredTramos([]);
            }
        } catch (error) {
            // Usar el servicio de errores para procesar y mostrar un mensaje amigable
            const processedError = errorService.processError(error, {
                context: 'TarifarioViewer.cargarTramos'
            });
            
            logger.error('Error al cargar tramos:', processedError);
            
            // Mostrar mensaje amigable para el usuario
            const errorMessage = errorService.getUserFriendlyMessage(processedError);
            setError(`No se pudieron cargar los tramos: ${errorMessage}`);
            setTramos([]);
            setTramosOriginal([]);
            setFilteredTramos([]);
        } finally {
            setLoading(false);
        }
        
        // Resetear selección y página
        setSelectedTramos([]);
        setPaginaActual(1);
    }, [cliente, filtroVigencia]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchSites();
        fetchTramos();
    }, [fetchSites, fetchTramos]);

    // Función para mostrar mensajes de error con más contexto y opciones de acción
    const handleError = useCallback((errorMsg, source, retryAction = null) => {
        const fullError = `${source}: ${errorMsg}`;
        logger.error(fullError);
        setError(fullError);
        
        // Si hay una acción de reintento, mostrarla
        if (retryAction) {
            // Implementación para reintento futuro
        }
    }, []);

    // Manejadores de eventos optimizados
    const handleAddTramo = async (tramoData) => {
        try {
            setLoadingOperation(true);
            
            // Añadir el cliente al tramo
            const tramoConCliente = {
                ...tramoData,
                cliente
            };
            
            await tarifarioService.createTramo(tramoConCliente);
            
            setShowAddForm(false);
            setSuccessMessage('Tramo creado correctamente');
            await fetchTramos();
        } catch (error) {
            handleError(error.message, 'Error al crear tramo');
        } finally {
            setLoadingOperation(false);
        }
    };

    const handleDeleteClick = (tramo) => {
        setTramoToDelete(tramo);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = () => {
        setTramoToDelete(null);
        setShowDeleteConfirm(true);
    };

    const handleEditClick = (tramo) => {
        setTramoToEdit(tramo);
        setShowAddForm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setLoadingOperation(true);

            if (tramoToDelete) {
                // Eliminar un solo tramo
                await tarifarioService.deleteTramo(tramoToDelete._id);
            } else {
                // Optimización: Usar Promise.all para eliminar tramos en paralelo
                const tramosToDelete = selectedTramos.map(id => id.split('-')[0]);
                await Promise.all(
                    tramosToDelete.map(id => tarifarioService.deleteTramo(id))
                );
            }
            
            setShowDeleteConfirm(false);
            setTramoToDelete(null);
            setSuccessMessage('Tramo(s) eliminado(s) correctamente');
            await fetchTramos();
        } catch (error) {
            handleError(error.message, 'Error al eliminar tramo(s)');
        } finally {
            setLoadingOperation(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setTramoToDelete(null);
    };

    const toggleSelectTramo = (id) => {
        setSelectedTramos(prev => {
            if (prev.includes(id)) {
                return prev.filter(tramoId => tramoId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const toggleSelectAll = () => {
        const allSelected = filteredTramos.length > 0 && 
                         filteredTramos.every(t => selectedTramos.includes(t._idCompuesto));
        
        if (allSelected) {
            setSelectedTramos([]);
        } else {
            setSelectedTramos(filteredTramos.map(t => t._idCompuesto));
        }
    };

    const handleBack = () => {
        onBack();
    };

    const handleOpenImporter = () => {
        setShowImporter(true);
    };

    const handleFilterOpen = () => {
        setShowFilters(true);
    };

    const handleFilterApply = (filtros) => {
        setFiltroVigencia(filtros);
    };

    const handleVigenciaMasivaOpen = () => {
        setIsVigenciaMasivaOpen(true);
    };

    const handleVigenciaMasivaUpdate = async (tramoIds, vigenciaData) => {
        try {
            setVigenciaMasivaLoading(true);
            
            // Obtener los IDs reales de los tramos (quitar el sufijo de tipo)
            const idsReales = tramoIds.map(id => id.split('-')[0]);
            
            await tarifarioService.updateVigenciaMasiva(idsReales, vigenciaData);
            
            setIsVigenciaMasivaOpen(false);
            setSuccessMessage('Vigencia actualizada correctamente');
            await fetchTramos();
        } catch (error) {
            handleError(error.message, 'Error al actualizar vigencia');
        } finally {
            setVigenciaMasivaLoading(false);
        }
    };

    const handleExportToExcel = () => {
        // Obtener los tramos seleccionados
        const tramosParaExportar = filteredTramos.filter(tramo => 
            selectedTramos.includes(tramo._idCompuesto)
        );
        
        if (tramosParaExportar.length === 0) {
            setError('No hay tramos seleccionados para exportar');
            return;
        }
        
        try {
            ExcelExporter.exportarSeleccionados(tramosParaExportar, cliente);
            setSuccessMessage(`${tramosParaExportar.length} tramos exportados correctamente`);
        } catch (error) {
            handleError(error.message, 'Error al exportar a Excel');
        }
    };

    const handleExportAllToExcel = () => {
        if (filteredTramos.length === 0) {
            setError('No hay tramos para exportar');
            return;
        }
        
        try {
            ExcelExporter.exportarTodos(filteredTramos, cliente);
            setSuccessMessage(`${filteredTramos.length} tramos exportados correctamente`);
        } catch (error) {
            handleError(error.message, 'Error al exportar a Excel');
        }
    };

    // Calcular total de tarifas ANTES de filtrar
    const totalTarifas = useMemo(() => {
        // Procesamos la lista original SIN filtros de fecha para obtener el total
        return procesarTramos(tramosOriginal, null, null).length;
    }, [tramosOriginal, procesarTramos]);

    // Actualizar filteredTramos cuando cambian los tramos originales o el filtro
    useEffect(() => {
        const tramosProcesados = procesarTramos(tramosOriginal, filtroVigencia.desde, filtroVigencia.hasta);
        setFilteredTramos(tramosProcesados);
        setPaginaActual(1); // Resetear a la primera página al cambiar el filtro
    }, [tramosOriginal, filtroVigencia, procesarTramos]);

    // Renderización del componente
    return (
        <Paper sx={{ width: '100%', p: 2 }}>
            {/* Barra de herramientas */}
            <Toolbar 
                sx={{ 
                    pl: { sm: 2 }, 
                    pr: { xs: 1, sm: 1 },
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                        Tarifario de Cliente
                    </Typography>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Volver
                    </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {permisos.includes('editar_tramos') && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setTramoToEdit(null);
                                setShowAddForm(true);
                            }}
                            size="small"
                            disabled={loading || loadingOperation}
                        >
                            Nuevo Tramo
                        </Button>
                    )}
                    
                    {permisos.includes('editar_tramos') && (
                        <Button
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            onClick={handleOpenImporter}
                            size="small"
                            disabled={loading || loadingOperation || sites.length === 0}
                        >
                            Importar
                        </Button>
                    )}
                    
                    <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={handleFilterOpen}
                        size="small"
                        color={filtroVigencia.desde ? 'secondary' : 'primary'}
                        disabled={loading || loadingOperation}
                    >
                        Filtrar
                    </Button>
                    
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportAllToExcel}
                        size="small"
                        disabled={filteredTramos.length === 0 || loading || loadingOperation}
                    >
                        Exportar Todos
                    </Button>
                </Box>
            </Toolbar>
            
            {/* Información y opciones */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Metadatos */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                        icon={<InfoIcon />} 
                        label={`Total: ${totalTarifas} tarifas`}
                        variant="outlined" 
                    />
                    {filteredTramos.length > 0 && (
                        <Chip 
                            label={`Mostrando: ${filteredTramos.length} tarifas`}
                            variant="outlined" 
                            color="primary"
                        />
                    )}
                    {filtroVigencia.desde && (
                        <Chip 
                            label={`Filtro: ${filtroVigencia.desde} a ${filtroVigencia.hasta}`} 
                            variant="outlined" 
                            color="secondary" 
                            onDelete={() => setFiltroVigencia({ desde: '', hasta: '' })}
                        />
                    )}
                </Box>
                
                {/* Mensajes de error o éxito */}
                {error && (
                    <Alert 
                        severity="error" 
                        onClose={() => setError(null)}
                        variant="filled"
                    >
                        {error}
                    </Alert>
                )}
                
                <Snackbar
                    open={!!successMessage}
                    autoHideDuration={5000}
                    onClose={() => setSuccessMessage(null)}
                    message={successMessage}
                />
                
                {/* Acciones sobre selección */}
                {selectedTramos.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                            {selectedTramos.length} tramos seleccionados
                        </Typography>
                        
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExportToExcel}
                            size="small"
                            disabled={loading || loadingOperation}
                        >
                            Exportar Selección
                        </Button>
                        
                        {permisos.includes('editar_tramos') && (
                            <Button
                                variant="outlined"
                                onClick={handleVigenciaMasivaOpen}
                                size="small"
                                disabled={loading || loadingOperation}
                            >
                                Actualizar Vigencia
                            </Button>
                        )}
                        
                        {permisos.includes('eliminar_tramos') && (
                            <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteSelected}
                                size="small"
                                color="error"
                                disabled={loading || loadingOperation}
                            >
                                Eliminar Selección
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
            
            {/* Contenido principal */}
            {(loading || loadingOperation) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TramosTable 
                        tramos={tramosPaginados} // Usar tramos paginados en lugar de todos
                        selectedTramos={selectedTramos}
                        fechaVigencia={filtroVigencia.desde || null}
                        onSelect={toggleSelectTramo}
                        onSelectAll={toggleSelectAll}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        permisos={permisos}
                    />
                    
                    {/* Paginación */}
                    {filteredTramos.length > tramosPorPagina && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                            <Pagination 
                                count={totalPaginas}
                                page={paginaActual}
                                onChange={handleChangePage}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
            
            {/* Diálogos con Suspense para carga diferida */}
            <Suspense fallback={<CircularProgress />}>
                {showAddForm && (
                    <AddTramoDialog 
                        open={showAddForm} 
                        onClose={() => setShowAddForm(false)} 
                        onSave={handleAddTramo} 
                        sites={sites} 
                        initialData={tramoToEdit}
                    />
                )}
                
                {showFilters && (
                    <FilterDialog 
                        open={showFilters} 
                        onClose={() => setShowFilters(false)} 
                        onApplyFilter={handleFilterApply} 
                        filtros={filtroVigencia}
                    />
                )}
                
                {isVigenciaMasivaOpen && (
                    <VigenciaMasivaDialog 
                        open={isVigenciaMasivaOpen} 
                        onClose={() => setIsVigenciaMasivaOpen(false)} 
                        onUpdate={handleVigenciaMasivaUpdate} 
                        tramosSeleccionados={selectedTramos}
                        loading={vigenciaMasivaLoading}
                    />
                )}
                
                {showImporter && (
                    <TramoBulkImporter
                        open={showImporter}
                        onClose={() => setShowImporter(false)}
                        onComplete={() => {
                            setShowImporter(false);
                            fetchTramos();
                        }}
                        cliente={cliente}
                        sites={sites}
                    />
                )}
            </Suspense>
            
            <Dialog 
                open={showDeleteConfirm} 
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {tramoToDelete 
                            ? '¿Está seguro que desea eliminar este tramo?' 
                            : `¿Está seguro que desea eliminar ${selectedTramos.length} tramos seleccionados?`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="primary" autoFocus>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TarifarioViewer; 