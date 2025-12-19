# Escuela del Emprendedor - Formulario de Inscripcion

Formulario web responsive para la inscripcion de emprendedores en el proceso educativo de La Otra Politica - Escuela del Emprendedor.

## Caracteristicas

- Diseno dark mode con efectos Liquid Glass
- Formulario completo con validacion
- Conexion a MongoDB Atlas
- Responsive design para todos los dispositivos
- Los 32 departamentos de Colombia incluidos
- Amplio catalogo de profesiones
- Panel de administracion con autenticacion JWT
- Exportacion de datos a Excel
- Notificaciones tipo toast para feedback al usuario

## Requisitos

- Node.js v18 o superior
- MongoDB Atlas (conexion configurada en .env)

## Instalacion

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Estructura del Proyecto

```
inscripcion - Escuela del Emprendedor/
├── public/
│   ├── css/
│   │   ├── styles.css
│   │   └── admin.css
│   ├── js/
│   │   ├── main.js
│   │   └── admin.js
│   ├── assets/
│   │   └── images/
│   ├── index.html
│   ├── admin.html
│   └── admin-login.html
├── assets/
│   └── images/
│       ├── profeVotos.jpg
│       ├── charles.png
│       └── profe-senador.png
├── .env
├── package.json
├── server.js
└── README.md
```

## Imagenes Requeridas

Las siguientes imagenes deben estar en la carpeta `public/assets/images/`:

1. **profeVotos.jpg** - Imagen del candidato al senado (sidebar)
2. **charles.png** - Foto del Profe Charles (footer)
3. **profe-senador.png** - Logo de La Otra Politica

## Campos del Formulario

El formulario recopila la siguiente informacion de los emprendedores:

- Nombre completo
- Cedula
- Telefono
- Departamento
- Ciudad
- Profesion
- **Nombre del emprendimiento**
- **Redes sociales del emprendimiento**
- **Principales retos del emprendimiento**

## API Endpoints

### Publicos

#### POST /api/inscripcion
Registra una nueva inscripcion.

**Body:**
```json
{
    "nombre": "string",
    "cedula": "string",
    "telefono": "string",
    "ciudad": "string",
    "departamento": "string",
    "profesion": "string",
    "profesionOtra": "string (opcional)",
    "nombreEmprendimiento": "string",
    "redesSociales": "string",
    "retosEmprendimiento": "string"
}
```

### Autenticacion

#### POST /api/admin/login
Inicia sesion como administrador.

**Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

#### GET /api/admin/verify
Verifica si el token JWT es valido.

### Protegidos (requieren token JWT)

#### GET /api/admin/departamentos
Obtiene lista de departamentos con conteo de inscritos.

#### GET /api/admin/inscripciones/:departamento
Obtiene inscripciones por departamento o todas si es "todos".

#### GET /api/admin/descargar/:departamento
Descarga inscripciones en formato Excel.

#### GET /api/admin/estadisticas
Obtiene estadisticas generales.

## Colores del Proyecto

- Morado principal: `#442e7d`
- Morado claro: `#5a3d9e`
- Morado oscuro: `#2d1e54`
- Gris texto: `#333333`
- Fondo oscuro: `#0d0d0f`

## Desarrollo

Para desarrollo con recarga automatica:
```bash
npm run dev
```

## Panel de Administracion

Accede al panel de administracion en:
```
http://localhost:3000/admin
```

Credenciales configuradas en el archivo `.env`:
- `ADMIN_USER` - Usuario administrador
- `ADMIN_PASSWORD` - Contrasena

### Funcionalidades del Admin

- Ver total de inscritos
- Filtrar por departamento
- Ver tabla con todos los datos de inscripcion
- Descargar datos en Excel
- Visualizar retos de emprendimiento con tooltip

## Variables de Entorno

Crear un archivo `.env` con:

```env
PORT=3000
MONGODB_URI=tu_uri_de_mongodb
MONGODB_DB_NAME=nombre_de_tu_base_de_datos
JWT_SECRET=tu_secreto_jwt
ADMIN_USER=usuario_admin
ADMIN_PASSWORD=contrasena_admin
```
