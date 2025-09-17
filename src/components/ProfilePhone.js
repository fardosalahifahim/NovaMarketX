import React from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

const phoneNavItems = [
  { label: 'My Profile', to: '/profile' },
  { label: 'Address Book', to: '/address-book' },
  { label: 'My Payment Options', to: '/payment-options' },
  { label: 'My Orders', to: '/myorders' },
  { label: 'My Returns', to: '/myreturns' },
  { label: 'My Cancellations', to: '/mycancellations' },
  { label: 'History', to: '/history' },
];

const ProfilePhone = ({ userPhoto, handleLogout }) => {
  return (
    <div className="profile-phone-container">
      <img
        src={userPhoto || require('../icons/Nav-icon/profile.png')}
        alt="Profile"
        className="profile-image-phone"
      />
      <nav className="phone-nav-cards">
        {phoneNavItems.map((item) => (
          <Link key={item.to} to={item.to} className="phone-nav-card">
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={handleLogout} className="profile-logout-button-phone">
        Logout
      </button>
    </div>
  );
};

export default ProfilePhone;
