import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./dashboard.css";
import "./BookQuestions.css";

// Constants
const API_BASE_URL = "https://alc-production-5d34.up.railway.app/questions";

export default function BookQuestions() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // State management
  const [book, setBook] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [readingPassages, setReadingPassages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toggle visibility states for each question section
  const [showMCQ, setShowMCQ] = useState(true);
  const [showMatching, setShowMatching] = useState(true);
  const [showTrueFalse, setShowTrueFalse] = useState(true);

  // Modal state for MCQ Add/Edit
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState(null); // null for add, object for edit
  const [mcqForm, setMcqForm] = useState({
    text: "",
    difficulty: "easy",
    mcq_choices: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });
  // for Reading
  const [showReading, setShowReading] = useState(true);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [readingForm, setReadingForm] = useState({
    title: "",
    content: "",
    questions_data: [
      {
        question: "",
        choices: ["", "", "", ""],
        correct_answer: "",
      },
    ],
  });

  // Modal state for Matching Add/Edit
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [editingMatching, setEditingMatching] = useState(null); // null for add, object for edit
  const [matchingForm, setMatchingForm] = useState({
    text: "",
    difficulty: "easy",
    matching_pairs: [
      { match_key: "A", left_item: "", right_item: "" },
      { match_key: "B", left_item: "", right_item: "" },
    ],
  });

  // Modal state for True/False Add/Edit
  const [showTrueFalseModal, setShowTrueFalseModal] = useState(false);
  const [editingTrueFalse, setEditingTrueFalse] = useState(null); // null for add, object for edit
  const [trueFalseForm, setTrueFalseForm] = useState({
    text: "",
    difficulty: "easy",
    is_true: true,
  });

  // MCQ Modal handlers
  const openMCQModal = (mcqToEdit = null) => {
    setEditingMCQ(mcqToEdit);
    if (mcqToEdit) {
      // Edit mode - populate form with existing data
      setMcqForm({
        text: mcqToEdit.text,
        difficulty: mcqToEdit.difficulty,
        mcq_choices: mcqToEdit.mcq_choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          is_correct: choice.is_correct,
        })),
      });
    } else {
      // Add mode - reset form
      setMcqForm({
        text: "",
        difficulty: "easy",
        mcq_choices: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      });
    }
    setShowMCQModal(true);
  };

  const closeMCQModal = () => {
    setShowMCQModal(false);
    setEditingMCQ(null);
  };

  // Matching Modal handlers
  const openMatchingModal = (matchingToEdit = null) => {
    setEditingMatching(matchingToEdit);
    if (matchingToEdit) {
      // Edit mode - populate form with existing data
      setMatchingForm({
        text: matchingToEdit.text,
        difficulty: matchingToEdit.difficulty,
        matching_pairs: matchingToEdit.matching_pairs
          ? // Handle new response format
            Array.isArray(matchingToEdit.matching_pairs[0]?.left_item)
            ? matchingToEdit.matching_pairs[0].left_item.map(
                (leftItem, index) => ({
                  id: index, // or use actual id if available
                  match_key: String.fromCharCode(65 + index),
                  left_item: leftItem,
                  right_item:
                    matchingToEdit.matching_pairs[1].right_item[index],
                })
              )
            : // Handle old format if still exists
              matchingToEdit.matching_pairs.map((pair, index) => ({
                id: pair.id,
                match_key: pair.match_key || String.fromCharCode(65 + index),
                left_item: pair.left_item,
                right_item: pair.right_item,
              }))
          : // Default if no matching_pairs
            [
              { match_key: "A", left_item: "", right_item: "" },
              { match_key: "B", left_item: "", right_item: "" },
            ],
      });
    } else {
      // Add mode - reset form
      setMatchingForm({
        text: "",
        difficulty: "easy",
        matching_pairs: [
          { match_key: "A", left_item: "", right_item: "" },
          { match_key: "B", left_item: "", right_item: "" },
        ],
      });
    }
    setShowMatchingModal(true);
  };

  const closeMatchingModal = () => {
    setShowMatchingModal(false);
    setEditingMatching(null);
  };

  // True/False Modal handlers
  const openTrueFalseModal = (trueFalseToEdit = null) => {
    setEditingTrueFalse(trueFalseToEdit);
    if (trueFalseToEdit) {
      // Edit mode - populate form with existing data
      setTrueFalseForm({
        text: trueFalseToEdit.text,
        difficulty: trueFalseToEdit.difficulty,
        is_true: trueFalseToEdit.is_true,
      });
    } else {
      // Add mode - reset form
      setTrueFalseForm({
        text: "",
        difficulty: "easy",
        is_true: true,
      });
    }
    setShowTrueFalseModal(true);
  };

  const closeTrueFalseModal = () => {
    setShowTrueFalseModal(false);
    setEditingTrueFalse(null);
  };

  // MCQ Form handlers
  const handleMcqChange = (e) => {
    const { name, value } = e.target;
    setMcqForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...mcqForm.mcq_choices];

    if (field === "is_correct") {
      // Only one correct answer allowed - make it exclusive
      newChoices.forEach((choice, i) => {
        choice.is_correct = i === index ? value : false;
      });
    } else {
      newChoices[index][field] = value;
    }

    setMcqForm((prev) => ({ ...prev, mcq_choices: newChoices }));
  };

  // Matching Form handlers
  const handleMatchingChange = (e) => {
    const { name, value } = e.target;
    setMatchingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePairChange = (index, field, value) => {
    const newPairs = [...matchingForm.matching_pairs];
    newPairs[index][field] = value;
    setMatchingForm((prev) => ({ ...prev, matching_pairs: newPairs }));
  };
  // Reading Modal handlers
  const openReadingModal = (readingToEdit = null) => {
    setEditingReading(readingToEdit);
    if (readingToEdit) {
      setReadingForm({
        title: readingToEdit.title,
        difficulty:readingToEdit.difficulty,
        content: readingToEdit.content,
        questions_data: readingToEdit.questions_data || [],
      });
    } else {
      setReadingForm({
        title: "",
        content: "",
        difficulty:"easy",
        questions_data: [
          {
            question: "",
            choices: ["", "", "", ""],
            correct_answer: "",
          },
        ],
      });
    }
    setShowReadingModal(true);
  };

  const closeReadingModal = () => {
    setShowReadingModal(false);
    setEditingReading(null);
  };

  // Reading Form handlers
  const handleReadingChange = (e) => {
    const { name, value } = e.target;
    setReadingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...readingForm.questions_data];
    newQuestions[index][field] = value;
    setReadingForm((prev) => ({ ...prev, questions_data: newQuestions }));
  };

  const handleChoiceChangeReading = (questionIndex, choiceIndex, value) => {
    const newQuestions = [...readingForm.questions_data];
    newQuestions[questionIndex].choices[choiceIndex] = value;
    setReadingForm((prev) => ({ ...prev, questions_data: newQuestions }));
  };

  const addReadingQuestion = () => {
    setReadingForm((prev) => ({
      ...prev,
      questions_data: [
        ...prev.questions_data,
        {
          question: "",
          choices: ["", "", "", ""],
          correct_answer: "",
        },
      ],
    }));
  };

  const removeReadingQuestion = (index) => {
    const newQuestions = readingForm.questions_data.filter(
      (_, i) => i !== index
    );
    setReadingForm((prev) => ({ ...prev, questions_data: newQuestions }));
  };

  // True/False Form handlers
  const handleTrueFalseChange = (e) => {
    const { name, value, type } = e.target;
    setTrueFalseForm((prev) => ({
      ...prev,
      [name]: type === "radio" ? value === "true" : value,
    }));
  };

  // Add new choice
  const addChoice = () => {
    setMcqForm((prev) => ({
      ...prev,
      mcq_choices: [...prev.mcq_choices, { text: "", is_correct: false }],
    }));
  };

  // Remove choice
  const removeChoice = (index) => {
    const newChoices = mcqForm.mcq_choices.filter((_, i) => i !== index);
    setMcqForm((prev) => ({ ...prev, mcq_choices: newChoices }));
  };

  // Add new matching pair
  const addPair = () => {
    const newKey = String.fromCharCode(65 + matchingForm.matching_pairs.length); // A, B, C...
    setMatchingForm((prev) => ({
      ...prev,
      matching_pairs: [
        ...prev.matching_pairs,
        { match_key: newKey, left_item: "", right_item: "" },
      ],
    }));
  };

  // Remove matching pair
  const removePair = (index) => {
    const newPairs = matchingForm.matching_pairs.filter((_, i) => i !== index);
    // Update match keys to maintain sequence
    const updatedPairs = newPairs.map((pair, i) => ({
      ...pair,
      match_key: String.fromCharCode(65 + i),
    }));
    setMatchingForm((prev) => ({ ...prev, matching_pairs: updatedPairs }));
  };

  // Submit MCQ form (Add or Edit)
  const handleMcqSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!mcqForm.text.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }
    if (mcqForm.mcq_choices.length < 2) {
      alert("يجب إدخال خيارين على الأقل");
      return;
    }
    if (!mcqForm.mcq_choices.some((c) => c.is_correct)) {
      alert("يجب تحديد خيار صحيح واحد على الأقل");
      return;
    }
    if (mcqForm.mcq_choices.some((c) => !c.text.trim())) {
      alert("يرجى ملء جميع خيارات الأسئلة");
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      const postData = {
        book: bookId,
        difficulty: mcqForm.difficulty,
        text: mcqForm.text.trim(),
        mcq_choices: mcqForm.mcq_choices.map(({ id, text, is_correct }) => ({
          ...(id && { id }), // Include id only if it exists (for edit)
          text: text.trim(),
          is_correct,
        })),
      };
      let response;
      if (editingMCQ) {
        // Edit existing MCQ
        response = await axios.put(
          `${API_BASE_URL}/mcq-questions/${editingMCQ.id}/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } else {
        // Create new MCQ
        response = await axios.post(
          `${API_BASE_URL}/mcq-questions/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      // Use the response
      console.log("MCQ saved:", response.data);

      // Success - close modal and refresh questions
      setShowMCQModal(false);
      setEditingMCQ(null);
      fetchQuestions();
      alert(editingMCQ ? "تم تعديل السؤال بنجاح!" : "تم إضافة السؤال بنجاح!");
    } catch (error) {
      console.error("خطأ في حفظ السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        alert(
          `حدث خطأ أثناء حفظ السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Submit Matching form (Add or Edit)
  const handleMatchingSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!matchingForm.text.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }
    if (matchingForm.matching_pairs.length < 2) {
      alert("يجب إدخال زوجين على الأقل");
      return;
    }
    if (
      matchingForm.matching_pairs.some(
        (p) => !p.left_item.trim() || !p.right_item.trim()
      )
    ) {
      alert("يرجى ملء جميع عناصر التوصيل");
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      // Prepare data for API
      const postData = {
        book: bookId,
        difficulty: matchingForm.difficulty,
        text: matchingForm.text.trim(),
        input_matching_pairs: matchingForm.matching_pairs.map(
          ({ id, match_key, left_item, right_item }) => ({
            ...(id && { id }), // Include id only if it exists (for edit)
            match_key,
            left_item: left_item.trim(),
            right_item: right_item.trim(),
          })
        ),
        pairs_count: matchingForm.matching_pairs.length,
      };

      let response;
      if (editingMatching) {
        // Edit existing Matching question
        response = await axios.put(
          `${API_BASE_URL}/matching-questions/${editingMatching.id}/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } else {
        // Create new Matching question
        response = await axios.post(
          `${API_BASE_URL}/matching-questions/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      // Use the response
      console.log("Matching question saved:", response.data);

      // Success - close modal and refresh questions
      setShowMatchingModal(false);
      setEditingMatching(null);
      fetchQuestions();
      alert(
        editingMatching ? "تم تعديل السؤال بنجاح!" : "تم إضافة السؤال بنجاح!"
      );
    } catch (error) {
      console.error("خطأ في حفظ السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        alert(
          `حدث خطأ أثناء حفظ السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };
  const handleReadingSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!readingForm.title.trim()) {
      alert("يرجى إدخال عنوان القطعة");
      return;
    }
    if (!readingForm.content.trim()) {
      alert("يرجى إدخال محتوى القطعة");
      return;
    }
    if (readingForm.questions_data.some((q) => !q.question.trim())) {
      alert("يرجى ملء جميع أسئلة القطعة");
      return;
    }
    if (
      readingForm.questions_data.some((q) => q.choices.some((c) => !c.trim()))
    ) {
      alert("يرجى ملء جميع خيارات الأسئلة");
      return;
    }
    if (readingForm.questions_data.some((q) => !q.correct_answer.trim())) {
      alert("يرجى تحديد الإجابة الصحيحة لكل سؤال");
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      const postData = {
        book: bookId,
        book_title: book?.title || "",
        title: readingForm.title.trim(),
        difficulty: readingForm.difficulty,
        content: readingForm.content.trim(),
        questions_data: readingForm.questions_data.map((q) => ({
          question: q.question.trim(),
          choices: q.choices.map((c) => c.trim()),
          correct_answer: q.correct_answer.trim(),
        })),
      };

      let response;
      if (editingReading) {
        response = await axios.put(
          `${API_BASE_URL.replace(
            "/questions",
            ""
          )}/questions/reading-comprehensions/${editingReading.id}/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL.replace(
            "/questions",
            ""
          )}/questions/reading-comprehensions/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      console.log("Reading comprehension saved:", response.data);

      setShowReadingModal(false);
      setEditingReading(null);
      fetchQuestions();
      alert(
        editingReading ? "تم تعديل القطعة بنجاح!" : "تم إضافة القطعة بنجاح!"
      );
    } catch (error) {
      console.error("خطأ في حفظ القطعة:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        alert(
          `حدث خطأ أثناء حفظ القطعة: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };
  // Submit True/False form (Add or Edit)
  const handleTrueFalseSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!trueFalseForm.text.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      // Prepare data for API
      const postData = {
        book: bookId,
        difficulty: trueFalseForm.difficulty,
        text: trueFalseForm.text.trim(),
        is_true: trueFalseForm.is_true ? "True" : "False", // Convert to string as per API requirement
      };

      let response;
      if (editingTrueFalse) {
        // Edit existing True/False question
        response = await axios.put(
          `${API_BASE_URL}/truefalse-questions/${editingTrueFalse.id}/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } else {
        // Create new True/False question
        response = await axios.post(
          `${API_BASE_URL}/truefalse-questions/`,
          postData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      // Use the response
      console.log("True/False question saved:", response.data);

      // Success - close modal and refresh questions
      setShowTrueFalseModal(false);
      setEditingTrueFalse(null);
      fetchQuestions();
      alert(
        editingTrueFalse ? "تم تعديل السؤال بنجاح!" : "تم إضافة السؤال بنجاح!"
      );
    } catch (error) {
      console.error("خطأ في حفظ السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        alert(
          `حدث خطأ أثناء حفظ السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };
  const handleDeleteReading = async (readingId, readingTitle) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف قطعة القراءة: "${readingTitle.substring(
          0,
          50
        )}..."؟`
      )
    ) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      await axios.delete(
        `${API_BASE_URL.replace(
          "/questions",
          ""
        )}/questions/reading-comprehensions/${readingId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      fetchQuestions();
      alert("تم حذف القطعة بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف القطعة:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (error.response?.status === 404) {
        alert("القطعة غير موجودة أو تم حذفها بالفعل.");
        fetchQuestions();
      } else {
        alert(
          `حدث خطأ أثناء حذف القطعة: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };
  // Delete MCQ
  const handleDeleteMCQ = async (mcqId, mcqText) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف السؤال: "${mcqText.substring(0, 50)}..."؟`
      )
    ) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      await axios.delete(`${API_BASE_URL}/mcq-questions/${mcqId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Success - refresh questions
      fetchQuestions();
      alert("تم حذف السؤال بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (error.response?.status === 404) {
        alert("السؤال غير موجود أو تم حذفه بالفعل.");
        fetchQuestions(); // Refresh to sync with server
      } else {
        alert(
          `حدث خطأ أثناء حذف السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Delete Matching Question
  const handleDeleteMatching = async (matchingId, matchingText) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف سؤال التوصيل: "${matchingText.substring(
          0,
          50
        )}..."؟`
      )
    ) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      await axios.delete(`${API_BASE_URL}/matching-questions/${matchingId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Success - refresh questions
      fetchQuestions();
      alert("تم حذف السؤال بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (error.response?.status === 404) {
        alert("السؤال غير موجود أو تم حذفه بالفعل.");
        fetchQuestions(); // Refresh to sync with server
      } else {
        alert(
          `حدث خطأ أثناء حذف السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Delete True/False Question
  const handleDeleteTrueFalse = async (trueFalseId, trueFalseText) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف سؤال صح/خطأ: "${trueFalseText.substring(
          0,
          50
        )}..."؟`
      )
    ) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("يجب تسجيل الدخول");
        navigate("/login");
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/truefalse-questions/${trueFalseId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Success - refresh questions
      fetchQuestions();
      alert("تم حذف السؤال بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف السؤال:", error);

      if (error.response?.status === 401) {
        alert("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (error.response?.status === 404) {
        alert("السؤال غير موجود أو تم حذفه بالفعل.");
        fetchQuestions(); // Refresh to sync with server
      } else {
        alert(
          `حدث خطأ أثناء حذف السؤال: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("يجب تسجيل الدخول أولاً.");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }

      const res = await axios.get(
        `${API_BASE_URL}/books/${bookId}/questions/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (res.data) {
        setBook(res.data.book);
        setQuestions(res.data.questions);
        setReadingPassages(res.data.reading_passages || []);
      } else {
        throw new Error("لا توجد بيانات");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);

      if (err.response?.status === 404) {
        setError("الكتاب غير موجود أو لا يحتوي على أسئلة.");
      } else if (err.response?.status === 401) {
        setError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("حدث خطأ أثناء تحميل الأسئلة.");
      }
    } finally {
      setLoading(false);
    }
  }, [bookId, navigate]);

  // Initialize component
  useEffect(() => {
    if (!bookId || !bookId.trim()) {
      // ✅ بس نتأكد إن فيه قيمة
      setError("معرف الكتاب غير صالح.");
      return;
    }
    fetchQuestions();
  }, [bookId, fetchQuestions]);

  const handleRetry = () => {
    fetchQuestions();
  };

  // Loading state
  if (loading) {
    return (
      <div className="book-questions-container">
        <div className="loading-container">
          <div className="loading-text">🔄 جاري تحميل الأسئلة...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="book-questions-container">
        <button onClick={() => openMCQModal()} className="btn-add-question">
          ➕ إضافة سؤال اختيار من متعدد
        </button>
        <button
          onClick={() => openMatchingModal()}
          className="btn-add-question"
        >
          🔗 إضافة سؤال توصيل
        </button>
        <button
          onClick={() => openTrueFalseModal()}
          className="btn-add-question"
        >
          ✅ إضافة سؤال صح/خطأ
        </button>

        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn-retry">
              🔄 إعادة المحاولة
            </button>
            <Link to="/dashboard" className="btn-back-to-dashboard">
              ← العودة للوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total questions
  const totalQuestions = questions
    ? (questions.mcq?.length || 0) +
      (questions.matching?.length || 0) +
      (questions.truefalse?.length || 0) +
      (questions.reading?.length || 0)
    : 0;

  return (
    <div className="book-questions-container">
      {/* Header Section */}
      <div className="main-header">
        <h2 className="page-title">
          📚 أسئلة الكتاب: {book?.title || `كتاب رقم ${bookId}`}
        </h2>

        <div>
          <Link to="/dashboard" className="back-link">
            ← العودة إلى لوحة التحكم
          </Link>
        </div>

        {/* Add Question Buttons */}
        <div className="add-question-section">
          <button onClick={() => openMCQModal()} className="btn-add-question">
            ➕ إضافة سؤال اختيار من متعدد
          </button>
          <button
            onClick={() => openMatchingModal()}
            className="btn-add-question btn-add-matching"
          >
            🔗 إضافة سؤال توصيل
          </button>
          <button
            onClick={() => openTrueFalseModal()}
            className="btn-add-question btn-add-truefalse"
          >
            ✅ إضافة سؤال صح/خطأ
          </button>

          <button
            onClick={() => openReadingModal()}
            className="btn-add-question btn-add-reading"
          >
            📖 إضافة قطعة فهم مقروء
          </button>
        </div>

        {/* Statistics */}
        <div className="statistics-section">
          <h4 className="statistics-title">📊 إحصائيات:</h4>
          <div className="statistics-grid">
            <span>
              إجمالي الأسئلة:{" "}
              <strong className="stat-total">{totalQuestions}</strong>
            </span>
            <span>
              أسئلة MCQ:{" "}
              <strong className="stat-mcq">
                {questions?.mcq?.length || 0}
              </strong>
            </span>
            <span>
              أسئلة التوصيل:{" "}
              <strong className="stat-matching">
                {questions?.matching?.length || 0}
              </strong>
            </span>
            <span>
              صح/خطأ:{" "}
              <strong className="stat-truefalse">
                {questions?.truefalse?.length || 0}
              </strong>
            </span>
            <span>
              قطع القراءة:{" "}
              <strong className="stat-reading">{readingPassages.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* No questions message */}
      {totalQuestions === 0 && (
        <div className="no-questions-message">
          <p className="no-questions-title">
            📝 لا توجد أسئلة مضافة لهذا الكتاب حتى الآن.
          </p>
          <p className="no-questions-subtitle">
            يمكنك البدء بإضافة أول سؤال باستخدام الأزرار أعلاه!
          </p>
        </div>
      )}

      {/* MCQ Questions */}
      {questions?.mcq?.length > 0 && (
        <section className="question-section">
          <h3
            className={`section-header section-header-mcq`}
            onClick={() => setShowMCQ(!showMCQ)}
          >
            <span className="section-title">
              🔵 أسئلة اختيار من متعدد ({questions.mcq.length})
            </span>
            <span
              className={`section-toggle-icon ${showMCQ ? "expanded" : ""}`}
            >
              ◀
            </span>
          </h3>
          {showMCQ && (
            <div className="section-content">
              {questions.mcq.map((q, index) => (
                <div key={q.id} className="question-card">
                  {/* Action buttons */}
                  <div className="question-actions">
                    <button
                      onClick={() => openMCQModal(q)}
                      className="btn-edit"
                      title="تعديل السؤال"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteMCQ(q.id, q.text)}
                      className="btn-delete"
                      title="حذف السؤال"
                    >
                      🗑️ حذف
                    </button>
                  </div>

                  <p className="question-text">
                    السؤال {index + 1}: {q.text}
                  </p>
                  <p className="question-difficulty">
                    مستوى الصعوبة:{" "}
                    <span className={`difficulty-${q.difficulty}`}>
                      {q.difficulty === "easy"
                        ? "سهل"
                        : q.difficulty === "medium"
                        ? "متوسط"
                        : "صعب"}
                    </span>
                  </p>

                  {q.mcq_choices?.length > 0 && (
                    <div className="choices-container">
                      <strong>الخيارات:</strong>
                      <ul className="choices-list">
                        {q.mcq_choices.map((choice, choiceIndex) => (
                          <li
                            key={choice.id}
                            className={`choice-item ${
                              choice.is_correct ? "correct" : ""
                            }`}
                          >
                            {String.fromCharCode(65 + choiceIndex)}){" "}
                            {choice.text}
                            {choice.is_correct && " ✅"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="correct-answer">
                    <em>الإجابة الصحيحة:</em> {q.correct_answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Matching Questions */}
      {questions?.matching?.length > 0 && (
        <section className="question-section">
          <h3
            className={`section-header section-header-matching`}
            onClick={() => setShowMatching(!showMatching)}
          >
            <span className="section-title">
              🔗 أسئلة التوصيل ({questions.matching.length})
            </span>
            <span
              className={`section-toggle-icon ${
                showMatching ? "expanded" : ""
              }`}
            >
              ◀
            </span>
          </h3>
          {showMatching && (
            <div className="section-content">
              {questions.matching.map((q, index) => (
                <div key={q.id} className="question-card">
                  {/* Action buttons */}
                  <div className="question-actions">
                    <button
                      onClick={() => openMatchingModal(q)}
                      className="btn-edit"
                      title="تعديل السؤال"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteMatching(q.id, q.text)}
                      className="btn-delete"
                      title="حذف السؤال"
                    >
                      🗑️ حذف
                    </button>
                  </div>

                  <p className="question-text">
                    السؤال {index + 1}: {q.text}
                  </p>
                  <p className="question-difficulty">
                    مستوى الصعوبة:{" "}
                    <span className={`difficulty-${q.difficulty}`}>
                      {q.difficulty === "easy"
                        ? "سهل"
                        : q.difficulty === "medium"
                        ? "متوسط"
                        : "صعب"}
                    </span>
                  </p>

                  {(q.matching_pairs?.length > 0 ||
                    (q.matching_pairs?.[0]?.left_item &&
                      Array.isArray(q.matching_pairs[0].left_item))) && (
                    <table className="matching-table">
                      <thead>
                        <tr>
                          <th>المفتاح</th>
                          <th>العنصر الأيسر</th>
                          <th>العنصر الأيمن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(q.matching_pairs[0]?.left_item)
                          ? // New format
                            q.matching_pairs[0].left_item.map(
                              (leftItem, index) => (
                                <tr key={index}>
                                  <td>{String.fromCharCode(65 + index)}</td>
                                  <td>{leftItem}</td>
                                  <td>
                                    {q.matching_pairs[1].right_item[index]}
                                  </td>
                                </tr>
                              )
                            )
                          : // Old format (fallback)
                            q.matching_pairs.map((pair) => (
                              <tr key={pair.id}>
                                <td>{pair.match_key}</td>
                                <td>{pair.left_item}</td>
                                <td>{pair.right_item}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* True/False Questions */}
      {questions?.truefalse?.length > 0 && (
        <section className="question-section">
          <h3
            className={`section-header section-header-truefalse`}
            onClick={() => setShowTrueFalse(!showTrueFalse)}
          >
            <span className="section-title">
              ✅❌ أسئلة صح أو خطأ ({questions.truefalse.length})
            </span>
            <span
              className={`section-toggle-icon ${
                showTrueFalse ? "expanded" : ""
              }`}
            >
              ◀
            </span>
          </h3>
          {showTrueFalse && (
            <div className="section-content">
              {questions.truefalse.map((q, index) => (
                <div key={q.id} className="question-card">
                  {/* Action buttons */}
                  <div className="question-actions">
                    <button
                      onClick={() => openTrueFalseModal(q)}
                      className="btn-edit"
                      title="تعديل السؤال"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteTrueFalse(q.id, q.text)}
                      className="btn-delete"
                      title="حذف السؤال"
                    >
                      🗑️ حذف
                    </button>
                  </div>

                  <p className="question-text">
                    السؤال {index + 1}: {q.text}
                  </p>
                  <p className="question-difficulty">
                    مستوى الصعوبة:{" "}
                    <span className={`difficulty-${q.difficulty}`}>
                      {q.difficulty === "easy"
                        ? "سهل"
                        : q.difficulty === "medium"
                        ? "متوسط"
                        : "صعب"}
                    </span>
                  </p>
                  <p
                    className={`truefalse-answer ${
                      q.is_true ? "true" : "false"
                    }`}
                  >
                    <em>الإجابة:</em> {q.is_true ? "صح ✅" : "خطأ ❌"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {/* Reading Comprehension */}
      {readingPassages?.length > 0 && (
        <section className="question-section">
          <h3
            className={`section-header section-header-reading`}
            onClick={() => setShowReading(!showReading)}
          >
            <span className="section-title">
              📖 قطع فهم المقروء ({readingPassages.length})
            </span>
            <span
              className={`section-toggle-icon ${showReading ? "expanded" : ""}`}
            >
              ◀
            </span>
          </h3>
          {showReading && (
            <div className="section-content">
              {readingPassages.map((passage, index) => (
                <div key={passage.id} className="question-card reading-passage">
                  <div className="question-actions">
                    <button
                      onClick={() => openReadingModal(passage)}
                      className="btn-edit"
                      title="تعديل القطعة"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteReading(passage.id, passage.title)
                      }
                      className="btn-delete"
                      title="حذف القطعة"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                  <p className="question-difficulty">
                    مستوى الصعوبة:{" "}
                    <span
                      className={`difficulty-${passage.difficulty || "easy"}`}
                    >
                      {(passage.difficulty || "easy") === "easy"
                        ? "سهل"
                        : (passage.difficulty || "easy") === "medium"
                        ? "متوسط"
                        : "صعب"}
                    </span>
                  </p>

                  <h4 className="reading-title">📖 {passage.title}</h4>
                  <div className="reading-content">
                    <strong>المحتوى:</strong>
                    <p>{passage.content}</p>
                  </div>

                  {passage.questions_data?.length > 0 && (
                    <div className="reading-questions">
                      <strong>
                        الأسئلة ({passage.questions_data.length}):
                      </strong>
                      {passage.questions_data.map((q, qIndex) => (
                        <div key={qIndex} className="reading-question-item">
                          <p className="question-text">
                            السؤال {qIndex + 1}: {q.question}
                          </p>
                          <ul className="choices-list">
                            {q.choices.map((choice, cIndex) => (
                              <li
                                key={cIndex}
                                className={`choice-item ${
                                  choice === q.correct_answer ? "correct" : ""
                                }`}
                              >
                                {String.fromCharCode(65 + cIndex)}) {choice}
                                {choice === q.correct_answer && " ✅"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MCQ Modal */}
      {showMCQModal && (
        <div className="modal-overlay" onClick={closeMCQModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMCQ
                  ? "✏️ تعديل سؤال اختيار من متعدد"
                  : "➕ إضافة سؤال اختيار من متعدد"}
              </h3>
              <button
                type="button"
                onClick={closeMCQModal}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMcqSubmit}>
              <div className="form-group">
                <label className="form-label">📝 نص السؤال:</label>
                <textarea
                  name="text"
                  value={mcqForm.text}
                  onChange={handleMcqChange}
                  rows={4}
                  className="form-textarea"
                  placeholder="اكتب نص السؤال هنا..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 مستوى الصعوبة:</label>
                <select
                  name="difficulty"
                  value={mcqForm.difficulty}
                  onChange={handleMcqChange}
                  className="form-select"
                >
                  <option value="easy">🟢 سهل</option>
                  <option value="medium">🟡 متوسط</option>
                  <option value="hard">🔴 صعب</option>
                </select>
              </div>

              <div className="form-group choices">
                <label className="form-label">📋 الخيارات:</label>
                {mcqForm.mcq_choices.map((choice, index) => (
                  <div key={index} className="choice-row">
                    <span className="choice-letter">
                      {String.fromCharCode(65 + index)})
                    </span>
                    <input
                      type="text"
                      placeholder={`نص الخيار ${index + 1}`}
                      value={choice.text}
                      onChange={(e) =>
                        handleChoiceChange(index, "text", e.target.value)
                      }
                      className="choice-input"
                      required
                    />
                    <label className="choice-checkbox-label">
                      <input
                        type="checkbox"
                        checked={choice.is_correct}
                        onChange={(e) =>
                          handleChoiceChange(
                            index,
                            "is_correct",
                            e.target.checked
                          )
                        }
                        className="choice-checkbox"
                      />
                      <span
                        className={`choice-checkbox-text ${
                          choice.is_correct ? "correct" : ""
                        }`}
                      >
                        {choice.is_correct ? "✅ صحيح" : "صحيح"}
                      </span>
                    </label>
                    {mcqForm.mcq_choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(index)}
                        className="btn-remove-choice"
                        title="حذف هذا الخيار"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChoice}
                  className="btn-add-choice"
                >
                  ➕ إضافة خيار جديد
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeMCQModal}
                  className="btn-cancel"
                >
                  ❌ إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingMCQ ? "💾 حفظ التعديل" : "💾 حفظ السؤال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matching Modal */}
      {showMatchingModal && (
        <div className="modal-overlay" onClick={closeMatchingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMatching
                  ? "✏️ تعديل سؤال التوصيل"
                  : "🔗 إضافة سؤال توصيل"}
              </h3>
              <button
                type="button"
                onClick={closeMatchingModal}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMatchingSubmit}>
              <div className="form-group">
                <label className="form-label">📝 نص السؤال:</label>
                <textarea
                  name="text"
                  value={matchingForm.text}
                  onChange={handleMatchingChange}
                  rows={4}
                  className="form-textarea"
                  placeholder="اكتب نص سؤال التوصيل هنا... (مثال: وصل العناصر التالية)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 مستوى الصعوبة:</label>
                <select
                  name="difficulty"
                  value={matchingForm.difficulty}
                  onChange={handleMatchingChange}
                  className="form-select"
                >
                  <option value="easy">🟢 سهل</option>
                  <option value="medium">🟡 متوسط</option>
                  <option value="hard">🔴 صعب</option>
                </select>
              </div>

              <div className="form-group matching-pairs">
                <label className="form-label">🔗 أزواج التوصيل:</label>
                {matchingForm.matching_pairs.map((pair, index) => (
                  <div key={index} className="pair-row">
                    <span className="pair-key">{pair.match_key})</span>
                    <input
                      type="text"
                      placeholder="العنصر الأيسر"
                      value={pair.left_item}
                      onChange={(e) =>
                        handlePairChange(index, "left_item", e.target.value)
                      }
                      className="pair-input"
                      required
                    />
                    <span className="pair-separator">←→</span>
                    <input
                      type="text"
                      placeholder="العنصر الأيمن"
                      value={pair.right_item}
                      onChange={(e) =>
                        handlePairChange(index, "right_item", e.target.value)
                      }
                      className="pair-input"
                      required
                    />
                    {matchingForm.matching_pairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePair(index)}
                        className="btn-remove-pair"
                        title="حذف هذا الزوج"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPair}
                  className="btn-add-pair"
                >
                  ➕ إضافة زوج جديد
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeMatchingModal}
                  className="btn-cancel"
                >
                  ❌ إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingMatching ? "💾 حفظ التعديل" : "💾 حفظ السؤال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* True/False Modal */}
      {showTrueFalseModal && (
        <div className="modal-overlay" onClick={closeTrueFalseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTrueFalse
                  ? "✏️ تعديل سؤال صح/خطأ"
                  : "✅ إضافة سؤال صح/خطأ"}
              </h3>
              <button
                type="button"
                onClick={closeTrueFalseModal}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTrueFalseSubmit}>
              <div className="form-group">
                <label className="form-label">📝 نص السؤال:</label>
                <textarea
                  name="text"
                  value={trueFalseForm.text}
                  onChange={handleTrueFalseChange}
                  rows={4}
                  className="form-textarea"
                  placeholder="اكتب نص السؤال هنا..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 مستوى الصعوبة:</label>
                <select
                  name="difficulty"
                  value={trueFalseForm.difficulty}
                  onChange={handleTrueFalseChange}
                  className="form-select"
                >
                  <option value="easy">🟢 سهل</option>
                  <option value="medium">🟡 متوسط</option>
                  <option value="hard">🔴 صعب</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">✅❌ الإجابة الصحيحة:</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="is_true"
                      value="true"
                      checked={trueFalseForm.is_true === true}
                      onChange={handleTrueFalseChange}
                      className="radio-input"
                    />
                    <span className="radio-text true">✅ صح</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="is_true"
                      value="false"
                      checked={trueFalseForm.is_true === false}
                      onChange={handleTrueFalseChange}
                      className="radio-input"
                    />
                    <span className="radio-text false">❌ خطأ</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeTrueFalseModal}
                  className="btn-cancel"
                >
                  ❌ إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingTrueFalse ? "💾 حفظ التعديل" : "💾 حفظ السؤال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reading Comprehension Modal */}
      {showReadingModal && (
        <div className="modal-overlay" onClick={closeReadingModal}>
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingReading
                  ? "✏️ تعديل قطعة فهم المقروء"
                  : "📖 إضافة قطعة فهم المقروء"}
              </h3>
              <button
                type="button"
                onClick={closeReadingModal}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReadingSubmit}>
              <div className="form-group">
                <label className="form-label">📝 عنوان القطعة:</label>
                <input
                  type="text"
                  name="title"
                  value={readingForm.title}
                  onChange={handleReadingChange}
                  className="form-input"
                  placeholder="اكتب عنوان القطعة..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📄 محتوى القطعة:</label>
                <textarea
                  name="content"
                  value={readingForm.content}
                  onChange={handleReadingChange}
                  rows={8}
                  className="form-textarea"
                  placeholder="اكتب محتوى القطعة هنا..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📊 مستوى الصعوبة:</label>
                <select
                  name="difficulty"
                  value={readingForm.difficulty}
                  onChange={handleReadingChange}
                  className="form-select"
                >
                  <option value="easy">🟢 سهل</option>
                  <option value="medium">🟡 متوسط</option>
                  <option value="hard">🔴 صعب</option>
                </select>
              </div>

              <div className="form-group reading-questions-section">
                <label className="form-label">❓ أسئلة القطعة:</label>
                {readingForm.questions_data.map((question, qIndex) => (
                  <div key={qIndex} className="reading-question-form">
                    <div className="question-header">
                      <h4>السؤال {qIndex + 1}</h4>
                      {readingForm.questions_data.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReadingQuestion(qIndex)}
                          className="btn-remove-question"
                        >
                          🗑️ حذف السؤال
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="نص السؤال..."
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "question", e.target.value)
                      }
                      className="form-input"
                      required
                    />

                    <div className="choices-section">
                      <label>الخيارات:</label>
                      {question.choices.map((choice, cIndex) => (
                        <div key={cIndex} className="choice-input-group">
                          <span className="choice-letter">
                            {String.fromCharCode(65 + cIndex)})
                          </span>
                          <input
                            type="text"
                            placeholder={`الخيار ${cIndex + 1}`}
                            value={choice}
                            onChange={(e) =>
                              handleChoiceChangeReading(
                                qIndex,
                                cIndex,
                                e.target.value
                              )
                            }
                            className="form-input"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="correct-answer-section">
                      <label>الإجابة الصحيحة:</label>
                      <select
                        value={question.correct_answer}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "correct_answer",
                            e.target.value
                          )
                        }
                        className="form-select"
                        required
                      >
                        <option value="">اختر الإجابة الصحيحة...</option>
                        {question.choices.map(
                          (choice, cIndex) =>
                            choice.trim() && (
                              <option key={cIndex} value={choice}>
                                {String.fromCharCode(65 + cIndex)}) {choice}
                              </option>
                            )
                        )}
                      </select>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addReadingQuestion}
                  className="btn-add-question-form"
                >
                  ➕ إضافة سؤال جديد
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeReadingModal}
                  className="btn-cancel"
                >
                  ❌ إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingReading ? "💾 حفظ التعديل" : "💾 حفظ القطعة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
