import axios from 'axios';
const API_CONFIG = 'http://192.168.1.5:5000';
// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: 'http://192.168.1.6:5000',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Fetch featured hotels from the API
 * @returns {Promise<Array>} Array of featured hotel objects
 */
export const fetchAllHotels = async () => {
  try {
    const response = await apiClient.get('/api/hotels');
    return response.data;
  } catch (error) {
    console.error('API Error - fetchAllHotels:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch All hotels');
  }
};
export const fetchFeaturedHotels = async () => {
  try {
    const response = await apiClient.get('/api/hotels/featured');
    return response.data;
  } catch (error) {
    console.error('API Error - fetchFeaturedHotels:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch featured hotels');
  }
};

/**
 * Search for hotels based on provided parameters
 * @param {Object} searchParams - Search parameters object
 * @returns {Promise<Array>} Array of hotel objects matching the search criteria
 */
export const searchHotels = async (searchParams) => {
  try {
    const response = await apiClient.get('/api/hotels/search', {
      params: searchParams
    });
    return response.data;
  } catch (error) {
    console.error('API Error - searchHotels:', error);
    throw new Error(error.response?.data?.message || 'Failed to search for hotels');
  }
};

/**
 * Get detailed information for a specific hotel
 * @param {string|number} hotelId - The ID of the hotel to fetch
 * @returns {Promise<Object>} Detailed hotel information
 */
export const getHotelDetails = async (hotelId) => {
  try {
    // In a real implementation, you would make API calls to your backend
    // which would query your database tables
    
    // API call to fetch hotel basic info
    const hotelResponse = await apiClient.get(`/api/hotels/${hotelId}`);
    const hotel = await hotelResponse.data;
    
    // API call to fetch hotel amenities
    const amenitiesResponse = await apiClient.get(`/api/hotels/${hotelId}/amenities`);
    const amenities = await amenitiesResponse.data;
    
    // API call to fetch room types
    const roomTypesResponse = await apiClient.get(`/api/hotels/${hotelId}/room-types`);
    const roomTypes = await roomTypesResponse.data;
    
    // API call to fetch reviews
    const reviewsResponse = await apiClient.get(`/api/hotels/${hotelId}/reviews`);
    const reviews = await reviewsResponse.data;
    
    // API call to fetch policies
    const policiesResponse = await apiClient.get(`/api/hotels/${hotelId}/policies`);
    const policies = await policiesResponse.data;
    
    return {
      hotel,
      amenities,
      roomTypes,
      reviews,
      policies: policies.length > 0 ? policies[0] : null
    };
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    throw error;
  }
};

/**
 * Get hotel reviews for a specific hotel
 * @param {string|number} hotelId - The ID of the hotel to fetch reviews for
 * @returns {Promise<Array>} Array of review objects
 */
export const getHotelReviews = async (hotelId) => {
  try {
    const response = await apiClient.get(`/api/hotels/${hotelId}/reviews`);
    return response.data;
  } catch (error) {
    console.error('API Error - getHotelReviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch hotel reviews');
  }
};
export const createBooking = async (bookingData) => {
  try {
    const response = await apiClient.post(`/api/hotel-bookings`, {
      hotel_id: bookingData.hotel_id,
      room_type_id: bookingData.room_id,
      user_id: bookingData.user_id,  // Add user_id to the request
      guest_name: bookingData.guest_name,
      guest_email: bookingData.guest_email,
      guest_phone: bookingData.guest_phone,
      check_in_date: bookingData.check_in_date,
      check_out_date: bookingData.check_out_date,
      guests_count: bookingData.guest_count,
      total_price: bookingData.total_amount,
      special_requests: bookingData.special_requests,
      payment_method: bookingData.payment_method  // Add payment_method
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};