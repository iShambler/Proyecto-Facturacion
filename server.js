const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Credenciales Facturama SANDBOX
const FACTURAMA_USER = 'pruebafactura123';
const FACTURAMA_PASSWORD = 'optimal123';
const FACTURAMA_BASE_URL = 'https://apisandbox.facturama.mx';

// Autenticación Base64
const authToken = Buffer.from(`${FACTURAMA_USER}:${FACTURAMA_PASSWORD}`).toString('base64');

// Ruta principal - Mostrar formulario
app.get('/', (req, res) => {
    let lineas = [];
    let numeroTicket = req.query.ticket || '';
    
    console.log('[DEBUG] Query params:', JSON.stringify(req.query, null, 2));
    
    // CASO 1: Múltiples productos (Express parsea automáticamente como arrays)
    if (Array.isArray(req.query.producto)) {
        const productos = req.query.producto;
        const cantidades = Array.isArray(req.query.cantidad) ? req.query.cantidad : [req.query.cantidad];
        const precios = Array.isArray(req.query.precio) ? req.query.precio : [req.query.precio];
        
        for (let i = 0; i < productos.length; i++) {
            lineas.push({
                producto: productos[i] || '',
                cantidad: parseFloat(cantidades[i]) || 0,
                precio_unitario: parseFloat(precios[i]) || 0
            });
        }
        console.log('[DEBUG] Productos múltiples parseados (arrays):', lineas.length);
    }
    // CASO 2: Un solo producto (compatibilidad hacia atrás)
    else if (req.query.producto) {
        lineas.push({
            producto: req.query.producto || '',
            cantidad: parseFloat(req.query.cantidad) || 0,
            precio_unitario: parseFloat(req.query.precio_unitario || req.query.precio) || 0
        });
        console.log('[DEBUG] Producto único parseado');
    }
    
    // Calcular totales
    let subtotalTotal = 0;
    lineas.forEach(linea => {
        linea.subtotal = linea.cantidad * linea.precio_unitario;
        subtotalTotal += linea.subtotal;
    });
    
    const ivaTotal = subtotalTotal * 0.16;
    const total = subtotalTotal + ivaTotal;
    
    // Leer el HTML
    let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
    
    // Generar HTML de líneas de productos
    let lineasHtml = '';
    lineas.forEach((linea, index) => {
        lineasHtml += `<div class="preview-item" data-index="${index}"><div class="preview-row"><span class="preview-label">${index + 1}. ${linea.producto}</span></div><div class="preview-row preview-row-small"><span class="preview-label-small">${linea.cantidad} × ${linea.precio_unitario.toFixed(2)}</span><span class="preview-value-small">${linea.subtotal.toFixed(2)} MXN</span></div></div>`;
    });
    
    // Reemplazar placeholders
    html = html.replace('{{lineas_productos}}', lineasHtml);
    
    // Escapar el JSON para que no rompa el HTML
    const lineasJsonEscaped = JSON.stringify(lineas)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    html = html.replace('{{lineas_json}}', lineasJsonEscaped);
    html = html.replace('{{numero_ticket}}', numeroTicket);
    html = html.replace('{{subtotal}}', subtotalTotal.toFixed(2));
    html = html.replace('{{iva}}', ivaTotal.toFixed(2));
    html = html.replace('{{total}}', total.toFixed(2));
    
    res.send(html);
});

