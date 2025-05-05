import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TextInput,
  ImageBackground,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../../consts/colors';
import axios from 'axios';
import { IP_ADDRESS, PORT } from '@env';
const { width } = Dimensions.get('screen');
const API_BASE_URL = `https://mahatourism.onrender.com/api`; // Replace with your actual API endpoint

const HomeScreen = ({ route, navigation }) => {
  const [destinations, setDestinations] = useState([]);
  const [recommendedDestinations, setRecommendedDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { userId, userFullName, userEmail, userMobile } = route.params || {};

  
  useEffect(() => {
    console.log("Full route object:", route);
    console.log("Route params:", route.params);
    console.log("userId specifically:", route.params?.userId);
  }, []);
  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
    } else {
      const filteredResults = destinations.filter(
        destination => 
          destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          destination.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredResults);
    }
  }, [searchQuery, destinations]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/destinations`);
      setDestinations(response.data);
      
      // Setting recommended destinations (you can modify this based on your criteria)
      const recommended = response.data.filter(item => item.entry_fee > 0).slice(0, 5);
      setRecommendedDestinations(recommended);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch destinations');
      setLoading(false);
      console.error('Error fetching destinations:', err);
    }
  };

  const handleFlightBooking = () => {
    navigation.navigate('FlightBookingScreen');
  };

  const handleHotelSearch = () => {
    navigation.navigate('HotelSearchScreen');
  };
  console.log("user: ",userId);
  const handleNearMe = () => {
    navigation.navigate('HolidayPackageScreen',{ 
      userId:userId, 
      userFullName,
      userEmail,
      userMobile
    });
  };

  const handleLocations = () => {
    navigation.navigate('TourPackagePage');
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleViewAllPlaces = () => {
    // Navigate to a screen that shows all destinations
    navigation.navigate('LocationDetailsScreen', { destinations });
  };

  const handleLogout = () => {
    // Implement your logout logic here
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const navigateToBookings = () => {
    navigation.navigate('Bookings');
  };

  const navigateToProfile = () => {
    navigation.navigate('ProfileScreen', { 
      userId, 
      userFullName,
      userEmail,
      userMobile
    });
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings',{ 
      userId, 
      userFullName,
      userEmail,
      userMobile
    });
  };

  const navigateToHome = () => {
    // If already on home, could refresh or do nothing
    // Or implement a specific behavior
  };

  // Handle AI Assistant press
  const handleAIAssistant = () => {
    // Navigate to AI Assistant screen or open AI chat modal
    navigation.navigate('PreferencesScreen', { 
      userId, 
      userFullName 
    });
    // You could also implement a modal or bottom sheet here
  };

  const ListCategories = () => (
    <View style={style.categoryContainer}>
      <TouchableOpacity activeOpacity={0.8} onPress={handleFlightBooking}>
        <View style={style.iconContainer}>
          <Icon name="flight" size={25} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} onPress={handleHotelSearch}>
        <View style={style.iconContainer}>
          <Icon name="beach-access" size={25} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} onPress={handleNearMe}>
        <View style={style.iconContainer}>
          <Icon name="card-travel" size={25} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} onPress={handleLocations}>
        <View style={style.iconContainer}>
          <Icon name="explore" size={25} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const Card = ({ destination }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DestinationDetails', { destination_id: destination.destination_id })}>
        <ImageBackground 
          source={{ uri: destination.image_url }} 
          style={style.cardImage}
          onError={() => console.log('Error loading image:', destination.image_url)}
          defaultSource={require('../../assets/placeholder.png')}
        >
          <Text
            style={{
              color: COLORS.white,
              fontSize: 20,
              fontWeight: 'bold',
              marginTop: 10,
            }}>
            {destination.name}
          </Text>
          <View
            style={{
              flex: 1,
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'flex-end',
            }}>
            <View style={{flexDirection: 'row'}}>
              <Icon name="place" size={20} color={COLORS.white} />
              <Text style={{marginLeft: 5, color: COLORS.white}}>
                {destination.location}
              </Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Icon name="star" size={20} color={COLORS.white} />
              <Text style={{marginLeft: 5, color: COLORS.white}}>5.0</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const RecommendedCard = ({ destination }) => {
    return (
      <ImageBackground 
        style={style.rmCardImage} 
        source={{ uri: destination.image_url }}
        defaultSource={require('../../assets/placeholder.jpg')}
      >
        <Text
          style={{
            color: COLORS.white,
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 10,
          }}>
          {destination.name}
        </Text>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
          <View style={{width: '100%', flexDirection: 'row', marginTop: 10}}>
            <View style={{flexDirection: 'row'}}>
              <Icon name="place" size={22} color={COLORS.white} />
              <Text style={{color: COLORS.white, marginLeft: 5}}>
                {destination.location}
              </Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Icon name="star" size={22} color={COLORS.white} />
              <Text style={{color: COLORS.white, marginLeft: 5}}>5.0</Text>
            </View>
          </View>
          <Text style={{color: COLORS.white, fontSize: 13}}>
            {destination.description}
          </Text>
        </View>
      </ImageBackground>
    );
  };
  
  // Footer component for navigation
  const Footer = () => (
    <View style={style.footer}>
      <TouchableOpacity style={style.footerItem} onPress={navigateToHome}>
        <Icon name="home" size={24} color={COLORS.primary} />
        <Text style={style.footerText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={style.footerItem} onPress={navigateToBookings}>
        <Icon name="book" size={24} color={COLORS.grey} />
        <Text style={style.footerText}>Bookings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={style.footerItem} onPress={navigateToProfile}>
        <Icon name="person" size={24} color={COLORS.grey} />
        <Text style={style.footerText}>Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={style.footerItem} onPress={navigateToSettings}>
        <Icon name="settings" size={24} color={COLORS.grey} />
        <Text style={style.footerText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.white}}>
      <StatusBar translucent={false} backgroundColor={COLORS.primary} />
      <View style={style.header}>
        
      </View>
      {loading ? (
        <View style={style.loadingContainer}>
          <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color={COLORS.primary} />
          <Text style={style.loadingText}>Loading destinations...</Text>
        </View>
      ) : error ? (
        <View style={style.errorContainer}>
          <Icon name="error" size={40} color={COLORS.primary} />
          <Text style={style.errorText}>{error}</Text>
          <TouchableOpacity style={style.retryButton} onPress={fetchDestinations}>
            <Text style={style.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }} // Increased padding to account for AI button
        >
          <View
            style={{
              backgroundColor: COLORS.primary,
              height: 120,
              paddingHorizontal: 20,
            }}>
            <View style={{flex: 1}}>
              <Text style={style.headerTitle}>MahaTourism</Text>
              <View style={style.inputContainer}>
                <Icon name="search" size={28} />
                <TextInput
                  placeholder="Search place"
                  style={{color: COLORS.dark, flex: 1}}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={24} color={COLORS.grey} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
          <ListCategories />
          
          {searchQuery.trim() ? (
            <>
              <Text style={style.sectionTitle}>Search Results</Text>
              {searchResults.length > 0 ? (
                <FlatList
                  contentContainerStyle={{paddingLeft: 20}}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={searchResults}
                  renderItem={({item}) => <Card destination={item} />}
                  keyExtractor={item => item.destination_id.toString()}
                />
              ) : (
                <Text style={style.noResultsText}>No destinations found matching "{searchQuery}"</Text>
              )}
            </>
          ) : (
            <>
              <View style={style.sectionTitleContainer}>
                <Text style={style.sectionTitle}>Places</Text>
                <TouchableOpacity onPress={handleViewAllPlaces}>
                  <View style={style.moreButtonContainer}>
                    <Text style={style.moreButtonText}>More</Text>
                    <Icon name="arrow-forward" size={16} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              </View>
              <View>
                <FlatList
                  contentContainerStyle={{paddingLeft: 20}}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={destinations}
                  keyExtractor={(item) => item.destination_id.toString()}
                  renderItem={({ item }) => <Card destination={item} />}
                />
                <Text style={style.sectionTitle}>Recommended</Text>
                <FlatList
                  snapToInterval={width - 20}
                  contentContainerStyle={{paddingLeft: 20, paddingBottom: 20}}
                  showsHorizontalScrollIndicator={false}
                  horizontal
                  data={recommendedDestinations}
                  renderItem={({item}) => <RecommendedCard destination={item} />}
                  keyExtractor={item => item.destination_id.toString()}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}
      
      {/* AI Assistant Icon Button */}
      <TouchableOpacity 
        style={style.aiButton}
        activeOpacity={0.8}
        onPress={handleAIAssistant}
      >
        <View style={style.aiIconContainer}>
          <Icon name="assistant" size={28} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      
      <Footer />
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  headerTitleSmall: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 22,
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 50,
  },
  inputContainer: {
    height: 60,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    position: 'absolute',
    top: 90,
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 12,
  },
  categoryContainer: {
    marginTop: 60,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconContainer: {
    height: 60,
    width: 60,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginVertical: 20,
    fontWeight: 'bold',
    fontSize: 20,
  },
  moreButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 5,
  },
  cardImage: {
    height: 220,
    width: width / 2,
    marginRight: 20,
    padding: 10,
    overflow: 'hidden',
    borderRadius: 10,
  },
  rmCardImage: {
    width: width - 40,
    height: 200,
    marginRight: 20,
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
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
  noResultsText: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontSize: 16,
    color: COLORS.dark,
    fontStyle: 'italic',
  },
  // AI Assistant button styles
  aiButton: {
    position: 'absolute',
    bottom: 70, // Position it just above the footer
    right: 20,
    zIndex: 999,
  },
  aiIconContainer: {
    height: 56,
    width: 56,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28, // Make it circular
    elevation: 8, // Add shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    marginTop: 2,
    color: COLORS.grey,
  },
});

export default HomeScreen;