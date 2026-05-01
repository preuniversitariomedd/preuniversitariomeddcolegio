// ============================================================
// testData.ts — Interfaces base usadas por testDataExtended.ts
// (Stub mínimo para que compile el archivo extendido. La data
//  real de tests vive en testdata.ts y banco24.ts.)
// ============================================================

export interface QuestionOption {
  label: string;
  value: number;
}

export interface Question {
  id: string;
  texto: string;
  opciones?: QuestionOption[];
  subescala?: string;
  invertida?: boolean;
}

export interface InterpretResult {
  nivel: "bajo" | "medio" | "alto";
  descripcion: string;
  subescalas?: Record<string, { puntaje: number; nivel: "bajo" | "medio" | "alto"; descripcion: string }>;
}

export interface Test {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  preguntas: Question[];
  opciones: QuestionOption[];
  tiempo_estimado: number;
  interpret?: (scores: Record<string, number>) => InterpretResult;
  [key: string]: any;
}
