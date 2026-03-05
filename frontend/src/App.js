import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import TradePage from './pages/TradePage';
import DepositPage from './pages/DepositPage';
import WithdrawalPage from './pages/WithdrawalPage';
import NewsPage from './pages/NewsPage';
import ProfilePage from './pages/ProfilePage';
import ClientLayout from './components/ClientLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCards from './pages/admin/AdminCards';
import AdminLayout from './components/AdminLayout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/adm/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Client Area */}
        <Route path="/app" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/trade" replace />} />
          <Route path="trade" element={<TradePage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdrawal" element={<WithdrawalPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Area */}
        <Route path="/adm/login" element={<AdminLogin />} />
        <Route path="/adm" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="cards" element={<AdminCards />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
