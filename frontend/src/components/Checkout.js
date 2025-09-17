import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { fetchAddresses, updateAddresses } from '../services/AddressBookService';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import PaymentGateway from './PaymentGateway';
import './Checkout.css';
import { CartContext } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import AddressForm from './AddressForm';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const { cartItems, clearCart } = useContext(CartContext);
  const { showOrderNotification, showOrderStatusNotification, showOrderConfirmationNotification } = useNotification();


  // Parse query parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const userIdFromUrl = searchParams.get('userId');

  const [currentStep, setCurrentStep] = useState(1); // 1: Shipping Info, 2: Payment, 3: Confirmation
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    building: '',
    colony: '',
    region: '',
    city: '',
    area: '',
    address: ''
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || user.uid !== userIdFromUrl) {
        setAccessDenied(true);
        setLoading(false);
      } else {
        setAccessDenied(false);
        fetchSavedAddresses(userIdFromUrl);
      }
    });
    return () => unsubscribe();
  }, [auth, userIdFromUrl]);

  const fetchSavedAddresses = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}`);
      if (res.data && res.data.addresses) {
        setSavedAddresses(res.data.addresses);
        if (res.data.addresses.length > 0) {
          setSelectedAddressIndex(0);
          setForm(res.data.addresses[0]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      setLoading(false);
    }
  };

  const handleSelectAddress = (index) => {
    setSelectedAddressIndex(index);
    if (savedAddresses && savedAddresses.length > index) {
      setForm(savedAddresses[index]);
    } else {
      setForm({
        fullName: '',
        phoneNumber: '',
        building: '',
        colony: '',
        region: '',
        city: '',
        area: '',
        address: ''
      });
    }
  };

  const handleEditAddress = () => {
    setEditingAddress(true);
  };

  const handleSaveAddress = async (updatedAddress) => {
    try {
      if (selectedAddressIndex === null) {
        // Adding new address
        const newAddresses = [...savedAddresses, updatedAddress];
        await updateUserAddresses(newAddresses);
        setSelectedAddressIndex(newAddresses.length - 1);
        setForm(updatedAddress);
      } else {
        // Updating existing address
        const newAddresses = [...savedAddresses];
        newAddresses[selectedAddressIndex] = updatedAddress;
        await updateUserAddresses(newAddresses);
        setForm(updatedAddress);
      }
      setEditingAddress(false);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const updateUserAddresses = async (addresses) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${userIdFromUrl}`, {
        addresses: addresses
      });
      if (res.status === 200) {
        setSavedAddresses(addresses);
      } else {
        console.error('Failed to update addresses');
      }
    } catch (error) {
      console.error('Error updating addresses:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(false);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!form.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!form.building.trim()) {
      setError('Building / House No / Floor / Street is required');
      return false;
    }
    if (!form.colony.trim()) {
      setError('Colony / Suburb / Locality / Landmark is required');
      return false;
    }
    if (!form.region.trim()) {
      setError('Region is required');
      return false;
    }
    if (!form.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!form.area.trim()) {
      setError('Area is required');
      return false;
    }
    if (!form.address.trim()) {
      setError('Address is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setSuccessMessage('');
    setCurrentStep(2); // Move to Payment step without placing order
  };

  const handleBackToShipping = () => {
    setCurrentStep(1);
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedPaymentMethod) {
        setError('Please select a payment method');
        return;
      }
      // Calculate total price from cartItems and products
      // Include quantity information for each product
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      
      // Create product details array with id and quantity for each item
      const productDetails = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity || 1
      }));

      const orderData = {
        shippingAddress: form,
        productDetails: productDetails,
        paymentMethod: selectedPaymentMethod,
        totalPrice: totalPrice,
        status: 'processing',
        userId: userIdFromUrl,
        orderDate: new Date().toISOString()
      };
      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      setSuccessMessage('Order placed successfully!');
      setForm({
        fullName: '',
        phoneNumber: '',
        building: '',
        colony: '',
        region: '',
        city: '',
        area: '',
        address: ''
      });
      setSelectedPaymentMethod('');
      clearCart();
      setCurrentStep(3); // Move to Confirmation step after placing order
      setError('');

      // Notification will be handled by MyOrders component when status changes

    } catch (error) {
      setError('Failed to place order. Please try again.');
      console.error('Order submission error:', error);
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="checkout-container">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this checkout page.</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="order-steps">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>Shipping Info</div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>Payment</div>
        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>Confirmation</div>
      </div>

      {currentStep === 1 && (
        <>
          <h2>Select Shipping Address</h2>
          <div className="address-select-dropdown">
            <select
              value={selectedAddressIndex !== null ? selectedAddressIndex : 'add_new'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'add_new') {
                  setEditingAddress(true);
                  setSelectedAddressIndex(null);
                } else {
                  const index = parseInt(value, 10);
                  handleSelectAddress(index);
                  setEditingAddress(false);
                }
              }}
            >
              {savedAddresses.length > 0 ? (
                savedAddresses.map((addr, index) => (
                  <option key={index} value={index}>
                    {`Address ${index + 1}`}
                  </option>
                ))
              ) : null}
              <option value="add_new">Add New Address</option>
            </select>
          </div>

          {editingAddress && (
            <AddressForm
              initialAddress={selectedAddressIndex !== null ? savedAddresses[selectedAddressIndex] : null}
              onSave={handleSaveAddress}
              onCancel={handleCancelEdit}
            />
          )}

          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          {!editingAddress && (
            <form onSubmit={handleSubmit} className="checkout-form">
              <label>
                Full name
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your first and last name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Phone Number
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Please enter your phone number"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Building / House No / Floor / Street
                <input
                  type="text"
                  name="building"
                  placeholder="Please enter"
                  value={form.building}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Colony / Suburb / Locality / Landmark
                <input
                  type="text"
                  name="colony"
                  placeholder="Please enter"
                  value={form.colony}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Region
                <input
                  type="text"
                  name="region"
                  placeholder="Please choose your region"
                  value={form.region}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  name="city"
                  placeholder="Please choose your city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Area
                <input
                  type="text"
                  name="area"
                  placeholder="Please choose your area"
                  value={form.area}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Address
                <textarea
                  name="address"
                  placeholder="For Example: House# 123, Street# 123, ABC Road"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </label>
              <button type="submit">Next: Payment</button>
            </form>
          )}
        </>
      )}

      {currentStep === 2 && (
        <>
          <PaymentGateway onSelectPaymentMethod={setSelectedPaymentMethod} />
          <div className="payment-navigation">
            <button onClick={handleBackToShipping}>Back to Shipping</button>
            <button onClick={handlePlaceOrder}>Place Order</button>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <h2>Order Confirmation</h2>
          <p>Your order has been placed successfully!</p>
        </>
      )}
    </div>
  );
};

export default Checkout;
