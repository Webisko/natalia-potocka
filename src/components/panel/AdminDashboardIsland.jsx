import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPanelFrame from './AdminPanelFrame.jsx';

export default function AdminDashboardIsland({ initialTab = 'pages' }) {
  return (
    <AdminPanelFrame title="Panel administratora">
      <AdminDashboard initialTab={initialTab} />
    </AdminPanelFrame>
  );
}