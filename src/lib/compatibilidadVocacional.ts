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

export interface ResultadoCompatibilidad {
  carrera: CarreraEspol;
  porcentaje: number;
  factoresPositivos: string[];
  factoresNeutros: string[];
  factoresADesarrollar: string[];
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

      return { carrera, porcentaje, factoresPositivos, factoresNeutros, factoresADesarrollar };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);
}
