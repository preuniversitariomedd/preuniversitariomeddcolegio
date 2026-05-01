// ============================================================
// CARRERAS ESPOL — datos hardcoded para Orientación Vocacional
// © 2020-2026 PreUniversitario MEDD — Víctor Cañizares González
// ============================================================

export interface CarreraEspol {
  id: string;
  nombre: string;
  facultad: string;
  siglaFacultad: string;
  descripcion: string;
  campoLaboral: string[];
  perfilIdeal: {
    empatia: number;            // 0-100
    prosocial: number;          // 0-100
    habilidadesSociales: number;// 0-100
  };
  materiasClaveESPOL: string[];
  color: string;
  icono: string;

  // Campos enriquecidos (opcionales — no rompen carreras antiguas)
  universidad?: string;
  siglaUniversidad?: "ESPOL" | "ECOTEC" | "UEES" | "UNEMI" | "UG" | "UCE";
  urlUniversidad?: string;
  urlCarrera?: string;
  modalidad?: string[];
  ciudad?: string[];
  tipoCosto?: "publica" | "privada";
  duracion?: string;
  salarioPromedioEcuador?: string;
  demandaLaboral?: "alta" | "media" | "baja";
  tags?: string[];
  estilosAprendizaje?: ("V" | "A" | "R" | "K")[];
}

const URL_ESPOL = "https://www.espol.edu.ec/es/admision/oferta-academica";

const espolBase = {
  universidad: "Escuela Superior Politécnica del Litoral",
  siglaUniversidad: "ESPOL" as const,
  urlUniversidad: URL_ESPOL,
  modalidad: ["presencial"],
  ciudad: ["Guayaquil"],
  tipoCosto: "publica" as const,
};

