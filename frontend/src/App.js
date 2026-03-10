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
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import ClientLayout from './components/ClientLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCards from './pages/admin/AdminCards';
import AdminChat from './pages/admin/AdminChat';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminHoneypot from './pages/admin/AdminHoneypot';
import AccessPage from './pages/AccessPage';
import NotFoundPage from './pages/NotFoundPage';
import LegalPage from './pages/LegalPage';
import ReferralPage from './pages/ReferralPage';
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
        <Route path="/access/:token" element={<AccessPage />} />
        <Route path="/legal" element={<LegalPage />} />


        {/* Client Area */}
        <Route path="/app" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trade" element={<TradePage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdrawal" element={<WithdrawalPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="referral" element={<ReferralPage />} />
        </Route>

        {/* Admin Area */}
        <Route path="/adm/login" element={<AdminLogin />} />
        <Route path="/adm" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="honeypot" element={<AdminHoneypot />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
