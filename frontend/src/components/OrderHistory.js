import React from 'react';
import MyOrders from './myorders';

const OrderHistory = () => {
  return <MyOrders statusFilter="history" readOnly={true} />;
};

export default OrderHistory;
