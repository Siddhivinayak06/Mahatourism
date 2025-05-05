import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../../consts/colors';
import axios from 'axios';
import { IP_ADDRESS, PORT } from '@env';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

const API_BASE_URL = `https://mahatourism.onrender.com/api`;

const Bookings = ({ route, navigation }) => {
  const [bookings, setBookings] = useState({
    flight: [],
    hotel: [],
    package: []
  });
  const [loading, setLoading] = useState({
    flight: false,
    hotel: false,
    package: false
  });
  const [error, setError] = useState({
    flight: null,
    hotel: null,
    package: null,
    general: null
  });
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('package');
  
  // Get user details from AsyncStorage on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userId= await AsyncStorage.getItem('userId');
        console.log(userId)
        setUserId(userId);
        
      } catch (err) {
        console.error('Error retrieving user data:', err);
        setError({...error, general: 'Failed to retrieve user information.'});
      }
    };
    
    getUserData();
  }, []);
  
  // Fetch all booking types once userId is available
  useEffect(() => {
    if (userId) {
      fetchPackageBookings();
      fetchFlightBookings();
      fetchHotelBookings();
    }
  }, [userId]);

  const fetchPackageBookings = async () => {
    try {
      setLoading(prevState => ({...prevState, package: true}));
      
      if (userId) {
        const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}`);
        
        let packageBookings = [];
        if (Array.isArray(response.data)) {
          packageBookings = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          packageBookings = response.data.data;
        }
        
        setBookings(prevState => ({...prevState, package: packageBookings}));
        setError(prevState => ({...prevState, package: null}));
      } else {
        setBookings(prevState => ({...prevState, package: []}));
      }
    } catch (err) {
      console.error('Error fetching package bookings:', err);
      setError(prevState => ({...prevState, package: 'Failed to fetch package bookings.'}));
    } finally {
      setLoading(prevState => ({...prevState, package: false}));
    }
  };

  const fetchFlightBookings = async () => {
    try {
      setLoading(prevState => ({...prevState, flight: true}));
      
      if (userId) {
        const response = await axios.get(`${API_BASE_URL}/flight-bookings/user/${userId}`);
        
        
        let flightBookings = [];
        if (Array.isArray(response.data)) {
          flightBookings = response.data;
          console.log('Flight bookings array length:', flightBookings.length);
          if (flightBookings.length > 0) {
            console.log('First flight booking sample:', JSON.stringify(flightBookings[0]));
          }
        } else if (response.data && response.data.bookings && Array.isArray(response.data.bookings)) {
          flightBookings = response.data.bookings;
          console.log('Flight bookings from response.data.bookings, length:', flightBookings.length);
        } else {
          console.log('Flight bookings response format is unexpected:', typeof response.data);
        }
        
        setBookings(prevState => ({...prevState, flight: flightBookings}));
        setError(prevState => ({...prevState, flight: null}));
      } else {
        setBookings(prevState => ({...prevState, flight: []}));
      }
    } catch (err) {
      console.error('Error fetching flight bookings:', err);
      setError(prevState => ({...prevState, flight: 'Failed to fetch flight bookings.'}));
    } finally {
      setLoading(prevState => ({...prevState, flight: false}));
    }
  };

  const fetchHotelBookings = async () => {
    try {
      setLoading(prevState => ({...prevState, hotel: true}));
      
      if (userId) {
        const response = await axios.get(`${API_BASE_URL}/hotel-bookings/user/${userId}`);
        
        let hotelBookings = [];
        if (Array.isArray(response.data)) {
          hotelBookings = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          hotelBookings = response.data.data;
        }
        
        setBookings(prevState => ({...prevState, hotel: hotelBookings}));
        setError(prevState => ({...prevState, hotel: null}));
      } else {
        setBookings(prevState => ({...prevState, hotel: []}));
      }
    } catch (err) {
      console.error('Error fetching hotel bookings:', err);
      setError(prevState => ({...prevState, hotel: 'Failed to fetch hotel bookings.'}));
    } finally {
      setLoading(prevState => ({...prevState, hotel: false}));
    }
  };

  // Refresh all bookings
  const refreshBookings = () => {
    if (userId) {
      fetchPackageBookings();
      fetchFlightBookings();
      fetchHotelBookings();
    }
  };

  // Refresh current tab bookings
  const refreshCurrentTab = () => {
    if (userId) {
      switch(activeTab) {
        case 'package':
          fetchPackageBookings();
          break;
        case 'flight':
          fetchFlightBookings();
          break;
        case 'hotel':
          fetchHotelBookings();
          break;
      }
    }
  };

  const renderBookingItem = ({ item }) => {
    // Common rendering for all booking types
    const renderCommonDetails = () => (
      <>
        <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle}>
  {activeTab === 'flight' ? 
    `${item.departure_airport || ''} to ${item.arrival_airport || ''}` : 
   activeTab === 'hotel' ? item.hotel_name || 'Hotel Booking' :
   item.package_destination || item.destination || 'Package Booking'}
</Text>
          <View style={[styles.statusBadge, 
            { backgroundColor: item.status === 'Confirmed' ? '#d4edda' : 
                            item.status === 'Pending' ? '#fff3cd' : 
                            item.status === 'Cancelled' ? '#f8d7da' : '#e2e3e5' }]}>
            <Text style={[styles.statusText, 
              { color: item.status === 'Confirmed' ? '#155724' : 
                      item.status === 'Pending' ? '#856404' : 
                      item.status === 'Cancelled' ? '#721c24' : '#383d41' }]}>
              {item.status || 'Processing'}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.infoRow}>
            <Icon name="event" size={16} color={COLORS.grey} />
            <Text style={styles.infoText}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date not specified'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icons name="currency-inr" size={16} color={COLORS.grey} />
            <Text style={styles.infoText}>
              ₹{item.total_price || item.price || 'N/A'}
            </Text>
          </View>
        </View>
      </>
    );

    // Additional details based on booking type
    const renderSpecificDetails = () => {
      
      switch(activeTab) {
       // In renderCommonDetails function, modify the flight title line:


       // In the renderSpecificDetails function, modify the flight section:
case 'flight':
  return (
    <View style={styles.typeSpecificDetails}>
      <View style={styles.infoRow}>
        <Icon name="flight" size={16} color={COLORS.grey} />
        <Text style={styles.infoText}>
          {item.departure_date || item.departure_time ? 
            new Date(item.departure_date || item.departure_time).toLocaleDateString() : 
            'Departure date not specified'}
        </Text>
      </View>
      
      {(item.flight_number || item.flightNumber) && (
        <View style={styles.infoRow}>
          <Icon name="confirmation-number" size={16} color={COLORS.grey} />
          <Text style={styles.infoText}>
            Flight: {item.flight_number || item.flightNumber}
          </Text>
        </View>
      )}
      
      {(item.airline || item.carrier) && (
        <View style={styles.infoRow}>
          <Icon name="flight-takeoff" size={16} color={COLORS.grey} />
          <Text style={styles.infoText}>
            {item.airline || item.carrier}
          </Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Icon name="person" size={16} color={COLORS.grey} />
        <Text style={styles.infoText}>
          {typeof item.passengers === 'object' && !Array.isArray(item.passengers) ? 
            item.passenger_count || 1 : 
            typeof item.passengers === 'number' ? 
              item.passengers : 
              Array.isArray(item.passengers) ? 
                item.passengers.length : 
                item.passenger_count || 1} Passenger(s)
        </Text>
      </View>
    </View>
  );
        case 'hotel':
          return (
            <View style={styles.typeSpecificDetails}>
              <View style={styles.infoRow}>
                <Icon name="hotel" size={16} color={COLORS.grey} />
                <Text style={styles.infoText}>
                  {item.check_in_date ? 
                    `${new Date(item.check_in_date).toLocaleDateString()} - ${new Date(item.check_out_date).toLocaleDateString()}` : 
                    'Stay dates not specified'}
                </Text>
              </View>
              {(item.rooms || item.room_count) && (
                <View style={styles.infoRow}>
                  <Icon name="meeting-room" size={16} color={COLORS.grey} />
                  <Text style={styles.infoText}>
                    {item.rooms || item.room_count} Room(s)
                  </Text>
                </View>
              )}
              {item.room_type && (
                <View style={styles.infoRow}>
                  <Icon name="king-bed" size={16} color={COLORS.grey} />
                  <Text style={styles.infoText}>
                    {item.room_type}
                  </Text>
                </View>
              )}
            </View>
          );
        case 'package':
          return (
            <View style={styles.typeSpecificDetails}>
              <View style={styles.infoRow}>
                <Icon name="group" size={16} color={COLORS.grey} />
                <Text style={styles.infoText}>
                  {((item.adults + item.children) || item.travellers || 1)} {((item.adults + item.children) || item.travellers) === 1 ? 'Person' : 'People'}
                </Text>
              </View>
              {(item.duration || item.days) && (
                <View style={styles.infoRow}>
                  <Icon name="timer" size={16} color={COLORS.grey} />
                  <Text style={styles.infoText}>
                    {item.duration || item.days} {(item.duration || item.days) === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>
              )}
              {item.departure_date && (
                <View style={styles.infoRow}>
                  <Icon name="today" size={16} color={COLORS.grey} />
                  <Text style={styles.infoText}>
                    Departs on {new Date(item.departure_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetails', { 
          bookingId: item.booking_id || item.id,
          bookingType: activeTab
        })}
      >
        {renderCommonDetails()}
        {renderSpecificDetails()}
      </TouchableOpacity>
    );
  };

  const EmptyBookings = () => (
    <View style={styles.emptyContainer}>
      {activeTab === 'flight' && <Icon name="flight" size={80} color={COLORS.primary} />}
      {activeTab === 'hotel' && <Icon name="hotel" size={80} color={COLORS.primary} />}
      {activeTab === 'package' && <Icon name="card-travel" size={80} color={COLORS.primary} />}
      
      <Text style={styles.emptyTitle}>No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings Found</Text>
      <Text style={styles.emptySubtitle}>You haven't made any {activeTab} bookings yet</Text>
      
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => {
          switch(activeTab) {
            case 'flight':
              navigation.navigate('FlightSearch');
              break;
            case 'hotel':
              navigation.navigate('HotelSearch');
              break;
            default:
              navigation.navigate('HomeScreen');
          }
        }}
      >
        <Text style={styles.exploreButtonText}>Explore {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    // Check if there's an error for the current tab
    const currentError = error[activeTab];
    
    // Check loading state for current tab
    const isLoading = loading[activeTab];
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your {activeTab} bookings...</Text>
        </View>
      );
    } else if (currentError) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color={COLORS.primary} />
          <Text style={styles.errorText}>{currentError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshCurrentTab}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <FlatList
          data={bookings[activeTab]}
          renderItem={renderBookingItem}
          keyExtractor={item => (item.booking_id || item.id)?.toString() || Math.random().toString()}
          contentContainerStyle={styles.bookingsList}
          ListEmptyComponent={EmptyBookings}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={refreshBookings}>
          <Icon name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs for different booking types */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'package' && styles.activeTab]}
            onPress={() => setActiveTab('package')}
          >
            <Icon name="card-travel" size={22} color={activeTab === 'package' ? COLORS.primary : COLORS.grey} />
            <Text style={[styles.tabText, activeTab === 'package' && styles.activeTabText]}>Packages</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'flight' && styles.activeTab]}
            onPress={() => setActiveTab('flight')}
          >
            <Icon name="flight" size={22} color={activeTab === 'flight' ? COLORS.primary : COLORS.grey} />
            <Text style={[styles.tabText, activeTab === 'flight' && styles.activeTabText]}>Flights</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'hotel' && styles.activeTab]}
            onPress={() => setActiveTab('hotel')}
          >
            <Icon name="hotel" size={22} color={activeTab === 'hotel' ? COLORS.primary : COLORS.grey} />
            <Text style={[styles.tabText, activeTab === 'hotel' && styles.activeTabText]}>Hotels</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Handle general error (like not logged in) */}
      {error.general ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color={COLORS.primary} />
          <Text style={styles.errorText}>{error.general}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderTabContent()
      )}
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
  tabContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.light,
  },
  tabText: {
    fontSize: 14,
    marginLeft: 8,
    color: COLORS.grey,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
  bookingsList: {
    padding: 15,
    paddingBottom: 80, // Add extra padding for footer navigation
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
    fontSize: 18,
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
  bookingDetails: {
    marginTop: 8,
  },
  typeSpecificDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: COLORS.dark,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 10,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 20,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Bookings;