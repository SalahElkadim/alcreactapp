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
  const [priceSar, setPriceSar] = useState(""); // 💰 حقل السعر الجديد
  const [editingBook, setEditingBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [fetchingBooks, setFetchingBooks] = useState(true);
  const navigate = useNavigate();

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

      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setFetchingBooks(false);
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

    // التحقق من صحة السعر
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
        price_sar: priceSar ? parseFloat(priceSar) : 0, // 💰 إرسال السعر
      };

      let res;
      if (editingBook) {
        // تحديث كتاب موجود
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
        // إضافة كتاب جديد
        res = await axios.post(`${API_BASE_URL}/books/`, bookData, { headers });
        setBooks((prevBooks) => [...prevBooks, res.data]);
        setMessage("تم إضافة الكتاب بنجاح.");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPriceSar(""); // 💰 مسح حقل السعر
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
    setPriceSar(book.price_sar ? book.price_sar.toString() : ""); // 💰 تعبئة السعر
    setEditingBook(book);
    setMessage(null);
    setError(null);

    // Scroll to form
    document.querySelector(".dashboard-form")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setPriceSar(""); // 💰 مسح السعر
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

      // If we were editing this book, cancel the edit
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
      {/* Header with logout button */}
      <div className="dashboard-header">
        <h1>إدارة الكتب</h1>
        <button onClick={handleLogout} className="logout-btn">
          تسجيل الخروج
        </button>
      </div>

      {/* Add/Edit Form */}
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

        {/* 💰 حقل السعر الجديد */}
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

      {/* Books List */}
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
                  {/* 💰 عرض السعر */}
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
    </div>
  );
}
