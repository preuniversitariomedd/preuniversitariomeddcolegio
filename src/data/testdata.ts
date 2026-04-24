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
// OPCIONES adicionales
// ============================================================

const LIKERT_5_DESCRIPCION: LikertOpcion[] = [
  { valor: 1, etiqueta: "No me describe en absoluto" },
  { valor: 2, etiqueta: "Me describe poco" },
  { valor: 3, etiqueta: "Me describe algo" },
  { valor: 4, etiqueta: "Me describe bastante" },
  { valor: 5, etiqueta: "Me describe totalmente" },
];

const LIKERT_5_FRECUENCIA: LikertOpcion[] = [
  { valor: 1, etiqueta: "Nunca" },
  { valor: 2, etiqueta: "Casi nunca" },
  { valor: 3, etiqueta: "A veces" },
  { valor: 4, etiqueta: "Casi siempre" },
  { valor: 5, etiqueta: "Siempre" },
];

const ROTTER_OPCIONES: LikertOpcion[] = [
  { valor: 0, etiqueta: "A — Afirmación A" },
  { valor: 1, etiqueta: "B — Afirmación B" },
];

// ============================================================
// TEST 3 — Locus de Control (Rotter) — 13 ítems forzados
// 0 = elección INTERNA, 1 = elección EXTERNA. Total = nivel de externalidad.
// ============================================================

const ROTTER: TestPsicometrico = {
  id: "rotter",
  nombre: "Locus de Control (Rotter)",
  descripcion:
    "Mide si atribuyes tus resultados a tu esfuerzo (interno) o al azar/otros (externo). Elección forzada entre pares.",
  categoria: "psicometria",
  tiempo_estimado: 10,
  instrucciones:
    "Para cada par, elige la afirmación con la que MÁS te identificas, aunque ninguna te describa por completo. La opción A representa locus interno, la B externo.",
  opciones: ROTTER_OPCIONES,
  preguntas: [
    { id: "rt1", texto: "A) Mis notas dependen sobre todo de mi esfuerzo. / B) Mis notas dependen mucho de la suerte y del profesor que me toque." },
    { id: "rt2", texto: "A) Si me preparo bien, puedo aprobar cualquier examen. / B) Por más que estudie, hay exámenes imposibles de aprobar." },
    { id: "rt3", texto: "A) Las personas exitosas lo son porque trabajan duro. / B) El éxito depende sobre todo de estar en el lugar y momento correctos." },
    { id: "rt4", texto: "A) Yo decido cómo organizar mi tiempo de estudio. / B) Mi tiempo de estudio depende de lo que pasa a mi alrededor." },
    { id: "rt5", texto: "A) Cuando me va mal en una prueba, suele ser porque no estudié lo suficiente. / B) Cuando me va mal, casi siempre es porque las preguntas fueron injustas." },
    { id: "rt6", texto: "A) Puedo influir en lo que los demás piensan de mí con mi conducta. / B) La opinión de los demás casi nunca depende de lo que uno hace." },
    { id: "rt7", texto: "A) Mi futuro académico depende de las decisiones que tomo hoy. / B) Mi futuro académico depende de circunstancias que no controlo." },
    { id: "rt8", texto: "A) Cuando tengo un problema, busco resolverlo yo mismo/a. / B) Cuando tengo un problema, espero a ver cómo se resuelve solo." },
    { id: "rt9", texto: "A) Sacar buenas calificaciones es cuestión de método. / B) Sacar buenas calificaciones es cuestión de suerte." },
    { id: "rt10", texto: "A) Si me esfuerzo, puedo cambiar mi situación actual. / B) Mi situación actual es difícil de cambiar haga lo que haga." },
    { id: "rt11", texto: "A) Lo que me ocurre es consecuencia de mis decisiones. / B) Lo que me ocurre depende del destino." },
    { id: "rt12", texto: "A) Puedo aprender cualquier materia si me lo propongo. / B) Hay materias para las que simplemente no estoy hecho/a." },
    { id: "rt13", texto: "A) Mis logros son fruto de mi trabajo. / B) Mis logros han sido sobre todo cuestión de oportunidades." },
  ],
  calculo_resultado:
    "Suma las elecciones tipo B (externas). Total 0–13. A mayor puntaje, locus de control más externo.",
  umbrales: { bajo_max: 4, medio_max: 8 },
  interpretacion: {
    bajo: "Locus interno (0–4). Atribuyes tus resultados a tu esfuerzo y decisiones. Buen predictor de rendimiento académico.",
    medio: "Locus mixto (5–8). Combinas atribuciones internas y externas. Equilibrio funcional.",
    alto: "Locus externo (9–13). Tiendes a atribuir resultados al azar o a otros. Trabaja en sentido de agencia y autoeficacia.",
  },
  estado: "completo",
};

