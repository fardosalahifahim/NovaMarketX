import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/users';

export const fetchAddresses = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}`);
    if (response.data && response.data.addresses) {
      return response.data.addresses;
    }
    return [];
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

export const updateAddresses = async (userId, addresses) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${userId}`, { addresses });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to update addresses');
    }
  } catch (error) {
    console.error('Error updating addresses:', error);
    throw error;
  }
};
