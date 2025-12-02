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
    // Obtener parámetros de la URL
    const producto = req.query.producto || '';
    const cantidad = req.query.cantidad || '';
    const precio_unitario = req.query.precio_unitario || '';
    
    // Calcular valores
    const cantidadNum = parseFloat(cantidad) || 0;
    const precioNum = parseFloat(precio_unitario) || 0;
    const subtotal = (cantidadNum * precioNum).toFixed(2);
    const iva = (parseFloat(subtotal) * 0.16).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(iva)).toFixed(2);
    
    // Leer el HTML
    let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
    
    // Reemplazar placeholders
    html = html.replace(/{{producto}}/g, producto);
    html = html.replace(/{{cantidad}}/g, cantidad);
    html = html.replace(/{{precio_unitario}}/g, precioNum.toFixed(2));
    html = html.replace(/{{precio_unitario_raw}}/g, precio_unitario);
    html = html.replace(/{{subtotal}}/g, subtotal);
    html = html.replace(/{{iva}}/g, iva);
    html = html.replace(/{{total}}/g, total);
    
    res.send(html);
});

// Ruta para procesar factura
app.post('/generar-factura', async (req, res) => {
    try {
        // Extraer datos del formulario
        const {
            producto,
            cantidad,
            precio_unitario_raw,
            rfc,
            nombre,
            cp_receptor,
            regimen,
            uso_cfdi,
            email
        } = req.body;

        // Validar datos requeridos
        if (!producto || !cantidad || !precio_unitario_raw || !rfc || !nombre || !cp_receptor || !regimen || !uso_cfdi || !email) {
            return res.json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        // Convertir a números
        const cantidadNum = parseFloat(cantidad);
        const precioUnitario = parseFloat(precio_unitario_raw);

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

        // Cálculos
        const subtotal = cantidadNum * precioUnitario;
        const iva = subtotal * 0.16;
        const total = subtotal + iva;

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
            Items: [{
                ProductCode: "10111302",
                Description: producto,
                UnitCode: "H87",
                Unit: "Pieza",
                Quantity: cantidadNum,
                UnitPrice: precioUnitario,
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
            }]
        };


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
