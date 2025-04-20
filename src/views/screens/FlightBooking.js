import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IP_ADDRESS, PORT } from '@env';

const FlightBooking = () => {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserIdAndBookings = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          fetchBookings(storedUserId);
        } else {
          Alert.alert(
            'Not Logged In',
            'Please login to view your bookings',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Login',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        setLoading(false);
      }
    };

    fetchUserIdAndBookings();
  }, [navigation]);

  const fetchBookings = async (userId) => {
    try {
      console.log('Fetching bookings for user:', userId);
      console.log('API endpoint:', `http://192.168.1.6:${PORT}/user-bookings/${userId}`);
      
      const response = await fetch(`http://192.168.1.6:${PORT}/user-bookings/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bookings fetched successfully:', data.bookings.length);
      
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const handleViewBookingDetails = (booking) => {
    // Navigate to booking details screen
    navigation.navigate('BookingDetailsScreen', { booking });
  };

  const renderBookingItem = ({ item }) => {
    // Parse passengers from JSON string
    const passengers = item.passengers ? JSON.parse(item.passengers) : [];
    
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleViewBookingDetails(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.flightNumber}>{item.flight_number}</Text>
          <Text style={[
            styles.statusBadge,
            item.payment_status === 'completed' ? styles.statusCompleted : 
            item.payment_status === 'pending' ? styles.statusPending : styles.statusFailed
          ]}>
            {item.payment_status.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.flightInfo}>
          <View style={styles.airportInfo}>
            <Text style={styles.airportCode}>{item.departure_code}</Text>
            <Text style={styles.airportName}>{item.departure_airport}</Text>
          </View>
          
          <View style={styles.flightPath}>
            <View style={styles.dottedLine} />
            <View style={styles.planeDot}>
              <Text style={styles.planeEmoji}>✈️</Text>
            </View>
            <View style={styles.dottedLine} />
          </View>
          
          <View style={styles.airportInfo}>
            <Text style={styles.airportCode}>{item.arrival_code}</Text>
            <Text style={styles.airportName}>{item.arrival_airport}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Airline:</Text>
          <Text style={styles.value}>{item.airline}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Departure:</Text>
          <Text style={styles.value}>{formatDateTime(item.departure_time)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Passengers:</Text>
          <Text style={styles.value}>{passengers.length} person(s)</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Booking Date:</Text>
          <Text style={styles.value}>{formatDateTime(item.booking_date)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Amount Paid:</Text>
          <Text style={styles.priceValue}>₹{parseFloat(item.amount).toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewBookingDetails(item)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF671F" />
        <Text style={styles.loaderText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Bookings</Text>
      
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any bookings yet.</Text>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.bookNowButtonText}>Book a Flight Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  bookNowButton: {
    backgroundColor: '#FF671F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  statusCompleted: {
    backgroundColor: '#e6f7ed',
    color: '#28a745',
  },
  statusPending: {
    backgroundColor: '#fff9e6',
    color: '#ffc107',
  },
  statusFailed: {
    backgroundColor: '#ffebee',
    color: '#dc3545',
  },
  flightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  airportInfo: {
    alignItems: 'center',
    flex: 2,
  },
  airportCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  airportName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  flightPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
    paddingHorizontal: 5,
  },
  dottedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderStyle: 'dotted',
  },
  planeDot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeEmoji: {
    fontSize: 16,
    transform: [{ rotate: '90deg' }],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    color: '#FF671F',
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FlightBooking;