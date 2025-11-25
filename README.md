# Formulario de Facturación con Facturama

Sistema de facturación electrónica con integración a Facturama API.

## 📋 Requisitos

- Node.js instalado (versión 14 o superior)
- npm (viene incluido con Node.js)

## 🚀 Instalación

1. Abre la terminal en esta carpeta (clic derecho → "Abrir en Terminal" o PowerShell)

2. Instala las dependencias:
```bash
npm install
```

## ▶️ Ejecutar el servidor

```bash
npm start
```

El servidor se iniciará en: http://localhost:3000

## 📝 Uso del formulario

### Con parámetros de producto en la URL:
```
http://localhost:3000?producto=Servicio%20de%20Consultoría&cantidad=2&precio_unitario=5000
```

### Parámetros URL disponibles:
- `producto`: Nombre del producto o servicio
- `cantidad`: Cantidad de productos
- `precio_unitario`: Precio unitario en MXN (sin símbolo $)

## 🔐 Configuración de Facturama

### Ambiente SANDBOX (actual)
- Usuario: `pruebafactura123`
- Password: `optimal123`
- URL: `https://apisandbox.facturama.mx`

### Cambiar a PRODUCCIÓN

Edita el archivo `server.js` y modifica:

```javascript
// Línea 11-13
const FACTURAMA_USER = 'TU_USUARIO_PRODUCCION';
const FACTURAMA_PASSWORD = 'TU_PASSWORD_PRODUCCION';
const FACTURAMA_BASE_URL = 'https://api.facturama.mx'; // Quitar "sandbox"
```

## 📄 Funcionalidades

✅ Formulario con datos de producto (no modificables, desde URL)
✅ Campos fiscales editables (RFC, Nombre, CP, Régimen, Uso CFDI, Email)
✅ Validación de RFC formato SAT
✅ Catálogo completo de Régimen Fiscal
✅ Catálogo completo de Uso de CFDI
✅ Cálculo automático de IVA y Total
✅ Timbrado de CFDI con Facturama
✅ Envío automático de PDF y XML por correo
✅ Manejo de RFC extranjero (XEXX010101000)
✅ Interfaz moderna y responsiva
✅ Indicador de carga durante el proceso

## 🛠️ Estructura de archivos

```
Facturacion/
├── package.json        # Configuración de dependencias
├── server.js          # Servidor Node.js con lógica de facturación
└── README.md          # Este archivo
```

## 📧 Correo de factura

Una vez generada la factura, se enviará automáticamente al correo proporcionado con:
- PDF de la factura
- XML timbrado

## 🐛 Solución de problemas

### Error: "npm no se reconoce..."
- Instala Node.js desde: https://nodejs.org/

### Puerto 3000 ocupado
- Cambia el puerto en `server.js` línea 7:
```javascript
const PORT = 3001; // o cualquier otro puerto disponible
```

### Error de conexión con Facturama
- Verifica tus credenciales
- Asegúrate de estar usando las credenciales correctas (sandbox vs producción)
- Revisa los logs en la consola

## 📝 Logs

Los logs se muestran en la consola donde ejecutas el servidor. Incluyen:
- Datos enviados a Facturama
- Respuesta de Facturama
- Resultado del envío de email
