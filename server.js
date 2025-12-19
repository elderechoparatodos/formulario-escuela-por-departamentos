require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// MongoDB Connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
    try {
        await client.connect();
        db = client.db(process.env.MONGODB_DB_NAME);
        console.log('Conectado a MongoDB exitosamente');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Middleware de autenticacion
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token invalido' });
        }
        req.user = user;
        next();
    });
};

// API Routes
app.post('/api/inscripcion', async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        const { nombre, cedula, telefono, ciudad, departamento, profesion, profesionOtra, nombreEmprendimiento, redesSociales, retosEmprendimiento } = req.body;

        // Validacion basica
        if (!nombre || !cedula || !telefono || !ciudad || !departamento || !profesion || !nombreEmprendimiento || !redesSociales || !retosEmprendimiento) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }

        // Verificar si la cedula ya existe
        const existente = await db.collection('inscripcion-escuela').findOne({ cedula });
        if (existente) {
            return res.status(400).json({ 
                success: false, 
                message: 'Esta cedula ya se encuentra registrada' 
            });
        }

        const inscripcion = {
            nombre: nombre.trim(),
            cedula: cedula.trim(),
            telefono: telefono.trim(),
            ciudad: ciudad.trim(),
            departamento,
            profesion: profesion === 'Otro' ? profesionOtra.trim() : profesion,
            nombreEmprendimiento: nombreEmprendimiento.trim(),
            redesSociales: redesSociales.trim(),
            retosEmprendimiento: retosEmprendimiento.trim(),
            fechaRegistro: new Date(),
            estado: 'activo'
        };

        const result = await db.collection('inscripcion-escuela').insertOne(inscripcion);

        res.status(201).json({ 
            success: true, 
            message: 'Inscripcion realizada exitosamente',
            id: result.insertedId 
        });

    } catch (error) {
        console.error('Error en inscripcion:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Ruta para obtener inscripciones por departamento (para lideres)
app.get('/api/inscripciones/:departamento', async (req, res) => {
    try {
        const { departamento } = req.params;
        const inscripciones = await db.collection('inscripcion-escuela')
            .find({ departamento })
            .sort({ fechaRegistro: -1 })
            .toArray();

        res.json({ 
            success: true, 
            data: inscripciones,
            total: inscripciones.length 
        });

    } catch (error) {
        console.error('Error obteniendo inscripciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// =====================================================
// RUTAS DE AUTENTICACION
// =====================================================

// Login del administrador
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuario y contrasena son requeridos' 
            });
        }

        // Verificar credenciales
        if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({ 
                success: true, 
                message: 'Login exitoso',
                token 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Verificar token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// =====================================================
// RUTAS PROTEGIDAS DEL ADMINISTRADOR
// =====================================================

// Obtener todos los departamentos con conteo
app.get('/api/admin/departamentos', authenticateToken, async (req, res) => {
    try {
        const departamentos = await db.collection('inscripcion-escuela').aggregate([
            {
                $group: {
                    _id: '$departamento',
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        const totalGeneral = departamentos.reduce((sum, dep) => sum + dep.total, 0);

        res.json({ 
            success: true, 
            data: departamentos,
            totalGeneral
        });

    } catch (error) {
        console.error('Error obteniendo departamentos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener inscripciones por departamento (protegido)
app.get('/api/admin/inscripciones/:departamento', authenticateToken, async (req, res) => {
    try {
        const { departamento } = req.params;
        
        let query = {};
        if (departamento !== 'todos') {
            query.departamento = departamento;
        }

        const inscripciones = await db.collection('inscripcion-escuela')
            .find(query)
            .sort({ fechaRegistro: -1 })
            .toArray();

        res.json({ 
            success: true, 
            data: inscripciones,
            total: inscripciones.length 
        });

    } catch (error) {
        console.error('Error obteniendo inscripciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Descargar Excel por departamento
app.get('/api/admin/descargar/:departamento', authenticateToken, async (req, res) => {
    try {
        const { departamento } = req.params;
        
        let query = {};
        if (departamento !== 'todos') {
            query.departamento = departamento;
        }

        const inscripciones = await db.collection('inscripcion-escuela')
            .find(query)
            .sort({ fechaRegistro: -1 })
            .toArray();

        // Preparar datos para Excel
        const data = inscripciones.map((item, index) => ({
            'No.': index + 1,
            'Nombre': item.nombre,
            'Cedula': item.cedula,
            'Telefono': item.telefono,
            'Ciudad': item.ciudad,
            'Departamento': item.departamento,
            'Profesion': item.profesion,
            'Nombre Emprendimiento': item.nombreEmprendimiento,
            'Redes Sociales': item.redesSociales,
            'Retos del Emprendimiento': item.retosEmprendimiento,
            'Fecha Registro': new Date(item.fechaRegistro).toLocaleString('es-CO')
        }));

        // Crear workbook y worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 5 },
            { wch: 35 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 25 },
            { wch: 30 },
            { wch: 35 },
            { wch: 50 },
            { wch: 20 }
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscripciones');

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Nombre del archivo
        const fileName = departamento === 'todos' 
            ? 'inscripciones_todos.xlsx' 
            : `inscripciones_${departamento.replace(/\s+/g, '_')}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generando Excel:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generando archivo Excel' 
        });
    }
});

// Obtener estadisticas generales
app.get('/api/admin/estadisticas', authenticateToken, async (req, res) => {
    try {
        const totalInscritos = await db.collection('inscripcion-escuela').countDocuments();
        
        const porProfesion = await db.collection('inscripcion-escuela').aggregate([
            {
                $group: {
                    _id: '$profesion',
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]).toArray();

        const ultimosRegistros = await db.collection('inscripcion-escuela')
            .find()
            .sort({ fechaRegistro: -1 })
            .limit(5)
            .toArray();

        res.json({ 
            success: true,
            data: {
                totalInscritos,
                porProfesion,
                ultimosRegistros
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadisticas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta admin login
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Ruta admin dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor
connectDB().then(() => {
    app.listen(PORT,'0.0.0.0', () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});

// Manejo de cierre
process.on('SIGINT', async () => {
    await client.close();
    console.log('Conexion a MongoDB cerrada');
    process.exit(0);
});
