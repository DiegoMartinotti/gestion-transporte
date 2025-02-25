const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        
        const { email, password } = req.body;

        // Validación más detallada
        if (!email || !password) {
            console.log('Faltan campos:', { email: !!email, password: !!password });
            return res.status(400).json({ 
                message: 'Email y contraseña son requeridos',
                details: {
                    email: !email ? 'Email es requerido' : null,
                    password: !password ? 'Contraseña es requerida' : null
                }
            });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            console.log('Usuario no encontrado:', email);
            return res.status(401).json({ 
                message: 'Credenciales inválidas',
                details: 'Usuario no encontrado'
            });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas',
                details: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            { 
                userId: usuario._id,
                email: usuario.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Asegurar que los headers CORS estén presentes
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            token,
            user: {
                id: usuario._id,
                email: usuario.email,
                nombre: usuario.nombre
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }

        usuario = new Usuario({
            nombre,
            email,
            password // No hacer hash aquí, el modelo ya lo hace
        });

        await usuario.save();
        console.log('Usuario registrado:', email);
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
