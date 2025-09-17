import React from 'react';
import MyOrders from './myorders';

const ConfirmedOrders = () => {
  return <MyOrders statusFilter="confirmed" />;
};

export default ConfirmedOrders;
