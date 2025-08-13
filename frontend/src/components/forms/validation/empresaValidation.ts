export const validateNombre = (value: string): string | null => {
  if (!value.trim()) return 'El nombre es obligatorio';
  if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (value.trim().length > 100) return 'El nombre no puede tener más de 100 caracteres';
  return null;
};

export const validateTipo = (value: string): string | null => {
  if (!value) return 'El tipo de empresa es obligatorio';
  return null;
};

export const validateMail = (value: string): string | null => {
  if (value && !/^\S+@\S+\.\S+$/.test(value)) {
    return 'Formato de email inválido';
  }
  return null;
};

export const validateTelefono = (value: string): string | null => {
  if (value && value.trim().length > 20) {
    return 'El teléfono no puede tener más de 20 caracteres';
  }
  return null;
};

export const validateDireccion = (value: string): string | null => {
  if (value && value.trim().length > 200) {
    return 'La dirección no puede tener más de 200 caracteres';
  }
  return null;
};

export const validateContactoPrincipal = (value: string): string | null => {
  if (value && value.trim().length > 100) {
    return 'El contacto no puede tener más de 100 caracteres';
  }
  return null;
};

export const validateCuit = (value: string): string | null => {
  if (value && !/^\d{2}-\d{8}-\d{1}$/.test(value) && !/^\d{11}$/.test(value)) {
    return 'CUIT debe tener formato XX-XXXXXXXX-X o 11 dígitos';
  }
  return null;
};

export const validateSitioWeb = (value: string): string | null => {
  if (value && !/^https?:\/\//.test(value)) {
    return 'El sitio web debe comenzar con http:// o https://';
  }
  return null;
};

export const empresaValidationRules = {
  nombre: validateNombre,
  tipo: validateTipo,
  mail: validateMail,
  telefono: validateTelefono,
  direccion: validateDireccion,
  contactoPrincipal: validateContactoPrincipal,
  cuit: validateCuit,
  sitioWeb: validateSitioWeb,
};
