import React, { useState } from 'react';
import './AdminPanel.css';

const AdminNavBar = ({ activeSection, onSectionChange, onLogout, onOrderFilterChange }) => {
  const [selectedFilter, setSelectedFilter] = useState('orders');

  const filters = [
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Product List', value: 'products' },
    { label: 'User Data', value: 'users' },
    { label: 'Orders', value: 'orders' },
    { label: 'Canceled Orders', value: 'cancelorder' },
    { label: 'History', value: 'orderhistory' },
    { label: 'Delivered Orders', value: 'deliveredorders' },
    { label: 'Confirmed Orders', value: 'confirmedOrders' },
    { label: 'Shipped Orders', value: 'shippedOrders' },
    { label: 'Messages', value: 'messages' },
    { label: 'Update', value: 'update' },
  ];

  // Added Update feature for editing hero banner

  const handleFilterSelect = (value) => {
    setSelectedFilter(value);
    onOrderFilterChange(value);
  };

  return (
    <nav className="admin-nav-bar">
      <ul style={{ display: 'flex', flexDirection: 'column' }}>
        {filters.map((filter, index) => (
          <li
            key={index}
            className={activeSection === filter.value ? 'active' : ''}
            onClick={() => onSectionChange(filter.value)}
            style={{ order: index }}
          >
            {filter.label}
          </li>
        ))}
      </ul>
      <div className="admin-nav-bar-logout">
        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavBar;
