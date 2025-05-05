import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../../consts/colors';
import axios from 'axios';
import { IP_ADDRESS, PORT } from '@env';

const API_BASE_URL = `https://mahatourism.onrender.com/api`;

const BookingDetails = ({ route, navigation }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { bookingId } = route.params || {};
  
  useEffect(() => {
    console.log("BookingDetails received params:", route.params);
  }, []);
  
  useEffect(() => {
    fetchBookingDetails();
    console.log("booking:", bookingId);
  }, []);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      if (bookingId) {
        const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`);
        console.log("API Response:", response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          // The API returns an array, so we take the first item
          setBooking(response.data[0]);
        } else if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Handle case where API returns {success: true, data: [...]}
          setBooking(response.data.data[0]);
        } else {
          // No booking found
          setError('Booking not found');
        }
      } else {
        setError('Booking ID not provided');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to fetch booking details. Please try again later.');
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "No",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: () => cancelBooking(),
          style: "destructive"
        }
      ]
    );
  };

  const cancelBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/bookings/cancel/${bookingId}`);
      if (response.data && response.data.success) {
        Alert.alert(
          "Booking Cancelled",
          "Your booking has been cancelled successfully",
          [
            { 
              text: "OK", 
              onPress: () => navigation.navigate('Bookings',{userId:booking?.user_id})
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to cancel booking");
      }
      setLoading(false);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      Alert.alert("Error", "Failed to cancel booking. Please try again later.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const renderDetailItem = (label, value, icon) => (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        {icon}
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  const renderStatusBadge = (status) => {
    let badgeStyle, textStyle;
    
    switch(status) {
      case 'Confirmed':
        badgeStyle = { backgroundColor: '#d4edda' };
        textStyle = { color: '#155724' };
        break;
      case 'Pending':
        badgeStyle = { backgroundColor: '#fff3cd' };
        textStyle = { color: '#856404' };
        break;
      case 'Cancelled':
        badgeStyle = { backgroundColor: '#f8d7da' };
        textStyle = { color: '#721c24' };
        break;
      default:
        badgeStyle = { backgroundColor: '#e2e3e5' };
        textStyle = { color: '#383d41' };
    }
    
    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <Text style={[styles.statusText, textStyle]}>
          {status || 'Processing'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color={COLORS.primary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBookingDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If booking is null, show an error screen
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color={COLORS.primary} />
          <Text style={styles.errorText}>No booking information found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBookingDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTitle}>
              {booking.package_destination || 'Booking'}
            </Text>
            {renderStatusBadge(booking.status)}
          </View>
          
          <View style={styles.bookingId}>
            <Text style={styles.bookingIdText}>Booking ID: #{bookingId}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            {renderDetailItem(
              'Package', 
              booking.package_name || 'Custom Package',
              <Icon name="flight" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Destination', 
              booking.package_destination || 'Not specified',
              <Icon name="place" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Travel Date', 
              formatDate(booking.travel_date),
              <Icon name="event" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Duration', 
              `${booking.duration || '1'} days`,
              <Icon name="access-time" size={20} color={COLORS.primary} />
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Traveler Information</Text>
            {renderDetailItem(
              'Adults', 
              booking.adults || '0',
              <Icon name="person" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Children', 
              booking.children || '0',
              <Icon name="child-care" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Guide', 
              booking.lead_traveler_name || 'Amit Singh',
              <Icon name="account-circle" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Guide Contact', 
              booking.contact_number || '+91 9906690319',
              <Icon name="phone" size={20} color={COLORS.primary} />
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            {renderDetailItem(
              'Package Price', 
              `₹${booking.total_price || '0'}`,
              <Icons name="currency-inr" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Additional Charges', 
              `₹${booking.additional_charges || '500'}`,
              <Icons name="cash-plus" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Discount', 
              `₹${booking.discount || '500'}`,
              <Icons name="cash-minus" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Total Amount', 
              `₹${booking.total_price || '0'}`,
              <Icons name="cash" size={20} color={COLORS.primary} />
            )}
            {renderDetailItem(
              'Payment Status', 
              booking.payment_status || 'Not paid',
              <Icon name="payment" size={20} color={COLORS.primary} />
            )}
          </View>
          
          {booking.special_requests && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Requests</Text>
              <View style={styles.specialRequests}>
                <Text style={styles.specialRequestsText}>
                  {booking.special_requests}
                </Text>
              </View>
            </View>
          )}
          
          {booking.status !== 'Cancelled' && (
            <View style={styles.actionsContainer}>
              {booking.status === 'Pending' && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PaymentScreen', { bookingId: booking.booking_id })}
                >
                  <Text style={styles.actionButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelBooking}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingId: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookingIdText: {
    fontSize: 14,
    color: COLORS.grey,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  specialRequests: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  specialRequestsText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.dark,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default BookingDetails;