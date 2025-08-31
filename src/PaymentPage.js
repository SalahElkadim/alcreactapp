import React, { useState } from "react";
import axios from "axios";

const PaymentPage = () => {
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ انشاء توكن البطاقة باستخدام Moyasar JS
      const token = await window.Moyasar.createToken({
        type: "card",
        number: cardNumber,
        cvc: cvv,
        month: parseInt(expiryMonth),
        year: parseInt(expiryYear),
        name: name,
      });

      // 2️⃣ إرسال التوكن للباك إند لإنشاء عملية الدفع
      const response = await axios.post(
        "https://alc-production-8568.up.railway.app/api/create-payment/",
        {
          amount: parseInt(amount),
          description: "Payment from React Store",
          customer_name: name,
          customer_email: "", // اختياري
          customer_phone: "", // اختياري
          source: {
            type: "token",
            token: token.id,
          },
        }
      );

      if (response.data.success) {
        alert("تم إنشاء الدفع بنجاح!");
        // يمكن التوجيه لصفحة حالة الدفع
      } else {
        setError(response.data.message || "فشل إنشاء عملية الدفع");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء الدفع");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2>الدفع</h2>
      <input
        type="text"
        placeholder="اسم صاحب البطاقة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />
      <input
        type="text"
        placeholder="رقم البطاقة"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="شهر الانتهاء (MM)"
          value={expiryMonth}
          onChange={(e) => setExpiryMonth(e.target.value)}
          style={{ flex: 1, padding: "10px", margin: "5px 0" }}
        />
        <input
          type="text"
          placeholder="سنة الانتهاء (YYYY)"
          value={expiryYear}
          onChange={(e) => setExpiryYear(e.target.value)}
          style={{ flex: 1, padding: "10px", margin: "5px 0" }}
        />
      </div>
      <input
        type="text"
        placeholder="CVV"
        value={cvv}
        onChange={(e) => setCvv(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />
      <input
        type="number"
        placeholder="المبلغ (هللة)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />

      <button
        onClick={handlePayment}
        disabled={loading}
        style={{ width: "100%", padding: "10px", marginTop: "10px" }}
      >
        {loading ? "جاري الدفع..." : "ادفع الآن"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default PaymentPage;
