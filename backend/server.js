const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

dotenv.config();

// DEBUG TEMPORAL
console.log('=== DEBUG EMAIL CONFIG ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS definido:', !!process.env.EMAIL_PASS);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('EMAIL_PASS es string:', typeof process.env.EMAIL_PASS === 'string');
console.log('=============================');

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// 💳 CONFIGURAR MERCADO PAGO
console.log('🔍 MP_ACCESS_TOKEN configurado:', !!process.env.MP_ACCESS_TOKEN);
console.log('🔍 Primeros caracteres del token:', process.env.MP_ACCESS_TOKEN?.substring(0, 15));

const mercadopagoClient = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

if (!process.env.MP_ACCESS_TOKEN) {
  console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en las variables de entorno');
  console.error('❌ Mercado Pago NO funcionará correctamente');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "503963971592-17vo21di0tjf249341l4ocscemath5p0.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// 📧 RATE LIMITING PARA EMAILS
const emailRateLimit = new Map();

const checkEmailRateLimit = (email) => {
  const now = Date.now();
  const lastSent = emailRateLimit.get(email);
  
  if (lastSent && (now - lastSent) < 60000) {
    return false;
  }
  
  emailRateLimit.set(email, now);
  return true;
};

// 📧 CONFIGURACIÓN MEJORADA DE NODEMAILER - TEMPORALMENTE DESHABILITADA
const crearTransporter = () => {
  console.log('⚠️ VERIFICACIÓN DE EMAIL TEMPORALMENTE DESHABILITADA');
  console.log('✅ Los usuarios se registrarán sin verificación de email');
  return null; // Retornar null para deshabilitar email
};

let transporter;
try {
  transporter = crearTransporter();
  console.log('📧 Email service:', transporter ? 'Habilitado' : 'DESHABILITADO (temporal)');
} catch (error) {
  console.error('❌ Error crítico creando transporter:', error);
  transporter = null;
}

// Reemplaza esta función en server.js
const verificarConfiguracionEmail = (req, res, next) => {
  console.log('⚠️ Verificación de email DESHABILITADA - Continuando sin verificación');
  req.emailDisabled = true; // Marcar que email está deshabilitado
  return next(); // ✅ PERMITIR CONTINUAR
};

// ========================================
// 🌐 CONFIGURACIÓN CORS COMPLETA Y FUNCIONAL
// ========================================

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://biosysvet.site',
  'https://www.biosysvet.site',
  'https://accounts.google.com',
  'https://www.googleapis.com'
];

// Aplicar CORS primero
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️ Origin no permitido:', origin);
      callback(null, true); // Temporal
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204
}));

// Manejar OPTIONS para todas las rutas DEL ROUTER
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ======================
   📸 CONFIGURACIÓN DE MULTER PARA BASE64 (MEMORIA)
   ====================== */

// 🆕 ALMACENAMIENTO EN MEMORIA para convertir a Base64
const storage = multer.memoryStorage();

const uploadMascota = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

const uploadProducto = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

console.log('✅ Multer configurado para guardar en MONGODB (Base64)');

/* ======================
   📸 FUNCIONES HELPER PARA IMÁGENES BASE64
   ====================== */

const convertirImagenABase64 = (file) => {
  if (!file) return null;
  
  return {
    data: file.buffer.toString('base64'),
    contentType: file.mimetype
  };
};

const obtenerImagenBase64ParaCliente = (imagenObj) => {
  if (!imagenObj || !imagenObj.data) return null;
  
  return `data:${imagenObj.contentType};base64,${imagenObj.data}`;
};

/* ======================
   Conexión a MongoDB Atlas
   ====================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Conectado a MongoDB Atlas");
    
    console.log("🤖 Iniciando sistema automático de gestión de citas...");
    setTimeout(() => {
      iniciarSistemaAutomatico();
    }, 3000);
    
  } catch (err) {
    console.error("❌ Error al conectar MongoDB:", err.message);
    process.exit(1);
  }
};
connectDB();

/* ======================
   MODELOS
   ====================== */

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    telefono: { 
      type: String, 
      required: true, 
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+?[\d\s\-\(\)]{7,15}$/.test(v);
        },
        message: 'El teléfono debe tener un formato válido'
      }
    },
    direccion: {
      calle: { type: String, required: true, trim: true },
      ciudad: { type: String, required: true, trim: true },
      estado: { type: String, required: true, trim: true },
      pais: { type: String, required: true, trim: true, default: 'Colombia' }
    },
    role: { type: String, default: "user", enum: ["user", "admin"] },
    googleId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String },
    authMethod: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    pendingActivation: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', function(next) {
  if (this.googleId && !this.emailVerified) {
    this.emailVerified = true;
    this.pendingActivation = false;
  }
  next();
});

const User = mongoose.model("User", userSchema);

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
  },
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    default: 0,
  },
  itemCount: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

CartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.lastUpdated = new Date();
  next();
});

CartSchema.methods.cleanupItems = function() {
  this.items = this.items.filter(item => item.quantity > 0);
  return this;
};

const Cart = mongoose.model('Cart', CartSchema);


// 🆕 ESQUEMA DE MASCOTA CON IMAGEN EN BASE64, FECHA DE NACIMIENTO, DATOS PERSONALES Y EXAMEN OCUPACIONAL
// 🆕 ESQUEMA DE MASCOTA CON IMAGEN EN BASE64, FECHA DE NACIMIENTO, DATOS PERSONALES, EXAMEN OCUPACIONAL Y TALLAJE
const mascotaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    tipoDocumento: { 
      type: String, 
      required: true, 
      enum: ["CC", "TI", "CE", "Pasaporte", "Otro"],
      trim: true 
    },
    numeroDocumento: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true
    },
    estadoCivil: { 
      type: String, 
      required: true, 
      enum: ["Soltero", "Casado", "Divorciado", "Viudo", "Unión Libre"],
      trim: true 
    },
    fechaExamenOcupacional: { type: Date, required: true },
    tallajeBotas: { type: String, required: true, trim: true },
    especie: { type: String, required: true, trim: true },
    raza: { type: String, required: true, trim: true },
    fechaNacimiento: { type: Date, required: true },
    edad: { type: Number, min: 0, max: 99 },
    genero: { type: String, required: true, enum: ["Macho", "Hembra"] },
    estado: { type: String, required: true, trim: true },
    enfermedades: { type: String, default: "", trim: true },
    historial: { type: String, default: "", trim: true },
    imagen: {
      data: { type: String },
      contentType: { type: String }
    },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vacunas: [
      {
        nombre: { type: String, required: true, trim: true },
        fecha: { type: Date, required: true },
        imagen: {
          data: { type: String },
          contentType: { type: String }
        }
      },
    ],
    operaciones: [
      {
        nombre: { type: String, required: true, trim: true },
        descripcion: { type: String, required: true, trim: true },
        fecha: { type: Date, required: true },
        imagen: {
          data: { type: String },
          contentType: { type: String }
        }
      },
    ],
  },
  { timestamps: true }
);

// Middleware para calcular edad automáticamente antes de guardar
mascotaSchema.pre('save', function(next) {
  if (this.fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(this.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    this.edad = edad;
  }
  next();
});

const Mascota = mongoose.model("Mascota", mascotaSchema);

// 🆕 ESQUEMA DE PRODUCTO CON IMAGEN EN BASE64
const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    // 🆕 IMAGEN COMO OBJETO CON DATA Y CONTENTTYPE
    imagen: {
      data: { type: String },
      contentType: { type: String }
    },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    descuento: {
      tiene: { type: Boolean, default: false },
      porcentaje: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        validate: {
          validator: function(v) {
            if (this.descuento.tiene && (v <= 0 || v > 100)) {
              return false;
            }
            return true;
          },
          message: 'El porcentaje de descuento debe estar entre 1 y 100'
        }
      },
      fechaInicio: { type: Date },
      fechaFin: { type: Date }
    },
    garantia: {
      tiene: { type: Boolean, default: false },
      meses: { 
        type: Number, 
        default: 0, 
        min: 0,
        validate: {
          validator: function(v) {
            if (this.garantia.tiene && v <= 0) {
              return false;
            }
            return true;
          },
          message: 'Los meses de garantía deben ser mayor a 0'
        }
      },
      descripcion: { type: String, default: "", trim: true }
    },
    envioGratis: { 
      type: Boolean, 
      default: false 
    },
    stock: { type: Number, default: 0, min: 0 },
    categoria: { 
      type: String, 
      enum: ["alimento", "juguetes", "medicamentos", "accesorios", "higiene", "otros"],
      default: "otros"
    },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productoSchema.methods.getPrecioConDescuento = function() {
  if (!this.descuento.tiene || this.descuento.porcentaje <= 0) {
    return this.precio;
  }
  
  const ahora = new Date();
  if (this.descuento.fechaInicio && ahora < this.descuento.fechaInicio) {
    return this.precio;
  }
  if (this.descuento.fechaFin && ahora > this.descuento.fechaFin) {
    return this.precio;
  }
  
  const descuentoDecimal = this.descuento.porcentaje / 100;
  return this.precio * (1 - descuentoDecimal);
};

productoSchema.methods.isDescuentoVigente = function() {
  if (!this.descuento.tiene) return false;
  
  const ahora = new Date();
  if (this.descuento.fechaInicio && ahora < this.descuento.fechaInicio) {
    return false;
  }
  if (this.descuento.fechaFin && ahora > this.descuento.fechaFin) {
    return false;
  }
  
  return true;
};

