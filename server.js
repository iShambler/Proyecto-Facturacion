const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Credenciales Facturama SANDBOX (cambiar a PROD cuando sea necesario)
const FACTURAMA_USER = 'pruebafactura123';
const FACTURAMA_PASSWORD = 'optimal123';
const FACTURAMA_BASE_URL = 'https://apisandbox.facturama.mx'; // Cambiar a https://api.facturama.mx para producción

// Crear credenciales base64 para autenticación
const authToken = Buffer.from(`${FACTURAMA_USER}:${FACTURAMA_PASSWORD}`).toString('base64');

// Ruta para mostrar el formulario
app.get('/', (req, res) => {
    console.log('Query params recibidos:', req.query);
    
    const producto = req.query.producto || '';
    const cantidad = req.query.cantidad || '';
    const precio_unitario = req.query.precio_unitario || '';
    
    console.log('Producto:', producto);
    console.log('Cantidad:', cantidad);
    console.log('Precio Unitario:', precio_unitario);
    
    const total = cantidad && precio_unitario ? (parseFloat(cantidad) * parseFloat(precio_unitario)).toFixed(2) : '0.00';
    
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulario de Facturación</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            padding: 30px 15px;
            min-height: 100vh;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e1e4e8;
        }

        .header {
            background: #1a1a1a;
            color: white;
            padding: 32px 40px;
            border-bottom: 3px solid #0066cc;
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        .header p {
            font-size: 14px;
            color: #b8b8b8;
            font-weight: 400;
        }

        .form-section {
            padding: 35px 40px;
            border-bottom: 1px solid #e1e4e8;
        }

        .form-section:last-of-type {
            border-bottom: none;
        }

        .section-title {
            font-size: 16px;
            color: #24292e;
            font-weight: 600;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e1e4e8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-bottom: 0;
        }

        .form-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 0;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        label {
            font-size: 13px;
            font-weight: 600;
            color: #24292e;
            margin-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        input[type="text"],
        input[type="email"],
        input[type="number"],
        select {
            padding: 10px 12px;
            border: 1px solid #d1d5da;
            border-radius: 3px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.15s ease;
            background: white;
            min-width: 0;
            width: 100%;
        }

        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="number"]:focus,
        select:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .readonly-field {
            background-color: #e8eaed;
            border: 1px solid #dadce0;
            color: #5f6368;
            cursor: not-allowed;
            font-weight: 500;
        }

        .btn-submit {
            width: 100%;
            padding: 14px 24px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 3px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .btn-submit:hover {
            background: #0052a3;
        }

        .btn-submit:active {
            background: #004080;
        }

        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: #0066cc;
        }

        .required {
            color: #d73a49;
        }

        .total-section {
            background: #f6f8fa;
            padding: 20px 24px;
            border-radius: 3px;
            margin-top: 24px;
            border: 1px solid #e1e4e8;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 20px;
            font-weight: 600;
            color: #24292e;
        }

        .total-amount {
            color: #0066cc;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 3px solid #e1e4e8;
            border-top: 3px solid #0066cc;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .alert {
            padding: 16px 20px;
            margin: 20px 40px;
            border-radius: 3px;
            display: none;
            font-size: 14px;
            border-left: 4px solid;
        }

        .alert-success {
            background-color: #e6f4ea;
            border-left-color: #28a745;
            color: #0d5025;
        }

        .alert-error {
            background-color: #ffeef0;
            border-left-color: #d73a49;
            color: #86181d;
        }

        @media (max-width: 768px) {
            body {
                padding: 15px 10px;
            }

            .container {
                border-radius: 0;
            }

            .header {
                padding: 24px 20px;
            }

            .form-section {
                padding: 24px 20px;
            }

            .form-grid-2,
            .form-grid-3 {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .alert {
                margin: 15px 20px;
            }
        }

        @media (max-width: 480px) {
            .header h1 {
                font-size: 20px;
            }

            .header p {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Formulario de Facturación</h1>
            <p>Complete los datos fiscales para generar su factura</p>
        </div>

        <div id="alertSuccess" class="alert alert-success"></div>
        <div id="alertError" class="alert alert-error"></div>

        <form id="facturaForm" method="POST" action="/generar-factura">
            <div class="form-section">
                <h2 class="section-title">Datos del Producto/Servicio</h2>
                
                <div class="form-grid-3">
                    <div class="form-group">
                        <label>Producto/Servicio</label>
                        <input type="text" name="producto" value="${producto}" class="readonly-field" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Cantidad</label>
                        <input type="text" name="cantidad" value="${cantidad}" class="readonly-field" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Precio Unitario (MXN)</label>
                        <input type="text" value="${precio_unitario ? parseFloat(precio_unitario).toFixed(2) : '0.00'}" class="readonly-field" readonly>
                        <input type="hidden" name="precio_unitario_raw" value="${precio_unitario}">
                    </div>
                </div>

                <div class="total-section">
                    <div class="total-row">
                        <span>Total:</span>
                        <span class="total-amount">$${total} MXN</span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-title">Datos Fiscales</h2>
                
                <div class="form-grid-2">
                    <div class="form-group">
                        <label>RFC <span class="required">*</span></label>
                        <input type="text" name="rfc" required maxlength="13" placeholder="Ej: XAXX010101000" pattern="[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="form-group">
                        <label>Nombre o Razón Social <span class="required">*</span></label>
                        <input type="text" name="nombre" required placeholder="Ingrese nombre o razón social" style="text-transform: uppercase;">
                    </div>
                </div>

                <div class="form-grid-2">
                    <div class="form-group">
                        <label>Código Postal <span class="required">*</span></label>
                        <input type="text" name="cp_receptor" required maxlength="5" pattern="[0-9]{5}" placeholder="Ej: 01000">
                    </div>
                    
                    <div class="form-group">
                        <label>Régimen Fiscal <span class="required">*</span></label>
                        <select name="regimen" required>
                            <option value="">Seleccione un régimen</option>
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                            <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                            <option value="606">606 - Arrendamiento</option>
                            <option value="607">607 - Régimen de Enajenación o Adquisición de Bienes</option>
                            <option value="608">608 - Demás ingresos</option>
                            <option value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</option>
                            <option value="611">611 - Ingresos por Dividendos (socios y accionistas)</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                            <option value="614">614 - Ingresos por intereses</option>
                            <option value="615">615 - Régimen de los ingresos por obtención de premios</option>
                            <option value="616">616 - Sin obligaciones fiscales</option>
                            <option value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</option>
                            <option value="621">621 - Incorporación Fiscal</option>
                            <option value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                            <option value="623">623 - Opcional para Grupos de Sociedades</option>
                            <option value="624">624 - Coordinados</option>
                            <option value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                            <option value="626">626 - Régimen Simplificado de Confianza</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid-2">
                    <div class="form-group">
                        <label>Uso de CFDI <span class="required">*</span></label>
                        <select name="uso_cfdi" required>
                            <option value="">Seleccione un uso</option>
                            <option value="G01">G01 - Adquisición de mercancías</option>
                            <option value="G02">G02 - Devoluciones, descuentos o bonificaciones</option>
                            <option value="G03">G03 - Gastos en general</option>
                            <option value="I01">I01 - Construcciones</option>
                            <option value="I02">I02 - Mobilario y equipo de oficina por inversiones</option>
                            <option value="I03">I03 - Equipo de transporte</option>
                            <option value="I04">I04 - Equipo de computo y accesorios</option>
                            <option value="I05">I05 - Dados, troqueles, moldes, matrices y herramental</option>
                            <option value="I06">I06 - Comunicaciones telefónicas</option>
                            <option value="I07">I07 - Comunicaciones satelitales</option>
                            <option value="I08">I08 - Otra maquinaria y equipo</option>
                            <option value="D01">D01 - Honorarios médicos, dentales y gastos hospitalarios</option>
                            <option value="D02">D02 - Gastos médicos por incapacidad o discapacidad</option>
                            <option value="D03">D03 - Gastos funerales</option>
                            <option value="D04">D04 - Donativos</option>
                            <option value="D05">D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)</option>
                            <option value="D06">D06 - Aportaciones voluntarias al SAR</option>
                            <option value="D07">D07 - Primas por seguros de gastos médicos</option>
                            <option value="D08">D08 - Gastos de transportación escolar obligatoria</option>
                            <option value="D09">D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones</option>
                            <option value="D10">D10 - Pagos por servicios educativos (colegiaturas)</option>
                            <option value="S01">S01 - Sin efectos fiscales</option>
                            <option value="CP01">CP01 - Pagos</option>
                            <option value="CN01">CN01 - Nómina</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Correo Electrónico <span class="required">*</span></label>
                        <input type="email" name="email" required placeholder="correo@ejemplo.com">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <button type="submit" class="btn-submit" id="btnSubmit">Generar Factura</button>
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: #667eea;">Generando factura...</p>
                </div>
            </div>
        </form>
    </div>

    <script>
        document.getElementById('facturaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const btnSubmit = document.getElementById('btnSubmit');
            const loading = document.getElementById('loading');
            const alertSuccess = document.getElementById('alertSuccess');
            const alertError = document.getElementById('alertError');
            
            // Ocultar alertas previas
            alertSuccess.style.display = 'none';
            alertError.style.display = 'none';
            
            // Mostrar loading
            btnSubmit.style.display = 'none';
            loading.style.display = 'block';
            
            try {
                // Convertir FormData a URLSearchParams para enviarlo como application/x-www-form-urlencoded
                const urlParams = new URLSearchParams(formData);
                
                const response = await fetch('/generar-factura', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: urlParams
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alertSuccess.textContent = result.message;
                    alertSuccess.style.display = 'block';
                    // No resetear el form para mantener los datos
                } else {
                    alertError.textContent = result.message || 'Error al generar la factura';
                    alertError.style.display = 'block';
                }
            } catch (error) {
                alertError.textContent = 'Error de conexión. Por favor intente nuevamente.';
                alertError.style.display = 'block';
            } finally {
                btnSubmit.style.display = 'block';
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>
    `);
});

// Ruta para procesar el formulario y generar factura
app.post('/generar-factura', async (req, res) => {
    try {
        console.log('Datos recibidos del formulario:', req.body);
        
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

        console.log('Producto:', producto);
        console.log('Cantidad:', cantidad);
        console.log('Precio Unitario Raw:', precio_unitario_raw);
        console.log('RFC:', rfc);
        console.log('Nombre:', nombre);

        // Validar datos requeridos
        if (!producto || !cantidad || !precio_unitario_raw || !rfc || !nombre || !cp_receptor || !regimen || !uso_cfdi || !email) {
            console.log('FALTA ALGÚN DATO:');
            console.log('  producto:', !!producto);
            console.log('  cantidad:', !!cantidad);
            console.log('  precio_unitario_raw:', !!precio_unitario_raw);
            console.log('  rfc:', !!rfc);
            console.log('  nombre:', !!nombre);
            console.log('  cp_receptor:', !!cp_receptor);
            console.log('  regimen:', !!regimen);
            console.log('  uso_cfdi:', !!uso_cfdi);
            console.log('  email:', !!email);
            
            return res.json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        // Convertir a números
        const cantidadNum = parseFloat(cantidad);
        const precioUnitario = parseFloat(precio_unitario_raw);

        // Normalizar RFC y nombre
        const rfcNormalizado = rfc.toUpperCase();
        const nombreNormalizado = nombre.toUpperCase();

        // Regla obligatoria SAT para RFC extranjero
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
            PaymentForm: "03", // 03 = Transferencia
            PaymentMethod: "PUE",
            Exportation: "01",
            Items: [
                {
                    ProductCode: "10111302",
                    Description: producto,
                    UnitCode: "H87",
                    Unit: "Pieza",
                    Quantity: cantidadNum,
                    UnitPrice: precioUnitario,
                    Subtotal: subtotal,
                    TaxObject: "02",
                    Taxes: [
                        {
                            Total: iva,
                            Name: "IVA",
                            Base: subtotal,
                            Rate: 0.16,
                            IsRetention: false,
                            IsFederalTax: true
                        }
                    ],
                    Total: total
                }
            ]
        };

        console.log('Enviando factura a Facturama:', JSON.stringify(facturaData, null, 2));

        // Timbrar factura
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

        console.log('Respuesta de Facturama:', JSON.stringify(response.data, null, 2));

        // Verificar si se obtuvo el ID
        if (!response.data || !response.data.Id) {
            return res.json({
                success: false,
                message: 'No se pudo generar la factura. No se recibió ID de Facturama.'
            });
        }

        const facturaId = response.data.Id;

        // Enviar PDF + XML por correo automáticamente
        try {
            const emailResponse = await axios.post(
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

            console.log('Respuesta de envío de email:', emailResponse.data);
        } catch (emailError) {
            console.error('Error al enviar email:', emailError.message);
            // No detener el proceso si falla el envío de email
        }

        res.json({
            success: true,
            message: `Factura generada exitosamente. Se ha enviado a ${email}`,
            facturaId: facturaId
        });

    } catch (error) {
        console.error('Error al generar factura:', error.response?.data || error.message);
        
        res.json({
            success: false,
            message: error.response?.data?.Message || 'Error al generar la factura. Por favor verifique los datos.',
            error: error.response?.data || error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Accede al formulario con parámetros de ejemplo:`);
    console.log(`   http://localhost:${PORT}?producto=Servicio%20de%20Consultoría&cantidad=2&precio_unitario=5000`);
});
