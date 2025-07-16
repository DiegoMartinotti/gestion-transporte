const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImport() {
    try {
        // Primer paso: autenticarse
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('Token obtenido:', token);
        
        // Segundo paso: importar archivo
        const filePath = path.join(__dirname, 'ejemplos', 'plantilla_viajes.xlsx');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        
        const importResponse = await axios.post('http://localhost:3001/api/viajes/bulk-import', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Respuesta de importación:', importResponse.data);
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testImport();