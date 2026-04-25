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

// ───────────────── Cédula ecuatoriana (algoritmo módulo 10) ─────────────────
export function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 5) return false; // personas naturales
  const digitos = cedula.split("").map(Number);
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    suma += val;
  }
  const verificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return verificador === digitos[9];
}

// ───────────────── Ofuscación localStorage (NO es cifrado real) ─────────────────
// btoa + encodeURIComponent: oculta el contenido a una inspección casual,
// pero un usuario técnico puede revertirlo. Solo para datos no sensibles
// (contadores de intentos, marcas de bloqueo). NO usar para contraseñas o tokens.
export function encodeStorage(data: string): string {
  try { return btoa(encodeURIComponent(data)); } catch { return ""; }
}
export function decodeStorage(data: string): string {
  try { return decodeURIComponent(atob(data)); } catch { return ""; }
}

// ───────────────── Fortaleza de contraseña ─────────────────
export type PasswordStrength = "debil" | "media" | "fuerte";
export function passwordStrength(p: string): PasswordStrength {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 2) return "debil";
  if (score <= 4) return "media";
  return "fuerte";
}
