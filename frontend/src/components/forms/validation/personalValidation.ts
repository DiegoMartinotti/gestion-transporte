export const validateDNI = (value: string): string | null => {
  if (!value) return 'El DNI es obligatorio';
  if (!/^[0-9]{7,8}$/.test(value)) return 'DNI debe tener 7 u 8 dígitos';
  return null;
};

export const validateCUIL = (value: string): string | null => {
  if (value && !/^[0-9]{2}-[0-9]{8}-[0-9]$/.test(value)) {
    return 'CUIL debe tener formato XX-XXXXXXXX-X';
  }
  return null;
};

export const validateEmail = (value: string): string | null => {
  if (value && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
    return 'Email inválido';
  }
  return null;
};

export const validateNombre = (value: string): string | null => {
  if (!value) return 'El nombre es obligatorio';
  if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  return null;
};

export const validateApellido = (value: string): string | null => {
  if (!value) return 'El apellido es obligatorio';
  if (value.length < 2) return 'El apellido debe tener al menos 2 caracteres';
  return null;
};

export const validateFechaNacimiento = (value: Date | null): string | null => {
  if (!value) return 'La fecha de nacimiento es obligatoria';
  const edad = new Date().getFullYear() - value.getFullYear();
  if (edad < 18) return 'Debe ser mayor de 18 años';
  if (edad > 70) return 'La edad no puede ser mayor a 70 años';
  return null;
};

export const personalValidationRules = {
  nombre: validateNombre,
  apellido: validateApellido,
  dni: validateDNI,
  cuil: validateCUIL,
  fechaNacimiento: validateFechaNacimiento,
  'contacto.email': validateEmail,
};
