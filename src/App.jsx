import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './modules/auth/pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './modules/dashboard/pages/DashboardPage'
import ProductsPage from './modules/products/pages/ProductsPage'
import ProductFormPage from './modules/products/pages/ProductFormPage'
import CategoriesPage from './modules/categories/pages/CategoriesPage'
import OrdersPage from './modules/orders/pages/OrdersPage'
import OrderDetailPage from './modules/orders/pages/OrderDetailPage'
import CustomersPage from './modules/customers/pages/CustomersPage'
import CustomerDetailPage from './modules/customers/pages/CustomerDetailPage'
import InventoryPage from './modules/inventory/pages/InventoryPage'
import ReportsPage from './modules/reports/pages/ReportsPage'
import AnaliticaPage from './modules/analytics/pages/AnaliticaPage'
import BannersPage from './modules/banners/pages/BannersPage'
import ColeccionesPage from './modules/colecciones/pages/ColeccionesPage'
import SettingsPage from './modules/settings/pages/SettingsPage'
import CollaboratorsPage from './modules/collaborators/pages/CollaboratorsPage'
import LocalSalePage from './modules/local-sale/pages/LocalSalePage'
import AuditLogPage from './modules/audit-log/pages/AuditLogPage'
import DevolucionesPage from './modules/returns/pages/DevolucionesPage'
import QuestionsPage from './modules/questions/pages/QuestionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Tienda */}
            <Route path="productos" element={<ProductsPage />} />
            <Route path="productos/nuevo" element={<ProductFormPage />} />
            <Route path="productos/:id/editar" element={<ProductFormPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="colecciones" element={<ColeccionesPage />} />
            <Route path="inventario" element={<InventoryPage />} />

            {/* Ventas */}
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="pedidos/:id" element={<OrderDetailPage />} />
            <Route path="devoluciones" element={<DevolucionesPage />} />
            <Route path="preguntas" element={<QuestionsPage />} />
            <Route path="venta-local" element={<LocalSalePage />} />
            <Route path="clientes" element={<CustomersPage />} />
            <Route path="clientes/:id" element={<CustomerDetailPage />} />

            {/* Análisis */}
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="analitica" element={<AnaliticaPage />} />

            {/* Sistema */}
            <Route path="banners" element={<BannersPage />} />
            <Route path="colaboradores" element={<CollaboratorsPage />} />
            <Route path="auditoria" element={<AuditLogPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
