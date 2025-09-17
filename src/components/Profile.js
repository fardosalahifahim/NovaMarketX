import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './ProfilePhone.css';
import './Profile.css';
import PastOrders from './PastOrders';
import AddressForm from './AddressForm';
import MyOrders from './myorders';
import ProfileImageLogout from './ProfileImageLogout';

import AddressBookPhone from './AddressBookPhone';
import PaymentOptionsPhone from './PaymentOptionsPhone';
import MyOrdersPhone from './MyOrdersPhone';
import MyReturnsPhone from './MyReturnsPhone';
import MyCancellationsPhone from './MyCancellationsPhone';
import HistoryPhone from './HistoryPhone';

const Profile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [personalProfileOpen, setPersonalProfileOpen] = useState(true);
  const [myOrdersOpen, setMyOrdersOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState('myProfile');
  const [userDetails, setUserDetails] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [currentAddressIndex, setCurrentAddressIndex] = useState(null);
  const auth = getAuth();

  const [isPhoneView, setIsPhoneView] = useState(window.innerWidth <= 600);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsPhoneView(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserPhoto(user.photoURL);
        fetchUserDetails(user.email);
      } else {
        setIsLoggedIn(false);
        setUserPhoto(null);
        setUserDetails(null);
        setAddresses([]);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const fetchUserDetails = async (email) => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const users = await res.json();
      const currentUser = users.find(u => u.email === email);
      if (currentUser) {
        setUserDetails(currentUser);
        if (currentUser.addresses && Array.isArray(currentUser.addresses)) {
          setAddresses(currentUser.addresses);
        } else if (currentUser.address) {
          setAddresses([currentUser.address]);
        } else {
          setAddresses([]);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUserPhoto(null);
      setUserDetails(null);
      setAddresses([]);
      setEditingAddress(false);
      setCurrentAddressIndex(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const togglePersonalProfile = () => {
    setPersonalProfileOpen(!personalProfileOpen);
  };

  const toggleMyOrders = () => {
    setMyOrdersOpen(!myOrdersOpen);
  };

  const handleEditClick = (index) => {
    setCurrentAddressIndex(index);
    setEditingAddress(true);
  };

  const handleAddNewClick = () => {
    setCurrentAddressIndex(null);
    setEditingAddress(true);
  };

  const handleSaveAddress = async (updatedAddress) => {
    if (!userDetails || (!userDetails.id && !userDetails.uid)) {
      console.error('User details or user ID missing');
      return;
    }
    const userId = userDetails.id || userDetails.uid;
    let newAddresses = [...addresses];
    if (currentAddressIndex === null) {
      newAddresses.push(updatedAddress);
    } else {
      newAddresses[currentAddressIndex] = updatedAddress;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...userDetails, addresses: newAddresses })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUserDetails(updatedUser);
        setAddresses(newAddresses);
        setEditingAddress(false);
        setCurrentAddressIndex(null);
      } else {
        console.error('Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(false);
    setCurrentAddressIndex(null);
  };

  const handleButtonClick = (section, url) => {
    if (isPhoneView) {
      navigate(url);
    } else {
      setSelectedSection(section);
    }
  };

  return (
    <div className="profile-container">
      
      {isLoggedIn ? (
        isPhoneView ? (
          <>
            <div className="profile-phone-container">
            <img
              src={userPhoto || require('../icons/Nav-icon/profile.png')}
              alt="Profile"
              className="profile-image-phone"
            />
              <div className="phone-nav-buttons">
                <button
                  className={selectedSection === 'addressBook' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('addressBook', '/address-book')}
                >
                  Address Book
                </button>
                <button
                  className={selectedSection === 'paymentOptions' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('paymentOptions', '/payment-options')}
                >
                  My Payment Options
                </button>
                <button
                  className={selectedSection === 'myOrders' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('myOrders', '/my-orders')}
                >
                  My Orders
                </button>
                <button
                  className={selectedSection === 'myReturns' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('myReturns', '/my-returns')}
                >
                  My Returns
                </button>
                <button
                  className={selectedSection === 'myCancellations' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('myCancellations', '/my-cancellations')}
                >
                  My Cancellations
                </button>
                <button
                  className={selectedSection === 'history' ? 'active-phone-button' : 'phone-button'}
                  onClick={() => handleButtonClick('history', '/history')}
                >
                  History
                </button>
              </div>
              <button onClick={handleLogout} className="profile-logout-button-phone">
                Logout
              </button>
            </div>
            <div className="profile-phone-content" style={{ marginTop: '20px' }}>
              {selectedSection === 'addressBook' && (
                <AddressBookPhone
                  addresses={addresses}
                  editingAddress={editingAddress}
                  currentAddressIndex={currentAddressIndex}
                  handleEditClick={handleEditClick}
                  handleAddNewClick={handleAddNewClick}
                  handleSaveAddress={handleSaveAddress}
                  handleCancelEdit={handleCancelEdit}
                />
              )}
              {selectedSection === 'paymentOptions' && (
                <PaymentOptionsPhone />
              )}
              {selectedSection === 'myOrders' && (
                <MyOrdersPhone statusFilter={null} />
              )}
              {selectedSection === 'myReturns' && (
                <MyReturnsPhone />
              )}
              {selectedSection === 'myCancellations' && (
                <MyCancellationsPhone />
              )}
              {selectedSection === 'history' && (
                <HistoryPhone />
              )}
            </div>
          </>
        ) : (
          <div className="profile-desktop-container">
            <nav className="profile-sidebar">
              <div className="sidebar-group">
                <button className="sidebar-toggle" onClick={togglePersonalProfile}>
                  Personal Profile {personalProfileOpen ? '-' : '+'}
                </button>
                {personalProfileOpen && (
                  <ul className="sidebar-list">
                    <li>
                      <button
                        className={selectedSection === 'myProfile' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('myProfile')}
                      >
                        My Profile
                      </button>
                    </li>
                    <li>
                      <button
                        className={selectedSection === 'addressBook' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('addressBook')}
                      >
                        Address Book
                      </button>
                    </li>
                    <li>
                      <button
                        className={selectedSection === 'paymentOptions' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('paymentOptions')}
                      >
                        My Payment Options
                      </button>
                    </li>
                  </ul>
                )}
              </div>
              <div className="sidebar-group">
                <button className="sidebar-toggle" onClick={toggleMyOrders}>
                  My Orders {myOrdersOpen ? '-' : '+'}
                </button>
                {myOrdersOpen && (
                  <ul className="sidebar-list">
                    <li>
                      <button
                        className={selectedSection === 'myOrders' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('myOrders')}
                      >
                        My Orders
                      </button>
                    </li>
                    <li>
                      <button
                        className={selectedSection === 'myReturns' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('myReturns')}
                      >
                        My Returns
                      </button>
                    </li>
                    <li>
                      <button
                        className={selectedSection === 'myCancellations' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('myCancellations')}
                      >
                        My Cancellations
                      </button>
                    </li>
                    <li>
                      <button
                        className={selectedSection === 'history' ? 'active-sidebar-button' : ''}
                        onClick={() => setSelectedSection('history')}
                      >
                        History
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </nav>
            <main className="profile-main">
              {selectedSection === 'myProfile' && (
                <div className="profile-left">
              <ProfileImageLogout userPhoto={userPhoto} onLogout={handleLogout} />
                </div>
              )}
              <div className="profile-right">
                {selectedSection === 'myProfile' && (
                  <section className="profile-section personal-profile">
                    <h3>Personal Profile</h3>
                    <div className="personal-info">
                      <p><strong>Username:</strong> {userDetails ? userDetails.username : 'Loading...'}</p>
                      <p><strong>Email:</strong> {userDetails ? userDetails.email : 'Loading...'}</p>
                      <p><strong>Phone Number:</strong> {userDetails ? userDetails.phone : 'Loading...'}</p>
                    </div>
                  </section>
                )}
                {selectedSection === 'addressBook' && (
                  <section className="profile-section address-book" >
                    <h3>Address Book</h3>
                    {editingAddress ? (
                      <AddressForm
                        initialAddress={currentAddressIndex !== null ? addresses[currentAddressIndex] : null}
                        onSave={handleSaveAddress}
                        onCancel={handleCancelEdit}
                      />
                    ) : (
                      <>
                        {addresses.length > 0 ? (
                          addresses.map((addr, index) => (
                            <div key={index} className="address-box">
                              <p><strong>Address {index + 1}:</strong></p>
                              <p>{addr.fullName}</p>
                              <p>{addr.phoneNumber}</p>
                              <p>{addr.building}, {addr.colony}, {addr.region}, {addr.city}, {addr.area}</p>
                              <p>{addr.address}</p>
                              <button className="edit-address-button" onClick={() => handleEditClick(index)}>Edit</button>
                            </div>
                          ))
                        ) : (
                          <p>No addresses available</p>
                        )}
                        <button onClick={handleAddNewClick}>Add New Address</button>
                      </>
                    )}
                  </section>
                )}
                {selectedSection === 'paymentOptions' && (
                  <section className="profile-section payment-options">
                    <h3>My Payment Options</h3>
                    <p>Payment options content goes here.</p>
                  </section>
                )}
                {(selectedSection === 'myOrders' || selectedSection === 'myReturns' || selectedSection === 'myCancellations' || selectedSection === 'history') && (
                  <section className="profile-section orders-section">
                    <MyOrders
                      statusFilter={
                        selectedSection === 'myOrders' ? null :
                        selectedSection === 'myReturns' ? 'returned' :
                        selectedSection === 'myCancellations' ? 'canceled' :
                        selectedSection === 'history' ? 'history' :
                        null
                      }
                    />
                  </section>
                )}
              </div>
            </main>
          </div>
        )
      ) : (
        <>
          <p>You are not logged in.</p>
          <Link to="/login" className="profile-login-link">Login</Link>
          <Link to="/register" className="profile-register-link">Register</Link>
        </>
      )}
    </div>
  );
};

export default Profile;
