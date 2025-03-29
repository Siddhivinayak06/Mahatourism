import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, FlatList, Image } from 'react-native';
import axios from 'axios';

const HotelSearchScreen = () => {
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [rooms, setRooms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [priceRange, setPriceRange] = useState('');
  const [rating, setRating] = useState('');

  useEffect(() => {
    // Fetch featured hotels on component mount
    fetchFeaturedHotels();
  }, []);

  const fetchFeaturedHotels = async () => {
    try {
      const response = await axios.get('http://192.168.1.4:5000/api/hotels/featured');
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching featured hotels:', error);
    }
  };

  const handleSearch = async () => {
    if (!location) {
      Alert.alert('Missing Info', 'Please enter a location');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get('http://192.168.1.4:5000/api/hotels/search', {
        params: {
          location,
          checkIn,
          checkOut,
          guests,
          rooms,
          priceRange,
          rating
        },
      });

      const searchResults = response.data;
      setHotels(searchResults);
      
      if (searchResults.length === 0) {
        Alert.alert('No Results', 'No hotels found matching your criteria.');
      }
    } catch (error) {
      console.error('Error searching for hotels:', error);
      Alert.alert('Error', 'Failed to search for hotels. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHotelItem = ({ item }) => (
    <View style={styles.hotelCard}>
      <Image 
        source={{ uri: item.image_url || 'https://placeholder.com/400x200' }} 
        style={styles.hotelImage}
        resizeMode="cover"
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName}>{item.name}</Text>
        <Text style={styles.hotelLocation}>{item.location}</Text>
        <Text style={styles.hotelAddress}>{item.address}</Text>
        <View style={styles.ratingPriceContainer}>
          <Text style={styles.hotelRating}>★ {item.rating}/5</Text>
          <Text style={styles.hotelPrice}>{item.price_range}</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Location"
        />
        <View style={styles.dateContainer}>
          <TextInput
            style={styles.dateInput}
            value={checkIn}
            onChangeText={setCheckIn}
            placeholder="Check In (YYYY-MM-DD)"
          />
          <TextInput
            style={styles.dateInput}
            value={checkOut}
            onChangeText={setCheckOut}
            placeholder="Check Out (YYYY-MM-DD)"
          />
        </View>
        <View style={styles.guestRoomContainer}>
          <TextInput
            style={styles.guestRoomInput}
            value={guests}
            onChangeText={setGuests}
            placeholder="Guests"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.guestRoomInput}
            value={rooms}
            onChangeText={setRooms}
            placeholder="Rooms"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.filterInput}
            value={priceRange}
            onChangeText={setPriceRange}
            placeholder="Price Range (e.g. $-$$$)"
          />
          <TextInput
            style={styles.filterInput}
            value={rating}
            onChangeText={setRating}
            placeholder="Min Rating (1-5)"
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity
          style={[styles.searchButton, isLoading && styles.disabledButton]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Text style={styles.searchButtonText}>
            {isLoading ? 'Searching...' : 'Search Hotels'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {hotels.length > 0 ? `${hotels.length} Hotels Found` : 'Featured Hotels'}
        </Text>
        <FlatList
          data={hotels}
          renderItem={renderHotelItem}
          keyExtractor={(item) => item.hotel_id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateInput: {
    width: '48%',
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  guestRoomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestRoomInput: {
    width: '48%',
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterInput: {
    width: '48%',
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  searchButton: {
    backgroundColor: '#FF5733',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ffaa91',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 16,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  hotelAddress: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  ratingPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hotelRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9900',
  },
  hotelPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default HotelSearchScreen;