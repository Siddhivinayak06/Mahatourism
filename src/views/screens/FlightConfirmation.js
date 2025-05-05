import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Share,
  ActivityIndicator,
  SafeAreaView,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FlightConfirmation = ({ route }) => {
  const navigation = useNavigation();
  const { bookingDetails, transactionId, flightDetails } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [userName, setUserName] = useState('');
  const [animatedValue] = useState(new Animated.Value(0));
  
  useEffect(()=>{
    console.log('Received in FlightConfirmation:', route.params);
  },[]);
  // Generate booking ID and fetch username on component mount
  useEffect(() => {
    // Generate a random booking ID
    const randomBookingId = `BK${Math.floor(Math.random() * 10000)}${Date.now().toString().slice(-4)}`;
    setBookingId(randomBookingId);
    
    // Fetch user name from AsyncStorage
    const getUserName = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        if (name) {
          setUserName(name);
        }
      } catch (error) {
        console.error('Error retrieving user name:', error);
      }
    };
    
    getUserName();
    
    // Start animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  // Format date to display in readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Convert SQL datetime format to readable format
    // Example: "2025-04-20 09:00:00" to "April 20, 2025"
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        weekday: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format time to display in 12-hour format
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString.split(' ')[1]?.slice(0, 5) || '';
    }
  };

  // Share booking details
  const shareBookingDetails = async () => {
    try {
      await Share.share({
        message: `✈️ My Flight Booking\n\nBooking ID: ${bookingId}\nTransaction ID: ${transactionId}\nFlight: ${bookingDetails.airline} ${bookingDetails.flightNumber}\nFrom: ${bookingDetails.departureAirport} (${bookingDetails.departureCode})\nTo: ${bookingDetails.arrivalAirport} (${bookingDetails.arrivalCode})\nDate: ${formatDate(bookingDetails.departureTime)}\nTime: ${formatTime(bookingDetails.departureTime)}\n\nThank you for booking with us!`,
        title: 'My Flight Booking'
      });
    } catch (error) {
      console.error('Error sharing booking details:', error);
    }
  };

  // Download ticket (simulated)
  const downloadTicket = () => {
    setIsLoading(true);
    
    // Simulate download delay
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would trigger a file download
      alert('Ticket downloaded successfully!');
    }, 2000);
  };

  // Navigate to home screen
  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeScreen' }],
    });
  };

  const circleScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const successIconOpacity = animatedValue.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1]
  });
  
  const detailsTranslateY = animatedValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [50, 50, 0]
  });
  
  const detailsOpacity = animatedValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0, 1]
  });

  // Helper function to format payment status safely
  const formatPaymentStatus = (status) => {
    if (!status) return 'Completed'; // Default value if status is undefined or null
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flight Booking Confirmed</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.successSection}>
          <Animated.View style={[
            styles.successCircle,
            { transform: [{ scale: circleScale }] }
          ]}>
            <Animated.View style={{ opacity: successIconOpacity }}>
              <Icon name="checkmark" size={50} color="#fff" />
            </Animated.View>
          </Animated.View>
          
          <Text style={styles.congratsText}>
            Congratulations{userName ? `, ${userName}` : ''}!
          </Text>
          <Text style={styles.successMessage}>
            Your flight booking has been confirmed. We look forward to serving you.
          </Text>
        </View>

        <Animated.View 
          style={[
            styles.ticketContainer,
            { 
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslateY }]
            }
          ]}
        >
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.airlineName}>{bookingDetails.airline}</Text>
              <Text style={styles.flightNumber}>{bookingDetails.flightNumber}</Text>
            </View>
            <View style={styles.bookingIdContainer}>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdValue}>{bookingId}</Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.flightInfoContainer}>
            <View style={styles.locationContainer}>
              <Text style={styles.airportCode}>{bookingDetails.departureCode}</Text>
              <Text style={styles.airportName}>{bookingDetails.departureAirport}</Text>
            </View>

            <View style={styles.flightPathContainer}>
              <View style={styles.flightPath}>
                <View style={styles.dot} />
                <View style={styles.line} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.duration}>
                {flightDetails?.duration || '2h 30m'}
              </Text>
            </View>

            <View style={styles.locationContainer}>
              <Text style={styles.airportCode}>{bookingDetails.arrivalCode}</Text>
              <Text style={styles.airportName}>{bookingDetails.arrivalAirport}</Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.detailsContainer}>
            <View style={styles.infoSection}>
              <Icon name="calendar-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(bookingDetails.departureTime)}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Icon name="time-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{formatTime(bookingDetails.departureTime)}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Icon name="people-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Passengers</Text>
                <Text style={styles.infoValue}>
                  {bookingDetails.passengers || '1 Adult'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Icon name="business-class" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Class</Text>
                <Text style={styles.infoValue}>
                  {/* Extract class from passengers JSON if available */}
                  {(bookingDetails.passengers && JSON.parse(bookingDetails.passengers)?.seatType) || 'Economy'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Icon name="cash-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Amount Paid</Text>
                <Text style={styles.infoValue}>₹{bookingDetails.amount}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Icon name="checkmark-circle-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Payment Status</Text>
                <Text style={[styles.infoValue, styles.successText]}>
                  {formatPaymentStatus(bookingDetails.paymentStatus)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.transactionContainer}>
            <Text style={styles.transactionLabel}>Transaction ID</Text>
            <Text style={styles.transactionValue}>{transactionId}</Text>
          </View>
        </Animated.View>

        <View style={styles.infoNotesCard}>
          <View style={styles.infoNoteRow}>
            <Icon name="time-outline" size={20} color="#F75D37" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Please arrive at the airport at least 2 hours before departure time.
            </Text>
          </View>
          
          <View style={styles.infoNoteRow}>
            <Icon name="card-outline" size={20} color="#F75D37" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Please present your ID proof and booking confirmation at check-in counter.
            </Text>
          </View>
          
          <View style={styles.infoNoteRow}>
            <Icon name="information-circle-outline" size={20} color="#F75D37" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Cancellation charges apply as per airline policy.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareBookingDetails}
        >
          <Icon name="share-social-outline" size={20} color="#F75D37" />
          <Text style={styles.shareButtonText}>Share booking details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={downloadTicket}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="download-outline" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download E-Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            For any queries related to your booking, please contact our customer support.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Icon name="call-outline" size={18} color="#F75D37" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.thankYouText}>
          Thank you for choosing our service. Have a great journey!
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.footerButton, styles.viewBookingButton]}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.viewBookingButtonText}>View My Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.homeButton]}
          onPress={goToHome}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90, // Space for footer
  },
  successSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F75D37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  ticketContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
  },
  airlineName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  flightNumber: {
    fontSize: 14,
    color: '#555',
  },
  bookingIdContainer: {
    alignItems: 'flex-end',
  },
  bookingIdLabel: {
    fontSize: 12,
    color: '#888',
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F75D37',
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  flightInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  locationContainer: {
    alignItems: 'center',
    flex: 1,
  },
  airportCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  airportName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  flightPathContainer: {
    flex: 1,
    alignItems: 'center',
  },
  flightPath: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F75D37',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F75D37',
    marginHorizontal: 4,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoIcon: {
    marginTop: 2,
    width: 24,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  successText: {
    color: '#009966',
  },
  transactionContainer: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  transactionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoNotesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoNoteRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoNoteIcon: {
    marginTop: 2,
    width: 24,
  },
  infoNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F75D37',
  },
  shareButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#F75D37',
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F75D37',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  downloadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  supportSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  supportButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#F75D37',
    fontWeight: '600',
  },
  thankYouText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBookingButton: {
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  viewBookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  homeButton: {
    backgroundColor: '#F75D37',
    marginLeft: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default FlightConfirmation;