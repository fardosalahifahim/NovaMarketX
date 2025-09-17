import React from 'react';
import AddressForm from './AddressForm';

const AddressBookPhone = ({
  addresses = [],
  editingAddress = false,
  currentAddressIndex = null,
  handleEditClick = () => {},
  handleAddNewClick = () => {},
  handleSaveAddress = () => {},
  handleCancelEdit = () => {},
}) => {
  return (
    <section className="profile-section address-book">
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
  );
};

export default AddressBookPhone;
