// ============================================================
// Algoritmo de compatibilidad vocacional
// Usa los 3 tests existentes: IRI (empatía), EHS (habilidades
// sociales) y Prosocial. Ponderación: 35/30/35.
// ============================================================
import type { CarreraEspol } from "@/data/carrerasEspol";

export interface PerfilEstudiante {
  empatia: number;             // 0-100
  prosocial: number;           // 0-100
  habilidadesSociales: number; // 0-100
}

export interface DesgloseIndicador {
  label: string;          // "Empatía"
  key: "empatia" | "prosocial" | "habilidadesSociales";
  tuPuntaje: number;      // 0-100
  perfilIdeal: number;    // 0-100
  similitud: number;      // 0-100
  peso: number;           // % del total (35/30/35)
  aporte: number;         // similitud * peso / 100  (puntos que aporta al %)
  nivel: "alto" | "medio" | "bajo";
  explicacion: string;
}

export interface ResultadoCompatibilidad {
  carrera: CarreraEspol;
  porcentaje: number;
  factoresPositivos: string[];
  factoresNeutros: string[];
  factoresADesarrollar: string[];
  desglose: DesgloseIndicador[];
  nivelGlobal: "alto" | "medio" | "bajo";
  resumen: string;
}

// Puntajes máximos de cada test (según testdata.ts)
// IRI: 28 ítems × 4 = 112; EHS: 18 × 4 = 72; Prosocial: 16 × 4 = 64
const MAX_PUNTAJE = { iri: 112, ehs: 72, prosocial: 64 };

export function normalizarPerfil(
  resultadosTests: { test_id: string; puntaje_total: number | null }[]
): { perfil: PerfilEstudiante; testsUsados: number } {
  // Tomar el resultado más reciente por test_id (los datos vienen ordenados desc por fecha)
  const map = new Map<string, number>();
  for (const r of resultadosTests) {
    if (!map.has(r.test_id) && r.puntaje_total != null) {
      map.set(r.test_id, r.puntaje_total);
    }
  }
  const empatia = map.has("iri")
    ? Math.round((Math.min(map.get("iri")!, MAX_PUNTAJE.iri) / MAX_PUNTAJE.iri) * 100)
    : 50;
  const habilidadesSociales = map.has("ehs")
    ? Math.round((Math.min(map.get("ehs")!, MAX_PUNTAJE.ehs) / MAX_PUNTAJE.ehs) * 100)
    : 50;
  const prosocial = map.has("prosocial")
    ? Math.round((Math.min(map.get("prosocial")!, MAX_PUNTAJE.prosocial) / MAX_PUNTAJE.prosocial) * 100)
    : 50;

  const testsUsados = ["iri", "ehs", "prosocial"].filter((id) => map.has(id)).length;
  return { perfil: { empatia, habilidadesSociales, prosocial }, testsUsados };
}

export function calcularCompatibilidad(
  perfil: PerfilEstudiante,
  carreras: CarreraEspol[]
): ResultadoCompatibilidad[] {
  const PESOS = { empatia: 35, prosocial: 30, habilidadesSociales: 35 };

  return carreras
    .map((carrera) => {
      const ideal = carrera.perfilIdeal;
      const simEmpatia = 100 - Math.abs(perfil.empatia - ideal.empatia);
      const simProsocial = 100 - Math.abs(perfil.prosocial - ideal.prosocial);
      const simSocial = 100 - Math.abs(perfil.habilidadesSociales - ideal.habilidadesSociales);

      const porcentaje = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (simEmpatia * PESOS.empatia +
              simProsocial * PESOS.prosocial +
              simSocial * PESOS.habilidadesSociales) /
              100
          )
        )
      );

      const factoresPositivos: string[] = [];
      const factoresNeutros: string[] = [];
      const factoresADesarrollar: string[] = [];
      const clasificar = (sim: number, label: string) => {
        if (sim >= 80) factoresPositivos.push(label);
        else if (sim >= 60) factoresNeutros.push(label);
        else factoresADesarrollar.push(label);
      };
      clasificar(simEmpatia, "Empatía");
      clasificar(simProsocial, "Conducta prosocial");
      clasificar(simSocial, "Habilidades sociales");

      const nivelDe = (sim: number): "alto" | "medio" | "bajo" =>
        sim >= 80 ? "alto" : sim >= 60 ? "medio" : "bajo";

      const explicarIndicador = (
        label: string, tu: number, ideal: number, sim: number,
      ): string => {
        const diff = tu - ideal;
        if (sim >= 80) return `Tu nivel de ${label.toLowerCase()} (${tu}%) coincide con lo que esta carrera requiere (${ideal}%).`;
        if (sim >= 60) return `Tu ${label.toLowerCase()} (${tu}%) está cerca del ideal (${ideal}%); con práctica te alineas bien.`;
        return diff < 0
          ? `Tu ${label.toLowerCase()} (${tu}%) está por debajo de lo que la carrera demanda (${ideal}%). Es un área a desarrollar.`
          : `Tu ${label.toLowerCase()} (${tu}%) supera lo típico de la carrera (${ideal}%); puede que no aproveches todo tu potencial.`;
      };

      const desglose: DesgloseIndicador[] = [
        {
          label: "Empatía", key: "empatia", tuPuntaje: perfil.empatia, perfilIdeal: ideal.empatia,
          similitud: Math.round(simEmpatia), peso: PESOS.empatia,
          aporte: Math.round((simEmpatia * PESOS.empatia) / 100),
          nivel: nivelDe(simEmpatia),
          explicacion: explicarIndicador("Empatía", perfil.empatia, ideal.empatia, simEmpatia),
        },
        {
          label: "Conducta prosocial", key: "prosocial", tuPuntaje: perfil.prosocial, perfilIdeal: ideal.prosocial,
          similitud: Math.round(simProsocial), peso: PESOS.prosocial,
          aporte: Math.round((simProsocial * PESOS.prosocial) / 100),
          nivel: nivelDe(simProsocial),
          explicacion: explicarIndicador("Conducta prosocial", perfil.prosocial, ideal.prosocial, simProsocial),
        },
        {
          label: "Habilidades sociales", key: "habilidadesSociales", tuPuntaje: perfil.habilidadesSociales,
          perfilIdeal: ideal.habilidadesSociales, similitud: Math.round(simSocial), peso: PESOS.habilidadesSociales,
          aporte: Math.round((simSocial * PESOS.habilidadesSociales) / 100),
          nivel: nivelDe(simSocial),
          explicacion: explicarIndicador("Habilidades sociales", perfil.habilidadesSociales, ideal.habilidadesSociales, simSocial),
        },
      ];

      const nivelGlobal: "alto" | "medio" | "bajo" =
        porcentaje >= 80 ? "alto" : porcentaje >= 60 ? "medio" : "bajo";

      const resumen =
        nivelGlobal === "alto"
          ? `Compatibilidad alta (${porcentaje}%): tu perfil psicológico encaja muy bien con esta carrera.`
          : nivelGlobal === "medio"
            ? `Compatibilidad media (${porcentaje}%): hay buena base pero conviene fortalecer ${factoresADesarrollar.join(", ").toLowerCase() || "algunos aspectos"}.`
            : `Compatibilidad baja (${porcentaje}%): tu perfil actual difiere del ideal en ${factoresADesarrollar.join(", ").toLowerCase() || "varios indicadores"}.`;

      return {
        carrera, porcentaje, factoresPositivos, factoresNeutros, factoresADesarrollar,
        desglose, nivelGlobal, resumen,
      };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