const Producto = mongoose.model("Producto", productoSchema);

const citaSchema = new mongoose.Schema(
  {
    mascota: { type: mongoose.Schema.Types.ObjectId, ref: "Mascota", required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tipo: { type: String, required: true, enum: ["consulta", "operacion", "vacunacion", "emergencia"] },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    motivo: { type: String, required: true, trim: true },
    estado: { type: String, default: "pendiente", enum: ["pendiente", "confirmada", "cancelada", "completada"] },
    notas: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

citaSchema.index({ fecha: 1, hora: 1 }, { unique: true });

const Cita = mongoose.model("Cita", citaSchema);

/* ======================
   🤖 SISTEMA AUTOMÁTICO DE GESTIÓN DE CITAS
   ====================== */

const actualizarCitasVencidas = async () => {
  try {
    const ahora = new Date();
    console.log('🔄 Iniciando actualización de citas vencidas...');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ahoraHora = new Date().toTimeString().substring(0, 5);

    const result = await Cita.updateMany(
      {
        $and: [
          { estado: { $in: ['pendiente', 'confirmada'] } },
          {
            $or: [
              { fecha: { $lt: hoy } },
              {
                $and: [
                  { fecha: { $gte: hoy } },
                  { fecha: { $lt: new Date(hoy.getTime() + 24*60*60*1000) } },
                  { hora: { $lt: ahoraHora } }
                ]
              }
            ]
          }
        ]
      },
      {
        $set: { estado: 'completada' },
        $currentDate: { updatedAt: true }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ ${result.modifiedCount} citas actualizadas a estado "completada"`);
    } else {
      console.log('ℹ️ No hay citas vencidas para actualizar');
    }

    return result;
  } catch (error) {
    console.error('❌ Error actualizando citas vencidas:', error);
    return null;
  }
};

const eliminarCitasAntiguas = async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 3);
    fechaLimite.setHours(23, 59, 59, 999);
    
    console.log('🗑️ Iniciando eliminación de citas antiguas...');
    console.log('📅 Eliminando citas anteriores a:', fechaLimite.toLocaleDateString());

    const citasParaEliminar = await Cita.find({
      fecha: { $lt: fechaLimite },
      estado: { $in: ['completada', 'cancelada'] }
    }).populate('mascota', 'nombre').populate('usuario', 'name email');

    if (citasParaEliminar.length > 0) {
      console.log('📋 Citas que serán eliminadas:');
      citasParaEliminar.forEach(cita => {
        console.log(`  - ${cita.mascota?.nombre || 'Mascota'} (${cita.usuario?.name}) - ${cita.fecha.toLocaleDateString()} - ${cita.estado}`);
      });

      const result = await Cita.deleteMany({
        fecha: { $lt: fechaLimite },
        estado: { $in: ['completada', 'cancelada'] }
      });

      console.log(`✅ ${result.deletedCount} citas eliminadas exitosamente`);
      return result;
    } else {
      console.log('ℹ️ No hay citas antiguas para eliminar');
      return { deletedCount: 0 };
    }

  } catch (error) {
    console.error('❌ Error eliminando citas antiguas:', error);
    return null;
  }
};

const ejecutarMantenimientoCitas = async () => {
  console.log('🤖 === INICIANDO MANTENIMIENTO AUTOMÁTICO DE CITAS ===');
  console.log('🕐 Timestamp:', new Date().toLocaleString());

  try {
    const resultadoActualizacion = await actualizarCitasVencidas();
    const resultadoEliminacion = await eliminarCitasAntiguas();

    console.log('📊 === RESUMEN DEL MANTENIMIENTO ===');
    console.log(`📝 Citas actualizadas: ${resultadoActualizacion?.modifiedCount || 0}`);
    console.log(`🗑️ Citas eliminadas: ${resultadoEliminacion?.deletedCount || 0}`);
    console.log('✅ Mantenimiento completado exitosamente');
    console.log('==========================================');

    return {
      success: true,
      citasActualizadas: resultadoActualizacion?.modifiedCount || 0,
      citasEliminadas: resultadoEliminacion?.deletedCount || 0,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Error en mantenimiento de citas:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

const obtenerEstadisticasCitas = async () => {
  try {
    const ahora = new Date();
    const hace3Dias = new Date();
    hace3Dias.setDate(hace3Dias.getDate() - 3);

    const stats = await Cita.aggregate([
      {
        $facet: {
          porEstado: [
            {
              $group: {
                _id: '$estado',
                count: { $sum: 1 }
              }
            }
          ],
          vencidas: [
            {
              $match: {
                fecha: { $lt: ahora },
                estado: { $in: ['pendiente', 'confirmada'] }
              }
            },
            {
              $count: 'total'
            }
          ],
          elegiblesEliminacion: [
            {
              $match: {
                fecha: { $lt: hace3Dias },
                estado: { $in: ['completada', 'cancelada'] }
              }
            },
            {
              $count: 'total'
            }
          ],
          total: [
            {
              $count: 'total'
            }
          ]
        }
      }
    ]);

    return {
      porEstado: stats[0].porEstado,
      citasVencidas: stats[0].vencidas[0]?.total || 0,
      elegiblesEliminacion: stats[0].elegiblesEliminacion[0]?.total || 0,
      totalCitas: stats[0].total[0]?.total || 0,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

const INTERVALO_MANTENIMIENTO = 2 * 60 * 60 * 1000;

let intervalId = null;

const iniciarSistemaAutomatico = () => {
  console.log('🚀 Iniciando sistema automático de gestión de citas...');
  console.log(`⏰ Configurado para ejecutarse cada ${INTERVALO_MANTENIMIENTO / (60 * 60 * 1000)} horas`);
  
  setTimeout(() => {
    console.log('🔄 Ejecutando mantenimiento inicial...');
    ejecutarMantenimientoCitas();
  }, 30000);
  
  intervalId = setInterval(ejecutarMantenimientoCitas, INTERVALO_MANTENIMIENTO);
  
  console.log('✅ Sistema automático iniciado exitosamente');
};

const detenerSistemaAutomatico = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Sistema automático detenido');
  }
};

/* ======================
   Middlewares de Auth
   ====================== */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ error: "Acceso denegado: Debes iniciar sesion primero" });

  try {
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Debes iniciar sesion primero" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "No tienes permisos de administrador" });
  next();
};

/* ======================
   FUNCIONES DE UTILIDAD
   ====================== */
const esHorarioValido = (hora) => {
  const [hours, minutes] = hora.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  const mañanaInicio = 7 * 60;
  const mañanaFin = 12 * 60;
  const tardeInicio = 14 * 60;
  const tardeFin = 18 * 60;
  
  return (timeInMinutes >= mañanaInicio && timeInMinutes <= mañanaFin) ||
         (timeInMinutes >= tardeInicio && timeInMinutes <= tardeFin);
};

const esFechaValida = (fechaString) => {
  try {
    const fechaCita = new Date(fechaString + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) return false;
    if (fechaCita.getDay() === 0) return false;
    
    return true;
  } catch (error) {
    console.error('Error validando fecha:', error);
    return false;
  }
};

const normalizarFecha = (fechaString) => {
  return new Date(fechaString + 'T00:00:00');
};

const validarTelefono = (telefono) => {
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  return /^\+?[\d]{7,15}$/.test(telefonoLimpio);
};

const validarDireccion = (direccion) => {
  const { calle, ciudad, estado } = direccion;
  
  if (!calle || !ciudad || !estado) {
    return { valido: false, mensaje: "Todos los campos de dirección son obligatorios" };
  }
  
  if (calle.trim().length < 5) {
    return { valido: false, mensaje: "La dirección debe tener al menos 5 caracteres" };
  }
  
  if (ciudad.trim().length < 2) {
    return { valido: false, mensaje: "La ciudad debe tener al menos 2 caracteres" };
  }
  
  if (estado.trim().length < 2) {
    return { valido: false, mensaje: "El estado debe tener al menos 2 caracteres" };
  }
  
  return { valido: true };
};

const validarProducto = (datos) => {
  const { nombre, descripcion, precio, descuento, garantia, categoria, stock } = datos;
  
  if (!nombre || !descripcion || precio === undefined) {
    return { valido: false, mensaje: "Nombre, descripción y precio son obligatorios" };
  }
  
  if (precio < 0) {
    return { valido: false, mensaje: "El precio no puede ser negativo" };
  }
  
  if (descuento && descuento.tiene) {
    if (!descuento.porcentaje || descuento.porcentaje <= 0 || descuento.porcentaje > 100) {
      return { valido: false, mensaje: "El porcentaje de descuento debe estar entre 1 y 100" };
    }
    
    if (descuento.fechaInicio && descuento.fechaFin) {
      if (new Date(descuento.fechaInicio) >= new Date(descuento.fechaFin)) {
        return { valido: false, mensaje: "La fecha de inicio del descuento debe ser anterior a la fecha de fin" };
      }
    }
  }
  
  if (garantia && garantia.tiene) {
    if (!garantia.meses || garantia.meses <= 0) {
      return { valido: false, mensaje: "Los meses de garantía deben ser mayor a 0" };
    }
  }
  
  if (stock !== undefined && stock < 0) {
    return { valido: false, mensaje: "El stock no puede ser negativo" };
  }
  
  const categoriasValidas = ["alimento", "juguetes", "medicamentos", "accesorios", "higiene", "otros"];
  if (categoria && !categoriasValidas.includes(categoria)) {
    return { valido: false, mensaje: "Categoría no válida" };
  }
  
  return { valido: true };
};

/* ======================
   📧 FUNCIONES DE EMAIL
   ====================== */

const generarTokenVerificacion = () => {
  return crypto.randomBytes(32).toString('hex');
};

const limpiarTokensExpirados = async () => {
  try {
    const result = await User.deleteMany({
      emailVerificationExpires: { $lt: new Date() },
      emailVerified: false
    });
    console.log(`🗑️ Tokens expirados eliminados: ${result.deletedCount}`);
  } catch (error) {
    console.error('Error limpiando tokens:', error);
  }
};

setInterval(limpiarTokensExpirados, 60 * 60 * 1000);

const plantillaEmailVerificacion = (nombre, tokenVerificacion) => {
  const urlVerificacion = `${FRONTEND_URL}/verificar-email?token=${tokenVerificacion}`;
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificar Email - Clínica Veterinaria</title>
        <style>
            @media only screen and (max-width: 600px) {
                .container { width: 95% !important; padding: 20px !important; }
                .content { padding: 20px !important; }
                .verify-button { padding: 12px 20px !important; font-size: 14px !important; }
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                color: white !important;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
            }
            .verify-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
            }
            .warning {
                background: #fef2f2;
                border-left: 4px solid #dc2626;
                padding: 16px;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🐾 Clínica Veterinaria</div>
                <p>Tu cuenta está casi lista</p>
            </div>
            
            <div class="content">
                <h2 style="color: #7c3aed; margin-bottom: 20px;">¡Hola ${nombre}!</h2>
                
                <p>Gracias por registrarte en nuestra clínica veterinaria. Solo necesitas verificar tu email para activar tu cuenta.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${urlVerificacion}" class="verify-button">
                        ✅ Verificar mi correo
                    </a>
                </div>
                
                <p>Si el botón no funciona, copia este enlace:</p>
                <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px;">
                    ${urlVerificacion}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas.
                </div>
                
                <p><strong>Una vez verificado podrás:</strong></p>
                <ul style="color: #64748b;">
                    <li>Registrar tus mascotas</li>
                    <li>Agendar citas veterinarias</li>
                    <li>Acceder a nuestros productos</li>
                    <li>Gestionar tu perfil</li>
                    <li>Guardar tu carrito de compras</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Este email fue enviado desde Clínica Veterinaria</p>
                <p>Si no te registraste, puedes ignorar este mensaje</p>
                <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const enviarEmailVerificacion = async (email, nombre, token) => {
  if (!transporter) {
    console.error('❌ Transporter no configurado');
    return { success: false, error: 'Servicio de email no configurado' };
  }

  try {
    const mailOptions = {
      from: {
        name: 'Clínica Veterinaria',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🐾 Verificar tu cuenta - Clínica Veterinaria',
      html: plantillaEmailVerificacion(nombre, token),
      replyTo: process.env.EMAIL_USER,
      headers: {
        'X-Mailer': 'Clinica-Veterinaria-App',
        'X-Priority': '3'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado a:', email);
    console.log('📧 Message ID:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    let errorMessage = 'Error desconocido al enviar email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Credenciales de email incorrectas. Verifica EMAIL_USER y EMAIL_PASS';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Error de conexión con Gmail. Verifica tu conexión a internet';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Dirección de email inválida';
    }
    
    return { success: false, error: errorMessage, details: error.message };
  }
};

/* ======================
   FUNCIONES GOOGLE OAUTH
   ====================== */

const verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload.email_verified) {
      throw new Error('Email de Google no verificado');
    }
    
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error('Error verificando token de Google:', error);
    throw new Error('Token de Google inválido');
  }
};

/* ======================
   💳 RUTAS DE MERCADO PAGO
   ====================== */

router.post("/crear-preferencia-pago", verifyToken, async (req, res) => {
  try {
    const { items, payer } = req.body;

    console.log('📥 Datos recibidos para pago:', { items: items?.length, payer: payer?.email });

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    console.log('💰 Total calculado:', total, 'COP');

    const preferenceClient = new Preference(mercadopagoClient);

    const usarURLsCompletas = BACKEND_URL.startsWith('https://');
    const body = {
      items: items.map(item => ({
        id: item.id || String(Math.random()),
        title: String(item.title).substring(0, 256),
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        currency_id: "COP",
        description: item.description ? String(item.description).substring(0, 256) : undefined
      })),
      payer: {
        name: payer?.name || req.user.name || "Usuario",
        email: payer?.email || req.user.email || "test@test.com",
        phone: {
          area_code: "57",
          number: String(payer?.phone || "3001234567").replace(/\D/g, '').substring(0, 15)
        },
        address: {
          street_name: payer?.address?.street_name || "Calle principal",
          street_number: String(payer?.address?.street_number || 123),
          zip_code: payer?.address?.zip_code || "110111"
        }
      },
      statement_descriptor: "CLINICA VET",
      external_reference: String(req.user.id),
      metadata: {
        user_id: String(req.user.id),
        user_email: String(req.user.email),
        order_date: new Date().toISOString()
      }
    };

    if (usarURLsCompletas) {
      body.back_urls = {
        success: `${FRONTEND_URL}/pago-exitoso`,
        failure: `${FRONTEND_URL}/pago-fallido`,
        pending: `${FRONTEND_URL}/pago-pendiente`
      };
      body.auto_return = "approved";
      body.notification_url = `${BACKEND_URL}/api/webhook-mercadopago`;
      
      console.log('✅ Usando URLs de retorno (producción/ngrok)');
    } else {
      console.log('⚠️ Modo localhost - sin URLs de retorno');
    }

    console.log('🔄 Creando preferencia en Mercado Pago...');

    const response = await preferenceClient.create({ body });

    console.log('✅ Preferencia creada:', response.id);

    res.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      preference_id: response.id,
      external_reference: response.external_reference
    });

  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("❌ Error mensaje:", error.message);
    
    res.status(500).json({ 
      error: "Error al procesar el pago",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post("/webhook-mercadopago", async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('🔔 Webhook recibido:', type, data);

    res.sendStatus(200);

    if (type === "payment" && data?.id) {
      try {
        const paymentClient = new Payment(mercadopagoClient);
        const paymentData = await paymentClient.get({ id: data.id });

        console.log('💳 Estado del pago:', paymentData.status);
        console.log('💰 Monto:', paymentData.transaction_amount, paymentData.currency_id);

        switch (paymentData.status) {
          case "approved":
            console.log('✅ Pago aprobado! ID:', paymentData.id);
            break;
          
          case "pending":
            console.log('⏳ Pago pendiente');
            break;
          
          case "rejected":
            console.log('❌ Pago rechazado');
            break;
        }

      } catch (error) {
        console.error('❌ Error procesando pago del webhook:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.sendStatus(500);
  }
});

router.get("/verificar-pago/:paymentId", verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const paymentClient = new Payment(mercadopagoClient);
    const paymentData = await paymentClient.get({ id: paymentId });

    res.json({
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      amount: paymentData.transaction_amount,
      currency: paymentData.currency_id,
      payment_method: paymentData.payment_method_id,
      date_approved: paymentData.date_approved,
      external_reference: paymentData.external_reference
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({ 
      error: "Error al verificar pago",
      message: error.message 
    });
  }
});

/* ======================
   🛒 RUTAS DEL CARRITO
   ====================== */

router.get("/cart/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    cart.cleanupItems();
    
    res.json({
      items: cart.items.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        stock: item.stock,
      })),
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.post("/cart", verifyToken, async (req, res) => {
  try {
    const { userId, items } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items debe ser un array' });
    }

    const cartItems = items.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      stock: item.stock,
    }));

    let cart = await Cart.findOne({ userId });
    
    if (cart) {
      cart.items = cartItems;
    } else {
      cart = new Cart({ userId, items: cartItems });
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Carrito actualizado exitosamente',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.delete("/cart/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], total: 0, itemCount: 0, lastUpdated: new Date() },
      { upsert: true }
    );

    res.json({ message: 'Carrito limpiado exitosamente' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.put("/cart/item", verifyToken, async (req, res) => {
  try {
    const { userId, item } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      cartItem => cartItem.productId === item.id
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      cart.items.push({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
        category: item.category,
        stock: item.stock,
      });
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Item agregado al carrito',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.delete("/cart/item/:userId/:productId", verifyToken, async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();

    res.json({
      message: 'Item eliminado del carrito',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.put("/cart/quantity", verifyToken, async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item no encontrado en el carrito' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Cantidad actualizada',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/* ======================
   📧 RUTAS DE AUTENTICACIÓN
   ====================== */
router.post("/register", verificarConfiguracionEmail, async (req, res) => {
  try {
    const { name, email, password, telefono, direccion, role } = req.body;
    
    console.log('📥 Registro iniciado para:', email);
    console.log('📧 Email verification DISABLED - Direct registration');
    
    // Validaciones básicas
    if (!name || !email || !password || !telefono || !direccion) {
      return res.status(400).json({ 
        error: "Todos los campos son obligatorios",
        campos: ["name", "email", "password", "telefono", "direccion"]
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    if (!validarTelefono(telefono)) {
      return res.status(400).json({ error: "El teléfono debe tener un formato válido (7-15 dígitos)" });
    }

    const validacionDireccion = validarDireccion(direccion);
    if (!validacionDireccion.valido) {
      return res.status(400).json({ error: validacionDireccion.mensaje });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      if (exists.emailVerified) {
        return res.status(400).json({ error: "El correo ya está registrado y verificado" });
      } else {
        // Si existe pero no está verificado, eliminarlo para permitir re-registro
        await User.deleteOne({ _id: exists._id });
        console.log('🗑️ Usuario anterior no verificado eliminado');
      }
    }

    // ✅ CREAR USUARIO SIN VERIFICACIÓN DE EMAIL
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Contraseña hasheada correctamente');
    
    const nuevoUsuario = new User({ 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password: hashedPassword,
      telefono: telefono.trim(),
      direccion: {
        calle: direccion.calle.trim(),
        ciudad: direccion.ciudad.trim(),
        estado: direccion.estado.trim(),
        pais: direccion.pais ? direccion.pais.trim() : 'Colombia'
      },
      role: role || 'user',
      // ✅ SIN VERIFICACIÓN DE EMAIL
      emailVerified: true, // Marcado como verificado automáticamente
      pendingActivation: false, // No requiere activación
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined
    });

    await nuevoUsuario.save();
    console.log('✅ Usuario guardado en BD sin verificación:', nuevoUsuario._id);

    // ✅ RESPUESTA EXITOSA SIN VERIFICACIÓN
    res.status(201).json({ 
      message: "Registro completado exitosamente",
      requiereVerificacion: false,
      email: email,
      instrucciones: "Tu cuenta ha sido activada automáticamente. Puedes iniciar sesión ahora.",
      usuario: {
        id: nuevoUsuario._id,
        name: nuevoUsuario.name,
        email: nuevoUsuario.email
      }
    });

  } catch (error) {
    console.error("💥 Error completo en registro:", error.message);
    console.error("Stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: "Error de validación", detalles: errors });
    } else if (error.code === 11000) {
      return res.status(400).json({ error: "El email ya está registrado" });
    } else {
      return res.status(500).json({ 
        error: "Error en el servidor",
        mensaje: error.message
      });
    }
  }
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Verificando token:', token);

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ 
        error: "Token inválido",
        codigo: "INVALID_FORMAT",
        accion: "El formato del token no es válido"
      });
    }

    const usuario = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
      emailVerified: false
    });

    if (!usuario) {
      return res.status(400).json({ 
        error: "Token de verificación inválido o expirado",
        codigo: "TOKEN_NOT_FOUND",
        accion: "Por favor, regístrate nuevamente o solicita un nuevo email de verificación"
      });
    }

    usuario.emailVerified = true;
    usuario.pendingActivation = false;
    usuario.emailVerificationToken = undefined;
    usuario.emailVerificationExpires = undefined;
    
    await usuario.save();
    
    console.log('✅ Email verificado exitosamente para:', usuario.email);

    res.json({
      success: true,
      message: "¡Email verificado exitosamente!",
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email
      },
      redirigir: "/login"
    });

  } catch (error) {
    console.error("Error verificando email:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      codigo: "SERVER_ERROR"
    });
  }
});

router.post("/resend-verification", verificarConfiguracionEmail, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    if (!checkEmailRateLimit(email)) {
      return res.status(429).json({ 
        error: "Debes esperar 1 minuto antes de solicitar otro email",
        codigo: "RATE_LIMIT",
        tiempoEspera: "60 segundos"
      });
    }

    const usuario = await User.findOne({
      email: email.toLowerCase(),
      emailVerified: false,
      pendingActivation: true
    });

    if (!usuario) {
      return res.status(404).json({ 
        error: "No se encontró una cuenta pendiente de verificación con este email",
        codigo: "USER_NOT_FOUND"
      });
    }

    const nuevoToken = generarTokenVerificacion();
    const nuevaExpiracion = new Date();
    nuevaExpiracion.setHours(nuevaExpiracion.getHours() + 24);

    usuario.emailVerificationToken = nuevoToken;
    usuario.emailVerificationExpires = nuevaExpiracion;
    await usuario.save();

    const emailEnviado = await enviarEmailVerificacion(email, usuario.name, nuevoToken);
    
    if (emailEnviado.success) {
      res.json({
        message: "Email de verificación reenviado exitosamente",
        email: email,
        expiraEn: "24 horas",
        instrucciones: "Revisa tu bandeja de entrada y spam. El enlace expira en 24 horas."
      });
    } else {
      res.status(500).json({
        error: "Error al reenviar email de verificación",
        codigo: "EMAIL_SEND_FAILED",
        detalles: process.env.NODE_ENV === 'development' ? emailEnviado.error : undefined
      });
    }

  } catch (error) {
    console.error("Error reenviando email:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      codigo: "SERVER_ERROR"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const u = await User.findOne({ email: email.toLowerCase() });
    if (!u) return res.status(400).json({ error: "Usuario no encontrado" });

    if (!u.googleId && !u.emailVerified) {
      return res.status(403).json({ 
        error: "Debes verificar tu email antes de iniciar sesión",
        requiereVerificacion: true,
        email: u.email,
        mensaje: "Revisa tu bandeja de entrada y haz clic en el enlace de verificación"
      });
    }

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: u._id, role: u.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      user: { 
        id: u._id, 
        name: u.name, 
        email: u.email, 
        telefono: u.telefono,
        direccion: u.direccion,
        role: u.role,
        profilePicture: u.profilePicture,
        authMethod: u.googleId ? 'both' : 'local',
        emailVerified: u.emailVerified
      },
      token,
      redirectTo: u.role === "admin" ? "/admin" : "/home",
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/email/status", verifyToken, isAdmin, (req, res) => {
  const status = {
    configured: !!transporter,
    emailUser: process.env.EMAIL_USER || 'No configurado',
    hasEmailPass: !!(process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'tu-password-de-aplicacion'),
    service: 'Gmail'
  };

  if (status.configured) {
    res.json({
      status: 'Configurado correctamente',
      ...status,
      message: 'El servicio de email está listo para usar'
    });
  } else {
    res.status(500).json({
      status: 'No configurado',
      ...status,
      error: 'El servicio de email no está configurado correctamente',
      instrucciones: [
        '1. Configura EMAIL_USER en .env con tu email de Gmail',
        '2. Configura EMAIL_PASS en .env con una contraseña de aplicación',
        '3. Reinicia el servidor'
      ]
    });
  }
});

/* ======================
   GOOGLE OAUTH ROUTES
   ====================== */

router.post("/auth/google", async (req, res) => {
  try {
    const { credential, userData } = req.body;
    
    console.log('📧 Iniciando autenticación con Google...');
    
    if (!credential) {
      return res.status(400).json({ error: "Token de Google requerido" });
    }

    const googleUser = await verifyGoogleToken(credential);
    console.log('✅ Usuario de Google verificado:', googleUser.email);

    let usuario = await User.findOne({ 
      $or: [
        { email: googleUser.email.toLowerCase() },
        { googleId: googleUser.googleId }
      ]
    });

    if (usuario) {
      console.log('👤 Usuario existente encontrado, iniciando sesión...');
      
      if (!usuario.googleId) {
        usuario.googleId = googleUser.googleId;
        usuario.profilePicture = googleUser.picture;
        usuario.authMethod = 'both';
        usuario.emailVerified = true;
        usuario.pendingActivation = false;
        await usuario.save();
        console.log('🔄 Datos de Google agregados al usuario existente');
      }

      const token = jwt.sign({ id: usuario._id, role: usuario.role }, JWT_SECRET, { expiresIn: "1d" });

      res.json({
        user: {
          id: usuario._id,
          name: usuario.name,
          email: usuario.email,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          role: usuario.role,
          profilePicture: usuario.profilePicture || googleUser.picture,
          authMethod: usuario.googleId ? 'both' : 'google',
          emailVerified: true
        },
        token,
        redirectTo: usuario.role === "admin" ? "/admin" : "/home",
        message: "Sesión iniciada con Google"
      });

    } else {
      console.log('🆕 Usuario nuevo de Google, requiere datos adicionales...');
      
      if (!userData || !userData.telefono || !userData.direccion) {
        return res.json({
          requiresAdditionalInfo: true,
          googleUser: {
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            googleId: googleUser.googleId
          },
          message: "Se requiere información adicional para completar el registro"
        });
      }

      if (!validarTelefono(userData.telefono)) {
        return res.status(400).json({ 
          error: "El teléfono debe tener un formato válido (7-15 dígitos)" 
        });
      }

      const validacionDireccion = validarDireccion(userData.direccion);
      if (!validacionDireccion.valido) {
        return res.status(400).json({ error: validacionDireccion.mensaje });
      }

      const hashedPassword = await bcrypt.hash("google_oauth_" + googleUser.googleId, 10);
      
      const nuevoUsuario = new User({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        password: hashedPassword,
        telefono: userData.telefono.trim(),
        direccion: {
          calle: userData.direccion.calle.trim(),
          ciudad: userData.direccion.ciudad.trim(),
          estado: userData.direccion.estado.trim(),
          pais: userData.direccion.pais || 'Colombia'
        },
        googleId: googleUser.googleId,
        profilePicture: googleUser.picture,
        authMethod: 'google',
        role: "user",
        emailVerified: true,
        pendingActivation: false
      });

      await nuevoUsuario.save();
      console.log('✅ Nuevo usuario creado con Google:', nuevoUsuario.email);

      const token = jwt.sign({ id: nuevoUsuario._id, role: nuevoUsuario.role }, JWT_SECRET, { expiresIn: "1d" });

      res.status(201).json({
        user: {
          id: nuevoUsuario._id,
          name: nuevoUsuario.name,
          email: nuevoUsuario.email,
          telefono: nuevoUsuario.telefono,
          direccion: nuevoUsuario.direccion,
          role: nuevoUsuario.role,
          profilePicture: nuevoUsuario.profilePicture,
          authMethod: 'google',
          emailVerified: true
        },
        token,
        redirectTo: "/home",
        message: "Cuenta creada exitosamente con Google"
      });
    }

  } catch (error) {
    console.error("❌ Error en autenticación con Google:", error);
    
    if (error.message === 'Token de Google inválido' || error.message === 'Email de Google no verificado') {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    
    res.status(500).json({ 
      error: "Error en el servidor durante autenticación con Google",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post("/auth/google/link", verifyToken, async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: "Token de Google requerido" });
    }

    const googleUser = await verifyGoogleToken(credential);
    const usuario = await User.findById(req.user.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (googleUser.email.toLowerCase() !== usuario.email.toLowerCase()) {
      return res.status(400).json({ 
        error: "El email de Google debe coincidir con el email de tu cuenta" 
      });
    }

    usuario.googleId = googleUser.googleId;
    usuario.profilePicture = googleUser.picture;
    await usuario.save();

    res.json({
      message: "Cuenta de Google vinculada exitosamente",
      user: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        profilePicture: usuario.profilePicture,
        hasGoogleAuth: true
      }
    });

  } catch (error) {
    console.error("Error vinculando cuenta de Google:", error);
    res.status(500).json({ error: "Error al vincular cuenta de Google" });
  }
});

router.delete("/auth/google/unlink", verifyToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!usuario.googleId) {
      return res.status(400).json({ error: "No hay cuenta de Google vinculada" });
    }

    usuario.googleId = undefined;
    usuario.profilePicture = undefined;
    await usuario.save();

    res.json({ message: "Cuenta de Google desvinculada exitosamente" });

  } catch (error) {
    console.error("Error desvinculando Google:", error);
    res.status(500).json({ error: "Error al desvincular cuenta de Google" });
  }
});

router.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(me);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

router.put("/usuarios/perfil", verifyToken, async (req, res) => {
  try {
    const { name, telefono, direccion } = req.body;
    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (telefono && !validarTelefono(telefono)) {
      return res.status(400).json({ error: "El teléfono debe tener un formato válido" });
    }

    if (direccion) {
      const validacionDireccion = validarDireccion(direccion);
      if (!validacionDireccion.valido) {
        return res.status(400).json({ error: validacionDireccion.mensaje });
      }
    }

    if (name && name.trim()) usuario.name = name.trim();
    if (telefono) usuario.telefono = telefono.trim();
    if (direccion) {
      usuario.direccion = {
        calle: direccion.calle.trim(),
        ciudad: direccion.ciudad.trim(),
        estado: direccion.estado.trim(),
        pais: direccion.pais ? direccion.pais.trim() : usuario.direccion.pais
      };
    }

    await usuario.save();

    res.json({
      message: "Perfil actualizado exitosamente",
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

/* ======================
   USUARIOS & MASCOTAS
   ====================== */
router.get("/usuarios", verifyToken, isAdmin, async (req, res) => {
  try {
    const usuarios = await User.find().select("-password");

    const usuariosConMascotas = await Promise.all(
      usuarios.map(async (u) => {
        const totalMascotas = await Mascota.countDocuments({ usuario: u._id });
        return { 
          ...u.toObject(), 
          totalMascotas,
          direccionCompleta: `${u.direccion.calle}, ${u.direccion.ciudad}, ${u.direccion.estado}`
        };
      })
    );

    res.json(usuariosConMascotas);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.get("/usuarios/:id/mascotas", verifyToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select("-password");
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "No autorizado para ver estas mascotas" });
    }

    const mascotas = await Mascota.find({ usuario: req.params.id });
    
    // 🆕 CONVERTIR IMÁGENES A BASE64 PARA EL CLIENTE
    const mascotasConImagen = mascotas.map(m => {
      const mascotaObj = m.toObject();
      if (mascotaObj.imagen && mascotaObj.imagen.data) {
        mascotaObj.imagenUrl = obtenerImagenBase64ParaCliente(mascotaObj.imagen);
      }
      delete mascotaObj.imagen;
      return mascotaObj;
    });
    
    res.json({ usuario, mascotas: mascotasConImagen });
  } catch (error) {
    console.error("Error obteniendo mascotas de usuario:", error);
    res.status(500).json({ error: "Error al obtener mascotas del usuario" });
  }
});

/* ======================
   🐾 RUTAS DE MASCOTAS CON BASE64
   ====================== */

router.post("/mascotas", verifyToken, uploadMascota.single("imagen"), async (req, res) => {
  try {
    const { nombre, tipoDocumento, numeroDocumento, estadoCivil, fechaExamenOcupacional, tallajeBotas, especie, raza, fechaNacimiento, genero, estado, enfermedades, historial } = req.body;

    if (!nombre || !tipoDocumento || !numeroDocumento || !estadoCivil || !fechaExamenOcupacional || !tallajeBotas || !especie || !raza || !fechaNacimiento || !genero || !estado) {
      const faltantes = [];
      if (!nombre) faltantes.push("nombre");
      if (!tipoDocumento) faltantes.push("tipoDocumento");
      if (!numeroDocumento) faltantes.push("numeroDocumento");
      if (!estadoCivil) faltantes.push("estadoCivil");
      if (!fechaExamenOcupacional) faltantes.push("fechaExamenOcupacional");
      if (!tallajeBotas) faltantes.push("tallajeBotas");
      if (!especie) faltantes.push("especie");
      if (!raza) faltantes.push("raza");
      if (!fechaNacimiento) faltantes.push("fechaNacimiento");
      if (!genero) faltantes.push("genero");
      if (!estado) faltantes.push("estado");

      return res.status(400).json({
        error: "Faltan campos obligatorios",
        campos: faltantes,
      });
    }

    if (!["Macho", "Hembra"].includes(genero)) {
      return res.status(400).json({ error: "El género debe ser 'Macho' o 'Hembra'" });
    }

    const documentoExistente = await Mascota.findOne({ numeroDocumento: numeroDocumento.trim() });
    if (documentoExistente) {
      return res.status(400).json({ error: "El número de documento ya está registrado" });
    }

    const imagenBase64 = req.file ? convertirImagenABase64(req.file) : null;

    const nuevaMascota = new Mascota({
      nombre: nombre.trim(),
      tipoDocumento: tipoDocumento.trim(),
      numeroDocumento: numeroDocumento.trim(),
      estadoCivil: estadoCivil.trim(),
      fechaExamenOcupacional: new Date(fechaExamenOcupacional),
      tallajeBotas: tallajeBotas.trim(),
      especie: especie.trim(),
      raza: raza.trim(),
      fechaNacimiento: new Date(fechaNacimiento),
      genero,
      estado: estado.trim(),
      enfermedades: enfermedades ? enfermedades.trim() : "",
      historial: historial ? historial.trim() : "",
      imagen: imagenBase64,
      usuario: req.user.id,
    });

    await nuevaMascota.save();
    console.log('✅ Mascota registrada con imagen en MongoDB:', nuevaMascota.nombre);
    res.status(201).json({ msg: "Mascota registrada", mascota: nuevaMascota });
  } catch (err) {
    console.error("Error creando mascota:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else if (err.code === 11000) {
      res.status(400).json({ msg: "El número de documento ya está registrado" });
    } else {
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  }
});


router.get("/mascotas", verifyToken, async (req, res) => {
  try {
    console.log('📋 Obteniendo mascotas para usuario:', req.user.id);
    const mascotas = await Mascota.find({ usuario: req.user.id }).populate("usuario", "name email telefono");
    console.log('📋 Mascotas encontradas:', mascotas.length);

    // 🆕 CONVERTIR IMÁGENES A BASE64 PARA EL CLIENTE
    const mascotasConImagen = mascotas.map((m) => {
      const mascotaObj = m.toObject();
      
      if (mascotaObj.imagen && mascotaObj.imagen.data) {
        mascotaObj.imagenUrl = obtenerImagenBase64ParaCliente(mascotaObj.imagen);
      } else {
        mascotaObj.imagenUrl = null;
      }
      
      delete mascotaObj.imagen; // No enviar el objeto completo
      
      return mascotaObj;
    });

    res.json(mascotasConImagen);
  } catch (error) {
    console.error("❌ Error al listar mascotas:", error);
    res.status(500).json({ message: "Error al listar mascotas", error: error.message });
  }
});

router.put("/mascotas/:id", verifyToken, uploadMascota.single("imagen"), async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para editar esta mascota" });
    }

    const { nombre, tipoDocumento, numeroDocumento, estadoCivil, fechaExamenOcupacional, tallajeBotas, especie, raza, fechaNacimiento, genero, estado, enfermedades, historial } = req.body;

    if (genero !== undefined && !["Macho", "Hembra"].includes(genero)) {
      return res.status(400).json({ error: "El género debe ser 'Macho' o 'Hembra'" });
    }

    if (numeroDocumento && numeroDocumento !== mascota.numeroDocumento) {
      const documentoExistente = await Mascota.findOne({ 
        numeroDocumento: numeroDocumento.trim(),
        _id: { $ne: req.params.id }
      });
      if (documentoExistente) {
        return res.status(400).json({ error: "El número de documento ya está registrado" });
      }
    }

    if (nombre && nombre.trim()) mascota.nombre = nombre.trim();
    if (tipoDocumento && tipoDocumento.trim()) mascota.tipoDocumento = tipoDocumento.trim();
    if (numeroDocumento && numeroDocumento.trim()) mascota.numeroDocumento = numeroDocumento.trim();
    if (estadoCivil && estadoCivil.trim()) mascota.estadoCivil = estadoCivil.trim();
    if (fechaExamenOcupacional) mascota.fechaExamenOcupacional = new Date(fechaExamenOcupacional);
    if (tallajeBotas && tallajeBotas.trim()) mascota.tallajeBotas = tallajeBotas.trim();
    if (especie && especie.trim()) mascota.especie = especie.trim();
    if (raza && raza.trim()) mascota.raza = raza.trim();
    if (fechaNacimiento) mascota.fechaNacimiento = new Date(fechaNacimiento);
    if (genero) mascota.genero = genero;
    if (estado && estado.trim()) mascota.estado = estado.trim();
    if (enfermedades !== undefined) mascota.enfermedades = enfermedades.trim();
    if (historial !== undefined) mascota.historial = historial.trim();

    if (req.file) {
      mascota.imagen = convertirImagenABase64(req.file);
      console.log('📸 Imagen actualizada en MongoDB');
    }

    await mascota.save();
    res.json({ msg: "Mascota actualizada correctamente", mascota });
  } catch (err) {
    console.error("Error actualizando mascota:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else if (err.code === 11000) {
      res.status(400).json({ msg: "El número de documento ya está registrado" });
    } else {
      res.status(500).json({ msg: "Error al actualizar mascota", error: err.message });
    }
  }
});

router.get("/mascotas/:id", verifyToken, async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id).populate("usuario", "name email telefono");
    
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    const mascotaUserId = mascota.usuario._id.toString();
    const tokenUserId = req.user.id.toString();
    
    if (req.user.role !== "admin" && mascotaUserId !== tokenUserId) {
      return res.status(403).json({ 
        error: "No autorizado para ver esta mascota"
      });
    }

    // 🆕 CONVERTIR IMAGEN A BASE64
    const mascotaObj = mascota.toObject();
    if (mascotaObj.imagen && mascotaObj.imagen.data) {
      mascotaObj.imagenUrl = obtenerImagenBase64ParaCliente(mascotaObj.imagen);
    } else {
      mascotaObj.imagenUrl = null;
    }
    delete mascotaObj.imagen;

    res.json(mascotaObj);
  } catch (error) {
    console.error("Error al obtener mascota:", error);
    res.status(500).json({ message: "Error al obtener mascota", error: error.message });
  }
});

router.post("/mascotas/:id/vacunas", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha, imagen } = req.body;

    if (!nombre || !fecha) {
      return res.status(400).json({ error: "Nombre y fecha de la vacuna son obligatorios" });
    }

    if (!nombre.trim()) {
      return res.status(400).json({ error: "El nombre no puede estar vacío" });
    }

    const mascota = await Mascota.findById(id);
    if (!mascota) return res.status(404).json({ msg: "Mascota no encontrada" });

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agregar vacunas a esta mascota" });
    }

    mascota.vacunas.push({
      nombre: nombre.trim(),
      fecha: new Date(fecha),
      imagen: imagen || null
    });

    await mascota.save();

    res.json({ msg: "Vacuna agregada correctamente", mascota });
  } catch (err) {
    console.error("Error agregando vacuna:", err);
    res.status(500).json({ msg: "Error al agregar vacuna", error: err.message });
  }
});

router.post("/mascotas/:id/operaciones", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha, imagen } = req.body;

    if (!nombre || !descripcion || !fecha) {
      return res.status(400).json({ error: "Nombre, descripción y fecha de la operación son obligatorios" });
    }

    if (!nombre.trim() || !descripcion.trim()) {
      return res.status(400).json({ error: "El nombre y descripción no pueden estar vacíos" });
    }

    const mascota = await Mascota.findById(id);
    if (!mascota) return res.status(404).json({ msg: "Mascota no encontrada" });

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agregar operaciones a esta mascota" });
    }

    mascota.operaciones.push({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fecha: new Date(fecha),
      imagen: imagen || null
    });

    await mascota.save();

    res.json({ msg: "Operación agregada correctamente", mascota });
  } catch (err) {
    console.error("Error agregando operación:", err);
    res.status(500).json({ msg: "Error al agregar operación", error: err.message });
  }
});

router.delete("/mascotas/:id", verifyToken, async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id);
    if (!mascota) return res.status(404).json({ error: "Mascota no encontrada" });

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar esta mascota" });
    }

    // 🆕 No hay archivos que eliminar, solo borrar de MongoDB
    await mascota.deleteOne();
    console.log('✅ Mascota eliminada de MongoDB');
    res.json({ msg: "Mascota eliminada con éxito" });
  } catch (err) {
    console.error("Error eliminando mascota:", err);
    res.status(500).json({ msg: "Error al eliminar mascota", error: err.message });
  }
});

/* ======================
   RUTAS DE CITAS
   ====================== */

router.post("/citas", verifyToken, async (req, res) => {
  try {
    console.log('📅 Creando nueva cita:', req.body);
    const { mascotaId, tipo, fecha, hora, motivo, notas } = req.body;

    if (!mascotaId || !tipo || !fecha || !hora || !motivo) {
      return res.status(400).json({ 
        error: "Los campos mascota, tipo, fecha, hora y motivo son obligatorios" 
      });
    }

    const mascota = await Mascota.findById(mascotaId);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agendar cita para esta mascota" });
    }

    if (!esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    if (!esHorarioValido(hora)) {
      return res.status(400).json({ 
        error: "Horario inválido. Los horarios de atención son: 7:00AM-12:00PM y 2:00PM-6:00PM" 
      });
    }

    const fechaNormalizada = normalizarFecha(fecha);
    const citaExistente = await Cita.findOne({ 
      fecha: fechaNormalizada, 
      hora: hora 
    });
    
    if (citaExistente) {
      return res.status(400).json({ 
        error: "Ya existe una cita agendada para esa fecha y hora" 
      });
    }

    const nuevaCita = new Cita({
      mascota: mascotaId,
      usuario: req.user.id,
      tipo,
      fecha: fechaNormalizada,
      hora,
      motivo: motivo.trim(),
      notas: notas ? notas.trim() : "",
    });

    await nuevaCita.save();
    console.log('✅ Cita creada exitosamente:', nuevaCita._id, 'para mascota:', mascota.nombre);
    await nuevaCita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    res.status(201).json({ 
      message: "Cita agendada exitosamente",
      cita: nuevaCita 
    });

  } catch (err) {
    console.error("❌ Error creando cita:", err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "Ya existe una cita agendada para esa fecha y hora" 
      });
    }
    res.status(500).json({ 
      error: "Error al agendar cita",
      details: err.message 
    });
  }
});

router.get("/citas", verifyToken, async (req, res) => {
  try {
    console.log('📋 Obteniendo citas para usuario:', req.user.id);
    let query = {};
    
    if (req.user.role !== "admin") {
      query.usuario = req.user.id;
    }

    const citas = await Cita.find(query)
      .populate('mascota', 'nombre especie raza imagen')
      .populate('usuario', 'name email telefono')
      .sort({ fecha: 1, hora: 1 });

    console.log('📋 Citas encontradas:', citas.length);
    res.json(citas);
  } catch (err) {
    console.error("❌ Error listando citas:", err);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

router.get("/citas/horarios-disponibles/:fecha", verifyToken, async (req, res) => {
  try {
    const { fecha } = req.params;
    console.log('🕐 Obteniendo horarios para fecha:', fecha);
    
    if (!esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    const fechaNormalizada = normalizarFecha(fecha);
    const citasExistentes = await Cita.find({ fecha: fechaNormalizada }).select('hora');
    const horasOcupadas = citasExistentes.map(cita => cita.hora);
    
    console.log('⏰ Horas ocupadas para', fecha + ':', horasOcupadas);

    const horariosDisponibles = [];
    
    // Horarios de la mañana (7:00 AM - 12:00 PM)
    for (let hora = 7; hora <= 11; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        if (!horasOcupadas.includes(horario)) {
          horariosDisponibles.push({
            hora: horario,
            periodo: 'mañana',
            disponible: true
          });
        }
      }
    }

    if (!horasOcupadas.includes('12:00')) {
      horariosDisponibles.push({
        hora: '12:00',
        periodo: 'mañana',
        disponible: true
      });
    }

    // Horarios de la tarde (2:00 PM - 6:00 PM)
    for (let hora = 14; hora <= 17; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        if (!horasOcupadas.includes(horario)) {
          horariosDisponibles.push({
            hora: horario,
            periodo: 'tarde',
            disponible: true
          });
        }
      }
    }

    if (!horasOcupadas.includes('18:00')) {
      horariosDisponibles.push({
        hora: '18:00',
        periodo: 'tarde',
        disponible: true
      });
    }

    console.log('✅ Horarios disponibles generados:', horariosDisponibles.length);

    res.json({
      fecha,
      horariosDisponibles,
      totalDisponibles: horariosDisponibles.length
    });

  } catch (err) {
    console.error("❌ Error obteniendo horarios:", err);
    res.status(500).json({ error: "Error al obtener horarios disponibles" });
  }
});

router.put("/citas/:id/estado", verifyToken, isAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!["pendiente", "confirmada", "cancelada", "completada"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    cita.estado = estado;
    await cita.save();

    await cita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    console.log('📝 Estado de cita actualizado:', req.params.id, 'a', estado);

    res.json({ 
      message: "Estado de cita actualizado",
      cita 
    });

  } catch (err) {
    console.error("❌ Error actualizando cita:", err);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

router.delete("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (req.user.role !== "admin" && cita.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para cancelar esta cita" });
    }

    if (cita.estado === "completada") {
      return res.status(400).json({ error: "No se puede cancelar una cita completada" });
    }

    await cita.deleteOne();
    console.log('❌ Cita cancelada:', req.params.id);
    res.json({ message: "Cita cancelada exitosamente" });

  } catch (err) {
    console.error("❌ Error cancelando cita:", err);
    res.status(500).json({ error: "Error al cancelar cita" });
  }
});

/* ======================
   📡 RUTAS DE API PARA MANTENIMIENTO AUTOMÁTICO DE CITAS
   ====================== */

router.post("/admin/citas/mantenimiento", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('🔧 Mantenimiento manual solicitado por admin:', req.user.id);
    const resultado = await ejecutarMantenimientoCitas();
    
    res.json({
      message: 'Mantenimiento ejecutado exitosamente',
      ...resultado
    });
    
  } catch (error) {
    console.error('Error en mantenimiento manual:', error);
    res.status(500).json({ 
      error: 'Error ejecutando mantenimiento',
      details: error.message 
    });
  }
});

router.get("/admin/citas/estadisticas-mantenimiento", verifyToken, isAdmin, async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticasCitas();
    
    if (estadisticas) {
      res.json(estadisticas);
    } else {
      res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get("/admin/citas/config-automatico", verifyToken, isAdmin, (req, res) => {
  res.json({
    activo: intervalId !== null,
    intervaloPorHoras: INTERVALO_MANTENIMIENTO / (60 * 60 * 1000),
    proximaEjecucion: intervalId ? 'Cada ' + (INTERVALO_MANTENIMIENTO / (60 * 60 * 1000)) + ' horas' : 'Sistema detenido',
    configuracion: {
      diasParaEliminacion: 3,
      estadosParaActualizar: ['pendiente', 'confirmada'],
      estadosParaEliminar: ['completada', 'cancelada']
    },
    ultimoMantenimiento: 'Ver logs del servidor'
  });
});

router.post("/admin/citas/toggle-automatico", verifyToken, isAdmin, (req, res) => {
  try {
    const { accion } = req.body;
    
    if (accion === 'iniciar') {
      if (intervalId) {
        return res.json({ message: 'El sistema ya está activo', activo: true });
      }
      iniciarSistemaAutomatico();
      res.json({ message: 'Sistema automático iniciado', activo: true });
      
    } else if (accion === 'detener') {
      if (!intervalId) {
        return res.json({ message: 'El sistema ya está detenido', activo: false });
      }
      detenerSistemaAutomatico();
      res.json({ message: 'Sistema automático detenido', activo: false });
      
    } else {
      res.status(400).json({ error: 'Acción inválida. Use "iniciar" o "detener"' });
    }
    
  } catch (error) {
    console.error('Error controlando sistema automático:', error);
    res.status(500).json({ error: 'Error al controlar sistema automático' });
  }
});

/* ======================
   Dashboard Admin
   ====================== */
router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const [totalUsuarios, totalProductos, totalMascotas, totalCitas, totalCarritos] = await Promise.all([
      User.countDocuments(),
      Producto.countDocuments(),
      Mascota.countDocuments(),
      Cita.countDocuments(),
      Cart.countDocuments(),
    ]);

    const citasPorEstado = await Cita.aggregate([
      {
        $group: {
          _id: "$estado",
          count: { $sum: 1 }
        }
      }
    ]);

    const citasHoy = await Cita.countDocuments({
      fecha: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const productosConDescuento = await Producto.countDocuments({ "descuento.tiene": true });
    const productosConGarantia = await Producto.countDocuments({ "garantia.tiene": true });
    const productosEnvioGratis = await Producto.countDocuments({ envioGratis: true });

    const carritoStats = await Cart.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$itemCount" },
          valorTotal: { $sum: "$total" },
          promedioItems: { $avg: "$itemCount" },
          promedioValor: { $avg: "$total" }
        }
      }
    ]);

    res.json({ 
      totalUsuarios, 
      totalProductos, 
      totalMascotas, 
      totalCitas,
      totalCarritos,
      citasPorEstado,
      citasHoy,
      productosConDescuento,
      productosConGarantia,
      productosEnvioGratis,
      carritoStats: carritoStats[0] || {
        totalItems: 0,
        valorTotal: 0,
        promedioItems: 0,
        promedioValor: 0
      }
    });
  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
});

/* ======================
   📦 RUTAS DE PRODUCTOS CON BASE64
   ====================== */

router.post("/productos", verifyToken, uploadProducto.single("imagen"), async (req, res) => {
  try {
    console.log('📦 === INICIANDO CREACIÓN DE PRODUCTO ===');
    console.log('📸 Archivo recibido:', req.file ? 'SÍ' : 'NO');
    
    const { 
      nombre, descripcion, precio, categoria, stock,
      tieneDescuento, porcentajeDescuento, fechaInicioDescuento, fechaFinDescuento,
      tieneGarantia, mesesGarantia, descripcionGarantia,
      envioGratis
    } = req.body;

    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ 
        error: "Nombre, descripción y precio son obligatorios" 
      });
    }

    console.log('✅ Validaciones básicas pasadas');

    const datosProducto = {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      precio: parseFloat(precio),
      categoria: categoria || 'otros',
      stock: parseInt(stock) || 0,
      envioGratis: envioGratis === 'true' || envioGratis === true,
      descuento: {
        tiene: tieneDescuento === 'true' || tieneDescuento === true,
        porcentaje: parseFloat(porcentajeDescuento) || 0,
        fechaInicio: fechaInicioDescuento ? new Date(fechaInicioDescuento) : null,
        fechaFin: fechaFinDescuento ? new Date(fechaFinDescuento) : null
      },
      garantia: {
        tiene: tieneGarantia === 'true' || tieneGarantia === true,
        meses: parseInt(mesesGarantia) || 0,
        descripcion: descripcionGarantia?.trim() || ""
      }
    };

    const validacion = validarProducto(datosProducto);
    if (!validacion.valido) {
      console.error('❌ Validación fallida:', validacion.mensaje);
      return res.status(400).json({ error: validacion.mensaje });
    }

    console.log('✅ Validación de producto exitosa');

    // 🆕 CONVERTIR IMAGEN A BASE64
    const imagenBase64 = req.file ? convertirImagenABase64(req.file) : null;

    const nuevoProducto = new Producto({
      ...datosProducto,
      imagen: imagenBase64,
      usuario: req.user.id,
    });

    console.log('💾 Guardando producto en BD...');
    await nuevoProducto.save();
    
    console.log('✅ Producto creado con imagen en MongoDB:', nuevoProducto._id);
    
    res.status(201).json({ 
      msg: "Producto creado exitosamente", 
      producto: nuevoProducto 
    });
    
  } catch (err) {
    console.error("❌ ERROR AL CREAR PRODUCTO:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        msg: "Error de validación", 
        errors,
        detalles: err.message 
      });
    } else if (err.name === 'MulterError') {
      return res.status(400).json({ 
        msg: "Error al subir archivo",
        error: err.message,
        code: err.code
      });
    } else {
      res.status(500).json({ 
        msg: "Error al crear producto", 
        error: err.message
      });
    }
  }
});

router.get("/productos", async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).populate("usuario", "name email");
    
    // 🆕 CONVERTIR IMÁGENES A BASE64 PARA CLIENTE
    const productosConDescuento = productos.map(producto => {
      const productoObj = producto.toObject();
      productoObj.precioConDescuento = producto.getPrecioConDescuento();
      productoObj.descuentoVigente = producto.isDescuentoVigente();
      productoObj.ahorroDescuento = productoObj.precio - productoObj.precioConDescuento;
      
      if (productoObj.imagen && productoObj.imagen.data) {
        productoObj.imagenUrl = obtenerImagenBase64ParaCliente(productoObj.imagen);
      } else {
        productoObj.imagenUrl = null;
      }
      
      delete productoObj.imagen;
      
      return productoObj;
    });
    
    res.json(productosConDescuento);
  } catch (err) {
    console.error("❌ Error listando productos:", err);
    res.status(500).json({ msg: "Error al listar productos", error: err.message });
  }
});

router.get("/productos/:id", async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate("usuario", "name email telefono");
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    
    const productoObj = producto.toObject();
    productoObj.precioConDescuento = producto.getPrecioConDescuento();
    productoObj.descuentoVigente = producto.isDescuentoVigente();
    productoObj.ahorroDescuento = productoObj.precio - productoObj.precioConDescuento;
    
    // 🆕 CONVERTIR IMAGEN A BASE64
    if (productoObj.imagen && productoObj.imagen.data) {
      productoObj.imagenUrl = obtenerImagenBase64ParaCliente(productoObj.imagen);
    } else {
      productoObj.imagenUrl = null;
    }
    
    delete productoObj.imagen;
    
    res.json(productoObj);
  } catch (err) {
    console.error("❌ Error obteniendo producto:", err);
    res.status(500).json({ msg: "Error al obtener producto", error: err.message });
  }
});

router.put("/productos/:id", verifyToken, uploadProducto.single("imagen"), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    if (req.user.role !== "admin" && producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para editar este producto" });
    }

    const { 
      nombre, descripcion, precio, categoria, stock,
      tieneDescuento, porcentajeDescuento, fechaInicioDescuento, fechaFinDescuento,
      tieneGarantia, mesesGarantia, descripcionGarantia,
      envioGratis, activo
    } = req.body;

    if (nombre && nombre.trim()) producto.nombre = nombre.trim();
    if (descripcion && descripcion.trim()) producto.descripcion = descripcion.trim();
    if (precio !== undefined) producto.precio = parseFloat(precio);
    if (categoria) producto.categoria = categoria;
    if (stock !== undefined) producto.stock = parseInt(stock);
    if (envioGratis !== undefined) producto.envioGratis = envioGratis === 'true' || envioGratis === true;
    if (activo !== undefined) producto.activo = activo === 'true' || activo === true;

    if (tieneDescuento !== undefined) {
      producto.descuento.tiene = tieneDescuento === 'true' || tieneDescuento === true;
      if (producto.descuento.tiene) {
        if (porcentajeDescuento !== undefined) producto.descuento.porcentaje = parseFloat(porcentajeDescuento);
        if (fechaInicioDescuento) producto.descuento.fechaInicio = new Date(fechaInicioDescuento);
        if (fechaFinDescuento) producto.descuento.fechaFin = new Date(fechaFinDescuento);
      } else {
        producto.descuento.porcentaje = 0;
        producto.descuento.fechaInicio = null;
        producto.descuento.fechaFin = null;
      }
    }

    if (tieneGarantia !== undefined) {
      producto.garantia.tiene = tieneGarantia === 'true' || tieneGarantia === true;
      if (producto.garantia.tiene) {
        if (mesesGarantia !== undefined) producto.garantia.meses = parseInt(mesesGarantia);
        if (descripcionGarantia !== undefined) producto.garantia.descripcion = descripcionGarantia.trim();
      } else {
        producto.garantia.meses = 0;
        producto.garantia.descripcion = "";
      }
    }

    // 🆕 ACTUALIZAR IMAGEN EN BASE64
    if (req.file) {
      producto.imagen = convertirImagenABase64(req.file);
      console.log('📸 Imagen actualizada en MongoDB');
    }

    const datosValidacion = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      descuento: producto.descuento,
      garantia: producto.garantia,
      categoria: producto.categoria,
      stock: producto.stock
    };

    const validacion = validarProducto(datosValidacion);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.mensaje });
    }

    await producto.save();
    res.json({ msg: "Producto actualizado correctamente", producto });
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else {
      res.status(500).json({ msg: "Error al actualizar producto", error: err.message });
    }
  }
});

router.delete("/productos/:id", verifyToken, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    if (req.user.role !== "admin" && producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar este producto" });
    }

    // 🆕 No hay archivos que eliminar, solo borrar de MongoDB
    await producto.deleteOne();
    console.log('✅ Producto eliminado de MongoDB');
    res.json({ msg: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    res.status(500).json({ msg: "Error al eliminar producto", error: err.message });
  }
});

router.get("/productos/categorias/disponibles", async (req, res) => {
  try {
    const categorias = [
      { value: 'alimento', label: 'Alimento' },
      { value: 'juguetes', label: 'Juguetes' },
      { value: 'medicamentos', label: 'Medicamentos' },
      { value: 'accesorios', label: 'Accesorios' },
      { value: 'higiene', label: 'Higiene' },
      { value: 'otros', label: 'Otros' }
    ];
    
    res.json(categorias);
  } catch (err) {
    console.error("❌ Error obteniendo categorías:", err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

/* ======================
   Rutas adicionales para admin - Gestión de citas
   ====================== */

router.get("/admin/citas", verifyToken, isAdmin, async (req, res) => {
  try {
    const { fecha, estado, tipo } = req.query;
    let query = {};

    if (fecha) {
      const fechaNormalizada = normalizarFecha(fecha);
      query.fecha = fechaNormalizada;
    }

    if (estado) {
      query.estado = estado;
    }

    if (tipo) {
      query.tipo = tipo;
    }

    const citas = await Cita.find(query)
      .populate('mascota', 'nombre especie raza imagen')
      .populate('usuario', 'name email telefono')
      .sort({ fecha: 1, hora: 1 });

    res.json(citas);
  } catch (err) {
    console.error("Error obteniendo citas admin:", err);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

router.get("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('mascota', 'nombre especie raza imagen usuario')
      .populate('usuario', 'name email telefono');

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (req.user.role !== "admin" && cita.usuario._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para ver esta cita" });
    }

    res.json(cita);
  } catch (err) {
    console.error("Error obteniendo cita:", err);
    res.status(500).json({ error: "Error al obtener cita" });
  }
});

router.put("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (req.user.role !== "admin" && cita.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para modificar esta cita" });
    }

    if (req.user.role !== "admin" && cita.estado !== "pendiente") {
      return res.status(400).json({ error: "Solo se pueden modificar citas pendientes" });
    }

    const { tipo, fecha, hora, motivo, notas } = req.body;

    if (fecha && !esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    if (hora && !esHorarioValido(hora)) {
      return res.status(400).json({ 
        error: "Horario inválido. Los horarios de atención son: 7:00AM-12:00PM y 2:00PM-6:00PM" 
      });
    }

    if ((fecha && fecha !== cita.fecha.toISOString().split('T')[0]) || 
        (hora && hora !== cita.hora)) {
      const fechaNormalizada = fecha ? normalizarFecha(fecha) : cita.fecha;
      const citaExistente = await Cita.findOne({ 
        fecha: fechaNormalizada, 
        hora: hora || cita.hora,
        _id: { $ne: cita._id }
      });
      
      if (citaExistente) {
        return res.status(400).json({ 
          error: "Ya existe una cita agendada para esa fecha y hora" 
        });
      }
    }

    if (tipo) cita.tipo = tipo;
    if (fecha) cita.fecha = normalizarFecha(fecha);
    if (hora) cita.hora = hora;
    if (motivo) cita.motivo = motivo.trim();
    if (notas !== undefined) cita.notas = notas.trim();

    await cita.save();
    
    await cita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    res.json({ 
      message: "Cita actualizada exitosamente",
      cita 
    });

  } catch (err) {
    console.error("Error actualizando cita:", err);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

router.get("/admin/citas/estadisticas", verifyToken, isAdmin, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const estadisticas = await Cita.aggregate([
      {
        $match: {
          fecha: { $gte: inicioMes, $lte: finMes }
        }
      },
      {
        $group: {
          _id: {
            dia: { $dayOfMonth: "$fecha" },
            estado: "$estado"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.dia",
          estados: {
            $push: {
              estado: "$_id.estado",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json({
      mes: hoy.getMonth() + 1,
      año: hoy.getFullYear(),
      estadisticas
    });

  } catch (err) {
    console.error("Error obteniendo estadísticas:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

/* ======================
   📧 Salud
   ====================== */
router.get("/health", (req, res) => {
  console.log('🩺 Health check solicitado');
  res.json({ 
    ok: true, 
    message: "🩺 Servidor veterinario funcionando correctamente con imágenes en MongoDB (Base64)",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    emailService: transporter ? 'Configurado' : 'No configurado',
    sistemaAutomaticoCitas: intervalId ? 'Activo' : 'Inactivo',
    frontendUrl: FRONTEND_URL,
    backendUrl: BACKEND_URL,
    features: [
      '📧 Verificación de email',
      '🛒 Carrito persistente',
      '🐾 Gestión de mascotas',
      '📅 Sistema de citas',
      '🤖 Gestión automática de citas',
      '📦 Catálogo de productos',
      '🔐 Autenticación Google OAuth',
      '📸 Imágenes guardadas en MongoDB como Base64',
      '💾 Todo en una sola base de datos'
    ]
  });
});

/* ======================
   Montar rutas de API
   ====================== */
app.use("/api", router);

/* ======================
   Manejo de errores global
   ====================== */
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT. Cerrando servidor...');
  detenerSistemaAutomatico();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM. Cerrando servidor...');
  detenerSistemaAutomatico();
  process.exit(0);
});

/* ======================
   📧 Servidor
   ====================== */
app.listen(PORT, () => {
  console.log("🚀=======================================");
  console.log(`🩺 Servidor Veterinario corriendo en:`);
  console.log(`📍 ${BACKEND_URL}`);
  console.log(`🔗 API disponible en: ${BACKEND_URL}/api`);
  console.log("📸 CONFIGURACIÓN DE IMÁGENES:");
  console.log(`   • Las imágenes se guardan en MongoDB como Base64`);
  console.log(`   • No se requiere carpeta de archivos`);
  console.log(`   • Todo está en la base de datos`);
  console.log(`   • Respuesta incluye imagenUrl con data:image formato`);
  console.log("🩺 Endpoints principales:");
  console.log("   • Salud: GET /api/health");
  console.log("   • Registro: POST /api/register");
  console.log("   • Login: POST /api/login");
  console.log("   • Mascotas: GET/POST/PUT/DELETE /api/mascotas");
  console.log("   • Productos: GET/POST/PUT/DELETE /api/productos");
  console.log("   • Citas: GET/POST/PUT/DELETE /api/citas");
  console.log("   • Carrito: GET/POST/DELETE /api/cart");
  console.log("🛒 SISTEMA DE CARRITO PERSISTENTE ACTIVADO");
  console.log("🔐 Autenticación con Google OAuth configurada");
  console.log("📧 SISTEMA DE VERIFICACIÓN POR EMAIL ACTIVO");
  console.log("🤖 SISTEMA AUTOMÁTICO DE CITAS CONFIGURADO");
  console.log("💾 IMÁGENES EN MONGODB (BASE64) - TODO EN UNA BD");
  console.log("=======================================🚀");
});