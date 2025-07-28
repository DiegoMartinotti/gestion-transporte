/**
 * Tests unitarios para BaseService
 */

import mongoose from 'mongoose';
import { TestService, ITestDocument, TestModel } from '../mocks/MockModel';
import '../setup';

describe('BaseService', () => {
  let testService: TestService;
  let testDocument: ITestDocument;

  beforeEach(() => {
    testService = new TestService();
  });

  describe('CRUD Operations', () => {
    describe('create()', () => {
      it('debería crear un documento válido', async () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          age: 25
        };

        const result = await testService.create(data);

        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.name).toBe(data.name);
        expect(result.email).toBe(data.email);
        expect(result.age).toBe(data.age);
        expect(result.isActive).toBe(true);
      });

      it('debería fallar con datos inválidos', async () => {
        const data = {
          name: '', // Nombre vacío
          email: 'invalid-email',
          age: 150 // Edad inválida
        };

        await expect(testService.create(data)).rejects.toThrow();
      });

      it('debería fallar sin nombre requerido', async () => {
        const data = {
          email: 'test@example.com',
          age: 25
        };

        await expect(testService.create(data)).rejects.toThrow('El nombre es requerido');
      });
    });

    describe('getById()', () => {
      beforeEach(async () => {
        testDocument = await testService.create({
          name: 'Test User',
          email: 'test@example.com'
        });
      });

      it('debería obtener un documento existente', async () => {
        const result = await testService.getById(testDocument._id.toString());

        expect(result).toBeDefined();
        expect(result!._id.toString()).toBe(testDocument._id.toString());
        expect(result!.name).toBe('Test User');
      });

      it('debería retornar null para ID inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const result = await testService.getById(fakeId);

        expect(result).toBeNull();
      });

      it('debería fallar con ID inválido', async () => {
        await expect(testService.getById('invalid-id')).rejects.toThrow('ID del documento no es un ObjectId válido');
      });

      it('debería fallar con ID vacío', async () => {
        await expect(testService.getById('')).rejects.toThrow('ID del documento es requerido');
      });
    });

    describe('getAll()', () => {
      beforeEach(async () => {
        // Crear documentos de prueba
        await testService.create({ name: 'User 1', age: 20 });
        await testService.create({ name: 'User 2', age: 30 });
        await testService.create({ name: 'User 3', age: 40 });
      });

      it('debería obtener todos los documentos con paginación por defecto', async () => {
        const result = await testService.getAll();

        expect(result.data).toHaveLength(3);
        expect(result.paginacion.total).toBe(3);
        expect(result.paginacion.paginas).toBe(1);
        expect(result.paginacion.paginaActual).toBe(1);
        expect(result.paginacion.limite).toBe(50);
      });

      it('debería paginar correctamente', async () => {
        const result = await testService.getAll({
          limite: 2,
          pagina: 1
        });

        expect(result.data).toHaveLength(2);
        expect(result.paginacion.total).toBe(3);
        expect(result.paginacion.paginas).toBe(2);
        expect(result.paginacion.paginaActual).toBe(1);
      });

      it('debería filtrar correctamente', async () => {
        const result = await testService.getAll({
          filtros: { age: { $gte: 30 } }
        });

        expect(result.data).toHaveLength(2);
        expect(result.data.every(doc => doc.age >= 30)).toBe(true);
      });
    });

    describe('update()', () => {
      beforeEach(async () => {
        testDocument = await testService.create({
          name: 'Original Name',
          email: 'original@example.com'
        });
      });

      it('debería actualizar un documento existente', async () => {
        const updateData = {
          name: 'Updated Name',
          age: 35
        };

        const result = await testService.update(testDocument._id.toString(), updateData);

        expect(result).toBeDefined();
        expect(result!.name).toBe('Updated Name');
        expect(result!.age).toBe(35);
        expect(result!.email).toBe('original@example.com'); // No cambiado
      });

      it('debería fallar con ID inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        
        await expect(testService.update(fakeId, { name: 'New Name' })).rejects.toThrow('no encontrado');
      });

      it('debería fallar con datos inválidos', async () => {
        await expect(testService.update(testDocument._id.toString(), { 
          name: '',
          age: 200 
        })).rejects.toThrow();
      });

      it('debería soportar upsert', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        
        const result = await testService.update(fakeId, { 
          name: 'Upserted User' 
        }, { upsert: true });

        expect(result).toBeDefined();
        expect(result!.name).toBe('Upserted User');
      });
    });

    describe('delete()', () => {
      beforeEach(async () => {
        testDocument = await testService.create({
          name: 'To Delete',
          email: 'delete@example.com'
        });
      });

      it('debería eliminar un documento existente', async () => {
        const result = await testService.delete(testDocument._id.toString());

        expect(result.success).toBe(true);
        expect(result.message).toBe('Documento eliminado correctamente');

        // Verificar que ya no existe
        const deletedDoc = await testService.getById(testDocument._id.toString());
        expect(deletedDoc).toBeNull();
      });

      it('debería fallar con ID inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        
        await expect(testService.delete(fakeId)).rejects.toThrow('no encontrado');
      });

      it('debería fallar con ID inválido', async () => {
        await expect(testService.delete('invalid-id')).rejects.toThrow('ID del documento no es un ObjectId válido');
      });
    });
  });

  describe('Validaciones', () => {
    describe('validateId()', () => {
      it('debería validar IDs válidos', () => {
        const validId = new mongoose.Types.ObjectId().toString();
        expect(() => testService.testValidateId(validId)).not.toThrow();
      });

      it('debería fallar con IDs inválidos', () => {
        expect(() => testService.testValidateId('invalid')).toThrow('ID no es un ObjectId válido');
        expect(() => testService.testValidateId('')).toThrow('ID es requerido');
      });
    });

    describe('validateRequired()', () => {
      it('debería validar campos requeridos presentes', () => {
        const data = { name: 'Test', email: 'test@example.com' };
        expect(() => testService.testValidateRequired(data, ['name', 'email'])).not.toThrow();
      });

      it('debería fallar con campos faltantes', () => {
        const data = { name: 'Test' };
        expect(() => testService.testValidateRequired(data, ['name', 'email'])).toThrow('Campos requeridos faltantes: email');
      });

      it('debería fallar con datos null/undefined', () => {
        expect(() => testService.testValidateRequired(null, ['name'])).toThrow('Los datos son requeridos');
        expect(() => testService.testValidateRequired(undefined, ['name'])).toThrow('Los datos son requeridos');
      });
    });
  });

  describe('Transacciones', () => {
    it('debería hacer rollback en error durante creación', async () => {
      const initialCount = await TestModel.countDocuments();

      // Crear datos que fallarán en validateData
      const invalidData = {
        name: '', // Nombre vacío causará error
        email: 'test@example.com'
      };

      await expect(testService.create(invalidData)).rejects.toThrow();

      // Verificar que no se creó ningún documento
      const finalCount = await TestModel.countDocuments();
      expect(finalCount).toBe(initialCount);
    });

    it('debería manejar transacciones en operaciones bulk', async () => {
      // Este test requiere implementación de operaciones bulk específicas
      // Por ahora solo verificamos que el método executeBulkWrite existe
      expect(typeof (testService as any).executeBulkWrite).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('debería manejar errores de validación de Mongoose', async () => {
      // Intentar crear con campo que viola schema constraints
      const invalidData = {
        name: 'Test',
        age: -5 // Violación de constraint min: 0
      };

      await expect(testService.create(invalidData)).rejects.toThrow();
    });

    it('debería manejar errores de clave duplicada', async () => {
      const data = {
        name: 'Test User',
        email: 'duplicate@example.com'
      };

      // Crear el primer documento
      await testService.create(data);

      // Intentar crear otro con el mismo email (unique constraint)
      await expect(testService.create(data)).rejects.toThrow('Ya existe un registro con ese email');
    });
  });
});