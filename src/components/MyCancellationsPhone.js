import React from 'react';
import MyOrdersPhone from './MyOrdersPhone';
import './MyCancellationsPhone.css';

const MyCancellationsPhone = () => {
  return (
    <section className="profile-section orders-section-phone">
      <MyOrdersPhone statusFilter="canceled" />
    </section>
  );
};

export default MyCancellationsPhone;
