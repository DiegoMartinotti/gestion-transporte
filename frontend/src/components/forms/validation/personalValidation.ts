const DNI_REGEX = /^\d{7,8}$/;
const CUIL_REGEX = /^\d{2}-\d{8}-\d$/;

export const validateDNI = (value: string): string | null => {
  if (!value) return 'El DNI es obligatorio';
  if (!DNI_REGEX.test(value)) return 'DNI debe tener 7 u 8 dígitos';
  return null;
};

export const validateCUIL = (value: string): string | null => {
  if (value && !CUIL_REGEX.test(value)) {
    return 'CUIL debe tener formato XX-XXXXXXXX-X';
  }
  return null;
};

export const validateEmail = (value: string): string | null => {
  if (!value) return null;

  const [localPart, domainPart] = value.split('@');
  if (!localPart || !domainPart) return 'Email inválido';

  const domainSections = domainPart.split('.');
  if (domainSections.length < 2 || domainSections.some((section) => section.length === 0)) {
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
