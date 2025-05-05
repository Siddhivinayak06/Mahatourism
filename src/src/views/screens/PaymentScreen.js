import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from "axios";
import { IP_ADDRESS, PORT } from '@env';

const PaymentScreen = ({ route }) => {
  const navigation = useNavigation();
  const { 
    bookingDetails, 
    flightDetails, 
    amount, 
    seatType, 
    departureDate, 
    passengers, 
    tripType,
    departureTime,
    arrivalTime,
    duration
  } = route.params;

  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'netbanking'
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(()=>{
    console.log('Received in PaymentScreen:', route.params);
  },[]);
  // Fetch user ID from AsyncStorage on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          // If userId is not in storage, navigate back or show error
          Alert.alert(
            "Authentication Required",
            "Please login to continue with booking.",
            [
              { 
                text: "OK", 
                onPress: () => navigation.navigate('Login', { 
                  returnTo: 'FlightDetailsScreen',
                  flightDetails,
                  seatType,
                  departureDate,
                  passengers,
                  tripType,
                  departureTime,
                  arrivalTime,
                  duration,
                  amount
                }) 
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
  }, []);

  // Validate the form based on selected payment method
  const validateForm = () => {
    const errors = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (paymentMethod === 'card') {
      if (!cardNumber) {
        errors.cardNumber = 'Card number is required';
      } else if (cardNumber.replace(/\s/g, '').length !== 16) {
        errors.cardNumber = 'Card number must be 16 digits';
      }

      if (!cardName) {
        errors.cardName = 'Cardholder name is required';
      }

      if (!expiryDate) {
        errors.expiryDate = 'Expiry date is required';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        errors.expiryDate = 'Expiry date must be in MM/YY format';
      }

      if (!cvv) {
        errors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(cvv)) {
        errors.cvv = 'CVV must be 3 or 4 digits';
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        errors.upiId = 'UPI ID is required';
      } else if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        errors.upiId = 'Invalid UPI ID format';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Handle form submission
  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
  
    try {
      // Generate a unique transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Prepare data for API call - match expected backend property names
      const bookingData = {
        userId: userId,
        flightNumber: bookingDetails.flight_number,
        airline: bookingDetails.airline,
        departureAirport: bookingDetails.departure_airport,
        departureCode: bookingDetails.departure_code,
        arrivalAirport: bookingDetails.arrival_airport,
        arrivalCode: bookingDetails.arrival_code,
        departureTime: formatDateTimeForDb(departureDate, departureTime || '09:00'),
        arrivalTime: formatDateTimeForDb(departureDate, arrivalTime || '11:30'),
        passengers: JSON.stringify(bookingDetails.passengers),
        amount: amount,
        bookingDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        email: email,
        transactionId: transactionId,
        paymentStatus: 'completed'
      };
      
      console.log('Sending booking data:', bookingData);
      
      // Make the actual API call - check if your backend URL is correct
      const response = await axios.post('https://mahatourism.onrender.com/save-booking', bookingData);
      
      console.log('API response:', response.data);
      
      setLoading(false);
      
      // Navigate to success screen
      navigation.navigate('FlightConfirmation', {
        bookingDetails: bookingData,
        transactionId,
        flightDetails
      });
      
    } catch (error) {
      setLoading(false);
      console.error('Payment error:', error);
      Alert.alert(
        "Payment Error",
        `There was an error processing your payment: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };
  // Format date and time for database storage
  const formatDateTimeForDb = (date, time) => {
    if (!date || !time) return null;
    
    // Format depends on how your date is stored
    // Assuming date format is DD/MM/YYYY
    const [day, month, year] = date.split('/');
    const [hours, minutes] = time.split(':');
    
    // Create a date object in YYYY-MM-DD HH:MM:SS format for MySQL
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButtonWrapper}
            onPress={() => navigation.goBack()}
          >
            <Image 
              source={require('../../assets/icons/backbutton.png')}
              style={styles.backButtonImage}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Payment</Text>
        </View>

        <View style={styles.flightSummary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Flight</Text>
            <Text style={styles.summaryValue}>{bookingDetails.airline} {bookingDetails.flight_number}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue}>{bookingDetails.departure_code} → {bookingDetails.arrival_code}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{departureDate}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Passengers</Text>
            <Text style={styles.summaryValue}>{passengers}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Seat Type</Text>
            <Text style={styles.summaryValue}>{seatType}</Text>
          </View>
          
          <View style={styles.totalAmount}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{amount}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, formErrors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'upi' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('upi')}
            >
              <Text style={styles.paymentOptionText}>UPI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'netbanking' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('netbanking')}
            >
              <Text style={styles.paymentOptionText}>Net Banking</Text>
            </TouchableOpacity>
          </View>

          {paymentMethod === 'card' && (
            <View style={styles.cardForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={[styles.input, formErrors.cardNumber && styles.inputError]}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  placeholder="XXXX XXXX XXXX XXXX"
                  keyboardType="numeric"
                  maxLength={19} // 16 digits + 3 spaces
                />
                {formErrors.cardNumber && <Text style={styles.errorText}>{formErrors.cardNumber}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cardholder Name</Text>
                <TextInput
                  style={[styles.input, formErrors.cardName && styles.inputError]}
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="Enter name as on card"
                  autoCapitalize="words"
                />
                {formErrors.cardName && <Text style={styles.errorText}>{formErrors.cardName}</Text>}
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={[styles.input, formErrors.expiryDate && styles.inputError]}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  {formErrors.expiryDate && <Text style={styles.errorText}>{formErrors.expiryDate}</Text>}
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={[styles.input, formErrors.cvv && styles.inputError]}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="XXX"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                  {formErrors.cvv && <Text style={styles.errorText}>{formErrors.cvv}</Text>}
                </View>
              </View>
            </View>
          )}

          {paymentMethod === 'upi' && (
            <View style={styles.upiForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput
                  style={[styles.input, formErrors.upiId && styles.inputError]}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  autoCapitalize="none"
                />
                {formErrors.upiId && <Text style={styles.errorText}>{formErrors.upiId}</Text>}
              </View>
            </View>
          )}

          {paymentMethod === 'netbanking' && (
            <View style={styles.netbankingForm}>
              <Text style={styles.infoText}>Select your bank from the list below</Text>
              
              {/* Sample bank list - you would expand this in a real app */}
              <TouchableOpacity style={styles.bankOption}>
                <Text style={styles.bankName}>State Bank of India</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.bankOption}>
                <Text style={styles.bankName}>HDFC Bank</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.bankOption}>
                <Text style={styles.bankName}>ICICI Bank</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.bankOption}>
                <Text style={styles.bankName}>Axis Bank</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By proceeding with payment, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Pay ₹{amount}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButtonWrapper: {
    padding: 5,
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  flightSummary: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  totalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F75D37',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#F75D37',
  },
  errorText: {
    color: '#F75D37',
    fontSize: 12,
    marginTop: 5,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedPayment: {
    borderColor: '#F75D37',
    backgroundColor: '#e6f0ff',
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardForm: {
    marginTop: 10,
  },
  upiForm: {
    marginTop: 10,
  },
  netbankingForm: {
    marginTop: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  bankName: {
    fontSize: 16,
  },
  infoText: {
    color: '#666',
    marginBottom: 15,
    fontSize: 14,
  },
  termsSection: {
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 80, // Extra space for the floating button
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: '#F75D37',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default PaymentScreen;