import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import MyOrdersPhone from './MyOrdersPhone';
import './MyReturnsPhone.css';

const MyReturnsPhone = () => {
  return (
    <section className="profile-section orders-section-phone">
      <MyOrdersPhone statusFilter="returned" />
    </section>
  );
};

export default MyReturnsPhone;
