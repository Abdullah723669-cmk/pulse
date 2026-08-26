import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/ChatPage';
import { ExplorePage } from './pages/ExplorePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Main App Routes wrapped in Layout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Chat Full View */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <div className="flex justify-center bg-[#090d16] min-h-screen">
                      <div className="w-full max-w-7xl flex">
                        <MainLayout />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              >
                <Route index element={<ChatPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
