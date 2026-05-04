// ============================================================
// perfil360.ts — Análisis cognitivo integral del estudiante
// Combina los 24 tests del banco para producir un perfil DUA.
// ============================================================
import { TESTS, getTestById } from "@/data/testdata";

export interface ResultadoTest {
  test_id: string;
  puntaje_por_subescala: Record<string, number> | null;
  puntaje_total: number | null;
  fecha: string;
}

export interface SubescalaNormalizada {
  testId: string;
  testNombre: string;
  categoria: string;
  subescalaId: string;
  subescalaNombre: string;
  raw: number;
  /** 0–100 normalizado por número de ítems × max opción */
  porcentaje: number;
  color?: string;
}

export interface Perfil360 {
  testsCompletados: number;
  porcentajeCompletitud: number;
  subescalas: SubescalaNormalizada[];
  /** Perfil consolidado de personalidad (Big Five + DISC + MBTI + Eneagrama) */
  rasgos: { codigo: string; nombre: string; valor: number; fuente: string }[];
  /** Top inteligencias múltiples (Gardner) */
  inteligenciasTop: { codigo: string; nombre: string; valor: number }[];
  /** Estilo de aprendizaje DUA: representación / acción / motivación */
  dua: {
    representacion: { canal: "visual" | "auditivo" | "lectoescritor" | "kinestesico"; score: number; descripcion: string };
    accion: { tipo: string; score: number; descripcion: string };
    motivacion: { tipo: string; score: number; descripcion: string };
  };
  /** Edad mental estimada (heurística psicométrica) */
  edadMental: {
    valor: number;
    rango: string;
    interpretacion: string;
    factoresUsados: string[];
  } | null;
  /** Holland top-3 + carreras compatibles */
  vocacional: {
    codigo: string;
    top3: { codigo: string; nombre: string; valor: number }[];
    carreras: string[];
  } | null;
  /** Recomendaciones puntuales DUA generadas localmente */
  adaptaciones: { titulo: string; descripcion: string; prioridad: "alta" | "media" | "baja" }[];
  alertas: { tipo: "ansiedad" | "autoestima" | "procrastinacion" | "resiliencia"; nivel: string; mensaje: string }[];
  /** Dimensiones complementarias: edad mental, decisiones bajo presión, visión de vida, modificación de conducta */
  dimensionesComplementarias: {
    testId: string;
    testNombre: string;
    icono?: string;
    completado: boolean;
    nivelGlobal: "bajo" | "medio" | "alto" | null;
    promedio: number;
    subescalas: {
      id: string;
      nombre: string;
      porcentaje: number;
      nivel: "bajo" | "medio" | "alto";
      interpretacion: string;
    }[];
  }[];
}

