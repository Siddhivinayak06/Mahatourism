import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getRoomDetails, createBooking } from './HotelService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingScreen = ({ route, navigation }) => {
  const { hotelId, hotelName, roomType } = route.params;
  
  const [room, setRoom] = useState(roomType || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Booking details
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Next day by default
  const [guests, setGuests] = useState(1);
  const [showCheckInDatePicker, setShowCheckInDatePicker] = useState(false);
  const [showCheckOutDatePicker, setShowCheckOutDatePicker] = useState(false);
  
  // Guest information
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('User ID loaded:', storedUserId);
        } else {
          console.log('No user ID found in storage');
          setError({...error, user: 'User not logged in. Please log in to continue.'});
        }
      } catch (err) {
        console.error('Error retrieving user data:', err);
        setError({...error, general: 'Failed to retrieve user information.'});
      }
    };
    
    getUserData();
  }, []);

  useEffect(() => {
    if (!roomType && hotelId) {
      loadRoomDetails();
    }
  }, [hotelId, roomType]);

  const loadRoomDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getRoomDetails(hotelId);
      if (data && data.length > 0) {
        setRoom(data[0]); // Default to first room type
      }
    } catch (error) {
      setError('Failed to load room details. Please try again later.');
      console.error('Error fetching room details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCheckInDateChange = (event, selectedDate) => {
    setShowCheckInDatePicker(false);
    if (selectedDate) {
      setCheckInDate(selectedDate);
      
      // If check-out date is before or same as check-in date, set it to next day
      if (checkOutDate <= selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(nextDay);
      }
    }
  };

  const onCheckOutDateChange = (event, selectedDate) => {
    setShowCheckOutDatePicker(false);
    if (selectedDate) {
      // Ensure check-out is after check-in
      if (selectedDate > checkInDate) {
        setCheckOutDate(selectedDate);
      } else {
        Alert.alert("Invalid Date", "Check-out date must be after check-in date.");
      }
    }
  };

  const calculateNights = () => {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateTotalPrice = () => {
    if (!room) return 0;
    const nights = calculateNights();
    const roomPrice = parseFloat(room.price_per_night) * nights;
    const taxes = roomPrice * 0.18; // Assuming 18% tax
    return roomPrice + taxes;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const incrementGuests = () => {
    if (guests < (room ? room.capacity : 4)) {
      setGuests(guests + 1);
    } else {
      Alert.alert("Maximum Guests", `This room can accommodate a maximum of ${room ? room.capacity : 4} guests.`);
    }
  };

  const decrementGuests = () => {
    if (guests > 1) {
      setGuests(guests - 1);
    }
  };

  const validateForm = () => {
    if (!userId) {
      Alert.alert("Error", "You need to be logged in to make a booking. Please log in and try again.");
      return false;
    }
    
    if (!guestName.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return false;
    }
    
    if (!guestEmail.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return false;
    }
    
    if (!guestPhone.trim()) {
      Alert.alert("Error", "Please enter your phone number.");
      return false;
    }
    
    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const formatDateForMySQL = (date) => {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };
      
      const bookingData = {
        hotel_id: hotelId,
        room_id: room.id,
        user_id: userId,
        check_in_date: formatDateForMySQL(checkInDate),
        check_out_date: formatDateForMySQL(checkOutDate),
        guest_count: guests,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_requests: specialRequests,
        payment_method: paymentMethod,
        total_amount: calculateTotalPrice(),
      };
      
      const response = await createBooking(bookingData);
      
      // Navigate to confirmation screen
      navigation.navigate('HotelConfirmation', {
        bookingId: response.booking_id,
        hotelName,
        roomName: room.name,
        checkInDate,
        checkOutDate,
        guests,
        totalAmount: calculateTotalPrice(),
      });
    } catch (error) {
      Alert.alert(
        "Booking Failed",
        "Unable to complete your booking. Please try again later."
      );
      console.error('Error creating booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !room) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5733" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (error && error.user) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="person-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>{error.user}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.retryButtonText}>Log In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="cloud-offline-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRoomDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="warning-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>Room information not found.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Booking</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.bookingDetails}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            
            <View style={styles.hotelInfoCard}>
              <Text style={styles.hotelName}>{hotelName}</Text>
              <Text style={styles.roomTypeName}>{room.name}</Text>
            </View>
            
            <View style={styles.dateContainer}>
              <TouchableOpacity 
                style={styles.dateSelector} 
                onPress={() => setShowCheckInDatePicker(true)}
              >
                <View style={styles.dateLabel}>
                  <Icon name="calendar-outline" size={20} color="#FF5733" />
                  <Text style={styles.dateLabelText}>Check-in</Text>
                </View>
                <Text style={styles.dateValue}>{formatDate(checkInDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateSelector} 
                onPress={() => setShowCheckOutDatePicker(true)}
              >
                <View style={styles.dateLabel}>
                  <Icon name="calendar-outline" size={20} color="#FF5733" />
                  <Text style={styles.dateLabelText}>Check-out</Text>
                </View>
                <Text style={styles.dateValue}>{formatDate(checkOutDate)}</Text>
              </TouchableOpacity>
            </View>
            
            {showCheckInDatePicker && (
              <DateTimePicker
                value={checkInDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onCheckInDateChange}
              />
            )}
            
            {showCheckOutDatePicker && (
              <DateTimePicker
                value={checkOutDate}
                mode="date"
                display="default"
                minimumDate={new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)}
                onChange={onCheckOutDateChange}
              />
            )}
            
            <View style={styles.guestsContainer}>
              <Text style={styles.guestsLabel}>Guests</Text>
              <View style={styles.guestsCounter}>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={decrementGuests}
                >
                  <Icon name="remove" size={20} color="#FF5733" />
                </TouchableOpacity>
                <Text style={styles.guestsCount}>{guests}</Text>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={incrementGuests}
                >
                  <Icon name="add" size={20} color="#FF5733" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.stayDetailsCard}>
              <View style={styles.stayDetail}>
                <Text style={styles.stayDetailLabel}>Duration</Text>
                <Text style={styles.stayDetailValue}>{calculateNights()} night(s)</Text>
              </View>
              <View style={styles.stayDetail}>
                <Text style={styles.stayDetailLabel}>Room Type</Text>
                <Text style={styles.stayDetailValue}>{room.name}</Text>
              </View>
              <View style={styles.stayDetail}>
                <Text style={styles.stayDetailLabel}>Max Occupancy</Text>
                <Text style={styles.stayDetailValue}>{room.capacity} guests</Text>
              </View>
              <View style={styles.stayDetail}>
                <Text style={styles.stayDetailLabel}>Bed Type</Text>
                <Text style={styles.stayDetailValue}>{room.bed_type}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.guestInfoSection}>
            <Text style={styles.sectionTitle}>Guest Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={guestName}
                onChangeText={setGuestName}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={guestEmail}
                onChangeText={setGuestEmail}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={guestPhone}
                onChangeText={setGuestPhone}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requests or preferences?"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                value={specialRequests}
                onChangeText={setSpecialRequests}
              />
            </View>
          </View>
          
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod('card')}
            >
              <Icon name="card-outline" size={24} color={paymentMethod === 'card' ? "#FF5733" : "#666"} />
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentOptionTitle}>Credit/Debit Card</Text>
                <Text style={styles.paymentOptionSubtitle}>Pay securely with your card</Text>
              </View>
              {paymentMethod === 'card' && (
                <Icon name="checkmark-circle" size={24} color="#FF5733" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'upi' && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod('upi')}
            >
              <Icon name="phone-portrait-outline" size={24} color={paymentMethod === 'upi' ? "#FF5733" : "#666"} />
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentOptionTitle}>UPI Payment</Text>
                <Text style={styles.paymentOptionSubtitle}>Pay with Google Pay, PhonePe, etc.</Text>
              </View>
              {paymentMethod === 'upi' && (
                <Icon name="checkmark-circle" size={24} color="#FF5733" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'hotel' && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod('hotel')}
            >
              <Icon name="cash-outline" size={24} color={paymentMethod === 'hotel' ? "#FF5733" : "#666"} />
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentOptionTitle}>Pay at Hotel</Text>
                <Text style={styles.paymentOptionSubtitle}>Pay during check-in</Text>
              </View>
              {paymentMethod === 'hotel' && (
                <Icon name="checkmark-circle" size={24} color="#FF5733" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceSummarySection}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            
            <View style={styles.priceSummaryCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Room Charges</Text>
                <Text style={styles.priceValue}>₹{room.price_per_night} x {calculateNights()} night(s)</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Room Total</Text>
                <Text style={styles.priceValue}>₹{room.price_per_night * calculateNights()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & Fees (18%)</Text>
                <Text style={styles.priceValue}>₹{(room.price_per_night * calculateNights() * 0.18).toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRowTotal}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{calculateTotalPrice().toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cancellationPolicy}>
            <Icon name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.cancellationText}>
              Free cancellation until 24 hours before check-in. Cancellation after that will incur a fee of one night's stay.
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <View style={styles.footerPriceContainer}>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPrice}>₹{calculateTotalPrice().toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleBooking}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#FF5733',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Booking details styles
  bookingDetails: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  hotelInfoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomTypeName: {
    fontSize: 14,
    color: '#666',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateSelector: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  dateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabelText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  guestsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  guestsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  stayDetailsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  stayDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stayDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  stayDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Guest information styles
  guestInfoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Payment styles
  paymentSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedPaymentOption: {
    borderColor: '#FF5733',
    backgroundColor: '#fff4f2',
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Price summary styles
  priceSummarySection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  priceSummaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5733',
  },
  // Cancellation policy styles
  cancellationPolicy: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 92, // Space for footer
  },
  cancellationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5733',
  },
  confirmButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default BookingScreen;