import { lazy, Suspense } from 'react';
import Loading from './components/Loading';
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
const Checklist = lazy(() => import("./pages/Checklist"));
import Rooms from "./pages/Rooms";
const Reports = lazy(() => import("./pages/Reports"));

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="page"><Loading label="Carregando página…" /></div>}><Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/salas" element={<Rooms />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="*" element={<Dashboard />} />
      </Routes></Suspense>
      <Toaster position="top-right" />
    </>
  );
}
