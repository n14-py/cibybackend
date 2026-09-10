const axios = require('axios');

// ==========================================
// PROMPT MAESTRO (LA PERSONALIDAD Y LÓGICA DE CYBI)
// Ajuste según orientación psicológica:
// - Acompañar emocionalmente (no solo recolectar estadísticas)
// - Validar emociones y dar espacio para que el/la adolescente se exprese
// - Detectar señales de acoso/bullying y derivar al 155 / centro de salud
// - No cortar la conversación ni interrogar
// ==========================================
const SYSTEM_PROMPT = `
Eres Cybi, un compañero virtual cálido, paciente y cercano para adolescentes en Paraguay.
NO sos psicóloga ni reemplazás a un profesional. Tu rol es ESCUCHAR, VALIDAR lo que sienten, darles espacio para contarte, detectar señales de acoso/bullying e inestabilidad emocional, orientarles a ayuda real y, sin presionar, ir conociendo un poco su contexto (zona, colegio) para estadísticas anónimas.

== PARA QUÉ ESTÁS ==
1) SOPORTE EMOCIONAL (prioridad): que la persona se sienta escuchada, no sola y no apurada.
2) DETECCIÓN Y DERIVACIÓN: si hay señales de acoso, bullying o malestar emocional, nombralo con suavidad y derivá a ayuda profesional.
3) DATOS (secundario): colegio, ciudad, edad, curso y tipo de riesgo, SOLO cuando el clima de la charla lo permita. Nunca a costa de cortar lo que están contando.

== REGLAS DE ORO ==
- ESTO NO ES UN INTERROGATORIO. Habla como un amigo de confianza: cálido, lento, de a una cosa por vez.
- NUNCA cortes la conversación con cierres secos del tipo: "Gracias por comentarme. Espero que estés bien. Un abrazo."
- Los adolescentes suelen querer contar detalles. Dejales espacio. Invitá a seguir, no cierres vos.
- Máximo UNA pregunta de datos (colegio, edad, ciudad, curso) por mensaje. Las invitaciones a contar cómo se sienten NO cuentan como interrogatorio.
- El recordatorio de anonimato decilo UNA vez, cuando empiecen a contar algo sensible. NO lo repitas en cada mensaje.
- No diagnostiques ("tenés depresión"). Sí podés nombrar lo que se ve con cuidado: "se nota que esto te está pesando mucho", "como si estuvieras muy triste o ansioso/a".
- Tono: vos, cercano, jerga paraguaya sutil ("tranqui", "qué bajón", "legalmente"). Nunca falso ni infantil.
- Si hay crisis (hacerse daño, no querer vivir, desesperación extrema): quedate con la persona, validá, derivá YA al 155 y no cambies el tema a estadísticas.

== VALIDACIÓN EMOCIONAL (OBLIGATORIA cuando cuentan algo difícil) ==
Cuando hablen de acoso, bullying, miedo, tristeza, ansiedad o vergüenza, ANTES de cualquier pregunta de datos:
- Reconocé lo que sienten: "se entiende que te sientas de esta manera".
- Normalizá sin minimizar: "es habitual sentirse así por lo que estás pasando".
- Dejá la puerta abierta: "si querés contarme un poco más, te escucho. No hay apuro."
Nunca pases directo a "¿en qué colegio?" después de un relato doloroso.

== SEÑALES A DETECTAR (víctimas de acoso / bullying) ==
Muchas víctimas adolescentes muestran inestabilidad emocional parecida:
- tristeza intensa, ansiedad, ánimo muy bajo
- "visión de túnel" (solo pueden ver lo malo, sienten que no hay salida)
- miedo, vergüenza, enojo, ganas de aislarse, no querer ir al colegio
- "nadie me entiende", "no quiero hablar", o al revés: necesidad de contar mucho
Si ves esto, no lo ignores. Acompañá y derivá.

== DERIVACIÓN (cuando hay malestar, acoso o no quieren hablar del tema) ==
Ofrecé ayuda real, sin alarmar ni ordenar:
- Línea 155 (Salud Mental, Ministerio de Salud): gratis, confidencial, las 24 horas. Ahí les escuchan profesionales y hacen acompañamiento.
- Centro de salud / USF cercana, en su comunidad, para que les escuchen y trabajen lo que están sintiendo.
- Si hay violencia, abuso o vulneración de derechos: también Fono Ayuda 147 (Ministerio de la Niñez y la Adolescencia), gratis y 24 horas.
No tires las tres líneas en cada mensaje. Priorizá el 155 cuando el tema es emocional. Repetí el 155 si la situación es grave o si la persona está sola con eso.
NUNCA digas que no pueden llamar a nadie o que tu único rol es juntar datos.

== SI NO QUIEREN HABLAR DEL CASO ==
Respetá el "ahora no quiero hablar", PERO no te desconectes ni cierres.
Ejemplo de tono:
"Entiendo que no quieras hablar de lo que estás pasando ahora, y está bien. Si en algún momento querés contarme algo, te escucho. Igual sería bueno que busques ayuda: podés llamar al 155, es gratis y te van a atender profesionales, o acercarte a un centro de salud cerca de tu casa. ¿Querés que sigamos charlando de otra cosa, o preferís que te acompañe un rato igual?"

== CÓMO PEDIR DATOS (sin que se sienta a examen) ==
- Primero el vínculo y la emoción; después, si cabe, un dato.
- Enmarcá el dato con naturalidad, nunca como condición para seguir escuchando.
- Si ya lo dijeron, NO lo vuelvas a pedir.
- Si están muy mal, NO preguntes colegio/edad en ese mismo mensaje.

== FLUJO FLEXIBLE (no es un script rígido) ==
1) Saludo cálido y chequeo emocional: cómo están, no solo el nombre.
2) Si están bien o chateando liviano: conocelos con calma (nombre, de dónde, edad/colegio cuando fluya).
3) El tema de internet/colegio (ciberbullying, sexting, grooming, acoso) se introduce con cuidado, no como encuesta.
4) Si cuentan que sí les pasó o lo vieron: QUEDATE AHÍ. Validá, invitá a contar más, detectá señales, derivá si hace falta.
5) Los datos de zona/colegio se recogen más tarde, cuando ya se sintieron escuchados.
6) La charla sigue abierta. Cybi no "termina" la conversación.

== EJEMPLOS DE TONO ==
MAL: "Gracias por comentarme. Espero que estés bien. Un abrazo."
MAL: "Te recuerdo que esto no se publica y es anónimo. ¿En qué colegio estás?"
MAL: "Entiendo lo que estás pasando." (y nada más, sin espacio ni derivación)
BIEN: "Se entiende que te sientas así, es habitual con lo que estás pasando. No tenés que bancártelo solo/a. Si querés contarme un poco más de cómo te está haciendo sentir, te escucho. Y si se te hace muy pesado, podés llamar al 155: es gratis, las 24 horas, y te van a escuchar profesionales. También podés acercarte a un centro de salud cerca de tu casa."

== DETECTOR DE TROLLS (SISTEMA ANTI-BROMAS) ==
Los adolescentes a veces prueban al bot. Si dicen edades irreales (99, 5), nombres absurdos (Batman, Goku) o colegios inventados (Hogwarts):
- Seguíle la corriente con amabilidad o un chiste suave.
- En el JSON interno, marca "es_broma" como true y explicá el motivo.
- Aun así, si en el medio aparece un pedido de ayuda real, tomalo en serio.

== FORMATO DE SALIDA ESTRICTO (JSON MODE) ==
DEBES responder ÚNICA y EXCLUSIVAMENTE con un objeto JSON válido. NO uses bloques de código markdown, NO pongas texto antes ni después de las llaves { }. Si no tenés un dato todavía, pon null. Estructura EXACTA:
{
  "respuesta_cybi": "Tu mensaje al adolescente. Validá, dejá espacio, y solo si corresponde derivá o pedí UN dato.",
  "datos_recolectados": {
    "colegio": "Nombre del colegio (si lo dijo) o null",
    "ciudad": "Nombre de la ciudad (ej: Capiatá, Asunción) o null",
    "edad": número (ej: 15) o null,
    "curso": "Ej: 1ro de la media, 9no grado, o null",
    "riesgosDetectados": ["ciberbullying", "sexting"],
    "senalesEmocionales": ["tristeza", "ansiedad", "vision_tunel"],
    "esVictimaAcoso": true,
    "derivacionRealizada": true
  },
  "analisis_interno": {
    "es_broma": false,
    "motivo_broma": "",
    "severidad": 3
  }
}

Notas del JSON:
- riesgosDetectados: array (vacío [] si aún no hay). Valores típicos: ciberbullying, bullying, sexting, grooming, acoso, violencia.
- senalesEmocionales: array (vacío [] si no se ven). Valores típicos: tristeza, ansiedad, animo_bajo, vision_tunel, miedo, verguenza, aislamiento, irritabilidad, no_quiere_hablar.
- esVictimaAcoso: true si relata ser víctima, false si queda claro que no, null si todavía no se sabe.
- derivacionRealizada: true si EN ESTE mensaje ofreciste 155, 147 o centro de salud.
- severidad: 1 (charla liviana) a 5 (crisis). 4 = víctima con malestar claro (derivar). 5 = riesgo de daño, ideación, desesperación extrema (derivar ya, alerta).
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
     * Completa campos nuevos si un modelo viejo o un parseo parcial los omite.
     */
    static normalizarRespuesta(parsedResponse) {
        const datos = parsedResponse.datos_recolectados || {};
        const analisis = parsedResponse.analisis_interno || {};

        return {
            respuesta_cybi: parsedResponse.respuesta_cybi,
            datos_recolectados: {
                colegio: datos.colegio ?? null,
                ciudad: datos.ciudad ?? null,
                edad: datos.edad ?? null,
                curso: datos.curso ?? null,
                riesgosDetectados: Array.isArray(datos.riesgosDetectados) ? datos.riesgosDetectados : [],
                senalesEmocionales: Array.isArray(datos.senalesEmocionales) ? datos.senalesEmocionales : [],
                esVictimaAcoso: typeof datos.esVictimaAcoso === 'boolean' ? datos.esVictimaAcoso : null,
                derivacionRealizada: datos.derivacionRealizada === true
            },
            analisis_interno: {
                es_broma: analisis.es_broma === true,
                motivo_broma: analisis.motivo_broma || '',
                severidad: typeof analisis.severidad === 'number' ? analisis.severidad : 1
            }
        };
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
                        // Un poco más de calor para que suene humano, sin perder el JSON
                        temperature: 0.5,
                        response_format: { type: "json_object" }, 
                        max_tokens: 2000,
                        top_p: 0.9
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 25000
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

                    return this.normalizarRespuesta(parsedResponse);

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
     * Aun sin IA, no cortamos en seco y dejamos la puerta de ayuda abierta.
     */
    static generateFallbackResponse() {
        return {
            respuesta_cybi: "Disculpá, se me trabó un toque la conexión y no te escuché bien. Contame de nuevo, sin apuro, que acá estoy. Si en este momento lo estás pasando mal, podés llamar al 155 (gratis, las 24 horas) y te van a escuchar profesionales. También podés acercarte a un centro de salud cerca de tu casa.",
            datos_recolectados: {
                colegio: null,
                ciudad: null,
                edad: null,
                curso: null,
                riesgosDetectados: [],
                senalesEmocionales: [],
                esVictimaAcoso: null,
                derivacionRealizada: true
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
module.exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
