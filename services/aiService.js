const axios = require('axios');

// ==========================================
// PROMPT MAESTRO (LA PERSONALIDAD Y LÓGICA DE CYBI)
// ==========================================
const SYSTEM_PROMPT = `
Eres Cybi, un asistente virtual empático y súper amigable diseñado para conversar con adolescentes en Paraguay. Tu ÚNICO objetivo es recolectar información sobre zonas y colegios afectados por riesgos digitales (ciberbullying, sexting, grooming, etc.) para generar datos estadísticos.

== REGLAS DE ORO DE LA CONVERSACIÓN ==
- ESTO NO ES UN INTERROGATORIO. Habla como un amigo, paso a paso, de forma súper cálida y amable.
- NUNCA ofrezcas soluciones directas, no digas "llama a este número", ni recomiendes hablar con autoridades específicas. Tu rol es SOLO recolectar información para mapear áreas afectadas.
- SÍ puedes dar consejos generales de cómo evitar situaciones de riesgo o cómo cuidarse en internet.
- Agradece siempre por los datos y recálcales que todo el proceso es 100% ANÓNIMO y seguro.
- Haz UNA sola pregunta por mensaje.
- Tono: Muy amigable, cercano y con toques de jerga paraguaya sutil ("vos", "tranqui", "qué bajón", "súper bien", "legalmente"). No exageres al punto de sonar falso.

== FLUJO IDEAL PASO A PASO (Flexible) ==
Paso 1: Saludo inicial cálido. "¡Hola hola! ¿Cómo estás? Soy Cybi. ¿Cómo te llamás y de dónde nos escribís?"
Paso 2: Reacción y edad/colegio. "¡Qué genial, [Nombre]! Te cuento que esta charla es totalmente anónima. ¿Cuántos años tenés y en qué colegio estás?"
Paso 3: Introducción al tema. "¡Súper! Che, te pregunto... estamos juntando info para ver qué zonas están afectadas por problemas en internet. ¿Alguna vez sufriste o escuchaste de cosas como ciberbullying, sexting o problemas en redes en tu colegio?"
Paso 4: Profundización amigable. Si dicen que sí, pregunta detalles sutilmente para ver las áreas afectadas, da un consejo general sobre cómo prevenirlo, agradece un montón por su ayuda y recuérdales que su reporte anónimo ayuda a solucionar el problema a gran escala.

== DETECTOR DE TROLLS (SISTEMA ANTI-BROMAS) ==
Los adolescentes mienten o prueban al bot. Si dicen:
- Edades irreales (ej. 99 años, 5 años).
- Nombres absurdos (ej. Batman, Goku).
- Colegios inventados (ej. Hogwarts).
ACCION: Síguele la corriente amablemente o haz un chiste al respecto, PERO en el JSON interno, marca "es_broma" como TRUE y explica el motivo.

== FORMATO DE SALIDA ESTRICTO (JSON MODE) ==
DEBES responder ÚNICA y EXCLUSIVAMENTE con un objeto JSON válido. NO uses bloques de código markdown, NO pongas texto antes ni después de las llaves { }. Si no tienes un dato todavía, pon "null". Estructura EXACTA requerida:
{
  "respuesta_cybi": "Tu respuesta amigable en texto. (Aquí va la siguiente pregunta del flujo o el consejo/agradecimiento).",
  "datos_recolectados": {
    "colegio": "Nombre del colegio (si lo dijo) o null",
    "ciudad": "Nombre de la ciudad (ej: Capiatá, Asunción) o null",
    "edad": número (ej: 15) o null,
    "curso": "Ej: 1ro de la media, 9no grado, o null",
    "riesgosDetectados": ["ciberbullying", "sexting"] // Array vacío [] si no hay aún
  },
  "analisis_interno": {
    "es_broma": true o false,
    "motivo_broma": "Por qué crees que miente (deja vacío si todo es normal)",
    "severidad": número // Del 1 (normal) al 5 (situación crítica).
  }
}
`;

class AIService {
    
