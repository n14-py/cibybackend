// ==========================================
// 🚀 MOTOR DEL CHAT DE CYBI (FRONTEND) 🚀
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Gestión Segura de Sesión
    let sessionId = sessionStorage.getItem('cybi_session');
    if (!sessionId) {
        // Generación de ID criptográficamente más seguro si es posible, o fallback a Math.random
        const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 15);
        sessionId = 'cybi_' + Date.now() + '_' + randomPart;
        sessionStorage.setItem('cybi_session', sessionId);
    }
    
    // URL del Backend (Actualizar al desplegar en producción)
    const API_URL = 'https://cibybackend.onrender.com/api/chat';

    // 2. Referencias DOM
    const chatWindowDom = document.getElementById('chat-window');
    const chatInputDom = document.getElementById('chat-input');
    const sendBtnDom = document.getElementById('send-btn');
    const statusIndicator = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const suggestionsDom = document.getElementById('suggestions');

    // 3. Sanitización (Protección XSS en el Frontend)
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // 4. Inicialización de Interfaz
    function habilitarChat() {
        if(!chatInputDom || !sendBtnDom) return;
        
        chatInputDom.disabled = false;
        sendBtnDom.disabled = false;
        chatInputDom.placeholder = "Escribe tu mensaje aquí...";
        sendBtnDom.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        sendBtnDom.style.cursor = 'pointer';
        sendBtnDom.style.background = 'var(--primary-blue)';
        
        // Cambiar estado a Verde (Activo)
        if(statusIndicator && statusText) {
            statusIndicator.style.backgroundColor = '#00E5FF';
            statusIndicator.style.boxShadow = '0 0 10px #00E5FF';
            statusText.textContent = 'En línea y seguro';
        }
    }

    setTimeout(habilitarChat, 500);

    // 5. Funciones de Renderizado UI
    function scrollAlFondo() {
        chatWindowDom.scrollTo({
            top: chatWindowDom.scrollHeight,
            behavior: 'smooth'
        });
    }

    function agregarMensajeUsuario(textoRaw) {
        const textoSeguro = escapeHTML(textoRaw);
        const html = `
            <div class="message-row user">
                <div class="chat-bubble user-bubble">${textoSeguro}</div>
            </div>
        `;
        chatWindowDom.insertAdjacentHTML('beforeend', html);
        scrollAlFondo();
        
        // Ocultar sugerencias iniciales si existen
        if(suggestionsDom) suggestionsDom.style.display = 'none';
    }

    function agregarMensajeCybi(textoRaw) {
        // Escapar primero, luego reemplazar saltos de línea por <br>
        const textoSeguro = escapeHTML(textoRaw).replace(/\n/g, '<br>');
        
        const html = `
            <div class="message-row bot">
                <img src="img/cybi-logo.jpeg" alt="Cybi" style="width: 35px; height: 35px; border-radius: 50%; margin-right: 10px; border: 1px solid var(--primary-blue);">
                <div class="chat-bubble bot-bubble">${textoSeguro}</div>
            </div>
        `;
        chatWindowDom.insertAdjacentHTML('beforeend', html);
        scrollAlFondo();
    }

    let indicadorTypingId = null;
    function mostrarEscribiendo() {
        const id = 'typing_' + Date.now();
        indicadorTypingId = id;
        const html = `
            <div class="message-row bot" id="${id}">
                <img src="img/cybi-logo.jpeg" alt="Cybi" style="width: 35px; height: 35px; border-radius: 50%; margin-right: 10px;">
                <div class="chat-bubble bot-bubble typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatWindowDom.insertAdjacentHTML('beforeend', html);
        scrollAlFondo();
    }

    function ocultarEscribiendo() {
        if (indicadorTypingId) {
            const elemento = document.getElementById(indicadorTypingId);
            if (elemento) elemento.remove();
            indicadorTypingId = null;
        }
    }

    // Exponer la función usarSugerencia al ámbito global para los botones del HTML
    window.usarSugerencia = function(texto) {
        if(chatInputDom) {
            chatInputDom.value = texto;
            chatInputDom.focus();
        }
    };

    // 6. Núcleo de Comunicación con la API
    async function enviarMensaje() {
        const texto = chatInputDom.value.trim();
        if (!texto) return;

        // Limpiar input y bloquear mientras carga
        chatInputDom.value = '';
        chatInputDom.disabled = true;
        sendBtnDom.disabled = true;

        // Mostrar el mensaje en pantalla
        agregarMensajeUsuario(texto);
        mostrarEscribiendo();

        try {
            // Petición HTTP al Backend
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    mensaje: texto
                })
            });

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            const data = await respuesta.json();
            
            // Ocultar los 3 puntitos y mostrar la respuesta de la IA
            ocultarEscribiendo();
            agregarMensajeCybi(data.respuesta);

        } catch (error) {
            console.error("[ERROR CYBI API]:", error);
            ocultarEscribiendo();
            agregarMensajeCybi("¡Huy! Hubo un problema de conexión con mi servidor. Revisá tu internet y volvé a intentarlo. 🔌");
        } finally {
            // Volver a habilitar el input
            chatInputDom.disabled = false;
            sendBtnDom.disabled = false;
            chatInputDom.focus();
        }
    }

    // 7. Event Listeners
    if(sendBtnDom) {
        sendBtnDom.addEventListener('click', enviarMensaje);
    }
    
    if(chatInputDom) {
        chatInputDom.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Previene comportamientos por defecto del formulario
                enviarMensaje();
            }
        });
    }
});