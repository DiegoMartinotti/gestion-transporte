/**
 * Modelo mock para testing del BaseService
 */

import mongoose, { Schema, Document } from 'mongoose';

// Interface para el documento de test
export interface ITestDocument extends Document {
  name: string;
  email?: string;
  age?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de test
const TestSchema = new Schema<ITestDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Modelo de test
export const TestModel = mongoose.models.Test || mongoose.model<ITestDocument>('Test', TestSchema);

// Servicio de test que extiende BaseService
import { BaseService } from '../../services/BaseService';

export class TestService extends BaseService<ITestDocument> {
  constructor() {
    super(TestModel);
  }

  // Implementar método abstracto requerido
  protected async validateData(data: Partial<ITestDocument>): Promise<void> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('El email no es válido');
    }
    
    if (data.age !== undefined && (data.age < 0 || data.age > 120)) {
      throw new Error('La edad debe estar entre 0 y 120 años');
    }
  }

  // Hook de ejemplo después de crear
  protected async afterCreate(documento: ITestDocument): Promise<void> {
    // Simular lógica post-creación (ej: enviar email de bienvenida)
    console.log(`Documento creado: ${documento.name} (${documento._id})`);
  }

  // Hook de ejemplo antes de eliminar
  protected async beforeDelete(documento: ITestDocument): Promise<void> {
    // Simular validación pre-eliminación
    if (documento.isActive) {
      console.log(`Desactivando documento antes de eliminar: ${documento._id}`);
    }
  }

  // Método helper privado
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método público para testing
  public async createWithValidation(data: Partial<ITestDocument>): Promise<ITestDocument> {
    return this.create(data);
  }

  // Método público para testing de validaciones
  public async testValidateId(id: string): Promise<void> {
    this.validateId(id);
  }

  public async testValidateRequired(data: unknown, fields: string[]): Promise<void> {
    this.validateRequired(data, fields);
  }
}