import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const PaymentStatusPage = () => {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(
          `https://alc-production-8568.up.railway.app/api/payment-status/${paymentId}/`
        );

        if (response.data.success) {
          setPayment(response.data.payment);
        } else {
          setError("فشل في جلب حالة الدفع");
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء جلب حالة الدفع");
      }
      setLoading(false);
    };

    fetchStatus();
  }, [paymentId]);

  if (loading) return <p>جاري التحميل...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2>حالة الدفع</h2>
      <p>رقم العملية: {payment.id}</p>
      <p>المبلغ: {payment.amount_in_riyals} ريال</p>
      <p>الحالة: {payment.status}</p>
      <p>الوصف: {payment.description}</p>
      {payment.paid_at && <p>تاريخ الدفع: {payment.paid_at}</p>}
    </div>
  );
};

export default PaymentStatusPage;
