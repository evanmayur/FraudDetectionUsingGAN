import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import SendTransaction from './pages/SendTransaction';
import TransactionHistory from './pages/TransactionHistory';
import AdminDashboard from './pages/AdminDashboard';
import LiveDemo from './pages/LiveDemo';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Live Demo - Exhibition Mode (no layout wrapper) */}
          <Route path="/demo" element={<LiveDemo />} />
          {/* Production Send Money with real API */}
          <Route path="/send" element={<SendTransaction />} />
          {/* Transaction History */}
          <Route path="/transactions" element={<TransactionHistory />} />
          {/* Admin Dashboard */}
          <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
          {/* Regular app routes with layout */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/send-money" element={<Layout><SendMoney /></Layout>} />
          <Route path="/settings" element={<Layout><Dashboard /></Layout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;