// ============================================================
// TEST 4 — Procrastinación Académica (EPA) — 16 ítems
// Likert 1–5 frecuencia. Subescalas: Autorregulación (AR, invertida) y
// Postergación (PA).
// ============================================================

const EPA: TestPsicometrico = {
  id: "epa",
  nombre: "Procrastinación Académica (EPA)",
  descripcion: "Postergación de tareas y autorregulación en el estudio.",
  categoria: "psicometria",
  tiempo_estimado: 8,
  instrucciones: "Indica con qué frecuencia te ocurre cada situación en tu vida académica.",
  opciones: LIKERT_5_FRECUENCIA,
  subescalas: [
    { id: "autorregulacion", nombre: "Autorregulación académica" },
    { id: "postergacion", nombre: "Postergación de actividades" },
  ],
  preguntas: [
    { id: "ep1", texto: "Cuando termino las clases reviso mis apuntes el mismo día.", subescala: "autorregulacion", invertida: true },
    { id: "ep2", texto: "Postergo los trabajos de los cursos que no me agradan.", subescala: "postergacion" },
    { id: "ep3", texto: "Constantemente intento mejorar mis hábitos de estudio.", subescala: "autorregulacion", invertida: true },
    { id: "ep4", texto: "Invierto el tiempo necesario en estudiar aunque las clases sean aburridas.", subescala: "autorregulacion", invertida: true },
    { id: "ep5", texto: "Cuando ya no entiendo algo, lo dejo para más tarde y al final no lo retomo.", subescala: "postergacion" },
    { id: "ep6", texto: "Postergo los trabajos de los cursos que se me dificultan.", subescala: "postergacion" },
    { id: "ep7", texto: "Postergo la lectura de los cursos que no me agradan.", subescala: "postergacion" },
    { id: "ep8", texto: "Trato de motivarme para mantener mi ritmo de estudio.", subescala: "autorregulacion", invertida: true },
    { id: "ep9", texto: "Trato de terminar mis trabajos importantes con tiempo de sobra.", subescala: "autorregulacion", invertida: true },
    { id: "ep10", texto: "Me retraso al hacer mis tareas porque dedico tiempo a otras cosas.", subescala: "postergacion" },
    { id: "ep11", texto: "Empiezo a estudiar para los exámenes con varios días de anticipación.", subescala: "autorregulacion", invertida: true },
    { id: "ep12", texto: "Suelo dejar para el último momento las tareas largas.", subescala: "postergacion" },
    { id: "ep13", texto: "Pospongo las decisiones académicas importantes.", subescala: "postergacion" },
    { id: "ep14", texto: "Cuando estoy estudiando me distraigo con redes sociales o el celular.", subescala: "postergacion" },
    { id: "ep15", texto: "Cumplo con los plazos que me fijo a mí mismo/a.", subescala: "autorregulacion", invertida: true },
    { id: "ep16", texto: "Aunque planifique, termino haciendo todo a último momento.", subescala: "postergacion" },
  ],
  calculo_resultado:
    "Cada ítem 1–5. Los ítems de Autorregulación se invierten (mayor procrastinación = menor autorregulación). Total 16–80.",
  umbrales: { bajo_max: 32, medio_max: 56 },
  interpretacion: {
    bajo: "Procrastinación baja (16–32). Buena autorregulación; mantén tu sistema de planificación.",
    medio: "Procrastinación moderada (33–56). Frecuente en estudiantes; aplica técnicas como Pomodoro y bloques de tiempo.",
    alto: "Procrastinación alta (57–80). Riesgo para tu rendimiento. Usa metas pequeñas, refuerzo inmediato y elimina distractores.",
  },
  estado: "completo",
};

// ============================================================
// TEST 5 — Resiliencia (CD-RISC-10) — 10 ítems
// ============================================================

