// ============================================================
// TESTDATA — Fuente única de verdad para tests psicométricos
// y ejercicios de concentración. PreUniversitario MEDD.
// ============================================================
//
// FASE 1 (este archivo):
//  - Estructura completa de datos
//  - 2 tests psicométricos completos: Rosenberg, TAI (versión reducida)
//  - 6 tests pendientes de Fase 2: Rotter, EPA, CD-RISC, EHS, IRI, Prosocial
//  - 5 ejercicios de concentración (definiciones; componentes en Fase 3)
//
// IMPORTANTE: Todos los ítems están parafraseados/adaptados al español
// preuniversitario; no se reproducen instrumentos originales con copyright.
// ============================================================

export type LikertOpcion = { valor: number; etiqueta: string };

export interface PreguntaTest {
  id: string;
  texto: string;
  /** Si la pregunta puntúa invertida (ej. ítems negativos de Rosenberg) */
  invertida?: boolean;
  /** Subescala a la que pertenece (opcional) */
  subescala?: string;
  /** Opciones específicas; si se omite, hereda las opciones globales del test */
  opciones?: LikertOpcion[];
}

export interface Interpretacion {
  bajo: string;
  medio: string;
  alto: string;
}

export interface TestPsicometrico {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: "psicometria";
  tiempo_estimado: number; // minutos
  instrucciones: string;
  /** Opciones por defecto (Likert) reusadas por todos los ítems */
  opciones: LikertOpcion[];
  preguntas: PreguntaTest[];
  /** Subescalas (si aplica) */
  subescalas?: { id: string; nombre: string }[];
  calculo_resultado: string;
  /** Umbrales numéricos sobre puntaje_total para clasificación */
  umbrales: { bajo_max: number; medio_max: number };
  interpretacion: Interpretacion;
  /** Estado: completo o pendiente de redacción de ítems */
  estado: "completo" | "pendiente";
}

export interface EjercicioConcentracion {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: "concentracion";
  prioridad: "alta" | "media";
  tiempo_estimado: number;
  instrucciones: string;
  /** Nombre del componente React asociado (Fase 3) */
  componente_react: string;
  /** Claves que se guardan en la columna `metricas` (jsonb) de Supabase */
  metricas: string[];
}

// ============================================================
// OPCIONES LIKERT REUTILIZABLES
// ============================================================

const LIKERT_4_ACUERDO: LikertOpcion[] = [
  { valor: 4, etiqueta: "Muy de acuerdo" },
  { valor: 3, etiqueta: "De acuerdo" },
  { valor: 2, etiqueta: "En desacuerdo" },
  { valor: 1, etiqueta: "Muy en desacuerdo" },
];

const LIKERT_4_FRECUENCIA: LikertOpcion[] = [
  { valor: 1, etiqueta: "Casi nunca" },
  { valor: 2, etiqueta: "Algunas veces" },
  { valor: 3, etiqueta: "Frecuentemente" },
  { valor: 4, etiqueta: "Casi siempre" },
];

// ============================================================
// TEST 1 — Autoestima de Rosenberg (RSES) — 10 ítems
// ============================================================

const ROSENBERG: TestPsicometrico = {
  id: "rosenberg",
  nombre: "Autoestima de Rosenberg",
  descripcion:
    "Índice de autoestima global. Especialmente relevante para adolescentes preuniversitarios.",
  categoria: "psicometria",
  tiempo_estimado: 5,
  instrucciones:
    "Lee cada afirmación y elige la opción que mejor describa cómo te sientes en este momento de tu vida. No hay respuestas correctas o incorrectas: responde con sinceridad.",
  opciones: LIKERT_4_ACUERDO,
  preguntas: [
    { id: "r1", texto: "Siento que soy una persona valiosa, al menos igual que cualquier otra." },
    { id: "r2", texto: "Creo que tengo varias cualidades positivas." },
    { id: "r3", texto: "En general, me inclino a pensar que soy un fracaso.", invertida: true },
    { id: "r4", texto: "Soy capaz de hacer las cosas tan bien como la mayoría de las personas." },
    { id: "r5", texto: "Siento que no tengo muchos motivos para sentirme orgulloso/a de mí.", invertida: true },
    { id: "r6", texto: "Tengo una actitud positiva hacia mí mismo/a." },
    { id: "r7", texto: "En general, estoy satisfecho/a conmigo mismo/a." },
    { id: "r8", texto: "Me gustaría poder sentir más respeto por mí mismo/a.", invertida: true },
    { id: "r9", texto: "A veces me siento realmente inútil.", invertida: true },
    { id: "r10", texto: "A veces pienso que no sirvo para nada.", invertida: true },
  ],
  calculo_resultado:
    "Cada ítem puntúa de 1 a 4. Los ítems invertidos (3, 5, 8, 9, 10) se invierten antes de sumar. Rango total: 10–40.",
  umbrales: { bajo_max: 25, medio_max: 35 },
  interpretacion: {
    bajo:
      "Autoestima baja (≤25). Conviene trabajar en autovaloración, refuerzo de logros y, si persiste, acompañamiento psicológico.",
    medio: "Autoestima media (26–35). Nivel funcional; hay margen para fortalecer la autoconfianza.",
    alto: "Autoestima alta (36–40). Buena valoración personal; mantenla con metas realistas y autocuidado.",
  },
  estado: "completo",
};

