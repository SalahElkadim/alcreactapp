import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

const PasswordResetConfirm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");

  // استخراج التوكين ومعرف المستخدم من الـ URL
  useEffect(() => {
    const currentUrl = window.location.pathname;
    const urlParts = currentUrl.split("/");

    // استخراج userId والتوكين من الـ URL
    // URL format: /users/reset-password-confirm/{userId}/{token}/
    if (urlParts.length >= 5) {
      setUserId(urlParts[3]);
      setToken(urlParts[4]);
    }
  }, []);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    }
    return "";
  };

  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("كلمات المرور غير متطابقة");
      setMessageType("error");
      return;
    }

    if (!userId || !token) {
      setMessage("رابط غير صالح أو منتهي الصلاحية");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `https://alc-production-9985.up.railway.app/users/reset-password-confirm/${userId}/${token}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_password: password,
          }),
        }
      );

      if (response.ok) {
        setMessage("تم تغيير كلمة المرور بنجاح!");
        setMessageType("success");
        setPassword("");
        setConfirmPassword("");

        // إعادة توجيه المستخدم بعد 3 ثوان
        setTimeout(() => {
          window.location.href = "/login"; // أو أي صفحة تسجيل دخول لديك
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || "حدث خطأ أثناء تغيير كلمة المرور");
        setMessageType("error");
      }
    } catch (error) {
      console.error("خطأ:", error);
      setMessage("حدث خطأ في الاتصال بالخادم");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-gray-600">قم بإدخال كلمة المرور الجديدة</p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                messageType === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="أدخل كلمة المرور الجديدة"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>متطلبات كلمة المرور:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li className={password.length >= 8 ? "text-green-600" : ""}>
                  8 أحرف على الأقل
                </li>
                <li
                  className={
                    password !== confirmPassword
                      ? "text-red-600"
                      : password && confirmPassword
                      ? "text-green-600"
                      : ""
                  }
                >
                  تطابق كلمة المرور
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "تحديث كلمة المرور"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              تذكرت كلمة المرور؟{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                تسجيل الدخول
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
