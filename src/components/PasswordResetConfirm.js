import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./PasswordResetConfirm.css"; // استيراد ملف الـ CSS

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

  const { userId, token } = useParams();

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
    <div className="password-reset-container" dir="rtl">
      <div className="password-reset-wrapper">
        <div className="password-reset-card">
          {/* Header */}
          <div className="password-reset-header">
            <div className="password-reset-icon">
              <Lock />
            </div>
            <h1 className="password-reset-title">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="password-reset-subtitle">
              قم بإدخال كلمة المرور الجديدة
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`password-reset-message ${messageType}`}>
              {messageType === "success" ? (
                <CheckCircle />
              ) : (
                <AlertCircle />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <div className="password-reset-form">
            {/* New Password */}
            <div className="password-reset-field">
              <label
                htmlFor="password"
                className="password-reset-label"
              >
                كلمة المرور الجديدة
              </label>
              <div className="password-reset-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="password-reset-input"
                  placeholder="أدخل كلمة المرور الجديدة"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-reset-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="password-reset-field">
              <label
                htmlFor="confirmPassword"
                className="password-reset-label"
              >
                تأكيد كلمة المرور
              </label>
              <div className="password-reset-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="password-reset-input"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-reset-toggle"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="password-requirements">
              <p>متطلبات كلمة المرور:</p>
              <ul>
                <li className={password.length >= 8 ? "text-green" : ""}>
                  8 أحرف على الأقل
                </li>
                <li
                  className={
                    password !== confirmPassword
                      ? "text-red"
                      : password && confirmPassword
                      ? "text-green"
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
              className="password-reset-button"
            >
              {loading ? (
                <>
                  <Loader className="loading" />
                  جاري التحديث...
                </>
              ) : (
                "تحديث كلمة المرور"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="password-reset-footer">
            <p>
              تذكرت كلمة المرور؟{" "}
              <a href="/login">
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