// import React, { useContext } from 'react';
// // 💡 We only need these imports from react-router-dom in this file
// import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// import Header from './layouts/Header';
// import Footer from './layouts/Footer';
// import { AuthPage } from './pages/AuthPage';
// import { AuthContext } from './auth/AuthContext';
// import ProtectedRoute from './routers/ProtectedRoutes';
// import HomePage from './pages/HomePage';
// import AdminDashboard from './pages/admin/adminDashboard';
// import UserDashboard from './pages/UserDashboard';
// import EsewaSuccess from './pages/EsewaSuccess';
// import EsewaFailure from './pages/EsewaFailure';
// import ForgotPasswordPage from './pages/ForgetPasswordPage';
// import ResetPasswordPage from './pages/ResetPasswordPage';

// // A component to determine which dashboard to show upon login or when accessing /dashboard
// const DashboardRedirect = () => {
//   const { user } = useContext(AuthContext);

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // Redirect to the correct dashboard root based on user role
//   if (user.role === 'admin') {
//     return <Navigate to="/admin" replace />;
//   }

//   return <Navigate to="/user" replace />;
// };

// function App() {
//   const { user } = useContext(AuthContext);
//   const location = useLocation();

//   // Determine if the header and footer should be shown.
//   const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user');
//   const hideFooterRoutes = ['/login', '/register', '/forgot-password'];
//   const shouldShowFooter = !isDashboardRoute && !hideFooterRoutes.includes(location.pathname);

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
//       <ToastContainer
//         position="bottom-right"
//         autoClose={2000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="colored"
//       />

//       {!isDashboardRoute && !user && <Header />}

//       <main className="flex-grow w-full">
//         <Routes>
//           {/* Public Routes - redirect if logged in */}
//           <Route path="/" element={!user ? <HomePage /> : <DashboardRedirect />} />
//           <Route path="/login" element={!user ? <AuthPage /> : <DashboardRedirect />} />
//           <Route path="/register" element={!user ? <AuthPage /> : <DashboardRedirect />} />
//           <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <DashboardRedirect />} />
//           <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

//           {/* Redirect users based on role */}
//           <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

//           {/* Role-specific dashboard routes */}
//           <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
//           <Route path="/user/*" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />

//           {/* Payment Result Routes */}
//           <Route path="/payment/esewa/success" element={<ProtectedRoute><EsewaSuccess /></ProtectedRoute>} />
//           <Route path="/payment/esewa/failure" element={<ProtectedRoute><EsewaFailure /></ProtectedRoute>} />

//           {/* Fallback Route */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </main>

//       {shouldShowFooter && <Footer />}
//     </div>
//   );
// }

// // We export App directly. The Router should be in your main.jsx file.
// export default App;




import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './layouts/Header';
import Footer from './layouts/Footer';
import { AuthPage } from './pages/AuthPage';
import { AuthContext } from './auth/AuthContext';
import ProtectedRoute from './routers/ProtectedRoutes';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/admin/adminDashboard';
import SuperadminDashboard from './pages/admin/superadminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import EsewaSuccess from './pages/EsewaSuccess';
import EsewaFailure from './pages/EsewaFailure';
import ForgotPasswordPage from './pages/ForgetPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// A component to determine which dashboard to show upon login or when accessing /dashboard
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/user" replace />;
};

function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Determine if the header and footer should be shown.
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.startsWith('/superadmin');
  
  // Add the paths for the 404 and reset password pages to the list of routes that hide the footer.
  const hideFooterRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/404'];
  
  // Check if the current path starts with any of the paths that should hide the footer.
  const shouldShowFooter = !isDashboardRoute && !hideFooterRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {!isDashboardRoute && !user && <Header />}

      <main className="flex-grow w-full">
        <Routes>
          {/* Public Routes - redirect if logged in */}
          <Route path="/" element={!user ? <HomePage /> : <DashboardRedirect />} />
          <Route path="/login" element={!user ? <AuthPage /> : <DashboardRedirect />} />
          <Route path="/register" element={!user ? <AuthPage /> : <DashboardRedirect />} />
          <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <DashboardRedirect />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Redirect users based on role */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          {/* Role-specific dashboard routes */}
          <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/*" element={<ProtectedRoute requiredRole="superadmin"><SuperadminDashboard /></ProtectedRoute>} />
          <Route path="/user/*" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />

          {/* Payment Result Routes */}
          <Route path="/payment/esewa/success" element={<ProtectedRoute><EsewaSuccess /></ProtectedRoute>} />
          <Route path="/payment/esewa/failure" element={<ProtectedRoute><EsewaFailure /></ProtectedRoute>} />
          
          {/* Explicit 404 route */}
          <Route path="/404" element={<NotFoundPage />} />

          {/* Fallback Route now redirects to the explicit 404 page */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>

      {shouldShowFooter && <Footer />}
    </div>
  );
}

export default App;