const NIVEL_TEXTOS: Record<string, { bajo: string; medio: string; alto: string }> = {
  ME: { bajo: "Aún identificas y regulas emociones de forma irregular.", medio: "Reconoces y manejas emociones con esfuerzo consciente.", alto: "Madurez emocional consolidada: identificas, expresas y regulas con soltura." },
  MC: { bajo: "Predomina pensamiento concreto e inmediato.", medio: "Combinas razonamiento abstracto con apoyo de lo concreto.", alto: "Pensamiento abstracto, planificador y consecuencial bien desarrollado." },
  MS: { bajo: "Aún ajustas tu comportamiento social a contextos nuevos.", medio: "Lees contextos sociales con razonable claridad.", alto: "Madurez social adulta: lees contextos y sostienes relaciones de calidad." },
  AU: { bajo: "Dependes de figuras externas para decisiones cotidianas.", medio: "Gestionas tu vida con autonomía moderada.", alto: "Alta autonomía personal y autogestión." },
  RE: { bajo: "Cuesta sostener compromisos y consecuencias.", medio: "Cumples responsabilidades con recordatorios y apoyo.", alto: "Asumes y sostienes responsabilidades con consistencia." },
  RP: { bajo: "Tiendes a paralizarte o postergar la decisión.", medio: "Decides con cierta agilidad cuando es necesario.", alto: "Decides con rapidez funcional sin bloquearte." },
  TE: { bajo: "El estrés agudo afecta tu juicio.", medio: "Mantienes claridad bajo presión moderada.", alto: "Operas con claridad incluso bajo estrés alto." },
  AR: { bajo: "Decides más por impulso que por análisis.", medio: "Evalúas pros/contras cuando hay tiempo.", alto: "Análisis racional sólido y consistente." },
  IN: { bajo: "Desconfías de tu intuición o no la consultas.", medio: "Usas intuición ocasionalmente con criterio.", alto: "Intuición calibrada por la experiencia." },
  RC: { bajo: "Los errores te detienen por largos periodos.", medio: "Te recuperas con tiempo y apoyo.", alto: "Aprendes y vuelves a actuar rápidamente tras errar." },
  PR: { bajo: "Aún buscas un sentido claro para tu vida.", medio: "Tienes un propósito en construcción.", alto: "Propósito personal claro y motivador." },
  ML: { bajo: "Te cuesta proyectarte a largo plazo.", medio: "Defines metas a mediano plazo.", alto: "Visualizas y planificas metas de largo alcance." },
  VC: { bajo: "Tus valores aún no están firmes ante la presión.", medio: "Tienes valores que sostienes en muchos contextos.", alto: "Valores centrales firmes que guían tus elecciones." },
  OF: { bajo: "Predomina visión pesimista o evitativa.", medio: "Optimismo intermitente.", alto: "Optimismo realista y sostenido." },
  ST: { bajo: "Aún no conectas con un sentido mayor.", medio: "Reconoces parcialmente algo más grande que tú.", alto: "Sentido de trascendencia integrado a tu vida." },
  AC: { bajo: "Cuesta verte sin filtros defensivos.", medio: "Reconoces patrones propios con apoyo.", alto: "Autoconciencia conductual bien desarrollada." },
  CO: { bajo: "Los impulsos suelen ganarle a la meta.", medio: "Autocontrol funcional con esfuerzo.", alto: "Alto autocontrol y elección consciente." },
  HP: { bajo: "Cuesta instalar hábitos sostenibles.", medio: "Construyes hábitos con apoyo y recordatorios.", alto: "Construyes hábitos que se sostienen solos." },
  FL: { bajo: "Tiendes a repetir estrategias aunque no funcionen.", medio: "Cambias de estrategia cuando hay evidencia clara.", alto: "Alta flexibilidad conductual." },
  PE: { bajo: "Las recaídas suelen abandonar el cambio.", medio: "Persistes con altibajos.", alto: "Persistes en el cambio aun ante recaídas." },
};

const ID_DIMENSIONES_EXTRA = ["edad-mental", "decisiones-presion", "vision-vida", "modificacion-conducta"];

function nivelDePorcentaje(p: number): "bajo" | "medio" | "alto" {
  if (p < 40) return "bajo";
  if (p <= 70) return "medio";
  return "alto";
}

// ────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────

function normalizarSubescala(testId: string, subId: string, raw: number): number {
  const test: any = getTestById(testId);
  if (!test) return 0;
  const items = test.preguntas.filter((p: any) => p.subescala === subId);
  if (!items.length) return 0;
  const maxOp = Math.max(...test.opciones.map((o: any) => o.valor));
  const minOp = Math.min(...test.opciones.map((o: any) => o.valor));
  const max = items.length * maxOp;
  const min = items.length * minOp;
  if (max === min) return 0;
  return Math.round(((raw - min) / (max - min)) * 100);
}

