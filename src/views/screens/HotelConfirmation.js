import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HotelConfirmation = ({ route, navigation }) => {
  const { 
    bookingId, 
    hotelName, 
    roomName, 
    checkInDate, 
    checkOutDate, 
    guests, 
    totalAmount 
  } = route.params;
  
  const [userName, setUserName] = useState('');
  const [animatedValue] = useState(new Animated.Value(0));
  
  useEffect(() => {
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
  
  const formatDate = (date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const calculateNights = () => {
    let checkIn, checkOut;
    
    if (typeof checkInDate === 'string') {
      checkIn = new Date(checkInDate);
    } else {
      checkIn = checkInDate;
    }
    
    if (typeof checkOutDate === 'string') {
      checkOut = new Date(checkOutDate);
    } else {
      checkOut = checkOutDate;
    }
    
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };
  
  const shareBooking = async () => {
    try {
      await Share.share({
        message: `I just booked a stay at ${hotelName}!\n\nBooking Details:\nBooking ID: ${bookingId}\nCheck-in: ${formatDate(checkInDate)}\nCheck-out: ${formatDate(checkOutDate)}\nRoom: ${roomName}\nGuests: ${guests}`,
        title: 'My Hotel Booking'
      });
    } catch (error) {
      console.error('Error sharing booking:', error);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
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
            Your booking has been confirmed. We look forward to hosting you.
          </Text>
        </View>
        
        <Animated.View 
          style={[
            styles.detailsCard,
            { 
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslateY }]
            }
          ]}
        >
          <Text style={styles.detailsTitle}>Booking Information</Text>
          
          <View style={styles.bookingIdRow}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <Text style={styles.bookingId}>{bookingId}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.hotelInfoSection}>
            <Icon name="business-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Hotel</Text>
              <Text style={styles.infoValue}>{hotelName}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Icon name="bed-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Room Type</Text>
              <Text style={styles.infoValue}>{roomName}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Icon name="calendar-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Check-in</Text>
              <Text style={styles.infoValue}>{formatDate(checkInDate)}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Icon name="calendar-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Check-out</Text>
              <Text style={styles.infoValue}>{formatDate(checkOutDate)}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Icon name="time-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{calculateNights()} night(s)</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Icon name="people-outline" size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Guests</Text>
              <Text style={styles.infoValue}>{guests} person(s)</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </Animated.View>
        
        <View style={styles.infoNotesCard}>
          <View style={styles.infoNoteRow}>
            <Icon name="time-outline" size={20} color="#FF5733" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Check-in time starts at 2:00 PM. Check-out time is 12:00 PM.
            </Text>
          </View>
          
          <View style={styles.infoNoteRow}>
            <Icon name="card-outline" size={20} color="#FF5733" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Please present your ID proof and booking confirmation at check-in.
            </Text>
          </View>
          
          <View style={styles.infoNoteRow}>
            <Icon name="information-circle-outline" size={20} color="#FF5733" style={styles.infoNoteIcon} />
            <Text style={styles.infoNoteText}>
              Free cancellation available until 24 hours before check-in.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareBooking}
        >
          <Icon name="share-social-outline" size={20} color="#FF5733" />
          <Text style={styles.shareButtonText}>Share booking details</Text>
        </TouchableOpacity>
        
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            For any queries related to your booking, please contact our customer support.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Icon name="call-outline" size={18} color="#FF5733" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
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
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#4CAF50',
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
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingIdLabel: {
    fontSize: 14,
    color: '#666',
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5733',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  hotelInfoSection: {
    flexDirection: 'row',
    marginBottom: 12,
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
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5733',
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
    borderColor: '#FF5733',
  },
  shareButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5733',
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
    color: '#FF5733',
    fontWeight: '600',
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
    backgroundColor: '#FF5733',
    marginLeft: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HotelConfirmation;