import React from 'react';
import MyOrdersPhone from './MyOrdersPhone';
import './HistoryPhone.css';

const HistoryPhone = () => {
  return (
    <section className="profile-section orders-section-phone">
      <MyOrdersPhone statusFilter="history" />
    </section>
  );
};

export default HistoryPhone;
