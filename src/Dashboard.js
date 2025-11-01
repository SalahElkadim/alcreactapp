import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";

// Constants
const API_BASE_URL = "https://alc-production-5d34.up.railway.app/questions";

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceSar, setPriceSar] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [fetchingBooks, setFetchingBooks] = useState(true);
  const navigate = useNavigate();

  const [resetRequests, setResetRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }, []);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.is_staff) {
      navigate("/login");
      return;
    }
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchResetRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBooks = async () => {
    setFetchingBooks(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/books/`, { headers });
      setBooks(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError("حدث خطأ أثناء تحميل الكتب.");

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setFetchingBooks(false);
    }
  };

  const fetchResetRequests = async () => {
    setLoadingRequests(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(
        "https://alc-production-5d34.up.railway.app/users/password-reset-requests/",
        { headers }
      );
      setResetRequests(res.data);
    } catch (err) {
      console.error("Error fetching reset requests:", err);
      setError("حدث خطأ أثناء تحميل طلبات نسيان كلمة المرور.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleMarkAsHandled = async (id) => {
    try {
      const headers = getAuthHeaders();
      await axios.patch(
        `https://alc-production-5d34.up.railway.app/users/password-reset-requests/${id}/`,
        { is_handled: true },
        { headers }
      );
      setResetRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_handled: true } : r))
      );
    } catch (err) {
      console.error("Error updating request:", err);
      setError("حدث خطأ أثناء تحديث الحالة.");
    }
  };

  // وظيفة النسخ
  const handleCopyLink = async (link, id) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("فشل نسخ الرابط");
    }
  };

  const handleViewQuestions = (bookId) => {
    navigate(`/books/${bookId}/questions`);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("عنوان الكتاب مطلوب.");
      return false;
    }

    if (priceSar && (isNaN(priceSar) || parseFloat(priceSar) < 0)) {
      setError("السعر يجب أن يكون رقم موجب.");
      return false;
    }

    return true;
  };

  const handleAddOrUpdateBook = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const headers = getAuthHeaders();
      const bookData = {
        title: title.trim(),
        description: description.trim(),
        price_sar: priceSar ? parseFloat(priceSar) : 0,
      };

      let res;
      if (editingBook) {
        res = await axios.put(
          `${API_BASE_URL}/books/${editingBook.id}/`,
          bookData,
          { headers }
        );
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === editingBook.id ? res.data : book
          )
        );
        setMessage("تم تحديث الكتاب بنجاح.");
      } else {
        res = await axios.post(`${API_BASE_URL}/books/`, bookData, { headers });
        setBooks((prevBooks) => [...prevBooks, res.data]);
        setMessage("تم إضافة الكتاب بنجاح.");
      }

      setTitle("");
      setDescription("");
      setPriceSar("");
      setEditingBook(null);
    } catch (err) {
      console.error("Error adding/updating book:", err);

      if (err.response?.status === 401) {
        setError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 400) {
        setError("بيانات غير صحيحة. يرجى المحاولة مرة أخرى.");
      } else {
        setError("حدث خطأ أثناء معالجة الطلب.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book) => {
    setTitle(book.title);
    setDescription(book.description || "");
    setPriceSar(book.price_sar ? book.price_sar.toString() : "");
    setEditingBook(book);
    setMessage(null);
    setError(null);

    document.querySelector(".dashboard-form")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setPriceSar("");
    setEditingBook(null);
    setMessage(null);
    setError(null);
  };

  const handleDeleteBook = async (id, bookTitle) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكتاب "${bookTitle}"؟`)) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/books/${id}/`, { headers });

      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
      setMessage("تم حذف الكتاب بنجاح.");

      if (editingBook?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Error deleting book:", err);

      if (err.response?.status === 401) {
        setError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("حدث خطأ أثناء حذف الكتاب.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  if (fetchingBooks) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>إدارة الكتب</h1>
        <button onClick={handleLogout} className="logout-btn">
          تسجيل الخروج
        </button>
      </div>

      <form onSubmit={handleAddOrUpdateBook} className="dashboard-form">
        <h2>{editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}</h2>

        <input
          type="text"
          placeholder="عنوان الكتاب *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="dashboard-input"
          maxLength={255}
        />

        <textarea
          placeholder="الوصف (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="dashboard-textarea"
          maxLength={1000}
        />

        <input
          type="number"
          placeholder="السعر بالريال السعودي (اختياري)"
          value={priceSar}
          onChange={(e) => setPriceSar(e.target.value)}
          className="dashboard-input"
          min="0"
          step="0.01"
        />

        <div className="form-buttons">
          <button type="submit" disabled={loading} className="dashboard-button">
            {loading
              ? "جاري المعالجة..."
              : editingBook
              ? "تحديث الكتاب"
              : "إضافة الكتاب"}
          </button>

          {editingBook && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="cancel-button"
              disabled={loading}
            >
              إلغاء
            </button>
          )}
        </div>

        {message && <p className="message-success">{message}</p>}
        {error && <p className="message-error">{error}</p>}
      </form>

      <div className="books-list">
        <h3>قائمة الكتب ({books.length})</h3>

        {books.length === 0 ? (
          <p className="no-books">لا توجد كتب مضافة حتى الآن.</p>
        ) : (
          <ul>
            {books.map((book) => (
              <li
                key={book.id}
                className={editingBook?.id === book.id ? "editing" : ""}
              >
                <div className="book-info">
                  <h4>{book.title}</h4>
                  {book.description && (
                    <p title={book.description}>{book.description}</p>
                  )}
                  <p className="book-price">
                    السعر: {book.price_sar ? `${book.price_sar} ر.س` : "مجاني"}
                  </p>
                  <small className="book-id">ID: {book.id}</small>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => handleEditBook(book)}
                    className="edit-btn"
                    disabled={loading}
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id, book.title)}
                    className="delete-btn"
                    disabled={loading}
                  >
                    حذف
                  </button>
                  <button
                    onClick={() => handleViewQuestions(book.id)}
                    className="view-questions-btn"
                  >
                    عرض الأسئلة
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="reset-requests-section">
        <h3>طلبات نسيان كلمة المرور ({resetRequests.length})</h3>
        {loadingRequests ? (
          <p>جاري تحميل الطلبات...</p>
        ) : resetRequests.length === 0 ? (
          <p className="no-requests">لا توجد طلبات جديدة.</p>
        ) : (
          <ul className="reset-requests-list">
            {resetRequests.map((req) => (
              <li key={req.id} className={req.is_handled ? "handled" : ""}>
                <div>
                  <strong>📧 {req.email}</strong>
                  <div className="reset-link-container">
                    <a
                      href={req.reset_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      رابط إعادة التعيين
                    </a>
                    <button
                      className={`copy-btn ${
                        copiedId === req.id ? "copied" : ""
                      }`}
                      onClick={() => handleCopyLink(req.reset_link, req.id)}
                    >
                      {copiedId === req.id ? "✓ تم النسخ" : "📋 نسخ"}
                    </button>
                  </div>
                  <small>
                    ⏰ {new Date(req.created_at).toLocaleString("ar-EG")}
                  </small>
                </div>
                <div>
                  {req.is_handled ? (
                    <span className="status-done">✅ تم الرد</span>
                  ) : (
                    <button
                      className="mark-done-btn"
                      onClick={() => handleMarkAsHandled(req.id)}
                    >
                      تم الرد
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
