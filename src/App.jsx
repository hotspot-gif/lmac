import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { CustomAuthProvider } from '@/lib/customAuth';
import CustomProtectedRoute from '@/components/CustomProtectedRoute';
// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// App pages
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ReportIssue from '@/pages/ReportIssue';
import MyTickets from '@/pages/MyTickets';
import TicketDetails from '@/pages/TicketDetails';
import AllTickets from '@/pages/AllTickets';
import PendingCases from '@/pages/PendingCases';
import CompletedCases from '@/pages/CompletedCases';
import StaffManagement from '@/pages/StaffManagement';
import Profile from '@/pages/Profile';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <CustomAuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<CustomProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/my-tickets" element={<MyTickets />} />
                <Route path="/all-tickets" element={<AllTickets />} />
                <Route path="/pending-cases" element={<PendingCases />} />
                <Route path="/completed-cases" element={<CompletedCases />} />
                <Route path="/staff-management" element={<StaffManagement />} />
                <Route path="/tickets/:id" element={<TicketDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </CustomAuthProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App