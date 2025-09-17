import React, { useState } from 'react';
import './AddressForm.css';

const AddressForm = ({ initialAddress, onSave, onCancel }) => {
  const [address, setAddress] = useState(initialAddress || {
    fullName: '',
    phoneNumber: '',
    building: '',
    colony: '',
    region: '',
    city: '',
    area: '',
    address: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(address);
  };

  return (
    <div className="address-card">
      <form className="address-form" onSubmit={handleSubmit}>
        <label>
          Full Name:
          <input type="text" name="fullName" value={address.fullName} onChange={handleChange} required />
        </label>
        <label>
          Phone Number:
          <input type="text" name="phoneNumber" value={address.phoneNumber} onChange={handleChange} required />
        </label>
        <label>
          Building / House No / Floor / Street:
          <input type="text" name="building" value={address.building} onChange={handleChange} />
        </label>
        <label>
          Colony / Suburb / Locality / Landmark:
          <input type="text" name="colony" value={address.colony} onChange={handleChange} />
        </label>
        <label>
          Region:
          <input type="text" name="region" value={address.region} onChange={handleChange} />
        </label>
        <label>
          City:
          <input type="text" name="city" value={address.city} onChange={handleChange} />
        </label>
        <label>
          Area:
          <input type="text" name="area" value={address.area} onChange={handleChange} />
        </label>
        <label>
          Address:
          <textarea name="address" value={address.address} onChange={handleChange} />
        </label>
        <div className="address-form-buttons">
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