export const CARRERAS_ESPOL: CarreraEspol[] = [
  // ── SALUD ───────────────────────────────────────────────
  { ...espolBase, id: "medicina", nombre: "Medicina", facultad: "Facultad de Ciencias Médicas", siglaFacultad: "FCM",
    descripcion: "Formación integral en ciencias de la salud humana, diagnóstico y tratamiento de enfermedades.",
    campoLaboral: ["Hospitales públicos y privados", "Investigación médica", "Salud pública", "Docencia universitaria"],
    perfilIdeal: { empatia: 95, prosocial: 88, habilidadesSociales: 85 },
    materiasClaveESPOL: ["Biología", "Química Orgánica", "Matemáticas"],
    color: "#EAF3DE", icono: "🩺",
    urlCarrera: URL_ESPOL, duracion: "12 semestres",
    salarioPromedioEcuador: "$1200-$3500/mes", demandaLaboral: "alta",
    tags: ["salud", "medicina", "ciencias"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "nutricion", nombre: "Nutrición y Dietética", facultad: "Facultad de Ciencias de la Vida", siglaFacultad: "FCV",
    descripcion: "Ciencia de la alimentación aplicada a la salud individual y colectiva.",
    campoLaboral: ["Hospitales", "Clínicas", "Industria alimentaria", "Deporte", "Docencia"],
    perfilIdeal: { empatia: 82, prosocial: 85, habilidadesSociales: 80 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#EAF3DE", icono: "🥗",
    urlCarrera: "https://www.fcv.espol.edu.ec/es/carreras-de-grado/nutricion-y-dietetica",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1400/mes",
    demandaLaboral: "alta", tags: ["salud", "nutricion", "alimentacion"], estilosAprendizaje: ["K", "V"] },

  // ── CIENCIAS DE LA VIDA ─────────────────────────────────
  { ...espolBase, id: "biologia", nombre: "Biología", facultad: "Facultad de Ciencias de la Vida", siglaFacultad: "FCV",
    descripcion: "Estudio de seres vivos, ecosistemas y biotecnología aplicada a la conservación y salud.",
    campoLaboral: ["Investigación científica", "Laboratorios clínicos", "Conservación ambiental", "Docencia", "Industria farmacéutica"],
    perfilIdeal: { empatia: 65, prosocial: 72, habilidadesSociales: 60 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#EAF3DE", icono: "🔬",
    urlCarrera: "https://www.fcv.espol.edu.ec/es/carreras-de-grado/biologia",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1200/mes",
    demandaLaboral: "media", tags: ["ciencias", "investigacion", "salud"], estilosAprendizaje: ["R", "K"] },

  { ...espolBase, id: "biotecnologia", nombre: "Ingeniería en Biotecnología", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Aplicación de organismos vivos y tecnología para desarrollar productos y procesos.",
    campoLaboral: ["Industria farmacéutica", "Agroindustria", "Investigación", "Medio ambiente"],
    perfilIdeal: { empatia: 60, prosocial: 75, habilidadesSociales: 58 },
    materiasClaveESPOL: ["Química", "Biología", "Matemáticas"],
    color: "#E1F5EE", icono: "🧬",
    urlCarrera: URL_ESPOL, duracion: "9 semestres",
    salarioPromedioEcuador: "$900-$2000/mes", demandaLaboral: "media",
    tags: ["ingenieria", "biologia", "investigacion"], estilosAprendizaje: ["R", "K"] },

  { ...espolBase, id: "agricola", nombre: "Ingeniería Agrícola y Biológica", facultad: "Facultad de Ciencias de la Vida", siglaFacultad: "FCV",
    descripcion: "Tecnificación agrícola, riego, mecanización y biotecnología aplicada al agro ecuatoriano.",
    campoLaboral: ["Agroindustria", "MAGAP", "Exportación", "Consultoría", "Emprendimiento agrícola"],
    perfilIdeal: { empatia: 58, prosocial: 72, habilidadesSociales: 60 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#E1F5EE", icono: "🌱",
    urlCarrera: "https://www.fcv.espol.edu.ec/es/carreras-de-grado/ingenieria-agricola-y-biologica",
    duracion: "9 semestres", salarioPromedioEcuador: "$700-$1500/mes",
    demandaLaboral: "media", tags: ["agricultura", "biologia", "recursos"], estilosAprendizaje: ["K", "R"] },

  // ── INGENIERÍA EN MECÁNICA Y PRODUCCIÓN ─────────────────
  { ...espolBase, id: "mecanica", nombre: "Ingeniería Mecánica", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Diseño, análisis y fabricación de sistemas mecánicos para industria, energía y manufactura.",
    campoLaboral: ["Industria manufacturera", "Sector petrolero", "Automotriz", "Mantenimiento industrial", "Docencia"],
    perfilIdeal: { empatia: 45, prosocial: 48, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "⚙️",
    urlCarrera: "https://www.fimcp.espol.edu.ec/es/carreras-de-grado/mecanica",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "industria", "tecnico"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "industrial", nombre: "Ingeniería Industrial", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Optimización de sistemas productivos, logística y gestión de operaciones.",
    campoLaboral: ["Manufactura", "Logística", "Consultoría", "Banca"],
    perfilIdeal: { empatia: 55, prosocial: 58, habilidadesSociales: 70 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "🏭",
    urlCarrera: "https://www.fimcp.espol.edu.ec/es/carreras-de-grado/ingenieria-industrial",
    duracion: "9 semestres", salarioPromedioEcuador: "$800-$1800/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "gestion", "industria"], estilosAprendizaje: ["R", "K"] },

  { ...espolBase, id: "mecatronica", nombre: "Ingeniería en Mecatrónica", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Integración de mecánica, electrónica, control e informática para sistemas automatizados y robótica.",
    campoLaboral: ["Industria 4.0", "Robótica", "Petróleo", "Automotriz", "Investigación"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#EEEDFE", icono: "🦾",
    urlCarrera: "https://www.fimcp.espol.edu.ec/es/carreras-de-grado/mecatronica",
    duracion: "9 semestres", salarioPromedioEcuador: "$1000-$2500/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "robotica", "automatizacion"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "quimica", nombre: "Ingeniería Química", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Diseño de procesos industriales químicos, petroquímica, alimentos y medio ambiente.",
    campoLaboral: ["Industria química", "Petroquímica", "Alimentos", "Medio ambiente", "Farmacéutica"],
    perfilIdeal: { empatia: 48, prosocial: 55, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Química", "Matemáticas", "Física"],
    color: "#FAEEDA", icono: "🧪",
    urlCarrera: "https://www.fimcp.espol.edu.ec/es/carreras-de-grado/quimica",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "media", tags: ["ingenieria", "quimica", "industria"], estilosAprendizaje: ["R", "K"] },

  { ...espolBase, id: "alimentos", nombre: "Ingeniería en Alimentos", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Diseño, desarrollo y control de calidad de alimentos seguros y nutritivos para la industria.",
    campoLaboral: ["Industria alimentaria", "Exportación", "Control sanitario", "Investigación", "Emprendimiento"],
    perfilIdeal: { empatia: 58, prosocial: 68, habilidadesSociales: 60 },
    materiasClaveESPOL: ["Química", "Biología", "Matemáticas"],
    color: "#EAF3DE", icono: "🌾",
    urlCarrera: "https://www.fimcp.espol.edu.ec/es/carreras-de-grado/alimentos",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1500/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "alimentos", "industria"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "materiales", nombre: "Ingeniería en Materiales", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Desarrollo y caracterización de materiales metálicos, polímeros, cerámicos y nanomateriales.",
    campoLaboral: ["Industria", "Investigación", "Sector petrolero", "Aeronáutica", "Construcción"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Química", "Física", "Matemáticas"],
    color: "#F1EFE8", icono: "🔩",
    urlCarrera: URL_ESPOL, duracion: "9 semestres",
    salarioPromedioEcuador: "$900-$2000/mes", demandaLaboral: "media",
    tags: ["ingenieria", "materiales", "industria"], estilosAprendizaje: ["R", "K"] },

  // ── ELECTRICIDAD Y COMPUTACIÓN ──────────────────────────
  { ...espolBase, id: "sistemas", nombre: "Ingeniería en Sistemas de Información", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Desarrollo de software, bases de datos y soluciones tecnológicas para organizaciones.",
    campoLaboral: ["Empresas tech", "Banca", "Gobierno", "Startups", "Freelance"],
    perfilIdeal: { empatia: 45, prosocial: 50, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#E6F1FB", icono: "💻",
    urlCarrera: URL_ESPOL, duracion: "8 semestres",
    salarioPromedioEcuador: "$900-$2200/mes", demandaLaboral: "alta",
    tags: ["tecnologia", "software", "digital"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "computacion", nombre: "Ingeniería en Computación", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Desarrollo de software avanzado, algoritmos, arquitectura de computadores e inteligencia artificial.",
    campoLaboral: ["Empresas tecnológicas", "Banca", "Gobierno digital", "Investigación", "Startups"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#E6F1FB", icono: "🖥️",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/computacion",
    duracion: "9 semestres", salarioPromedioEcuador: "$1000-$2500/mes",
    demandaLaboral: "alta", tags: ["tecnologia", "software", "digital"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "datos-ia", nombre: "Ciencia de Datos e Inteligencia Artificial", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Machine learning, big data, IA y toma de decisiones basada en datos para organizaciones.",
    campoLaboral: ["Empresas tech", "Banca", "Salud", "Gobierno digital", "Investigación"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#EEEDFE", icono: "🧠",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/ciencia-de-datos-e-inteligencia-artificial-hibrida",
    duracion: "8 semestres", salarioPromedioEcuador: "$1200-$3500/mes",
    demandaLaboral: "alta", tags: ["tecnologia", "ia", "datos"],
    modalidad: ["presencial", "hibrida"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "telematica", nombre: "Ingeniería en Telemática", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Integración de redes de computadoras, telecomunicaciones y sistemas de información distribuidos.",
    campoLaboral: ["Telecomunicaciones", "ISPs", "Gobierno", "Banca", "Empresas tech"],
    perfilIdeal: { empatia: 40, prosocial: 45, habilidadesSociales: 50 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#E6F1FB", icono: "🌐",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/telematica",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["tecnologia", "redes", "telecomunicaciones"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "telecomunicaciones", nombre: "Ingeniería en Telecomunicaciones", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Diseño de sistemas de comunicación inalámbrica, fibra óptica, satélites y redes 5G.",
    campoLaboral: ["CNT", "Claro", "Movistar", "Gobierno", "Investigación"],
    perfilIdeal: { empatia: 40, prosocial: 45, habilidadesSociales: 50 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#E6F1FB", icono: "📡",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/telecomunicaciones",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["tecnologia", "comunicaciones", "redes"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "electricidad", nombre: "Ingeniería Eléctrica", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Generación, transmisión y distribución de energía eléctrica, energías renovables y sistemas de potencia.",
    campoLaboral: ["CELEC EP", "CNE", "Empresas eléctricas", "Industria", "Consultoría"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#FAEEDA", icono: "⚡",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/electricidad",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "energia", "industria"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "electronica", nombre: "Ingeniería en Electrónica y Automatización", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Diseño de sistemas electrónicos, robótica, automatización industrial y control de procesos.",
    campoLaboral: ["Industria manufacturera", "Minería", "Petróleo", "Robótica", "Investigación"],
    perfilIdeal: { empatia: 40, prosocial: 45, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#FAEEDA", icono: "🤖",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/electronica-y-automatizacion",
    duracion: "9 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "automatizacion", "industria"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "tics", nombre: "Tecnologías de la Información", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Gestión de sistemas de información, seguridad informática, cloud computing y transformación digital.",
    campoLaboral: ["Empresas tecnológicas", "Banca", "Gobierno", "Consultoría IT", "Startups"],
    perfilIdeal: { empatia: 45, prosocial: 50, habilidadesSociales: 62 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#E6F1FB", icono: "☁️",
    urlCarrera: "https://www.fiec.espol.edu.ec/es/carreras-de-grado/tecnologias-de-la-informacion",
    duracion: "8 semestres", salarioPromedioEcuador: "$900-$2200/mes",
    demandaLaboral: "alta", tags: ["tecnologia", "digital", "sistemas"], estilosAprendizaje: ["R", "V"] },

  // ── CIENCIAS DE LA TIERRA ───────────────────────────────
  { ...espolBase, id: "civil", nombre: "Ingeniería Civil", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Diseño y construcción de infraestructura: puentes, edificios, carreteras y sistemas hidráulicos.",
    campoLaboral: ["Constructoras", "Gobierno", "Consultoras", "Organismos internacionales"],
    perfilIdeal: { empatia: 50, prosocial: 55, habilidadesSociales: 65 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "🏗️",
    urlCarrera: "https://www.fict.espol.edu.ec/es/carreras-de-grado/ingenieria-civil",
    duracion: "10 semestres", salarioPromedioEcuador: "$900-$2200/mes",
    demandaLaboral: "alta", tags: ["ingenieria", "construccion", "infraestructura"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "arquitectura", nombre: "Arquitectura", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Diseño de espacios, edificaciones y ciudades combinando creatividad técnica y estética.",
    campoLaboral: ["Estudios de arquitectura", "Constructoras", "Gobierno", "Docencia"],
    perfilIdeal: { empatia: 65, prosocial: 60, habilidadesSociales: 72 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Dibujo técnico"],
    color: "#FAEEDA", icono: "🏛️",
    urlCarrera: URL_ESPOL, duracion: "10 semestres",
    salarioPromedioEcuador: "$800-$1800/mes", demandaLaboral: "media",
    tags: ["arte", "diseño", "construccion"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "ambiental", nombre: "Ingeniería Ambiental", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Protección y gestión del medio ambiente, manejo de residuos y evaluación de impacto ambiental.",
    campoLaboral: ["Empresas petroleras", "Gobierno", "ONGs", "Consultoría ambiental"],
    perfilIdeal: { empatia: 70, prosocial: 82, habilidadesSociales: 68 },
    materiasClaveESPOL: ["Química", "Biología", "Matemáticas"],
    color: "#E1F5EE", icono: "🌿",
    urlCarrera: URL_ESPOL, duracion: "9 semestres",
    salarioPromedioEcuador: "$800-$1800/mes", demandaLaboral: "media",
    tags: ["ingenieria", "ambiente", "recursos"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "geologia", nombre: "Ingeniería en Geología", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Exploración y análisis de recursos geológicos, minerales e hidrocarburos.",
    campoLaboral: ["Minería", "Petróleo", "Hidrogeología", "Construcción", "Gobierno"],
    perfilIdeal: { empatia: 45, prosocial: 52, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "🪨",
    urlCarrera: "https://www.fict.espol.edu.ec/es/carreras-de-grado/geologia",
    duracion: "9 semestres", salarioPromedioEcuador: "$1000-$2500/mes",
    demandaLaboral: "media", tags: ["ingenieria", "mineria", "recursos"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "minas", nombre: "Ingeniería de Minas", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Extracción segura y sostenible de recursos minerales con gestión ambiental.",
    campoLaboral: ["Empresas mineras", "ENAMI", "Gobierno", "Consultoría ambiental"],
    perfilIdeal: { empatia: 45, prosocial: 55, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "⛏️",
    urlCarrera: "https://www.fict.espol.edu.ec/es/carreras-de-grado/minas",
    duracion: "9 semestres", salarioPromedioEcuador: "$1200-$3000/mes",
    demandaLaboral: "media", tags: ["ingenieria", "mineria", "recursos"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "petroleo", nombre: "Ingeniería en Petróleo", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Exploración, extracción y procesamiento de hidrocarburos con enfoque en sostenibilidad energética.",
    campoLaboral: ["Petroecuador", "EP Petroecuador", "Empresas petroleras", "Consultoría"],
    perfilIdeal: { empatia: 45, prosocial: 50, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#FAEEDA", icono: "🛢️",
    urlCarrera: "https://www.fict.espol.edu.ec/es/carreras-de-grado/petroleo",
    duracion: "9 semestres", salarioPromedioEcuador: "$1500-$4000/mes",
    demandaLaboral: "media", tags: ["ingenieria", "energia", "recursos"], estilosAprendizaje: ["R", "K"] },

  // ── INGENIERÍA MARÍTIMA ─────────────────────────────────
  { ...espolBase, id: "naval", nombre: "Ingeniería Naval", facultad: "Facultad de Ingeniería Marítima y Ciencias del Mar", siglaFacultad: "FIMCM",
    descripcion: "Diseño, construcción y mantenimiento de embarcaciones y estructuras marinas.",
    campoLaboral: ["Astilleros", "Armada del Ecuador", "Industria pesquera", "Transporte marítimo"],
    perfilIdeal: { empatia: 45, prosocial: 50, habilidadesSociales: 58 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#E6F1FB", icono: "⚓",
    urlCarrera: "https://www.fimcm.espol.edu.ec/es/carreras-de-grado/ingenieria-naval",
    duracion: "10 semestres", salarioPromedioEcuador: "$900-$2500/mes",
    demandaLaboral: "baja", tags: ["ingenieria", "maritimo", "naval"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "oceanografia", nombre: "Oceanografía", facultad: "Facultad de Ingeniería Marítima y Ciencias del Mar", siglaFacultad: "FIMCM",
    descripcion: "Estudio del océano, recursos marinos, cambio climático oceánico y gestión costera.",
    campoLaboral: ["INOCAR", "Ministerio del Ambiente", "ONGs marinas", "Industria pesquera", "Investigación"],
    perfilIdeal: { empatia: 62, prosocial: 72, habilidadesSociales: 60 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#E6F1FB", icono: "🌊",
    urlCarrera: "https://www.fimcm.espol.edu.ec/es/carreras-de-grado/oceanografia",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1500/mes",
    demandaLaboral: "baja", tags: ["ciencias", "maritimo", "ambiente"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "acuicultura", nombre: "Acuicultura", facultad: "Facultad de Ingeniería Marítima y Ciencias del Mar", siglaFacultad: "FIMCM",
    descripcion: "Cultivo sostenible de organismos acuáticos. Ecuador es líder mundial en acuacultura del camarón.",
    campoLaboral: ["Industria camaronera", "Exportación", "Investigación acuícola", "Emprendimiento"],
    perfilIdeal: { empatia: 58, prosocial: 70, habilidadesSociales: 60 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#E1F5EE", icono: "🦐",
    urlCarrera: "https://www.fimcm.espol.edu.ec/es/carreras-de-grado/acuicultura",
    duracion: "8 semestres", salarioPromedioEcuador: "$800-$2000/mes",
    demandaLaboral: "alta", tags: ["acuicultura", "maritimo", "recursos"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "logistica", nombre: "Logística y Transporte", facultad: "Facultad de Ingeniería Marítima y Ciencias del Mar", siglaFacultad: "FIMCM",
    descripcion: "Gestión de cadenas de suministro, comercio exterior, transporte marítimo y portuario.",
    campoLaboral: ["Puerto de Guayaquil", "Navieras", "Exportación", "Logística empresarial", "Aduana"],
    perfilIdeal: { empatia: 55, prosocial: 58, habilidadesSociales: 72 },
    materiasClaveESPOL: ["Matemáticas", "Lengua", "Razonamiento"],
    color: "#FAEEDA", icono: "🚢",
    urlCarrera: "https://www.fimcm.espol.edu.ec/es/carreras-de-grado/logistica-y-transporte",
    duracion: "8 semestres", salarioPromedioEcuador: "$800-$1800/mes",
    demandaLaboral: "alta", tags: ["comercio", "logistica", "maritimo"], estilosAprendizaje: ["R", "A"] },

  // ── CIENCIAS NATURALES Y MATEMÁTICAS ────────────────────
  { ...espolBase, id: "estadistica", nombre: "Estadística", facultad: "Facultad de Ciencias Naturales y Matemáticas", siglaFacultad: "FCNM",
    descripcion: "Análisis de datos, modelos estadísticos, ciencia de datos y apoyo a la toma de decisiones.",
    campoLaboral: ["Banca", "Gobierno", "Empresas", "Investigación", "Salud pública"],
    perfilIdeal: { empatia: 42, prosocial: 48, habilidadesSociales: 52 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#EEEDFE", icono: "📊",
    urlCarrera: "https://www.fcnm.espol.edu.ec/es/carreras-de-grado/estadistica",
    duracion: "8 semestres", salarioPromedioEcuador: "$900-$2000/mes",
    demandaLaboral: "alta", tags: ["matematicas", "datos", "tecnologia"], estilosAprendizaje: ["R", "V"] },

  { ...espolBase, id: "matematica", nombre: "Matemáticas", facultad: "Facultad de Ciencias Naturales y Matemáticas", siglaFacultad: "FCNM",
    descripcion: "Matemáticas puras y aplicadas con énfasis en modelamiento, cálculo y análisis numérico.",
    campoLaboral: ["Docencia universitaria", "Investigación", "Banca", "Tecnología", "Actuaría"],
    perfilIdeal: { empatia: 40, prosocial: 45, habilidadesSociales: 50 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#EEEDFE", icono: "📐",
    urlCarrera: "https://www.fcnm.espol.edu.ec/es/carreras-de-grado/matematica",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1500/mes",
    demandaLaboral: "media", tags: ["matematicas", "ciencias", "investigacion"], estilosAprendizaje: ["R", "V"] },

  // ── CIENCIAS SOCIALES Y HUMANÍSTICAS ────────────────────
  { ...espolBase, id: "administracion", nombre: "Administración de Empresas", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Gestión organizacional, liderazgo empresarial, finanzas y estrategia de negocios.",
    campoLaboral: ["Empresas privadas", "Emprendimiento", "Banca", "Organismos internacionales"],
    perfilIdeal: { empatia: 62, prosocial: 60, habilidadesSociales: 85 },
    materiasClaveESPOL: ["Matemáticas", "Estadística", "Economía"],
    color: "#FAEEDA", icono: "📈",
    urlCarrera: "https://www.fcsh.espol.edu.ec/es/carreras-de-grado/administracion-de-empresas",
    duracion: "8 semestres", salarioPromedioEcuador: "$800-$2000/mes",
    demandaLaboral: "alta", tags: ["negocios", "gestion", "empresarial"], estilosAprendizaje: ["A", "R"] },

  { ...espolBase, id: "economia", nombre: "Economía", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Análisis económico, política fiscal, comercio internacional y desarrollo económico del Ecuador.",
    campoLaboral: ["BCE", "Ministerios", "Banca", "Organismos internacionales", "Consultoría"],
    perfilIdeal: { empatia: 55, prosocial: 58, habilidadesSociales: 72 },
    materiasClaveESPOL: ["Matemáticas", "Lengua", "Razonamiento"],
    color: "#FAEEDA", icono: "💹",
    urlCarrera: "https://www.fcsh.espol.edu.ec/es/carreras-de-grado/economia",
    duracion: "8 semestres", salarioPromedioEcuador: "$800-$2000/mes",
    demandaLaboral: "media", tags: ["economia", "finanzas", "negocios"], estilosAprendizaje: ["R", "A"] },

  { ...espolBase, id: "auditoria", nombre: "Auditoría y Control de Gestión", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Control financiero, auditoría de empresas, tributación y gestión contable con herramientas digitales.",
    campoLaboral: ["Empresas privadas", "SRI", "Contraloría", "Banca", "Big Four"],
    perfilIdeal: { empatia: 50, prosocial: 55, habilidadesSociales: 68 },
    materiasClaveESPOL: ["Matemáticas", "Lengua", "Razonamiento"],
    color: "#FAEEDA", icono: "📋",
    urlCarrera: "https://www.fcsh.espol.edu.ec/es/carreras-de-grado/auditoria-y-control-de-gestion",
    duracion: "8 semestres", salarioPromedioEcuador: "$800-$2000/mes",
    demandaLaboral: "alta", tags: ["finanzas", "contabilidad", "empresarial"], estilosAprendizaje: ["R", "K"] },

  { ...espolBase, id: "turismo", nombre: "Turismo", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Gestión turística, hotelería, turismo sostenible y desarrollo de destinos en Ecuador y el mundo.",
    campoLaboral: ["Hoteles", "Agencias de viaje", "Ministerio de Turismo", "Cruceros", "Emprendimiento"],
    perfilIdeal: { empatia: 75, prosocial: 70, habilidadesSociales: 88 },
    materiasClaveESPOL: ["Lengua", "Razonamiento", "Inglés"],
    color: "#E1F5EE", icono: "✈️",
    urlCarrera: "https://www.fcsh.espol.edu.ec/es/carreras-de-grado/turismo",
    duracion: "8 semestres", salarioPromedioEcuador: "$600-$1400/mes",
    demandaLaboral: "alta", tags: ["turismo", "servicios", "internacional"], estilosAprendizaje: ["A", "V"] },

  { ...espolBase, id: "arqueologia", nombre: "Arqueología", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Estudio del patrimonio cultural material, excavaciones y conservación del legado histórico ecuatoriano.",
    campoLaboral: ["INPC", "Municipios", "ONGs culturales", "Museos", "Docencia", "Turismo cultural"],
    perfilIdeal: { empatia: 68, prosocial: 75, habilidadesSociales: 68 },
    materiasClaveESPOL: ["Lengua", "Razonamiento", "Ciencias Sociales"],
    color: "#FAEEDA", icono: "🏺",
    urlCarrera: "https://www.fcsh.espol.edu.ec/es/carreras-de-grado/arqueologia",
    duracion: "8 semestres", salarioPromedioEcuador: "$600-$1200/mes",
    demandaLaboral: "baja", tags: ["humanidades", "cultura", "historia"], estilosAprendizaje: ["K", "R"] },

  { ...espolBase, id: "educacion", nombre: "Licenciatura en Educación", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Formación de docentes con sólida base pedagógica para educación básica y bachillerato.",
    campoLaboral: ["Instituciones educativas", "Ministerio de Educación", "ONGs", "Docencia universitaria"],
    perfilIdeal: { empatia: 88, prosocial: 90, habilidadesSociales: 92 },
    materiasClaveESPOL: ["Matemáticas", "Lengua", "Ciencias"],
    color: "#FAECE7", icono: "📚",
    urlCarrera: URL_ESPOL, duracion: "8 semestres",
    salarioPromedioEcuador: "$700-$1500/mes", demandaLaboral: "alta",
    tags: ["educacion", "humanidades", "social"], estilosAprendizaje: ["A", "V"] },

  { ...espolBase, id: "psicologia", nombre: "Psicología", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Estudio del comportamiento humano, salud mental y procesos cognitivos y emocionales.",
    campoLaboral: ["Clínicas y hospitales", "Empresas (RRHH)", "Educación", "Investigación"],
    perfilIdeal: { empatia: 92, prosocial: 85, habilidadesSociales: 88 },
    materiasClaveESPOL: ["Biología", "Estadística", "Comunicación"],
    color: "#EEEDFE", icono: "🧠",
    urlCarrera: URL_ESPOL, duracion: "9 semestres",
    salarioPromedioEcuador: "$700-$1500/mes", demandaLaboral: "alta",
    tags: ["salud", "social", "humanidades"], estilosAprendizaje: ["A", "V"] },

  // ── ARTE, DISEÑO Y COMUNICACIÓN ─────────────────────────
  { ...espolBase, id: "disenio-grafico", nombre: "Diseño Gráfico", facultad: "Facultad de Arte, Diseño y Comunicación Audiovisual", siglaFacultad: "FADCOM",
    descripcion: "Comunicación visual, identidad de marca, diseño digital y UX/UI para medios impresos y digitales.",
    campoLaboral: ["Agencias de publicidad", "Empresas", "Freelance", "Medios digitales", "Emprendimiento"],
    perfilIdeal: { empatia: 62, prosocial: 58, habilidadesSociales: 72 },
    materiasClaveESPOL: ["Arte", "Lengua", "Razonamiento"],
    color: "#FAECE7", icono: "🎨",
    urlCarrera: "https://www.fadcom.espol.edu.ec/es/carreras-de-grado/diseno-grafico",
    duracion: "8 semestres", salarioPromedioEcuador: "$600-$1500/mes",
    demandaLaboral: "alta", tags: ["arte", "diseño", "digital"], estilosAprendizaje: ["V", "K"] },

  { ...espolBase, id: "produccion-medios", nombre: "Producción para Medios de Comunicación", facultad: "Facultad de Arte, Diseño y Comunicación Audiovisual", siglaFacultad: "FADCOM",
    descripcion: "Producción audiovisual, cine, televisión, podcasting y contenido digital para medios modernos.",
    campoLaboral: ["Televisoras", "Productoras", "YouTube/Streaming", "Publicidad", "Periodismo digital"],
    perfilIdeal: { empatia: 68, prosocial: 62, habilidadesSociales: 80 },
    materiasClaveESPOL: ["Arte", "Lengua", "Razonamiento"],
    color: "#FAECE7", icono: "🎬",
    urlCarrera: "https://www.fadcom.espol.edu.ec/es/carreras-de-grado/produccion-para-medios-de-comunicacion",
    duracion: "8 semestres", salarioPromedioEcuador: "$600-$1500/mes",
    demandaLaboral: "media", tags: ["arte", "comunicacion", "medios"], estilosAprendizaje: ["V", "A"] },

  { ...espolBase, id: "disenio-productos", nombre: "Diseño de Productos", facultad: "Facultad de Arte, Diseño y Comunicación Audiovisual", siglaFacultad: "FADCOM",
    descripcion: "Diseño industrial, innovación de productos, ergonomía y prototipado con tecnología digital.",
    campoLaboral: ["Industria manufacturera", "Emprendimiento", "Consultoría", "Exportación"],
    perfilIdeal: { empatia: 60, prosocial: 58, habilidadesSociales: 68 },
    materiasClaveESPOL: ["Arte", "Matemáticas", "Física"],
    color: "#FAECE7", icono: "🛋️",
    urlCarrera: "https://www.fadcom.espol.edu.ec/es/carreras-de-grado/diseno-de-productos",
    duracion: "8 semestres", salarioPromedioEcuador: "$700-$1500/mes",
    demandaLaboral: "media", tags: ["arte", "diseño", "industria"], estilosAprendizaje: ["V", "K"] },
];

// Áreas globales para el filtro de preferencias
export const AREAS_CARRERA = [
  "salud",
  "tecnologia",
  "negocios",
  "arte",
  "ingenieria",
  "humanidades",
  "ciencias",
  "educacion",
] as const;

export type AreaCarrera = typeof AREAS_CARRERA[number];

export function getCarreraById(id: string): CarreraEspol | undefined {
  return CARRERAS_ESPOL.find((c) => c.id === id);
}
