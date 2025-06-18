import mongoose, { Document, Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Interface for Usuario document
 */
export interface IUsuario extends Document {
    email: string;
    password: string;
    nombre: string;
    createdAt: Date;
    updatedAt: Date;
    
    // Instance methods
    verificarPassword(password: string): Promise<boolean>;
}

/**
 * Interface for Usuario Model
 */
export interface IUsuarioModel extends mongoose.Model<IUsuario> {}

/**
 * Esquema de usuario para MongoDB
 */
const usuarioSchema = new Schema<IUsuario>({
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, introduce un email válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
    },
    nombre: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

/**
 * Middleware que se ejecuta antes de guardar un usuario
 * Encripta la contraseña si ha sido modificada
 */
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

/**
 * Método para verificar la contraseña del usuario
 */
usuarioSchema.methods.verificarPassword = async function(this: IUsuario, password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

/**
 * Modelo de Usuario basado en el esquema definido
 */
const Usuario = model<IUsuario, IUsuarioModel>('Usuario', usuarioSchema);

export default Usuario;