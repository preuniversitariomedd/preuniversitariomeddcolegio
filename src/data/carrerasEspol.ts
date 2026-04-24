// ============================================================
// CARRERAS ESPOL — datos hardcoded para Orientación Vocacional
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
}

export const CARRERAS_ESPOL: CarreraEspol[] = [
  { id: "medicina", nombre: "Medicina", facultad: "Facultad de Ciencias Médicas", siglaFacultad: "FCM",
    descripcion: "Formación integral en ciencias de la salud humana, diagnóstico y tratamiento de enfermedades.",
    campoLaboral: ["Hospitales públicos y privados", "Investigación médica", "Salud pública", "Docencia universitaria"],
    perfilIdeal: { empatia: 95, prosocial: 88, habilidadesSociales: 85 },
    materiasClaveESPOL: ["Biología", "Química Orgánica", "Matemáticas"],
    color: "#EAF3DE", icono: "🩺" },
  { id: "psicologia", nombre: "Psicología", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Estudio del comportamiento humano, salud mental y procesos cognitivos y emocionales.",
    campoLaboral: ["Clínicas y hospitales", "Empresas (RRHH)", "Educación", "Investigación"],
    perfilIdeal: { empatia: 92, prosocial: 85, habilidadesSociales: 88 },
    materiasClaveESPOL: ["Biología", "Estadística", "Comunicación"],
    color: "#EEEDFE", icono: "🧠" },
  { id: "arquitectura", nombre: "Arquitectura", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Diseño de espacios, edificaciones y ciudades combinando creatividad técnica y estética.",
    campoLaboral: ["Estudios de arquitectura", "Constructoras", "Gobierno", "Docencia"],
    perfilIdeal: { empatia: 65, prosocial: 60, habilidadesSociales: 72 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Dibujo técnico"],
    color: "#FAEEDA", icono: "🏛️" },
  { id: "biotecnologia", nombre: "Ingeniería en Biotecnología", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Aplicación de organismos vivos y tecnología para desarrollar productos y procesos.",
    campoLaboral: ["Industria farmacéutica", "Agroindustria", "Investigación", "Medio ambiente"],
    perfilIdeal: { empatia: 60, prosocial: 75, habilidadesSociales: 58 },
    materiasClaveESPOL: ["Química", "Biología", "Matemáticas"],
    color: "#E1F5EE", icono: "🔬" },
  { id: "educacion", nombre: "Licenciatura en Educación", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Formación de docentes con sólida base pedagógica para educación básica y bachillerato.",
    campoLaboral: ["Instituciones educativas", "Ministerio de Educación", "ONGs", "Docencia universitaria"],
    perfilIdeal: { empatia: 88, prosocial: 90, habilidadesSociales: 92 },
    materiasClaveESPOL: ["Matemáticas", "Lengua", "Ciencias"],
    color: "#FAECE7", icono: "📚" },
  { id: "industrial", nombre: "Ingeniería Industrial", facultad: "Facultad de Ingeniería en Mecánica y Ciencias de la Producción", siglaFacultad: "FIMCP",
    descripcion: "Optimización de sistemas productivos, logística y gestión de operaciones.",
    campoLaboral: ["Manufactura", "Logística", "Consultoría", "Banca"],
    perfilIdeal: { empatia: 55, prosocial: 58, habilidadesSociales: 70 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#E6F1FB", icono: "⚙️" },
  { id: "sistemas", nombre: "Ingeniería en Sistemas de Información", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Desarrollo de software, bases de datos y soluciones tecnológicas para organizaciones.",
    campoLaboral: ["Empresas tech", "Banca", "Gobierno", "Startups", "Freelance"],
    perfilIdeal: { empatia: 45, prosocial: 50, habilidadesSociales: 55 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Lógica"],
    color: "#E6F1FB", icono: "💻" },
  { id: "civil", nombre: "Ingeniería Civil", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Diseño y construcción de infraestructura: puentes, edificios, carreteras y sistemas hidráulicos.",
    campoLaboral: ["Constructoras", "Gobierno", "Consultoras", "Organismos internacionales"],
    perfilIdeal: { empatia: 50, prosocial: 55, habilidadesSociales: 65 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#F1EFE8", icono: "🏗️" },
  { id: "ambiental", nombre: "Ingeniería Ambiental", facultad: "Facultad de Ingeniería en Ciencias de la Tierra", siglaFacultad: "FICT",
    descripcion: "Protección y gestión del medio ambiente, manejo de residuos y evaluación de impacto ambiental.",
    campoLaboral: ["Empresas petroleras", "Gobierno", "ONGs", "Consultoría ambiental"],
    perfilIdeal: { empatia: 70, prosocial: 82, habilidadesSociales: 68 },
    materiasClaveESPOL: ["Química", "Biología", "Matemáticas"],
    color: "#E1F5EE", icono: "🌿" },
  { id: "administracion", nombre: "Administración de Empresas", facultad: "Facultad de Ciencias Sociales y Humanísticas", siglaFacultad: "FCSH",
    descripcion: "Gestión organizacional, liderazgo empresarial, finanzas y estrategia de negocios.",
    campoLaboral: ["Empresas privadas", "Emprendimiento", "Banca", "Organismos internacionales"],
    perfilIdeal: { empatia: 62, prosocial: 60, habilidadesSociales: 85 },
    materiasClaveESPOL: ["Matemáticas", "Estadística", "Economía"],
    color: "#FAEEDA", icono: "📊" },
  { id: "electronica", nombre: "Ingeniería en Electrónica y Telecomunicaciones", facultad: "Facultad de Ingeniería en Electricidad y Computación", siglaFacultad: "FIEC",
    descripcion: "Diseño y desarrollo de sistemas electrónicos, redes y comunicaciones.",
    campoLaboral: ["Telecomunicaciones", "Industria", "Investigación", "Defensa"],
    perfilIdeal: { empatia: 40, prosocial: 45, habilidadesSociales: 50 },
    materiasClaveESPOL: ["Matemáticas", "Física", "Química"],
    color: "#E6F1FB", icono: "📡" },
  { id: "nutricion", nombre: "Nutrición y Dietética", facultad: "Facultad de Ciencias Médicas", siglaFacultad: "FCM",
    descripcion: "Ciencia de la alimentación aplicada a la salud individual y colectiva.",
    campoLaboral: ["Hospitales", "Clínicas", "Industria alimentaria", "Deporte", "Docencia"],
    perfilIdeal: { empatia: 82, prosocial: 85, habilidadesSociales: 80 },
    materiasClaveESPOL: ["Biología", "Química", "Matemáticas"],
    color: "#EAF3DE", icono: "🥗" },
];
