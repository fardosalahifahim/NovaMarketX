import React from 'react';
import PropTypes from 'prop-types';
import './ProfileImageLogout.css';

const ProfileImageLogout = ({ userPhoto, onLogout }) => {
  return (
    <div className="profile-image-logout-container">
      <img
        src={userPhoto || require('../icons/Nav-icon/profile.png')}
        alt="Profile"
        className="profile-image"
      />
      <button onClick={onLogout} className="profile-logout-button">
        Logout
      </button>
    </div>
  );
};

ProfileImageLogout.propTypes = {
  userPhoto: PropTypes.string,
  onLogout: PropTypes.func.isRequired,
};

export default ProfileImageLogout;