// ============================================================
// TEST 2 — Ansiedad ante Exámenes (TAI versión reducida 20 ítems)
// Spielberger — Subescalas: Preocupación (W) y Emotividad (E)
// ============================================================

const TAI: TestPsicometrico = {
  id: "tai",
  nombre: "Ansiedad ante Exámenes (TAI)",
  descripcion:
    "Mide la ansiedad específica frente a exámenes y procesos de admisión universitaria (ESPOL/ingreso).",
  categoria: "psicometria",
  tiempo_estimado: 8,
  instrucciones:
    "Indica con qué frecuencia experimentas cada situación cuando te enfrentas a exámenes importantes. Responde según tu experiencia habitual, no según un examen puntual.",
  opciones: LIKERT_4_FRECUENCIA,
  subescalas: [
    { id: "preocupacion", nombre: "Preocupación (cognitiva)" },
    { id: "emotividad", nombre: "Emotividad (fisiológica)" },
  ],
  preguntas: [
    { id: "t1", texto: "Me siento confiado/a y tranquilo/a mientras hago exámenes.", invertida: true, subescala: "emotividad" },
    { id: "t2", texto: "Mientras hago exámenes finales importantes me siento inquieto/a y alterado/a.", subescala: "emotividad" },
    { id: "t3", texto: "Pensar en mi calificación interfiere con mi rendimiento en los exámenes.", subescala: "preocupacion" },
    { id: "t4", texto: "Me quedo paralizado/a en exámenes importantes.", subescala: "emotividad" },
    { id: "t5", texto: "Durante los exámenes me pregunto si lograré terminar mis estudios.", subescala: "preocupacion" },
    { id: "t6", texto: "Cuanto más estudio para un examen, más confundido/a me siento.", subescala: "preocupacion" },
    { id: "t7", texto: "Pensar en cómo me irá interfiere mientras hago el examen.", subescala: "preocupacion" },
    { id: "t8", texto: "Me siento muy nervioso/a durante un examen importante.", subescala: "emotividad" },
    { id: "t9", texto: "Aunque esté preparado/a para un examen, me siento muy ansioso/a.", subescala: "emotividad" },
    { id: "t10", texto: "Comienzo a sentirme inquieto/a justo antes de recibir un examen.", subescala: "emotividad" },
    { id: "t11", texto: "Durante los exámenes me siento muy tenso/a.", subescala: "emotividad" },
    { id: "t12", texto: "Querría que los exámenes no me afectaran tanto.", subescala: "preocupacion" },
    { id: "t13", texto: "Durante exámenes importantes me siento tan tenso/a que me molesta el estómago.", subescala: "emotividad" },
    { id: "t14", texto: "Parece que termino los exámenes antes de lo que podría rendir.", subescala: "preocupacion" },
    { id: "t15", texto: "Me bloqueo en los exámenes.", subescala: "preocupacion" },
    { id: "t16", texto: "Después del examen pienso una y otra vez que pude haberlo hecho mejor.", subescala: "preocupacion" },
    { id: "t17", texto: "Durante los exámenes pienso en las consecuencias de fracasar.", subescala: "preocupacion" },
    { id: "t18", texto: "Siento que el corazón me late muy rápido en exámenes importantes.", subescala: "emotividad" },
    { id: "t19", texto: "Cuando termino el examen intento dejar de preocuparme, pero no puedo.", subescala: "preocupacion" },
    { id: "t20", texto: "Durante los exámenes estoy tan nervioso/a que olvido cosas que sé bien.", subescala: "emotividad" },
  ],
  calculo_resultado:
    "Cada ítem puntúa 1–4. El ítem invertido (1) se invierte. Puntaje total 20–80. También se calcula puntaje por subescala (Preocupación / Emotividad).",
  umbrales: { bajo_max: 39, medio_max: 59 },
  interpretacion: {
    bajo: "Ansiedad baja (20–39). Manejas bien los exámenes; mantén tus rutinas de estudio y descanso.",
    medio:
      "Ansiedad moderada (40–59). Normal en procesos de admisión; trabaja técnicas de respiración y simulacros cronometrados.",
    alto:
      "Ansiedad alta (60–80). Recomendado aplicar técnicas de regulación (respiración 5×5, exposición progresiva, reestructuración cognitiva) y considerar acompañamiento.",
  },
  estado: "completo",
};