const CD_RISC: TestPsicometrico = {
  id: "cd-risc-10",
  nombre: "Resiliencia (CD-RISC-10)",
  descripcion: "Capacidad de recuperación ante el fracaso y la adversidad académica.",
  categoria: "psicometria",
  tiempo_estimado: 5,
  instrucciones: "Indica en qué medida cada afirmación describe cómo te has sentido en el último mes.",
  opciones: [
    { valor: 0, etiqueta: "Nada cierto" },
    { valor: 1, etiqueta: "Rara vez cierto" },
    { valor: 2, etiqueta: "A veces cierto" },
    { valor: 3, etiqueta: "A menudo cierto" },
    { valor: 4, etiqueta: "Casi siempre cierto" },
  ],
  preguntas: [
    { id: "cd1", texto: "Soy capaz de adaptarme a los cambios cuando ocurren." },
    { id: "cd2", texto: "Puedo lidiar con casi cualquier situación." },
    { id: "cd3", texto: "Trato de ver el lado positivo cuando enfrento problemas." },
    { id: "cd4", texto: "Hacer frente al estrés me fortalece." },
    { id: "cd5", texto: "Tiendo a recuperarme rápido tras enfermedades, lesiones u otras dificultades." },
    { id: "cd6", texto: "Creo que puedo lograr mis metas aunque haya obstáculos." },
    { id: "cd7", texto: "Bajo presión, mantengo la concentración y pienso con claridad." },
    { id: "cd8", texto: "No me desanimo fácilmente ante el fracaso." },
    { id: "cd9", texto: "Me considero una persona fuerte cuando enfrento retos y dificultades de la vida." },
    { id: "cd10", texto: "Soy capaz de manejar sentimientos desagradables como tristeza, miedo o enojo." },
  ],
  calculo_resultado: "Cada ítem 0–4. Total 0–40.",
  umbrales: { bajo_max: 20, medio_max: 30 },
  interpretacion: {
    bajo: "Resiliencia baja (0–20). Trabaja redes de apoyo, autocuidado y reinterpretación de fracasos como aprendizaje.",
    medio: "Resiliencia media (21–30). Buen punto de partida; consolida hábitos de afrontamiento activo.",
    alto: "Resiliencia alta (31–40). Recuperación ágil ante adversidad. Mantén tus rutinas de bienestar.",
  },
  estado: "completo",
};

// ============================================================
// TEST 6 — Habilidades Sociales (EHS) — versión 18 ítems adaptada
// Likert 1–4. Mayor puntaje = mejores HHSS.
// ============================================================

const EHS: TestPsicometrico = {
  id: "ehs",
  nombre: "Habilidades Sociales (EHS)",
  descripcion: "Asertividad, comunicación y manejo social en contexto académico.",
  categoria: "psicometria",
  tiempo_estimado: 8,
  instrucciones:
    "Lee cada situación e indica qué tan de acuerdo estás con cada afirmación según tu manera habitual de actuar.",
  opciones: LIKERT_4_ACUERDO,
  preguntas: [
    { id: "eh1", texto: "Cuando alguien dice algo con lo que no estoy de acuerdo, expreso mi opinión." },
    { id: "eh2", texto: "Me cuesta decir 'no' aunque algo no me convenga.", invertida: true },
    { id: "eh3", texto: "Soy capaz de iniciar una conversación con personas que no conozco." },
    { id: "eh4", texto: "Si un compañero me interrumpe en clase, le pido respetuosamente que me deje terminar." },
    { id: "eh5", texto: "Evito quejarme aunque me hayan tratado injustamente.", invertida: true },
    { id: "eh6", texto: "Puedo expresar mis sentimientos sin sentirme incómodo/a." },
    { id: "eh7", texto: "Sé pedir ayuda al profesor cuando no entiendo un tema." },
    { id: "eh8", texto: "Me da vergüenza hacer preguntas en clase aunque tenga dudas.", invertida: true },
    { id: "eh9", texto: "Acepto críticas constructivas sin sentirme atacado/a." },
    { id: "eh10", texto: "Sé reconocer cuando me equivoco y pedir disculpas." },
    { id: "eh11", texto: "Defiendo a un compañero cuando alguien lo trata mal." },
    { id: "eh12", texto: "Cuando me elogian, sé recibir el cumplido sin minimizarlo." },
    { id: "eh13", texto: "Cuando estoy en desacuerdo en un grupo, prefiero callarme.", invertida: true },
    { id: "eh14", texto: "Puedo expresar enojo de forma respetuosa, sin gritar ni agredir." },
    { id: "eh15", texto: "Me resulta fácil pedir prestado un libro o material a un compañero." },
    { id: "eh16", texto: "Sé escuchar sin interrumpir cuando alguien me cuenta algo importante." },
    { id: "eh17", texto: "Si un docente comete un error al calificar, lo señalo respetuosamente." },
    { id: "eh18", texto: "Me cuesta hacer amigos nuevos en cursos o talleres.", invertida: true },
  ],
  calculo_resultado:
    "Cada ítem 1–4. Los ítems negativos se invierten. Mayor puntaje = mejores habilidades sociales. Rango 18–72.",
  umbrales: { bajo_max: 36, medio_max: 54 },
  interpretacion: {
    bajo: "HHSS bajas (18–36). Practica asertividad, role-playing y comunicación clara en grupo.",
    medio: "HHSS medias (37–54). Buen nivel general; refuerza puntos específicos (decir no, recibir críticas).",
    alto: "HHSS altas (55–72). Buen manejo social; aprovéchalo en trabajo en equipo y liderazgo.",
  },
  estado: "completo",
};

