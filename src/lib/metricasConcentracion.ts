import { supabase } from "@/integrations/supabase/client";

/**
 * Métricas estándar para todos los ejercicios del módulo Concentración Visual.
 * Toda inserción en `resultados_ejercicios_concentracion` debe pasar por aquí
 * para que la página /student/concentracion y el panel admin puedan calcular
 * racha, precisión, minutos y comparativas con la misma lógica.
 */
export interface MetricasConcentracion {
  /** Duración real del ejercicio en segundos (>=0). Usado para "minutos hoy" y gráfico semanal. */
  duracion_segundos: number;
  /** Respuestas correctas. Usado para precisión 7 días. */
  aciertos: number;
  /** Respuestas incorrectas. Usado para precisión 7 días. */
  errores: number;
  /** Precisión 0-100 calculada. Redundante pero útil para queries rápidas. */
  precision: number;
  /** Puntaje específico del ejercicio (Stroop ms, Schulte tiempo, etc.). Opcional. */
  puntaje?: number;
  /** Nivel/dificultad alcanzada. Opcional. */
  nivel?: number | string;
  /** Datos extra específicos del ejercicio (sin romper el contrato común). */
  extra?: Record<string, unknown>;
}

export interface EntradaMetricas {
  duracion_segundos: number;
  aciertos?: number;
  errores?: number;
  puntaje?: number;
  nivel?: number | string;
  extra?: Record<string, unknown>;
}

/**
 * Normaliza valores crudos a la forma canónica:
 *  - Coerce a número, descarta NaN/negativos.
 *  - Calcula precisión (%) con redondeo entero.
 */
export function normalizarMetricas(input: EntradaMetricas): MetricasConcentracion {
  const dur = Math.max(0, Math.round(Number(input.duracion_segundos) || 0));
  const aciertos = Math.max(0, Math.round(Number(input.aciertos) || 0));
  const errores = Math.max(0, Math.round(Number(input.errores) || 0));
  const total = aciertos + errores;
  const precision = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  const out: MetricasConcentracion = {
    duracion_segundos: dur,
    aciertos,
    errores,
    precision,
  };
  if (input.puntaje !== undefined && !Number.isNaN(Number(input.puntaje))) {
    out.puntaje = Number(input.puntaje);
  }
  if (input.nivel !== undefined) out.nivel = input.nivel;
  if (input.extra && Object.keys(input.extra).length > 0) out.extra = input.extra;
  return out;
}

/**
 * Inserta un resultado de ejercicio de concentración respetando RLS:
 * el `user_id` debe coincidir con `auth.uid()` (lo provee el cliente autenticado).
 */
export async function guardarResultadoConcentracion(params: {
  userId: string;
  ejercicioId: string;
  completado?: boolean;
  metricasCrudas: EntradaMetricas;
}) {
  const metricas = normalizarMetricas(params.metricasCrudas);
  const { data, error } = await supabase
    .from("resultados_ejercicios_concentracion")
    .insert([
      {
        user_id: params.userId,
        ejercicio_id: params.ejercicioId,
        completado: params.completado ?? true,
        metricas: metricas as never,
      },
    ])
    .select()
    .single();

  return { data, error, metricas };
}