// ============================================================
// TESTS 3–8 — Estructura pendiente (Fase 2 redactará ítems)
// Mantienen metadatos para listarlos en UI desde ya.
// ============================================================

function pendiente(
  id: string,
  nombre: string,
  descripcion: string,
  tiempo: number,
  instrucciones: string,
  rangoMax: number,
): TestPsicometrico {
  return {
    id,
    nombre,
    descripcion,
    categoria: "psicometria",
    tiempo_estimado: tiempo,
    instrucciones,
    opciones: LIKERT_4_ACUERDO,
    preguntas: [],
    calculo_resultado: "Pendiente Fase 2.",
    umbrales: { bajo_max: Math.round(rangoMax * 0.4), medio_max: Math.round(rangoMax * 0.7) },
    interpretacion: {
      bajo: "Pendiente — se completará en Fase 2.",
      medio: "Pendiente — se completará en Fase 2.",
      alto: "Pendiente — se completará en Fase 2.",
    },
    estado: "pendiente",
  };
}

const ROTTER = pendiente(
  "rotter",
  "Locus de Control (Rotter)",
  "Mide si el estudiante atribuye sus resultados a sí mismo (interno) o al azar/otros (externo). Formato de elección forzada entre pares.",
  10,
  "Para cada par de afirmaciones, elige la que mejor describa lo que tú crees, aunque no estés totalmente de acuerdo con ninguna.",
  13,
);

const EPA = pendiente(
  "epa",
  "Procrastinación Académica (EPA)",
  "Mide la postergación de tareas académicas y sus causas (autorregulación / postergación de actividades).",
  8,
  "Indica con qué frecuencia te ocurre cada situación en tu vida académica.",
  64,
);

const CD_RISC = pendiente(
  "cd-risc-10",
  "Resiliencia (CD-RISC-10)",
  "Capacidad de recuperación ante fracaso y adversidad académica.",
  10,
  "Indica en qué medida cada afirmación describe cómo te has sentido en el último mes.",
  40,
);

const EHS = pendiente(
  "ehs",
  "Habilidades Sociales (EHS)",
  "Comunicación, asertividad y escucha activa en contexto preuniversitario.",
  10,
  "Lee cada situación e indica qué tan identificado/a te sientes con la respuesta descrita.",
  132,
);

const IRI = pendiente(
  "iri",
  "Empatía (IRI)",
  "Cuatro subescalas: toma de perspectiva, fantasía, preocupación empática y malestar personal.",
  12,
  "Indica qué tan bien te describe cada afirmación.",
  140,
);
IRI.subescalas = [
  { id: "perspectiva", nombre: "Toma de perspectiva" },
  { id: "fantasia", nombre: "Fantasía" },
  { id: "preocupacion", nombre: "Preocupación empática" },
  { id: "malestar", nombre: "Malestar personal" },
];

const PROSOCIAL = pendiente(
  "prosocial",
  "Conducta Prosocial",
  "Altruismo, cooperación y comportamiento ético en el aula.",
  8,
  "Indica con qué frecuencia realizas cada conducta descrita.",
  80,
);

// ============================================================
// EXPORT TESTS
// ============================================================

export const TESTS: TestPsicometrico[] = [
  ROSENBERG,
  TAI,
  ROTTER,
  EPA,
  CD_RISC,
  EHS,
  IRI,
  PROSOCIAL,
];

export function getTestById(id: string): TestPsicometrico | undefined {
  return TESTS.find((t) => t.id === id);
}

// ============================================================
// EJERCICIOS DE CONCENTRACIÓN VISUAL
// ============================================================