// ============================================================
// TEST 7 — Empatía (IRI Davis) — 28 ítems, 4 subescalas (7 c/u)
// Likert 0–4 ("No me describe" → "Me describe muy bien")
// ============================================================

const IRI_OPCIONES: LikertOpcion[] = [
  { valor: 0, etiqueta: "No me describe" },
  { valor: 1, etiqueta: "Me describe poco" },
  { valor: 2, etiqueta: "Me describe regularmente" },
  { valor: 3, etiqueta: "Me describe bastante" },
  { valor: 4, etiqueta: "Me describe muy bien" },
];

const IRI: TestPsicometrico = {
  id: "iri",
  nombre: "Empatía (IRI)",
  descripcion: "Cuatro dimensiones: toma de perspectiva, fantasía, preocupación empática y malestar personal.",
  categoria: "psicometria",
  tiempo_estimado: 12,
  instrucciones: "Indica qué tan bien te describe cada afirmación. Sé honesto/a; no hay respuestas correctas.",
  opciones: IRI_OPCIONES,
  subescalas: [
    { id: "perspectiva", nombre: "Toma de perspectiva" },
    { id: "fantasia", nombre: "Fantasía" },
    { id: "preocupacion", nombre: "Preocupación empática" },
    { id: "malestar", nombre: "Malestar personal" },
  ],
  preguntas: [
    // Toma de perspectiva (PT)
    { id: "ir1", texto: "Antes de criticar a alguien, intento imaginar cómo me sentiría yo en su lugar.", subescala: "perspectiva" },
    { id: "ir2", texto: "Cuando estoy seguro/a de algo, no pierdo tiempo escuchando los argumentos de otros.", subescala: "perspectiva", invertida: true },
    { id: "ir3", texto: "Trato de mirar todos los lados de una discusión antes de tomar postura.", subescala: "perspectiva" },
    { id: "ir4", texto: "Creo que toda historia tiene dos versiones y trato de ver ambas.", subescala: "perspectiva" },
    { id: "ir5", texto: "Cuando estoy molesto/a con alguien, intento ponerme en su lugar por un momento.", subescala: "perspectiva" },
    { id: "ir6", texto: "Antes de tomar una decisión que afecta a otros, considero distintas opiniones.", subescala: "perspectiva" },
    { id: "ir7", texto: "Me cuesta ver las cosas desde el punto de vista de otra persona.", subescala: "perspectiva", invertida: true },
    // Fantasía (FS)
    { id: "ir8", texto: "Sueño despierto/a con frecuencia sobre cosas que podrían pasarme.", subescala: "fantasia" },
    { id: "ir9", texto: "Me involucro mucho con los sentimientos de los personajes de una novela.", subescala: "fantasia" },
    { id: "ir10", texto: "Soy objetivo/a viendo películas y rara vez me dejo llevar.", subescala: "fantasia", invertida: true },
    { id: "ir11", texto: "Después de ver una película, me siento como si fuera uno de los personajes.", subescala: "fantasia" },
    { id: "ir12", texto: "Rara vez me involucro emocionalmente con un buen libro.", subescala: "fantasia", invertida: true },
    { id: "ir13", texto: "Cuando leo una historia, imagino vívidamente lo que sentiría si me ocurriera a mí.", subescala: "fantasia" },
    { id: "ir14", texto: "Cuando veo una buena película, me pongo fácilmente en el lugar del protagonista.", subescala: "fantasia" },
    // Preocupación empática (EC)
    { id: "ir15", texto: "Suelo tener sentimientos de compasión por personas con menos suerte que yo.", subescala: "preocupacion" },
    { id: "ir16", texto: "Cuando veo que se aprovechan de alguien, siento ganas de protegerlo.", subescala: "preocupacion" },
    { id: "ir17", texto: "A veces no me da pena la gente cuando tiene problemas.", subescala: "preocupacion", invertida: true },
    { id: "ir18", texto: "Las desgracias de los demás no suelen perturbarme mucho.", subescala: "preocupacion", invertida: true },
    { id: "ir19", texto: "Me describiría como una persona de corazón blando.", subescala: "preocupacion" },
    { id: "ir20", texto: "Me conmueven las cosas que veo que les pasan a otras personas.", subescala: "preocupacion" },
    { id: "ir21", texto: "Cuando veo a alguien siendo tratado injustamente, siento poca lástima por él/ella.", subescala: "preocupacion", invertida: true },
    // Malestar personal (PD)
    { id: "ir22", texto: "En situaciones de emergencia me siento aprensivo/a e incómodo/a.", subescala: "malestar" },
    { id: "ir23", texto: "Suelo mantener la calma en situaciones tensas con otras personas.", subescala: "malestar", invertida: true },
    { id: "ir24", texto: "Cuando veo a alguien necesitando ayuda urgentemente, me bloqueo.", subescala: "malestar" },
    { id: "ir25", texto: "A veces me siento desamparado/a en situaciones emocionales muy fuertes.", subescala: "malestar" },
    { id: "ir26", texto: "Cuando alguien cercano necesita mucho mi apoyo, me cuesta manejar mis propias emociones.", subescala: "malestar" },
    { id: "ir27", texto: "Generalmente soy efectivo/a tratando con emergencias.", subescala: "malestar", invertida: true },
    { id: "ir28", texto: "Tiendo a perder el control en emergencias.", subescala: "malestar" },
  ],
  calculo_resultado:
    "Cada ítem 0–4. Ítems negativos invertidos. Total 0–112 + puntaje por subescala (0–28 cada una).",
  umbrales: { bajo_max: 50, medio_max: 80 },
  interpretacion: {
    bajo: "Empatía baja (0–50). Practica escucha activa y toma de perspectiva en discusiones cotidianas.",
    medio: "Empatía media (51–80). Capacidad empática funcional. Revisa la subescala más baja para mejorar.",
    alto: "Empatía alta (81–112). Alta sintonía emocional con otros. Cuida también tu autorregulación para no agotarte.",
  },
  estado: "completo",
};

