export const validateNombre = (value: string): string | null => {
  if (!value.trim()) return 'El nombre es obligatorio';
  if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (value.trim().length > 100) return 'El nombre no puede tener más de 100 caracteres';
  return null;
};

export const validateCuit = (value: string): string | null => {
  if (!value.trim()) return 'El CUIT es obligatorio';
  const cuitRegex = /^(20|23|24|27|30|33|34)-\d{8}-\d$/;
  if (!cuitRegex.test(value.trim())) {
    return 'CUIT inválido. Formato: XX-XXXXXXXX-X';
  }
  return null;
};

export const validateEmail = (value: string): string | null => {
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

export const validateContacto = (value: string): string | null => {
  if (value && value.trim().length > 100) {
    return 'El contacto no puede tener más de 100 caracteres';
  }
  return null;
};

export const clienteValidationRules = {
  nombre: validateNombre,
  cuit: validateCuit,
  email: validateEmail,
  telefono: validateTelefono,
  direccion: validateDireccion,
  contacto: validateContacto,
};
