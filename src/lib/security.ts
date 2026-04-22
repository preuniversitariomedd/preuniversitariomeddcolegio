// ============================================================
// security.ts — utilidades de validación y sanitización
// ============================================================
import { z } from "zod";

/** Elimina caracteres potencialmente peligrosos en strings cortos. */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Schema reusable: texto corto seguro. */
export const safeText = (max = 500) =>
  z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => sanitizeText(v, max));

export const safeOptionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => sanitizeText(v, max))
    .optional();

export const cedulaSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "La cédula debe tener exactamente 10 dígitos");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const emailSchema = z.string().trim().email("Email inválido").max(255);

/** Lanza error si el rol no es admin. Úsese antes de cualquier mutación admin-only. */
export function checkAdminPermission(role: string | null): void {
  if (role !== "admin") {
    throw new Error("Acción no permitida: requiere permisos de administrador.");
  }
}