// ============================================================
// TEST 8 — Conducta Prosocial (Caprara, adaptado) — 16 ítems
// Likert 1–5 frecuencia. Mayor puntaje = mayor prosocialidad.
// ============================================================

const PROSOCIAL: TestPsicometrico = {
  id: "prosocial",
  nombre: "Conducta Prosocial",
  descripcion: "Altruismo, cooperación y comportamiento ético en el aula.",
  categoria: "psicometria",
  tiempo_estimado: 8,
  instrucciones: "Indica con qué frecuencia realizas cada conducta descrita en tu vida cotidiana.",
  opciones: LIKERT_5_FRECUENCIA,
  preguntas: [
    { id: "pr1", texto: "Comparto lo que tengo con quienes lo necesitan." },
    { id: "pr2", texto: "Trato de ayudar a otros." },
    { id: "pr3", texto: "Me ofrezco voluntariamente para ayudar a quien lo necesita." },
    { id: "pr4", texto: "Soy de los/las que primeros/as en ayudar a alguien en dificultades." },
    { id: "pr5", texto: "Hago feliz a la gente con la que estoy." },
    { id: "pr6", texto: "Comparto las cosas que tengo con mis amigos." },
    { id: "pr7", texto: "Intento consolar a quien está triste." },
    { id: "pr8", texto: "Me esfuerzo por ayudar a otros aunque no me lo pidan." },
    { id: "pr9", texto: "Cuando un compañero no entiende algo, le explico con paciencia." },
    { id: "pr10", texto: "Cuando alguien tiene un problema, intento ayudarle a resolverlo." },
    { id: "pr11", texto: "Soy empático/a con los problemas de los demás." },
    { id: "pr12", texto: "Defiendo a quien está siendo tratado injustamente." },
    { id: "pr13", texto: "Reconozco públicamente los logros de otras personas." },
    { id: "pr14", texto: "Me preocupo por el bienestar de las personas a mi alrededor." },
    { id: "pr15", texto: "Coopero en trabajos grupales aunque no me beneficie directamente." },
    { id: "pr16", texto: "Devuelvo lo prestado en buen estado y a tiempo." },
  ],
  calculo_resultado: "Cada ítem 1–5. Total 16–80.",
  umbrales: { bajo_max: 40, medio_max: 60 },
  interpretacion: {
    bajo: "Prosocialidad baja (16–40). Practica gestos pequeños y cotidianos de ayuda y cooperación.",
    medio: "Prosocialidad media (41–60). Buen nivel; identifica oportunidades concretas para aportar al grupo.",
    alto: "Prosocialidad alta (61–80). Comportamiento altruista marcado. Cuida también tus propios límites.",
  },
  estado: "completo",
};

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
  {
    id: "schulte",
    nombre: "Tabla de Schulte",
    descripcion:
      "Encuentra los números en orden ascendente. Entrena tu visión periférica y velocidad de procesamiento visual.",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 3,
    instrucciones:
      "Toca los números del 1 al N en orden. Mira al centro de la tabla y usa tu visión periférica. 4 niveles: 3×3, 4×4, 5×5 y 7×7.",
    componente_react: "SchulteTest",
    metricas: ["nivel", "tiempo_segundos", "errores", "calificacion"],
  },
  {
    id: "punto_focal",
    nombre: "Punto Focal",
    descripcion: "Fija la mirada y mejora el enfoque sostenido siguiendo un punto en movimiento.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 3,
    instrucciones:
      "Sigue con la vista el punto durante 3 minutos sin perder el foco. No muevas la cabeza, solo los ojos.",
    componente_react: "PuntoFocalExercise",
    metricas: ["duracion_segundos", "completado"],
  },
  {
    id: "busqueda_rapida",
    nombre: "Búsqueda Rápida",
    descripcion: "Detecta el símbolo diferente en una grilla 5×5 lo más rápido posible.",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 3,
    instrucciones:
      "En cada ronda hay un carácter distinto en la grilla. Tócalo. Son 10 rondas cronometradas.",
    componente_react: "BusquedaRapidaExercise",
    metricas: ["aciertos", "tiempo_promedio_ms", "duracion_segundos"],
  },
  {
    id: "memoria_visual",
    nombre: "Memoria Visual",
    descripcion: "Reproduce secuencias de colores que aparecen brevemente. Sube de 3 a 7 elementos.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 4,
    instrucciones:
      "Memoriza la secuencia mostrada y reprodúcela tocando los colores en el mismo orden. Empieza en 3 y avanza hasta 7.",
    componente_react: "MemoriaVisualExercise",
    metricas: ["nivel_max", "errores", "duracion_segundos"],
  },
  {
    id: "pomodoro",
    nombre: "Pomodoro Guiado",
    descripcion: "Bloque de 25 minutos de estudio + 5 de descanso visual con respiración.",
    categoria: "concentracion",
    prioridad: "alta",
    tiempo_estimado: 30,
    instrucciones:
      "Estudia enfocado 25 minutos. En el descanso de 5 sigue la guía de respiración visual. Cada bloque completo cuenta como una sesión.",
    componente_react: "PomodoroExercise",
    metricas: ["duracion_segundos", "ciclos_completados"],
  },
  {
    id: "regla_20_20_20",
    nombre: "Regla 20-20-20",
    descripcion: "Cada 20 minutos, mira 20 segundos a un objeto a 20 pies (≈6 m) de distancia.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 1,
    instrucciones:
      "Activa el recordatorio. Cuando suene, aparta la vista de la pantalla y mira un objeto lejano durante 20 segundos.",
    componente_react: "Regla202020Exercise",
    metricas: ["pausas_completadas", "duracion_segundos"],
  },
  {
    id: "lectura_rapida",
    nombre: "Lectura Rápida",
    descripcion: "Lee párrafos de ciencias palabra por palabra a velocidad ajustable y comprueba comprensión.",
    categoria: "concentracion",
    prioridad: "media",
    tiempo_estimado: 4,
    instrucciones:
      "Ajusta la velocidad (100-400 ppm). Lee el párrafo y responde la pregunta de comprensión al final.",
    componente_react: "LecturaRapidaExercise",
    metricas: ["ppm", "aciertos_comprension", "duracion_segundos"],
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
