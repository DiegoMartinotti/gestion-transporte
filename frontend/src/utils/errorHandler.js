export const handleApiError = (error) => {
  console.error('API Error:', error);
  let message = 'Ocurrió un error inesperado';
  
  if (error.response) {
    message = error.response.data?.error || error.response.statusText;
  } else if (error.message) {
    message = error.message;
  }

  return message;
};
