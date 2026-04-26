import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEstudiantes = lazy(() => import("./pages/admin/Estudiantes"));
const AdminCursos = lazy(() => import("./pages/admin/Cursos"));
const AdminGrupos = lazy(() => import("./pages/admin/Grupos"));
const AdminContenido = lazy(() => import("./pages/admin/Contenido"));
const AdminQuiz = lazy(() => import("./pages/admin/Quiz"));
const AdminCompetencia = lazy(() => import("./pages/admin/Competencia"));
const AdminBiblioteca = lazy(() => import("./pages/admin/Biblioteca"));
const AdminMensajes = lazy(() => import("./pages/admin/Mensajes"));
const AdminPerfil = lazy(() => import("./pages/admin/Perfil"));
const AdminPsicometria = lazy(() => import("./pages/admin/Psicometria"));
const StudentLayout = lazy(() => import("./components/StudentLayout"));
const StudentPsicometria = lazy(() => import("./pages/student/Psicometria"));
const StudentPsicometriaTest = lazy(() => import("./pages/student/PsicometriaTest"));
const StudentConcentracion = lazy(() => import("./pages/student/Concentracion"));
const StudentStroop = lazy(() => import("./pages/student/concentracion/StroopExercise"));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentCursos = lazy(() => import("./pages/student/Cursos"));
const StudentSesion = lazy(() => import("./pages/student/Sesion"));
const StudentCompetencia = lazy(() => import("./pages/student/Competencia"));
const StudentBiblioteca = lazy(() => import("./pages/student/Biblioteca"));
const StudentMensajes = lazy(() => import("./pages/student/Mensajes"));
const StudentPerfil = lazy(() => import("./pages/student/Perfil"));
const StudentOrientacion = lazy(() => import("./pages/student/OrientacionVocacional"));
const StudentCompararCarreras = lazy(() => import("./pages/student/CompararCarreras"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const APP_INFO = {
  nombre: "PreUniversitario MEDD",
  version: "2.0.0",
  autor: "Víctor Cañizares González",
  fundacion: "2020-01-09",
  copyright: "© 2020-2026 Víctor Cañizares González",
  descripcion: "Plataforma educativa digital para preparación universitaria",
  contacto: "admin@meddprepolitecnico.com",
} as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="estudiantes" element={<AdminEstudiantes />} />
                <Route path="cursos" element={<AdminCursos />} />
                <Route path="grupos" element={<AdminGrupos />} />
                <Route path="contenido" element={<AdminContenido />} />
                <Route path="quiz" element={<AdminQuiz />} />
                <Route path="competencia" element={<AdminCompetencia />} />
                <Route path="biblioteca" element={<AdminBiblioteca />} />
                <Route path="mensajes" element={<AdminMensajes />} />
                <Route path="perfil" element={<AdminPerfil />} />
                <Route path="psicometria" element={<AdminPsicometria />} />
              </Route>
              <Route
                path="/student"
                element={
                  <ProtectedRoute requireRole="estudiante">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="cursos" element={<StudentCursos />} />
                <Route path="sesion/:id" element={<StudentSesion />} />
                <Route path="competencia" element={<StudentCompetencia />} />
                <Route path="biblioteca" element={<StudentBiblioteca />} />
                <Route path="mensajes" element={<StudentMensajes />} />
                <Route path="perfil" element={<StudentPerfil />} />
                <Route path="psicometria" element={<StudentPsicometria />} />
                <Route path="psicometria/:testId" element={<StudentPsicometriaTest />} />
                <Route path="concentracion" element={<StudentConcentracion />} />
                <Route path="concentracion/stroop" element={<StudentStroop />} />
                <Route path="orientacion-vocacional" element={<StudentOrientacion />} />
                <Route path="comparar-carreras" element={<StudentCompararCarreras />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
