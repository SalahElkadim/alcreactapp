import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        "https://alc-production-5d34.up.railway.app/users/login/",
        {
          email,
          password,
        }
      );

      // شيك إذا كان الـ user له صلاحيات admin
      if (!res.data.user.is_staff) {
        setError("ليس لديك صلاحيات الدخول لهذه الصفحة");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", res.data.tokens.access);
      localStorage.setItem("refresh_token", res.data.tokens.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setLoading(false);
      navigate("/add-book");
    } catch (err) {
      console.error("Login error:", err);

      // معالجة أفضل للأخطاء
      if (err.response?.status === 401) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (err.response?.status === 400) {
        setError("يرجى التأكد من صحة البيانات المدخلة");
      } else {
        setError("خطأ في تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى");
      }

      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="login-form" dir="rtl">
        <h2>لوحة التحكم الخاصة ببرنامج ALC</h2>

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "جاري التسجيل..." : "تسجيل الدخول"}
        </button>

        {error && <p className="error-msg">{error}</p>}
      </form>

      <style jsx>{`
        .login-form {
          max-width: 360px;
          margin: 80px auto;
          padding: 30px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
        }

        .login-form h2 {
          margin-bottom: 24px;
          color: #222;
        }

        .login-form input {
          width: 100%;
          padding: 12px 15px;
          margin: 10px 0 18px 0;
          border: 1.8px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
          direction: rtl;
        }

        .login-form input:focus {
          border-color: #007bff;
          outline: none;
        }

        .login-form button {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          border: none;
          color: white;
          font-weight: 600;
          font-size: 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .login-form button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .login-form button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .error-msg {
          margin-top: 16px;
          color: #e74c3c;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
