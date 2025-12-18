// Mostrar número de ticket si existe
window.addEventListener('DOMContentLoaded', () => {
    const ticketInput = document.getElementById('numeroTicket');
    const ticketDisplay = document.getElementById('ticketNumber');
    const ticketNum = document.getElementById('ticketNum');
    
    if (ticketInput && ticketInput.value) {
        ticketNum.textContent = ticketInput.value;
        ticketDisplay.style.display = 'block';
    }
});

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
        
        const response = await fetch('generar-factura', {
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