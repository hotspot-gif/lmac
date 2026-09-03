import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';
import Layout from '@/components/Layout';

export default function CustomProtectedRoute() {
  const { currentUser, loading } = useCustomAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-destructive border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}