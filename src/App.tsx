import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

const Login = lazy(() => import("./pages/Login"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEstudiantes = lazy(() => import("./pages/admin/Estudiantes"));
const AdminCursos = lazy(() => import("./pages/admin/Cursos"));
const AdminContenido = lazy(() => import("./pages/admin/Contenido"));
const AdminQuiz = lazy(() => import("./pages/admin/Quiz"));
const AdminCompetencia = lazy(() => import("./pages/admin/Competencia"));
const AdminBiblioteca = lazy(() => import("./pages/admin/Biblioteca"));
const AdminMensajes = lazy(() => import("./pages/admin/Mensajes"));
const StudentLayout = lazy(() => import("./components/StudentLayout"));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentCursos = lazy(() => import("./pages/student/Cursos"));
const StudentSesion = lazy(() => import("./pages/student/Sesion"));
const StudentCompetencia = lazy(() => import("./pages/student/Competencia"));
const StudentBiblioteca = lazy(() => import("./pages/student/Biblioteca"));
const StudentMensajes = lazy(() => import("./pages/student/Mensajes"));
const StudentPerfil = lazy(() => import("./pages/student/Perfil"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-display font-bold text-destructive">Algo salió mal</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">Recargar</button>
      </div>
    </div>
  );
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
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="estudiantes" element={<AdminEstudiantes />} />
                <Route path="cursos" element={<AdminCursos />} />
                <Route path="contenido" element={<AdminContenido />} />
                <Route path="quiz" element={<AdminQuiz />} />
                <Route path="competencia" element={<AdminCompetencia />} />
                <Route path="biblioteca" element={<AdminBiblioteca />} />
                <Route path="mensajes" element={<AdminMensajes />} />
              </Route>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="cursos" element={<StudentCursos />} />
                <Route path="sesion/:id" element={<StudentSesion />} />
                <Route path="competencia" element={<StudentCompetencia />} />
                <Route path="biblioteca" element={<StudentBiblioteca />} />
                <Route path="mensajes" element={<StudentMensajes />} />
                <Route path="perfil" element={<StudentPerfil />} />
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
