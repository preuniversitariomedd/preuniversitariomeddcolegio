// AUTO-GENERADO — 4 tests psicométricos complementarios
// Dimensiones: edad mental, decisiones bajo presión, visión de vida, modificación de conducta
// © 2020-2026 PreUniversitario MEDD — Víctor Cañizares González
import type { TestExtendido } from "./banco24";

export const BANCO_EXTRA_TESTS: TestExtendido[] = [
  {
    "id": "edad-mental",
    "nombre": "Edad Mental vs Cronológica",
    "subtitulo": "Madurez psicológica integral",
    "icono": "🧬",
    "descripcion": "Estima tu nivel de madurez psicológica en cinco dimensiones (emocional, cognitiva, social, autonomía y responsabilidad) para compararlo con tu edad cronológica.",
    "categoria": "psicometria",
    "tiempo_estimado": 14,
    "estimatedMinutes": 14,
    "totalQuestions": 55,
    "instrucciones": "Lee cada afirmación y elige la opción que mejor te describa. No hay respuestas correctas o incorrectas; responde con sinceridad.",
    "opciones": [
      {
        "valor": 1,
        "etiqueta": "Totalmente en desacuerdo"
      },
      {
        "valor": 2,
        "etiqueta": "En desacuerdo"
      },
      {
        "valor": 3,
        "etiqueta": "Neutral"
      },
      {
        "valor": 4,
        "etiqueta": "De acuerdo"
      },
      {
        "valor": 5,
        "etiqueta": "Totalmente de acuerdo"
      }
    ],
    "scaleType": "likert5",
    "scales": {
      "ME": {
        "name": "Madurez Emocional",
        "description": "Capacidad de reconocer, expresar y regular las propias emociones de forma adaptativa."
      },
      "MC": {
        "name": "Madurez Cognitiva",
        "description": "Pensamiento abstracto, planificación a largo plazo y razonamiento consecuencial."
      },
      "MS": {
        "name": "Madurez Social",
        "description": "Comprensión de normas, lectura de contextos sociales y relaciones interpersonales adultas."
      },
      "AU": {
        "name": "Autonomía Personal",
        "description": "Capacidad de gestionar la propia vida sin depender excesivamente de figuras externas."
      },
      "RE": {
        "name": "Responsabilidad y Compromiso",
        "description": "Asumir consecuencias, cumplir compromisos y sostener obligaciones a lo largo del tiempo."
      }
    },
    "subescalas": [
      {
        "id": "ME",
        "nombre": "Madurez Emocional"
      },
      {
        "id": "MC",
        "nombre": "Madurez Cognitiva"
      },
      {
        "id": "MS",
        "nombre": "Madurez Social"
      },
      {
        "id": "AU",
        "nombre": "Autonomía Personal"
      },
      {
        "id": "RE",
        "nombre": "Responsabilidad y Compromiso"
      }
    ],
    "preguntas": [
      {
        "id": "edad-mental-1",
        "texto": "Cuando algo me molesta, identifico con claridad qué emoción estoy sintiendo.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-2",
        "texto": "Logro calmarme antes de reaccionar ante una situación frustrante.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-3",
        "texto": "Puedo hablar de mis emociones sin sentirme amenazado/a.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-4",
        "texto": "Tolero la tristeza o la ansiedad sin necesidad de evadirlas con distracciones.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-5",
        "texto": "Reconozco cuando una reacción mía es desproporcionada al estímulo.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-6",
        "texto": "No dependo de la aprobación constante de los demás para sentirme bien.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-7",
        "texto": "Manejo la decepción de manera constructiva, sin caer en rencor prolongado.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-8",
        "texto": "Puedo postergar una gratificación inmediata por un beneficio mayor a futuro.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-9",
        "texto": "Acepto la crítica sin que destruya mi autoestima.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-10",
        "texto": "Distingo lo que siento de lo que pienso, y ambos guían mis decisiones.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-11",
        "texto": "Cuando me equivoco, me hago responsable sin culpar a otros.",
        "subescala": "ME"
      },
      {
        "id": "edad-mental-12",
        "texto": "Pienso en las consecuencias a largo plazo antes de actuar.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-13",
        "texto": "Puedo analizar un problema desde varios puntos de vista distintos al mío.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-14",
        "texto": "Comprendo ideas abstractas como justicia, libertad o ética sin reducirlas a ejemplos.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-15",
        "texto": "Cambio de opinión cuando aparece evidencia que contradice mis creencias.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-16",
        "texto": "Planifico mis estudios o proyectos con metas semanales y mensuales.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-17",
        "texto": "Reconozco que la realidad rara vez es blanco o negro.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-18",
        "texto": "Soy capaz de sostener una conversación profunda sobre temas complejos.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-19",
        "texto": "Distingo entre hechos verificables y opiniones personales.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-20",
        "texto": "Anticipo riesgos y preparo planes alternativos.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-21",
        "texto": "Aprendo de mis errores y ajusto mi conducta en situaciones futuras.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-22",
        "texto": "Sé priorizar lo importante por encima de lo urgente.",
        "subescala": "MC"
      },
      {
        "id": "edad-mental-23",
        "texto": "Adapto mi forma de comunicarme según con quién esté hablando.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-24",
        "texto": "Comprendo las normas implícitas de los entornos en los que me muevo.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-25",
        "texto": "Resuelvo conflictos sin recurrir al grito, la burla o el silencio prolongado.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-26",
        "texto": "Reconozco cuándo es mejor hablar y cuándo escuchar.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-27",
        "texto": "Mantengo relaciones estables con personas de distintas edades y contextos.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-28",
        "texto": "Pongo límites sanos sin necesidad de pelear.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-29",
        "texto": "Identifico cuando alguien necesita apoyo emocional sin que tenga que pedírmelo.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-30",
        "texto": "Puedo trabajar en equipo aunque no esté de acuerdo con todos los integrantes.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-31",
        "texto": "Acepto opiniones distintas sin sentirme amenazado/a.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-32",
        "texto": "Manejo bien la presión social y no sigo conductas riesgosas para encajar.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-33",
        "texto": "Soy capaz de pedir disculpas genuinas cuando hago daño a alguien.",
        "subescala": "MS"
      },
      {
        "id": "edad-mental-34",
        "texto": "Me organizo solo/a sin necesidad de que me recuerden mis tareas.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-35",
        "texto": "Tomo decisiones importantes sin depender de la aprobación familiar.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-36",
        "texto": "Manejo mi propio dinero o presupuesto cuando es posible.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-37",
        "texto": "Sé buscar información, formularios o recursos por mí mismo/a cuando los necesito.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-38",
        "texto": "Soy capaz de cocinar, lavar y organizar mi espacio personal.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-39",
        "texto": "Puedo pasar tiempo solo/a sin sentirme vacío/a o aburrido/a.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-40",
        "texto": "Asumo decisiones aunque sepa que pueden generar tensiones con mis padres.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-41",
        "texto": "Tengo opiniones propias que no copio de mis amistades cercanas.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-42",
        "texto": "Persigo metas personales aunque nadie me esté observando.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-43",
        "texto": "Reconozco cuándo necesito ayuda profesional y la pido.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-44",
        "texto": "Mi autoestima no depende exclusivamente de mis resultados académicos.",
        "subescala": "AU"
      },
      {
        "id": "edad-mental-45",
        "texto": "Cumplo con mis compromisos aunque ya no me apetezca hacerlos.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-46",
        "texto": "Llego puntual a clases, citas y reuniones.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-47",
        "texto": "Termino las tareas que empiezo, no solo las que me resultan fáciles.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-48",
        "texto": "Asumo las consecuencias de mis decisiones, aunque sean negativas.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-49",
        "texto": "Mantengo mi palabra cuando me comprometo con alguien.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-50",
        "texto": "Soy capaz de sostener un esfuerzo durante semanas para lograr una meta.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-51",
        "texto": "Reconozco que mi futuro depende, en gran parte, de mis acciones de hoy.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-52",
        "texto": "Cumplo con plazos académicos sin necesidad de presión externa.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-53",
        "texto": "Cuido mis pertenencias y las que me prestan.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-54",
        "texto": "Soy responsable con el manejo del tiempo en redes sociales y entretenimiento.",
        "subescala": "RE"
      },
      {
        "id": "edad-mental-55",
        "texto": "Asumo deberes hacia mi familia, mi comunidad o mi entorno cercano.",
        "subescala": "RE"
      }
    ],
    "calculo_resultado": "Promedio normalizado por subescala (0-100).",
    "umbrales": {
      "bajo_max": 110,
      "medio_max": 192.5
    },
    "interpretacion": {
      "bajo": "Área a fortalecer. Considera trabajar estos aspectos con apoyo psicopedagógico.",
      "medio": "Nivel funcional con espacio para crecer en algunas dimensiones.",
      "alto": "Fortaleza notable en este constructo; capitalízalo en tu plan de vida y carrera."
    },
    "estado": "completo"
  },
  {
    "id": "decisiones-presion",
    "nombre": "Toma de Decisiones bajo Presión",
    "subtitulo": "Cómo decides cuando el tiempo apremia",
    "icono": "⚡",
    "descripcion": "Evalúa tus estilos y competencias al tomar decisiones bajo estrés, urgencia o información incompleta — clave para carreras de alta exigencia.",
    "categoria": "psicometria",
    "tiempo_estimado": 14,
    "estimatedMinutes": 14,
    "totalQuestions": 55,
    "instrucciones": "Lee cada afirmación y elige la opción que mejor te describa. No hay respuestas correctas o incorrectas; responde con sinceridad.",
    "opciones": [
      {
        "valor": 1,
        "etiqueta": "Nunca"
      },
      {
        "valor": 2,
        "etiqueta": "Pocas veces"
      },
      {
        "valor": 3,
        "etiqueta": "A veces"
      },
      {
        "valor": 4,
        "etiqueta": "Frecuentemente"
      },
      {
        "valor": 5,
        "etiqueta": "Siempre"
      }
    ],
    "scaleType": "likert5",
    "scales": {
      "RP": {
        "name": "Rapidez Decisional",
        "description": "Capacidad de elegir con agilidad sin paralizarse."
      },
      "TE": {
        "name": "Tolerancia al Estrés",
        "description": "Mantener claridad mental cuando la presión se eleva."
      },
      "AR": {
        "name": "Análisis Racional",
        "description": "Evaluar pros, contras y datos disponibles antes de decidir."
      },
      "IN": {
        "name": "Intuición Calibrada",
        "description": "Confiar en señales internas validadas por la experiencia."
      },
      "RC": {
        "name": "Recuperación tras Error",
        "description": "Aprender, ajustar y volver a actuar después de equivocarse."
      }
    },
    "subescalas": [
      {
        "id": "RP",
        "nombre": "Rapidez Decisional"
      },
      {
        "id": "TE",
        "nombre": "Tolerancia al Estrés"
      },
      {
        "id": "AR",
        "nombre": "Análisis Racional"
      },
      {
        "id": "IN",
        "nombre": "Intuición Calibrada"
      },
      {
        "id": "RC",
        "nombre": "Recuperación tras Error"
      }
    ],
    "preguntas": [
      {
        "id": "decisiones-presion-1",
        "texto": "Cuando hay que decidir rápido, soy capaz de hacerlo sin bloquearme.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-2",
        "texto": "Prefiero tomar una decisión imperfecta que quedarme sin decidir.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-3",
        "texto": "En un examen con tiempo límite, gestiono bien el reloj.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-4",
        "texto": "Cuando ocurre un imprevisto, reacciono en lugar de quedarme paralizado/a.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-5",
        "texto": "Tengo agilidad para elegir entre varias opciones similares.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-6",
        "texto": "No suelo arrepentirme por decisiones tomadas con poco tiempo, si fueron meditadas.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-7",
        "texto": "Asumo el liderazgo cuando nadie más se anima a decidir.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-8",
        "texto": "Distingo qué decisiones requieren rapidez y cuáles ameritan más reflexión.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-9",
        "texto": "Respondo bien ante preguntas inesperadas en clase o en una entrevista.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-10",
        "texto": "Acepto que no toda decisión puede ser perfecta y eso no me detiene.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-11",
        "texto": "Cuando hay urgencia real, dejo de lado el perfeccionismo.",
        "subescala": "RP"
      },
      {
        "id": "decisiones-presion-12",
        "texto": "Bajo presión mantengo la respiración estable y el pensamiento claro.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-13",
        "texto": "El estrés agudo no me hace olvidar lo que sé.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-14",
        "texto": "Mi rendimiento mejora cuando el desafío es alto, no se desploma.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-15",
        "texto": "Tolero bien situaciones con resultados inciertos.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-16",
        "texto": "Puedo trabajar con varios estímulos al mismo tiempo sin colapsar.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-17",
        "texto": "Mantengo el foco aunque haya distractores o interrupciones.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-18",
        "texto": "Las críticas durante una decisión no me hacen perder rumbo.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-19",
        "texto": "Recupero la calma con rapidez cuando algo me altera.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-20",
        "texto": "Sé identificar cuando estoy entrando en pánico y aplico técnicas para regularme.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-21",
        "texto": "Puedo dormir bien la noche previa a una situación importante.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-22",
        "texto": "El miedo no me impide actuar cuando tengo que hacerlo.",
        "subescala": "TE"
      },
      {
        "id": "decisiones-presion-23",
        "texto": "Antes de decidir, hago una lista mental de pros y contras.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-24",
        "texto": "Verifico la fuente de la información que voy a usar.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-25",
        "texto": "Pondero el impacto a corto y largo plazo de mis decisiones.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-26",
        "texto": "Identifico riesgos que otros pasan por alto.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-27",
        "texto": "Distingo entre suposiciones y datos comprobados.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-28",
        "texto": "Considero al menos dos alternativas antes de elegir.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-29",
        "texto": "Reviso si mis emociones están sesgando mi juicio.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-30",
        "texto": "Calculo costos, tiempos y recursos antes de comprometerme.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-31",
        "texto": "Pregunto a personas con experiencia antes de decidir algo importante.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-32",
        "texto": "Estructuro decisiones complejas en pasos más pequeños.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-33",
        "texto": "Reconozco mis sesgos cognitivos al evaluar opciones.",
        "subescala": "AR"
      },
      {
        "id": "decisiones-presion-34",
        "texto": "A veces tengo una corazonada que termina siendo acertada.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-35",
        "texto": "Confío en mi instinto cuando las opciones se ven similares en lo racional.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-36",
        "texto": "Detecto rápido cuándo algo no encaja, aunque no pueda explicarlo de inmediato.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-37",
        "texto": "Mi experiencia previa me ayuda a anticipar resultados.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-38",
        "texto": "Identifico el ánimo de un grupo casi sin palabras.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-39",
        "texto": "Capto patrones antes de tener la información completa.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-40",
        "texto": "Sé cuándo debo retirarme de una situación, aunque parezca prometedora.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-41",
        "texto": "Mi intuición acierta más cuando la pongo a prueba con datos.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-42",
        "texto": "Reconozco la diferencia entre intuición y deseo o miedo.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-43",
        "texto": "Puedo decidir con poca información sin sentir que arriesgo a ciegas.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-44",
        "texto": "Sintetizo rápido información dispersa para generar una opinión.",
        "subescala": "IN"
      },
      {
        "id": "decisiones-presion-45",
        "texto": "Cuando me equivoco, busco entender qué falló sin castigarme.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-46",
        "texto": "Aplico lecciones aprendidas a decisiones futuras.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-47",
        "texto": "Puedo retomar una tarea tras un error sin perder motivación.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-48",
        "texto": "Pido retroalimentación específica para mejorar.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-49",
        "texto": "No oculto mis errores; los hago visibles para corregirlos.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-50",
        "texto": "Diferencio entre mala decisión y mal resultado.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-51",
        "texto": "Vuelvo a confiar en mí mismo/a tras una caída.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-52",
        "texto": "Reconstruyo planes cuando un imprevisto los rompe.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-53",
        "texto": "Acepto disculpas y disculpo a otros sin guardar resentimiento.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-54",
        "texto": "Mantengo la perspectiva: un error no define mi valor.",
        "subescala": "RC"
      },
      {
        "id": "decisiones-presion-55",
        "texto": "Veo el fracaso como información, no como condena.",
        "subescala": "RC"
      }
    ],
    "calculo_resultado": "Promedio normalizado por subescala (0-100).",
    "umbrales": {
      "bajo_max": 110,
      "medio_max": 192.5
    },
    "interpretacion": {
      "bajo": "Área a fortalecer. Considera trabajar estos aspectos con apoyo psicopedagógico.",
      "medio": "Nivel funcional con espacio para crecer en algunas dimensiones.",
      "alto": "Fortaleza notable en este constructo; capitalízalo en tu plan de vida y carrera."
    },
    "estado": "completo"
  },
  {
    "id": "vision-vida",
    "nombre": "Visión de Vida y Propósito",
    "subtitulo": "Tu brújula vital y proyectiva",
    "icono": "🧭",
    "descripcion": "Mide la claridad de tu propósito, tus metas a largo plazo, valores centrales, optimismo realista y sentido de trascendencia personal.",
    "categoria": "personalidad",
    "tiempo_estimado": 14,
    "estimatedMinutes": 14,
    "totalQuestions": 55,
    "instrucciones": "Lee cada afirmación y elige la opción que mejor te describa. No hay respuestas correctas o incorrectas; responde con sinceridad.",
    "opciones": [
      {
        "valor": 1,
        "etiqueta": "Totalmente en desacuerdo"
      },
      {
        "valor": 2,
        "etiqueta": "En desacuerdo"
      },
      {
        "valor": 3,
        "etiqueta": "Neutral"
      },
      {
        "valor": 4,
        "etiqueta": "De acuerdo"
      },
      {
        "valor": 5,
        "etiqueta": "Totalmente de acuerdo"
      }
    ],
    "scaleType": "likert5",
    "scales": {
      "PR": {
        "name": "Propósito Personal",
        "description": "Sentido de para qué hago lo que hago."
      },
      "ML": {
        "name": "Metas a Largo Plazo",
        "description": "Capacidad de imaginar y planificar el futuro lejano."
      },
      "VC": {
        "name": "Valores Centrales",
        "description": "Principios firmes que guían las elecciones cotidianas."
      },
      "OF": {
        "name": "Optimismo Realista",
        "description": "Esperanza fundada en evidencia, no negación de lo difícil."
      },
      "ST": {
        "name": "Sentido de Trascendencia",
        "description": "Conexión con algo mayor que uno mismo: familia, sociedad, espiritualidad, legado."
      }
    },
    "subescalas": [
      {
        "id": "PR",
        "nombre": "Propósito Personal"
      },
      {
        "id": "ML",
        "nombre": "Metas a Largo Plazo"
      },
      {
        "id": "VC",
        "nombre": "Valores Centrales"
      },
      {
        "id": "OF",
        "nombre": "Optimismo Realista"
      },
      {
        "id": "ST",
        "nombre": "Sentido de Trascendencia"
      }
    ],
    "preguntas": [
      {
        "id": "vision-vida-1",
        "texto": "Sé qué cosas me hacen sentir que mi vida tiene sentido.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-2",
        "texto": "Identifico una motivación profunda detrás de lo que hago día a día.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-3",
        "texto": "Mi propósito guía mis decisiones académicas.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-4",
        "texto": "Cuando estoy desanimado/a, recuerdo mi propósito y recupero energía.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-5",
        "texto": "Distingo entre lo que la sociedad espera y lo que yo realmente quiero.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-6",
        "texto": "Mi propósito es lo bastante claro para explicárselo a otra persona.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-7",
        "texto": "Lo que estudio se conecta con quien quiero llegar a ser.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-8",
        "texto": "Puedo nombrar tres cosas por las que vale la pena esforzarme.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-9",
        "texto": "Mi propósito ha evolucionado conmigo a lo largo del tiempo.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-10",
        "texto": "Siento que tengo algo significativo que aportar al mundo.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-11",
        "texto": "Aunque a veces dude, vuelvo a un sentido central que me sostiene.",
        "subescala": "PR"
      },
      {
        "id": "vision-vida-12",
        "texto": "Puedo describir cómo me imagino mi vida en 5 años.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-13",
        "texto": "Tengo metas concretas para los próximos 12 meses.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-14",
        "texto": "Pienso en cómo mis decisiones de hoy afectan mi futuro a 10 años.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-15",
        "texto": "Sé qué carrera o áreas profesionales me interesan.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-16",
        "texto": "Tengo claro qué tipo de vida quiero construir como adulto/a.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-17",
        "texto": "Mis metas son realistas y desafiantes a la vez.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-18",
        "texto": "Reviso periódicamente mis metas y las ajusto.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-19",
        "texto": "Distingo entre metas propias y metas impuestas por otros.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-20",
        "texto": "Tengo un plan para llegar a las metas que me importan.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-21",
        "texto": "Acepto que mis metas a largo plazo pueden cambiar y eso no me asusta.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-22",
        "texto": "Puedo postergar gratificaciones inmediatas por una meta lejana.",
        "subescala": "ML"
      },
      {
        "id": "vision-vida-23",
        "texto": "Tengo claros los principios que no negociaría por ningún beneficio.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-24",
        "texto": "Mis decisiones diarias coinciden con lo que valoro.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-25",
        "texto": "Sé identificar cuándo alguien me pide algo contrario a mis valores.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-26",
        "texto": "Puedo defender mis valores con respeto cuando se cuestionan.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-27",
        "texto": "Mi forma de tratar a los demás refleja lo que creo que es correcto.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-28",
        "texto": "Reflexiono sobre el origen de mis valores en lugar de heredarlos sin cuestionar.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-29",
        "texto": "Mis valores guían mi consumo (lo que veo, leo, compro).",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-30",
        "texto": "Soy coherente entre lo que digo y lo que hago.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-31",
        "texto": "Reconozco la diferencia entre valores auténticos y modas pasajeras.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-32",
        "texto": "Puedo nombrar al menos cinco valores centrales en mi vida.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-33",
        "texto": "Mis valores incluyen el cuidado del otro y de mi entorno.",
        "subescala": "VC"
      },
      {
        "id": "vision-vida-34",
        "texto": "Creo que el futuro puede ser mejor con esfuerzo y planificación.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-35",
        "texto": "Reconozco lo difícil sin dejar de ver lo posible.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-36",
        "texto": "Identifico oportunidades incluso en situaciones complicadas.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-37",
        "texto": "Confío en que puedo aprender lo que aún no sé.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-38",
        "texto": "Las dificultades me parecen retos antes que castigos.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-39",
        "texto": "Mi historia personal no determina del todo mi futuro.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-40",
        "texto": "Tengo esperanza realista sobre mi país y mi generación.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-41",
        "texto": "Cuando algo sale mal, busco lo aprovechable.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-42",
        "texto": "Creo que el cambio personal es posible a cualquier edad.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-43",
        "texto": "Visualizo escenarios positivos como parte de mi planificación.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-44",
        "texto": "Mi optimismo no es negación; convive con la conciencia de los riesgos.",
        "subescala": "OF"
      },
      {
        "id": "vision-vida-45",
        "texto": "Mi vida está conectada con personas y causas que me importan más allá de mí.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-46",
        "texto": "Quiero dejar algo que valga la pena cuando ya no esté.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-47",
        "texto": "Siento que pertenezco a algo más grande: familia, comunidad, fe o ideales.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-48",
        "texto": "Disfruto contribuir al bienestar de otros, aunque nadie lo note.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-49",
        "texto": "Reflexiono sobre el sentido de la vida y la muerte sin angustia paralizante.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-50",
        "texto": "Reconozco mi pequeñez y mi importancia en el mismo gesto.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-51",
        "texto": "Tengo prácticas (oración, meditación, naturaleza, arte) que me conectan con lo profundo.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-52",
        "texto": "Mi trabajo o mi estudio tiene un impacto, aunque modesto, en otros.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-53",
        "texto": "Valoro la dignidad humana incluso de quienes piensan distinto.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-54",
        "texto": "Me importa el legado que deje en mi familia y mi entorno.",
        "subescala": "ST"
      },
      {
        "id": "vision-vida-55",
        "texto": "Puedo encontrar belleza y sentido en momentos cotidianos.",
        "subescala": "ST"
      }
    ],
    "calculo_resultado": "Promedio normalizado por subescala (0-100).",
    "umbrales": {
      "bajo_max": 110,
      "medio_max": 192.5
    },
    "interpretacion": {
      "bajo": "Área a fortalecer. Considera trabajar estos aspectos con apoyo psicopedagógico.",
      "medio": "Nivel funcional con espacio para crecer en algunas dimensiones.",
      "alto": "Fortaleza notable en este constructo; capitalízalo en tu plan de vida y carrera."
    },
    "estado": "completo"
  },
  {
    "id": "modificacion-conducta",
    "nombre": "Modificación de Conducta y Autorregulación",
    "subtitulo": "Tu capacidad real de cambio sostenido",
    "icono": "🔄",
    "descripcion": "Evalúa cuánto puedes observarte, ajustar hábitos, sostener nuevas conductas y construir cambios duraderos en tu vida.",
    "categoria": "psicometria",
    "tiempo_estimado": 14,
    "estimatedMinutes": 14,
    "totalQuestions": 55,
    "instrucciones": "Lee cada afirmación y elige la opción que mejor te describa. No hay respuestas correctas o incorrectas; responde con sinceridad.",
    "opciones": [
      {
        "valor": 1,
        "etiqueta": "Nunca"
      },
      {
        "valor": 2,
        "etiqueta": "Pocas veces"
      },
      {
        "valor": 3,
        "etiqueta": "A veces"
      },
      {
        "valor": 4,
        "etiqueta": "Frecuentemente"
      },
      {
        "valor": 5,
        "etiqueta": "Siempre"
      }
    ],
    "scaleType": "likert5",
    "scales": {
      "AC": {
        "name": "Autoconciencia Conductual",
        "description": "Capacidad de observarte sin juicio y reconocer patrones propios."
      },
      "CO": {
        "name": "Autocontrol",
        "description": "Frenar impulsos y elegir respuestas alineadas con tus metas."
      },
      "HP": {
        "name": "Construcción de Hábitos",
        "description": "Instalar conductas positivas que se sostienen sin esfuerzo extremo."
      },
      "FL": {
        "name": "Flexibilidad Conductual",
        "description": "Cambiar estrategias cuando una deja de funcionar."
      },
      "PE": {
        "name": "Persistencia en el Cambio",
        "description": "Mantener el rumbo aunque haya recaídas o desánimo."
      }
    },
    "subescalas": [
      {
        "id": "AC",
        "nombre": "Autoconciencia Conductual"
      },
      {
        "id": "CO",
        "nombre": "Autocontrol"
      },
      {
        "id": "HP",
        "nombre": "Construcción de Hábitos"
      },
      {
        "id": "FL",
        "nombre": "Flexibilidad Conductual"
      },
      {
        "id": "PE",
        "nombre": "Persistencia en el Cambio"
      }
    ],
    "preguntas": [
      {
        "id": "modificacion-conducta-1",
        "texto": "Puedo describir mis hábitos sin disfrazarlos para verme mejor.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-2",
        "texto": "Identifico los disparadores que me llevan a una conducta no deseada.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-3",
        "texto": "Reconozco cuando estoy entrando en piloto automático.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-4",
        "texto": "Llevo registro de mis conductas cuando quiero cambiarlas.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-5",
        "texto": "Sé qué situaciones suelen sacarme de mis casillas.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-6",
        "texto": "Distingo entre lo que siento, pienso y hago en una misma situación.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-7",
        "texto": "Acepto retroalimentación sobre mis conductas sin defenderme de inmediato.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-8",
        "texto": "Reflexiono al final del día sobre cómo actué.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-9",
        "texto": "Identifico si mi conducta refleja mis valores reales o solo costumbres.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-10",
        "texto": "Reconozco patrones repetitivos en mis decisiones.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-11",
        "texto": "Soy consciente del lenguaje corporal que comunico.",
        "subescala": "AC"
      },
      {
        "id": "modificacion-conducta-12",
        "texto": "Resisto la tentación de mirar el celular cuando debo concentrarme.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-13",
        "texto": "Puedo postergar una recompensa inmediata por algo más importante.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-14",
        "texto": "Mantengo la calma cuando alguien me provoca.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-15",
        "texto": "Controlo mi gasto y no compro impulsivamente.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-16",
        "texto": "Modero mi consumo de redes, juegos o entretenimiento sin culpa.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-17",
        "texto": "Sé cuándo dejar de comer, beber o trasnochar.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-18",
        "texto": "Cumplo lo que me prometo a mí mismo/a.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-19",
        "texto": "Mi conducta no depende solo de mi estado de ánimo.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-20",
        "texto": "Logro estudiar incluso cuando no tengo ganas.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-21",
        "texto": "Puedo callar cuando hablar empeoraría las cosas.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-22",
        "texto": "Mantengo límites con personas que conozco hace tiempo.",
        "subescala": "CO"
      },
      {
        "id": "modificacion-conducta-23",
        "texto": "Tengo rutinas estables que no requieren mucho esfuerzo mantener.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-24",
        "texto": "He logrado instalar al menos un buen hábito en el último año.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-25",
        "texto": "Vinculo nuevas conductas a momentos del día específicos.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-26",
        "texto": "Ajusto mi entorno para facilitar las conductas que quiero.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-27",
        "texto": "Celebro mis pequeños avances en lugar de minimizarlos.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-28",
        "texto": "Tengo recordatorios o sistemas que me sostienen.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-29",
        "texto": "Comienzo nuevos hábitos en pequeño y los voy escalando.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-30",
        "texto": "Mantengo un hábito incluso cuando estoy fuera de mi rutina habitual.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-31",
        "texto": "Identifico qué hábitos me alejan de mis metas y los reduzco.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-32",
        "texto": "Combino disciplina con disfrute para que los hábitos duren.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-33",
        "texto": "Mis hábitos reflejan la persona que quiero llegar a ser.",
        "subescala": "HP"
      },
      {
        "id": "modificacion-conducta-34",
        "texto": "Cuando una estrategia no funciona, pruebo otra.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-35",
        "texto": "Acepto que el plan original puede cambiar.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-36",
        "texto": "Aprendo nuevas formas de hacer cosas que ya dominaba.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-37",
        "texto": "Pido ayuda cuando descubro que mi método no es eficaz.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-38",
        "texto": "No me aferro a una rutina si deja de servirme.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-39",
        "texto": "Reconozco cuando hay que abandonar un proyecto.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-40",
        "texto": "Adapto mis hábitos al cambio de etapa o de contexto.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-41",
        "texto": "Acepto críticas constructivas sin perder la motivación.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-42",
        "texto": "Cambio de opinión cuando aparece evidencia clara.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-43",
        "texto": "Pruebo enfoques distintos para problemas viejos.",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-44",
        "texto": "Manejo bien las transiciones (mudanza, cambio de horario, nueva escuela).",
        "subescala": "FL"
      },
      {
        "id": "modificacion-conducta-45",
        "texto": "Vuelvo a empezar un hábito tras una recaída sin culpa paralizante.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-46",
        "texto": "Sé que los cambios reales toman meses y no me desespero.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-47",
        "texto": "Mantengo objetivos a pesar de obstáculos repetidos.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-48",
        "texto": "Distingo entre un mal día y un fracaso del cambio.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-49",
        "texto": "Continúo aunque nadie me apoye externamente.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-50",
        "texto": "Tengo un sistema de seguimiento de mis avances.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-51",
        "texto": "Acepto los retrocesos como parte natural del proceso.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-52",
        "texto": "Persisto en metas relevantes aunque no haya gratificación inmediata.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-53",
        "texto": "Combino paciencia con acción.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-54",
        "texto": "Encuentro motivación interna cuando la externa se agota.",
        "subescala": "PE"
      },
      {
        "id": "modificacion-conducta-55",
        "texto": "He sostenido cambios importantes durante más de seis meses.",
        "subescala": "PE"
      }
    ],
    "calculo_resultado": "Promedio normalizado por subescala (0-100).",
    "umbrales": {
      "bajo_max": 110,
      "medio_max": 192.5
    },
    "interpretacion": {
      "bajo": "Área a fortalecer. Considera trabajar estos aspectos con apoyo psicopedagógico.",
      "medio": "Nivel funcional con espacio para crecer en algunas dimensiones.",
      "alto": "Fortaleza notable en este constructo; capitalízalo en tu plan de vida y carrera."
    },
    "estado": "completo"
  }
];
