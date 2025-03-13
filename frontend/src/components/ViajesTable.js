import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const ViajesTable = () => {
    const [viajes, setViajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchViajes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/viajes');
                logger.debug('Viajes recibidos:', response.data);
                setViajes(response.data);
            } catch (error) {
                logger.error('Error al obtener viajes:', error);
                setError(error.response?.data?.message || 'Error al cargar los viajes');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchViajes();
        }
    }, [isAuthenticated]);

    // ...resto del código del componente...
};
