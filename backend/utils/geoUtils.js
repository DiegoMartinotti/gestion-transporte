function calcularDistancia(coordenadas1, coordenadas2) {
    // Radio de la Tierra en kilómetros
    const R = 6371;
    
    // Convertir latitud/longitud de grados a radianes
    const lat1 = (coordenadas1[1] * Math.PI) / 180;
    const lon1 = (coordenadas1[0] * Math.PI) / 180;
    const lat2 = (coordenadas2[1] * Math.PI) / 180;
    const lon2 = (coordenadas2[0] * Math.PI) / 180;
    
    // Fórmula haversine
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    // Redondear a 2 decimales
    return Math.round(distancia * 100) / 100;
}

module.exports = { calcularDistancia };