// Ruta para procesar factura
app.post('/generar-factura', async (req, res) => {
    try {
        // Extraer datos del formulario
        const {
            lineas_json,
            numero_ticket,
            rfc,
            nombre,
            cp_receptor,
            regimen,
            uso_cfdi,
            email
        } = req.body;

        // Validar datos requeridos
        if (!lineas_json || !rfc || !nombre || !cp_receptor || !regimen || !uso_cfdi || !email) {
            return res.json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        // Parsear líneas de productos
        console.log('[DEBUG POST] lineas_json recibido:', lineas_json);
        console.log('[DEBUG POST] Tipo:', typeof lineas_json);
        
        // Desescapar el HTML del JSON
        const lineasJsonUnescaped = lineas_json
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        
        let lineas;
        try {
            lineas = JSON.parse(lineasJsonUnescaped);
            console.log('[DEBUG POST] Líneas parseadas correctamente:', lineas.length);
        } catch (e) {
            console.error('[ERROR POST] Error al parsear JSON:', e.message);
            console.error('[ERROR POST] JSON problemático:', lineasJsonUnescaped);
            return res.json({
                success: false,
                message: 'Error al procesar los productos: ' + e.message
            });
        }

        if (!lineas || lineas.length === 0) {
            return res.json({
                success: false,
                message: 'No hay productos para facturar'
            });
        }

        // Normalizar datos
        const rfcNormalizado = rfc.toUpperCase();
        const nombreNormalizado = nombre.toUpperCase();

        // Regla SAT para RFC extranjero
        let regimenFiscal = regimen;
        let usoCfdi = uso_cfdi;
        
        if (rfcNormalizado === "XEXX010101000") {
            regimenFiscal = "616";
            usoCfdi = "S01";
        }

        // Construir Items del CFDI (una por cada línea de producto)
        const items = [];
        let subtotalTotal = 0;
        let ivaTotal = 0;
        
        lineas.forEach(linea => {
            const subtotal = linea.cantidad * linea.precio_unitario;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;
            
            subtotalTotal += subtotal;
            ivaTotal += iva;
            
            items.push({
                ProductCode: "10111302",
                Description: linea.producto,
                UnitCode: "H87",
                Unit: "Pieza",
                Quantity: linea.cantidad,
                UnitPrice: linea.precio_unitario,
                Subtotal: subtotal,
                TaxObject: "02",
                Taxes: [{
                    Total: iva,
                    Name: "IVA",
                    Base: subtotal,
                    Rate: 0.16,
                    IsRetention: false,
                    IsFederalTax: true
                }],
                Total: total
            });
        });

        const totalTotal = subtotalTotal + ivaTotal;

        // Construir CFDI JSON
        const facturaData = {
            Receiver: {
                Rfc: rfcNormalizado,
                Name: nombreNormalizado,
                CfdiUse: usoCfdi,
                FiscalRegime: regimenFiscal,
                TaxZipCode: cp_receptor,
                Email: email
            },
            CfdiType: "I",
            ExpeditionPlace: "26015",
            PaymentForm: "03",
            PaymentMethod: "PUE",
            Exportation: "01",
            Items: items
        };
        
        // Añadir número de ticket si existe (como Observaciones)
        if (numero_ticket) {
            facturaData.Observations = `Ticket: ${numero_ticket}`;
        }


        // Timbrar factura en Facturama
        const response = await axios.post(
            `${FACTURAMA_BASE_URL}/3/cfdis`,
            facturaData,
            {
                headers: {
                    'Authorization': `Basic ${authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 40000
            }
        );

    
        // Verificar ID de factura
        if (!response.data || !response.data.Id) {
            return res.json({
                success: false,
                message: 'No se pudo generar la factura'
            });
        }

        const facturaId = response.data.Id;

        // Enviar PDF + XML por email
        try {
            await axios.post(
                `${FACTURAMA_BASE_URL}/cfdi?cfdiType=issued&cfdiId=${facturaId}&email=${email}`,
                null,
                {
                    headers: {
                        'Authorization': `Basic ${authToken}`,
                        'Content-Length': '0'
                    },
                    timeout: 40000
                }
            );
        } catch (emailError) {
            console.error('Error al enviar email:', emailError.message);
        }

        // Respuesta exitosa
        res.json({
            success: true,
            message: `Factura generada exitosamente. Se ha enviado a ${email}`,
            facturaId: facturaId
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        
        res.json({
            success: false,
            message: error.response?.data?.Message || 'Error al generar la factura',
            error: error.response?.data || error.message
        });
    }
});

app.listen(PORT);