import { describe, it, expect } from "vitest";
import { BANCO_EXTRA_TESTS } from "@/data/banco24Extra";
import { TESTS, getTestById, calcularResultado } from "@/data/testdata";

const NEW_IDS = ["edad-mental", "decisiones-presion", "vision-vida", "modificacion-conducta"];

describe("4 nuevas pruebas psicométricas (banco24Extra)", () => {
  it("se cargan los 4 tests con id correcto", () => {
    expect(BANCO_EXTRA_TESTS).toHaveLength(4);
    const ids = BANCO_EXTRA_TESTS.map((t) => t.id);
    NEW_IDS.forEach((id) => expect(ids).toContain(id));
  });

  it("están integrados al array TESTS global", () => {
    NEW_IDS.forEach((id) => expect(getTestById(id)).toBeTruthy());
  });

  it.each(NEW_IDS)("'%s' cumple el schema esperado", (id) => {
    const t: any = getTestById(id);
    expect(t).toBeDefined();
    expect(t.estado).toBe("completo");
    expect(t.preguntas.length).toBeGreaterThanOrEqual(50);
    expect(t.opciones.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(t.subescalas)).toBe(true);
    expect(t.subescalas.length).toBe(5);
    expect(t.interpretacion.bajo).toBeTruthy();
    expect(t.interpretacion.medio).toBeTruthy();
    expect(t.interpretacion.alto).toBeTruthy();

    const subIds = new Set(t.subescalas.map((s: any) => s.id));
    for (const p of t.preguntas) {
      expect(p.id).toBeTruthy();
      expect(p.texto).toBeTruthy();
      expect(p.subescala).toBeTruthy();
      expect(subIds.has(p.subescala)).toBe(true);
    }
  });

  it.each(NEW_IDS)("calcularResultado('%s') produce niveles bajo/medio/alto coherentes", (id) => {
    const t: any = getTestById(id);
    const valores = t.opciones.map((o: any) => o.valor);
    const min = Math.min(...valores);
    const max = Math.max(...valores);

    const respMin: Record<string, number> = {};
    const respMax: Record<string, number> = {};
    const respMid: Record<string, number> = {};
    for (const p of t.preguntas) {
      respMin[p.id] = min;
      respMax[p.id] = max;
      respMid[p.id] = Math.round((min + max) / 2);
    }
    const rBajo = calcularResultado(t, respMin);
    const rAlto = calcularResultado(t, respMax);
    const rMedio = calcularResultado(t, respMid);

    expect(rBajo.interpretacion).toBe("bajo");
    expect(rAlto.interpretacion).toBe("alto");
    expect(["bajo", "medio", "alto"]).toContain(rMedio.interpretacion);
    expect(rBajo.puntaje_por_subescala).toBeTruthy();
    expect(Object.keys(rBajo.puntaje_por_subescala!)).toHaveLength(5);
  });
});
