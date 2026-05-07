import { describe, it, expect } from "vitest";
import { construirPerfil360, NIVEL_TEXTOS } from "@/lib/perfil360";
import { getTestById, calcularResultado } from "@/data/testdata";

const NEW_IDS = ["edad-mental", "decisiones-presion", "vision-vida", "modificacion-conducta"];

function resultadoMaxParaTest(testId: string) {
  const t: any = getTestById(testId)!;
  const max = Math.max(...t.opciones.map((o: any) => o.valor));
  const resp: Record<string, number> = {};
  for (const p of t.preguntas) resp[p.id] = max;
  const r = calcularResultado(t, resp);
  return {
    test_id: testId,
    puntaje_total: r.puntaje_total,
    puntaje_por_subescala: r.puntaje_por_subescala,
    fecha: new Date().toISOString(),
  };
}

describe("Perfil 360 — dimensiones complementarias precisas", () => {
  it("incluye los 4 tests nuevos en dimensionesComplementarias y calcula nivel global alto con respuestas máximas", () => {
    const resultados = NEW_IDS.map(resultadoMaxParaTest);
    const perfil = construirPerfil360(resultados, null);
    expect(perfil.dimensionesComplementarias).toHaveLength(4);
    for (const dim of perfil.dimensionesComplementarias) {
      expect(NEW_IDS).toContain(dim.testId);
      expect(dim.completado).toBe(true);
      expect(dim.subescalas.length).toBe(5);
      expect(dim.nivelGlobal).toBe("alto");
      expect(dim.promedio).toBeGreaterThanOrEqual(85);
      for (const s of dim.subescalas) {
        expect(s.porcentaje).toBeGreaterThanOrEqual(0);
        expect(s.porcentaje).toBeLessThanOrEqual(100);
        expect(["bajo", "medio", "alto"]).toContain(s.nivel);
        expect(s.interpretacion.length).toBeGreaterThan(5);
      }
    }
  });

  it("marca completado=false para tests no realizados", () => {
    const perfil = construirPerfil360([], null);
    for (const dim of perfil.dimensionesComplementarias) {
      expect(dim.completado).toBe(false);
      expect(dim.nivelGlobal).toBeNull();
      expect(dim.subescalas).toEqual([]);
    }
  });

  it("todas las subescalas de los 4 tests nuevos tienen mapeo en NIVEL_TEXTOS", () => {
    const faltantes: string[] = [];
    for (const id of NEW_IDS) {
      const t: any = getTestById(id)!;
      for (const s of t.subescalas) {
        if (!NIVEL_TEXTOS[s.id]) faltantes.push(`${id}:${s.id}`);
      }
    }
    expect(faltantes).toEqual([]);
  });

  it("porcentajeCompletitud refleja avance del banco", () => {
    const perfil0 = construirPerfil360([], null);
    expect(perfil0.porcentajeCompletitud).toBe(0);
    const resultados = NEW_IDS.map(resultadoMaxParaTest);
    const perfil = construirPerfil360(resultados, null);
    expect(perfil.testsCompletados).toBe(4);
    expect(perfil.porcentajeCompletitud).toBeGreaterThan(0);
  });
});
