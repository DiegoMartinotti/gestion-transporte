// Las funciones relacionadas con tokens en localStorage ya no son necesarias
// con el enfoque de cookies HttpOnly

// Eliminando todas las funciones, ya que ahora se utiliza axiosInstance configurado 
// con withCredentials y Content-Type ya está configurado en la instancia

// Si algún componente necesita encabezados específicos, puede configurarlos directamente
// al hacer la llamada a la API
