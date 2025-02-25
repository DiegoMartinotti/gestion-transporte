import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
                console.log('Clientes recibidos:', response.data);
                setClientes(response.data);
            } catch (error) {
                console.error('Error al obtener clientes:', error);
                setError(error.response?.data?.message || 'Error al cargar los clientes');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchClientes();
        }
    }, [isAuthenticated]);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!clientes.length) return <div>No hay clientes registrados</div>;

    return (
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clientes.map(cliente => (
                    <tr key={cliente._id}>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.email}</td>
                        <td>{cliente.telefono}</td>
                        <td>
                            {/* Aquí puedes agregar botones de editar/eliminar */}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ClientesTable;
