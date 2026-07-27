import { Routes, Route } from 'react-router';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import RepositoriesPage from './pages/RepositoriesPage';
import DashboardPage from './pages/DashboardPage';
import RepositoryDetailPage from './pages/RepositoryDetailPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import AIPage from './pages/AIPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/repositories/:id" element={<RepositoryDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
