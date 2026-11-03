import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Checklist from './pages/Checklist';
import Rooms from './pages/Rooms';
import Reports from './pages/Reports';

export default function App() {
  return <>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/salas" element={<Rooms />} />
      <Route path="/relatorios" element={<Reports />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
    <Toaster position="top-right" />
  </>;
}