export const EJERCICIOS_CONCENTRACION: EjercicioConcentracion[] = [
  {
    id: "stroop",
    nombre: "Stroop Color-Palabra",
    descripcion:
      "Se muestra una palabra (ROJO, AZUL, VERDE, AMARILLO) escrita en un color de tinta diferente. Indica el COLOR de la tinta, ignorando lo que dice la palabra.",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 3,
    instrucciones:
      "Verás una palabra coloreada. Pulsa el botón del COLOR de la tinta, NO de la palabra. Tienes 40 ensayos. Sé rápido y preciso.",
    componente_react: "StroopExercise",
    metricas: [
      "aciertos",
      "errores",
      "tiempo_promedio_ms",
      "ensayos_congruentes_aciertos",
      "ensayos_incongruentes_aciertos",
      "efecto_stroop_ms",
    ],
  },
  {
    id: "span_digitos",
    nombre: "Span de Dígitos",
    descripcion:
      "Se muestran números uno por uno. Repítelos en el mismo orden (directo) y luego en orden inverso (inverso).",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 5,
    instrucciones:
      "Memoriza la secuencia mostrada (1 dígito por segundo). Empezamos con 3 dígitos y la longitud aumenta. Termina cuando falles 2 veces seguidas en cada modo.",
    componente_react: "SpanDigitosExercise",
    metricas: ["span_max_directo", "span_max_inverso", "errores_totales", "duracion_segundos"],
  },
  {
    id: "n_back",
    nombre: "N-Back",
    descripcion:
      "Secuencia de letras. Indica si la letra actual es igual a la mostrada N pasos atrás. Niveles 1, 2 y 3-Back.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 5,
    instrucciones:
      "Pulsa COINCIDE si la letra actual es la misma que la presentada N posiciones atrás. Hay (20 + 2N) ensayos por nivel.",
    componente_react: "NBackExercise",
    metricas: ["nivel", "aciertos", "falsas_alarmas", "omisiones", "indice_d_prima"],
  },
  {
    id: "matrices_d2",
    nombre: "Matrices de Atención (estilo d2)",
    descripcion:
      "Filas de letras d, p, b, q con 1 o 2 puntos arriba/abajo. Marca solo las 'd' con exactamente 2 puntos (uno arriba y uno abajo).",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 8,
    instrucciones:
      "Tienes 14 filas de 47 caracteres y 20 segundos por fila. Marca cada 'd' con 2 puntos (1 arriba + 1 abajo). Ignora el resto.",
    componente_react: "D2Exercise",
    metricas: [
      "total_aciertos",
      "omisiones",
      "comisiones",
      "indice_concentracion",
      "filas_completadas",
    ],
  },
  {
    id: "respiracion_coherencia",
    nombre: "Respiración de Coherencia",
    descripcion:
      "Guía visual de respiración a 5 ciclos/min (5 s inhalar, 1 s pausa, 5 s exhalar). Reduce cortisol antes del examen.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 5,
    instrucciones:
      "Sigue el círculo: cuando se expande inhala, cuando se contrae exhala. Mantén la postura erguida y los hombros relajados durante 5 minutos.",
    componente_react: "RespiracionExercise",
    metricas: ["ciclos_completados", "duracion_segundos"],
  },
];

export function getEjercicioById(id: string): EjercicioConcentracion | undefined {
  return EJERCICIOS_CONCENTRACION.find((e) => e.id === id);
}

// ============================================================
// CÁLCULO E INTERPRETACIÓN GENÉRICOS
// ============================================================

export interface ResultadoCalculado {
  puntaje_total: number;
  puntaje_por_subescala: Record<string, number> | null;
  interpretacion: "bajo" | "medio" | "alto";
}

/**
 * Calcula puntaje total y por subescala a partir de respuestas {preguntaId: valor}.
 * Aplica inversión a ítems marcados como `invertida` usando el rango de opciones.
 */
export function calcularResultado(
  test: TestPsicometrico,
  respuestas: Record<string, number>,
): ResultadoCalculado {
  const valores = test.opciones.map((o) => o.valor);
  const max = Math.max(...valores);
  const min = Math.min(...valores);

  let total = 0;
  const subTotales: Record<string, number> = {};

  for (const p of test.preguntas) {
    const raw = respuestas[p.id];
    if (raw == null) continue;
    const valor = p.invertida ? max + min - raw : raw;
    total += valor;
    if (p.subescala) {
      subTotales[p.subescala] = (subTotales[p.subescala] || 0) + valor;
    }
  }

  let interp: "bajo" | "medio" | "alto" = "medio";
  if (total <= test.umbrales.bajo_max) interp = "bajo";
  else if (total > test.umbrales.medio_max) interp = "alto";

  return {
    puntaje_total: total,
    puntaje_por_subescala: Object.keys(subTotales).length ? subTotales : null,
    interpretacion: interp,
  };
}
