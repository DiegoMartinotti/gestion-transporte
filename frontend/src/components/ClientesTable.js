import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Table } from '../ui/components';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import logger from '../utils/logger';

const ClientesTable = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/clientes');
                logger.debug('Clientes recibidos:', response.data);
                setClientes(response.data);
            } catch (error) {
                logger.error('Error al obtener clientes:', error);
                setError(error.response?.data?.message || 'Error al cargar los clientes');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchClientes();
        }
    }, [isAuthenticated]);

    // Definición de columnas para la tabla
    const columns = [
        { id: 'nombre', label: 'Nombre' },
        { id: 'email', label: 'Email' },
        { id: 'telefono', label: 'Teléfono' },
        { 
            id: 'acciones', 
            label: 'Acciones',
            align: 'center',
            format: (value, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {/* Aquí puedes agregar botones de editar/eliminar */}
                    <Typography variant="body2">Editar</Typography>
                </Box>
            )
        },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Table
            columns={columns}
            data={clientes}
            title="Clientes"
            enableSearch={true}
            onRowClick={(row) => logger.debug('Cliente seleccionado:', row)}
        />
    );
};

export default ClientesTable;
