/**
 * Tipo para representar coordenadas geográficas [longitud, latitud]
 */
type Coordenadas = [number, number];

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula haversine
 * @param coordenadas1 - Coordenadas del primer punto [longitud, latitud]
 * @param coordenadas2 - Coordenadas del segundo punto [longitud, latitud]
 * @returns Distancia en kilómetros, redondeada a 2 decimales
 */
function calcularDistancia(coordenadas1: Coordenadas, coordenadas2: Coordenadas): number {
    // Radio de la Tierra en kilómetros
    const R: number = 6371;
    
    // Convertir latitud/longitud de grados a radianes
    const lat1: number = (coordenadas1[1] * Math.PI) / 180;
    const lon1: number = (coordenadas1[0] * Math.PI) / 180;
    const lat2: number = (coordenadas2[1] * Math.PI) / 180;
    const lon2: number = (coordenadas2[0] * Math.PI) / 180;
    
    // Fórmula haversine
    const dLat: number = lat2 - lat1;
    const dLon: number = lon2 - lon1;
    const a: number = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia: number = R * c;
    
    // Redondear a 2 decimales
    return Math.round(distancia * 100) / 100;
}

export { calcularDistancia }; 