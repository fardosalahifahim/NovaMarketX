import React, { useState } from 'react';
import './PaymentGateway.css';

const PaymentGateway = ({ onSelectPaymentMethod }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handlePaymentMethodClick = (method) => {
    setSelectedMethod(method);
    if (onSelectPaymentMethod) {
      onSelectPaymentMethod(method);
    }
  };

  console.log('PaymentGateway component rendered');

  return (
    <div className="payment-gateway-container">
      <h2>Select Payment Method</h2>
      <div className="payment-methods">
        <button
          className={selectedMethod === 'Credit/Debit Card' ? 'selected' : ''}
          onClick={() => handlePaymentMethodClick('Credit/Debit Card')}
        >
          Credit/Debit Card
        </button>
        <button
          className={selectedMethod === 'Nagad' ? 'selected' : ''}
          onClick={() => handlePaymentMethodClick('Nagad')}
        >
          Nagad
        </button>
        <button
          className={selectedMethod === 'Save bKash Account' ? 'selected' : ''}
          onClick={() => handlePaymentMethodClick('Save bKash Account')}
        >
          Save bKash Account
        </button>
        <button
          className={selectedMethod === 'Cash on Delivery' ? 'selected' : ''}
          onClick={() => handlePaymentMethodClick('Cash on Delivery')}
        >
          Cash on Delivery
        </button>
      </div>
    </div>
  );
};

export default PaymentGateway;
