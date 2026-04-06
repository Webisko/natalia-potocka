import AdminProductEdit from './pages/AdminProductEdit.jsx';
import AdminPanelFrame from './AdminPanelFrame.jsx';

export default function AdminProductEditIsland({ productId = 'new' }) {
  return (
    <AdminPanelFrame title="Panel administratora">
      <AdminProductEdit productId={productId} />
    </AdminPanelFrame>
  );
}