    /**
     * Limpia la respuesta de la IA por si alucina y le pone backticks de Markdown al JSON
     */
    static limpiarRespuestaJSON(rawContent) {
        let textoLimpio = rawContent.trim();
        if (textoLimpio.startsWith('```json')) {
            textoLimpio = textoLimpio.substring(7); // Quita el ```json inicial
        }
        if (textoLimpio.startsWith('```')) {
            textoLimpio = textoLimpio.substring(3); // Quita el ``` inicial
        }
        if (textoLimpio.endsWith('```')) {
            textoLimpio = textoLimpio.substring(0, textoLimpio.length - 3); // Quita el ``` final
        }
        return textoLimpio.trim();
    }

    /**
     * Función principal con sistema de reintentos (Retry)
     */
    static async getCybiResponse(messages, retries = 2) {
        // Añadimos el prompt maestro al inicio del historial
        const formattedMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
        ];

        let ultimoError = null;

        // Bucle de reintentos. Si la IA falla, intenta de nuevo automáticamente sin que el usuario lo note
        for (let intento = 1; intento <= retries; intento++) {
            try {
                // Petición a DeepInfra
                const response = await axios.post(
                    'https://api.deepinfra.com/v1/openai/chat/completions',
                    {
                        model: 'deepseek-ai/DeepSeek-V3',
                        messages: formattedMessages,
                        temperature: 0.3, // Bajo para mantener precisión en el JSON, pero permite algo de empatía
                        response_format: { type: "json_object" }, 
                        max_tokens: 1500, // Suficiente para la respuesta y los datos
                        top_p: 0.9 // Controla la diversidad de las palabras para que no suene robótico
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 25000 // Aumentamos el timeout a 25 seg para respuestas complejas
                    }
                );

                const rawContent = response.data.choices[0].message.content;
                const jsonLimpio = this.limpiarRespuestaJSON(rawContent);
                
                // Intentamos parsear el JSON
                try {
                    const parsedResponse = JSON.parse(jsonLimpio);
                    
                    // Verificación de seguridad estructural
                    if (!parsedResponse.respuesta_cybi || !parsedResponse.datos_recolectados || !parsedResponse.analisis_interno) {
                        throw new Error("El JSON devuelto por DeepSeek no tiene la estructura requerida.");
                    }

                    return parsedResponse;

                } catch (parseError) {
                    console.error(`[ERROR PARSEO JSON - Intento ${intento}]:`, parseError.message);
                    console.error("Contenido recibido:", rawContent);
                    ultimoError = parseError;
                    // Si falla el parseo, el bucle continúa y hace otro intento
                }

            } catch (networkError) {
                console.error(`[ERROR DE RED API - Intento ${intento}]:`, networkError.message);
                ultimoError = networkError;
                
                // Si es el último intento, no esperamos, rompemos el bucle
                if (intento === retries) break;
                
                // Esperamos 1 segundo antes de reintentar (Exponential Backoff básico)
                await new Promise(resolve => setTimeout(resolve, 1000 * intento));
            }
        }

        // Si llegamos aquí, es que agotó todos los reintentos
        console.error("[FALLO CRÍTICO IA] Se agotaron los reintentos. Retornando Plan B.");
        console.error("Último error registrado:", ultimoError?.message);
        return this.generateFallbackResponse();
    }

    /**
     * PLAN B: Respuesta de contingencia absoluta.
     * Mantiene la app viva aunque todo el ecosistema de IA colapse.
     */
    static generateFallbackResponse() {
        return {
            respuesta_cybi: "¡Huy! Me parece que se me enredaron unos cables por acá y estoy un poco lento. ¿Me podés repetir eso de otra forma?",
            datos_recolectados: {
                colegio: null,
                ciudad: null,
                edad: null,
                curso: null,
                riesgosDetectados: []
            },
            analisis_interno: {
                es_broma: false,
                motivo_broma: "Fallo sistémico de API. Ignorar registro temporal.",
                severidad: 1
            }
        };
    }
}

module.exports = AIService;