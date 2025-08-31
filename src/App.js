import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import BookQuestions from "./BookQuestions";
import PrivateRoute from "./PrivateRoute";
import PasswordResetConfirm from "./components/PasswordResetConfirm";

// استيراد صفحات الدفع
import PaymentPage from "./PaymentPage";
import PaymentStatusPage from "./PaymentStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* إعادة توجيه من الصفحة الرئيسية للوحة التحكم */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<LoginPage />} />

        {/* لوحة التحكم محمية */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* صفحة الأسئلة محمية */}
        <Route
          path="/books/:bookId/questions"
          element={
            <PrivateRoute>
              <BookQuestions />
            </PrivateRoute>
          }
        />

        {/* صفحة الدفع */}
        <Route path="/payment" element={<PaymentPage />} />

        {/* صفحة حالة الدفع */}
        <Route
          path="/payment-status/:paymentId"
          element={<PaymentStatusPage />}
        />

        {/* إعادة توجيه أي مسار غير موجود */}
        <Route path="*" element={<Navigate to="/dashboard" />} />

        {/* صفحة إعادة تعيين كلمة المرور */}
        <Route
          path="/users/reset-password-confirm/:userId/:token"
          element={<PasswordResetConfirm />}
        />
      </Routes>
    </BrowserRouter>
  );
}