function fechaCalcularEdad(fechaNac: string | null): number | null {
  if (!fechaNac) return null;
  const d = new Date(fechaNac);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// ────────────────────────────────────────────────────────────
// Construcción del perfil
// ────────────────────────────────────────────────────────────

export function construirPerfil360(
  resultados: ResultadoTest[],
  fechaNacimiento: string | null = null,
): Perfil360 {
  const totalTests = TESTS.filter((t) => t.estado === "completo").length;

  // Quedarse con el resultado más reciente por test
  const ultPorTest = new Map<string, ResultadoTest>();
  for (const r of resultados) {
    const prev = ultPorTest.get(r.test_id);
    if (!prev || new Date(r.fecha) > new Date(prev.fecha)) {
      ultPorTest.set(r.test_id, r);
    }
  }

  // Normalizar subescalas
  const subescalas: SubescalaNormalizada[] = [];
  for (const [testId, r] of ultPorTest) {
    const test: any = getTestById(testId);
    if (!test || !r.puntaje_por_subescala) continue;
    for (const [subId, raw] of Object.entries(r.puntaje_por_subescala)) {
      const meta = test.subescalas?.find((s: any) => s.id === subId);
      const scaleMeta = test.scales?.[subId];
      subescalas.push({
        testId,
        testNombre: test.nombre,
        categoria: test.categoria,
        subescalaId: subId,
        subescalaNombre: meta?.nombre || scaleMeta?.name || subId,
        raw: raw as number,
        porcentaje: normalizarSubescala(testId, subId, raw as number),
        color: scaleMeta?.color,
      });
    }
  }

  // ── Rasgos consolidados (Big Five + DISC + MBTI + Eneagrama) ──
  const rasgos: Perfil360["rasgos"] = [];
  const big5 = subescalas.filter((s) => s.testId === "big-five-ocean");
  big5.forEach((s) => rasgos.push({ codigo: s.subescalaId, nombre: s.subescalaNombre, valor: s.porcentaje, fuente: "Big Five" }));

  const disc = subescalas.filter((s) => s.testId === "disc-extendido");
  disc.forEach((s) => rasgos.push({ codigo: s.subescalaId, nombre: s.subescalaNombre, valor: s.porcentaje, fuente: "DISC" }));

  const enne = subescalas.filter((s) => s.testId === "eneagrama");
  if (enne.length) {
    const top = [...enne].sort((a, b) => b.porcentaje - a.porcentaje)[0];
    rasgos.push({ codigo: top.subescalaId, nombre: `Eneatipo dominante: ${top.subescalaNombre}`, valor: top.porcentaje, fuente: "Eneagrama" });
  }

  // ── Inteligencias Gardner top ──
  const gardner = subescalas
    .filter((s) => s.testId === "gardner-completo")
    .sort((a, b) => b.porcentaje - a.porcentaje);
  const inteligenciasTop = gardner.slice(0, 4).map((s) => ({
    codigo: s.subescalaId,
    nombre: s.subescalaNombre,
    valor: s.porcentaje,
  }));

  // ── Estilo DUA ──
  // Representación: VARK
  const vark = subescalas.filter((s) => s.testId === "estilos-vark");
  let representacion: Perfil360["dua"]["representacion"] = {
    canal: "visual",
    score: 0,
    descripcion: "Sin datos de VARK",
  };
  if (vark.length) {
    const map: Record<string, "visual" | "auditivo" | "lectoescritor" | "kinestesico"> = {
      V: "visual", A: "auditivo", R: "lectoescritor", K: "kinestesico",
    };
    const top = [...vark].sort((a, b) => b.porcentaje - a.porcentaje)[0];
    const canal = map[top.subescalaId] || "visual";
    const desc: Record<string, string> = {
      visual: "Aprende mejor con esquemas, mapas mentales, infografías y videos.",
      auditivo: "Aprende mejor escuchando: clases magistrales, podcasts, debates.",
      lectoescritor: "Aprende mejor leyendo textos, tomando apuntes y reescribiendo.",
      kinestesico: "Aprende mejor haciendo: experimentos, proyectos prácticos, movimiento.",
    };
    representacion = { canal, score: top.porcentaje, descripcion: desc[canal] };
  }

  // Acción: Metacognición + Pensamiento Analítico
  const meta = subescalas.filter((s) => s.testId === "metacognicion");
  const accionScore = meta.length ? Math.round(meta.reduce((a, s) => a + s.porcentaje, 0) / meta.length) : 0;
  const accion = {
    tipo: accionScore > 70 ? "Estratégico autorregulado" : accionScore > 40 ? "En desarrollo" : "Requiere andamiaje",
    score: accionScore,
    descripcion:
      accionScore > 70
        ? "Planifica, supervisa y evalúa su propio aprendizaje con autonomía."
        : accionScore > 40
          ? "Necesita guías de planificación y rúbricas de autoevaluación."
          : "Necesita scaffolding explícito: cronogramas, listas de chequeo y feedback frecuente.",
  };

  // Motivación: Big Five C/E + Logro (valores laborales)
  const valores = subescalas.filter((s) => s.testId === "valores-laborales");
  const logro = valores.find((s) => s.subescalaId === "LO")?.porcentaje ?? 0;
  const motiv = {
    tipo: logro > 70 ? "Intrínseca (logro)" : logro > 40 ? "Mixta" : "Extrínseca",
    score: logro,
    descripcion:
      logro > 70
        ? "Se motiva con metas desafiantes y reconocimiento del progreso personal."
        : logro > 40
          ? "Combina recompensas externas con metas personales. Útil reforzar autonomía."
          : "Necesita recompensas externas claras y metas a corto plazo visibles.",
  };

  const dua = { representacion, accion, motivacion: motiv };

  // ── Edad mental heurística ──
  // Promedio ponderado de: metacognición (30%), EI (25%), pensamiento analítico (20%),
  // autoestima (15%), apertura Big5 (10%). Mapeo: 0%→14 años, 100%→28 años.
  let edadMental: Perfil360["edadMental"] = null;
  const factores: { peso: number; score: number; nombre: string }[] = [];
  const metaProm = meta.length ? meta.reduce((a, s) => a + s.porcentaje, 0) / meta.length : null;
  const ei = subescalas.filter((s) => s.testId === "inteligencia-emocional");
  const eiProm = ei.length ? ei.reduce((a, s) => a + s.porcentaje, 0) / ei.length : null;
  const analitico = subescalas.filter((s) => s.testId === "pensamiento-analitico");
  const anaProm = analitico.length ? analitico.reduce((a, s) => a + s.porcentaje, 0) / analitico.length : null;
  const autoest = subescalas.find((s) => s.testId === "autoestima-autoconcepto");
  const apertura = big5.find((s) => s.subescalaId === "O");

  if (metaProm !== null) factores.push({ peso: 0.30, score: metaProm, nombre: "Metacognición" });
  if (eiProm !== null) factores.push({ peso: 0.25, score: eiProm, nombre: "Inteligencia emocional" });
  if (anaProm !== null) factores.push({ peso: 0.20, score: anaProm, nombre: "Pensamiento analítico" });
  if (autoest) factores.push({ peso: 0.15, score: autoest.porcentaje, nombre: "Autoestima" });
  if (apertura) factores.push({ peso: 0.10, score: apertura.porcentaje, nombre: "Apertura (Big Five)" });

  if (factores.length >= 2) {
    const pesoTotal = factores.reduce((a, f) => a + f.peso, 0);
    const scorePond = factores.reduce((a, f) => a + f.score * f.peso, 0) / pesoTotal;
    const valor = Math.round(14 + (scorePond / 100) * 14); // 14–28 años
    const cron = fechaCalcularEdad(fechaNacimiento);
    let interp = "";
    if (cron != null) {
      const delta = valor - cron;
      if (delta >= 3) interp = `Madurez cognitivo-emocional ${delta} años por encima de su edad cronológica (${cron}). Perfil de alto desempeño preuniversitario.`;
      else if (delta <= -3) interp = `Madurez cognitivo-emocional ${Math.abs(delta)} años por debajo de su edad cronológica (${cron}). Beneficiará de andamiaje socioemocional.`;
      else interp = `Madurez cognitivo-emocional acorde a su edad cronológica (${cron}).`;
    } else {
      interp = "Edad mental estimada a partir de funciones ejecutivas y socioemocionales.";
    }
    edadMental = {
      valor,
      rango: valor < 17 ? "Adolescencia media" : valor < 21 ? "Adolescencia tardía / joven adulto" : valor < 25 ? "Adulto joven" : "Adulto",
      interpretacion: interp,
      factoresUsados: factores.map((f) => f.nombre),
    };
  }

  // ── Vocacional Holland ──
  let vocacional: Perfil360["vocacional"] = null;
  const holland = subescalas.filter((s) => s.testId === "holland-riasec").sort((a, b) => b.porcentaje - a.porcentaje);
  if (holland.length >= 3) {
    const top3 = holland.slice(0, 3);
    const codigo = top3.map((s) => s.subescalaId).join("");
    const test: any = getTestById("holland-riasec");
    const carreras = new Set<string>();
    for (const t of top3) {
      const sc = test?.scales?.[t.subescalaId];
      sc?.careers?.forEach((c: string) => carreras.add(c));
    }
    vocacional = {
      codigo,
      top3: top3.map((s) => ({ codigo: s.subescalaId, nombre: s.subescalaNombre, valor: s.porcentaje })),
      carreras: Array.from(carreras).slice(0, 12),
    };
  }

  // ── Adaptaciones DUA puntuales ──
  const adaptaciones: Perfil360["adaptaciones"] = [];
  if (representacion.canal === "visual") adaptaciones.push({ titulo: "Material visual prioritario", descripcion: "Usar mapas conceptuales, diagramas, infografías y videos cortos en cada sesión.", prioridad: "alta" });
  if (representacion.canal === "auditivo") adaptaciones.push({ titulo: "Refuerzo auditivo", descripcion: "Grabar resúmenes en audio, podcasts de repaso y discusiones grupales.", prioridad: "alta" });
  if (representacion.canal === "lectoescritor") adaptaciones.push({ titulo: "Estrategias de escritura", descripcion: "Apuntes Cornell, resúmenes escritos, fichas de estudio y reescritura activa.", prioridad: "alta" });
  if (representacion.canal === "kinestesico") adaptaciones.push({ titulo: "Aprendizaje activo", descripcion: "Laboratorios virtuales, role-play, manipulables digitales, pausas activas cada 20 min.", prioridad: "alta" });

  if (accion.score < 40) adaptaciones.push({ titulo: "Andamiaje metacognitivo", descripcion: "Cronogramas semanales prediseñados, rúbricas paso-a-paso y revisiones diarias de 5 min.", prioridad: "alta" });
  if (motiv.score < 40) adaptaciones.push({ titulo: "Sistema de recompensas externas", descripcion: "Insignias, rachas y reconocimiento público de pequeños logros.", prioridad: "media" });
  if (motiv.score > 70) adaptaciones.push({ titulo: "Retos de alta exigencia", descripcion: "Ofrecer ejercicios de dificultad variable y proyectos auto-dirigidos.", prioridad: "media" });

  // ── Alertas ──
  const alertas: Perfil360["alertas"] = [];
  const ansiedad = ultPorTest.get("tai");
  if (ansiedad?.puntaje_total && ansiedad.puntaje_total >= 60) alertas.push({ tipo: "ansiedad", nivel: "alta", mensaje: "Ansiedad ante exámenes alta. Aplicar respiración 5×5, simulacros cronometrados y reestructuración cognitiva." });
  const rosen = ultPorTest.get("rosenberg");
  if (rosen?.puntaje_total && rosen.puntaje_total <= 25) alertas.push({ tipo: "autoestima", nivel: "baja", mensaje: "Autoestima baja. Reforzar logros, fijar metas alcanzables y considerar acompañamiento psicológico." });
  const epaR = ultPorTest.get("epa");
  if (epaR?.puntaje_total && epaR.puntaje_total >= 56) alertas.push({ tipo: "procrastinacion", nivel: "alta", mensaje: "Procrastinación elevada. Implementar Pomodoro, plazos cortos y tutoría semanal." });
  const cd = ultPorTest.get("cd-risc");
  if (cd?.puntaje_total && cd.puntaje_total <= 30) alertas.push({ tipo: "resiliencia", nivel: "baja", mensaje: "Resiliencia baja. Trabajar mindset de crecimiento y técnicas de afrontamiento activo." });

  return {
    testsCompletados: ultPorTest.size,
    porcentajeCompletitud: Math.round((ultPorTest.size / Math.max(totalTests, 1)) * 100),
    subescalas,
    rasgos,
    inteligenciasTop,
    dua,
    edadMental,
    vocacional,
    adaptaciones,
    alertas,
  };
}
