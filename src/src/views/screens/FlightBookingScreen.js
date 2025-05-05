import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, Image, Alert } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const FlightBookingScreen = () => {
  const navigation = useNavigation();

  const [popularCities, setPopularCities] = useState([]);
  const [tripType, setTripType] = useState('One Way');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [seatType, setSeatType] = useState('First Class');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedAirport, setSelectedAirport] = useState(null);

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      const response = await axios.get('https://mahatourism.onrender.com/api/airports');
      setPopularCities(response.data);
    } catch (error) {
      console.error('Error fetching airport data:', error);
    }
  };

  const handleSearchFlights = async () => {
    try {
      const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
        params: {
          access_key: '85f32754beba735ab64c141d5e782441',
          dep_iata: from,
          arr_iata: to,
          dep_date: departureDate.toISOString().split('T')[0],
        },
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const flightData = response.data.data[0];
        const formattedFlightDetails = {
          flight: {
            number: flightData.flight.number,
            status: flightData.flight_status,
            date: flightData.flight_date
          },
          airline: {
            name: flightData.airline.name
          },
          departure: {
            airport: flightData.departure.airport,
            iata: flightData.departure.iata
          },
          arrival: {
            airport: flightData.arrival.airport,
            iata: flightData.arrival.iata
          }
        };
      navigation.navigate('FlightDetailsScreen', { 
        flightDetails: formattedFlightDetails,
        seatType: seatType,
        departureDate: departureDate.toLocaleDateString(),
        passengers: passengers,
        tripType: tripType
      });

      } else {
        Alert.alert(
          'No Flights Available',
          'Sorry, there are no flights available for your selected route and date.',
          [{ text: 'OK', onPress: () => {} }]
        );
      }


    } catch (error) {
      console.error('Error fetching flight data:', error);
      Alert.alert(
        'Error',
        'There was an error searching for flights. Please try again later.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }

  };

  const filteredCities = popularCities.filter(city =>
    city.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image 
          source={require('../../assets/icons/backbutton.png')}
          style={styles.backButtonImage}
        />
      </TouchableOpacity>

      <Text style={styles.header}>Flight Booking</Text>
      
      <View style={styles.tripTypeContainer}>
        <TouchableOpacity onPress={() => setTripType('One Way')} style={[styles.tripTypeButton, tripType === 'One Way' && styles.activeButton]}>
          <Text>One Way</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTripType('Round Trip')} style={[styles.tripTypeButton, tripType === 'Round Trip' && styles.activeButton]}>
          <Text>Round Trip</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => { setModalVisible(true); setSelectedCity('from'); }}>
        <TextInput
          style={styles.input}
          placeholder="From"
          value={from}
          editable={false}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setModalVisible(true); setSelectedCity('to'); }}>

        <TextInput
          style={styles.input}
          placeholder="To"
          value={to}
          editable={false}
        />
      </TouchableOpacity>

      <Text style={styles.dateLabel}>Depart</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          style={styles.input}
          placeholder="Departure Date"
          value={departureDate.toLocaleDateString()}
          editable={false}
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setDepartureDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />

      {tripType === 'Round Trip' && (
        <>
          <Text style={styles.dateLabel}>Return</Text>
          <TouchableOpacity onPress={() => setShowReturnDatePicker(true)}>
            <TextInput
              style={styles.input}
              placeholder="Return Date"
              value={returnDate.toLocaleDateString()}
              editable={false}
            />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showReturnDatePicker}
            mode="date"
            onConfirm={(date) => {
              setReturnDate(date);
              setShowReturnDatePicker(false);
            }}
            onCancel={() => setShowReturnDatePicker(false)}
            minimumDate={new Date()}
          />
        </>
      )}

      <Text style={styles.seatLabel}>Seat Numbers</Text>
      <View style={styles.passengerContainer}>
        <TouchableOpacity onPress={() => setPassengers(passengers - 1 < 1 ? 1 : passengers - 1)}>
          <Text style={styles.adjustButton}>-</Text>
        </TouchableOpacity>
        <Text style={styles.passengerCount}>{passengers}</Text>
        <TouchableOpacity onPress={() => setPassengers(passengers + 1)}>
          <Text style={styles.adjustButton}>+</Text>
        </TouchableOpacity>
      </View>
      
      <Picker
        selectedValue={seatType}
        style={styles.picker}
        onValueChange={(itemValue) => setSeatType(itemValue)}
      >
        <Picker.Item label="First Class" value="First Class" />
        <Picker.Item label="Economy" value="Economy" />
        <Picker.Item label="Premium Economy" value="Premium Economy" />
        <Picker.Item label="Business" value="Business" />
      </Picker>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearchFlights}>
        <Text style={styles.searchButtonText}>View Details</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setModalVisible(false)}
          >
            <Image 
              source={require('../../assets/icons/backbutton.png')}
              style={styles.backButtonImage}
            />
          </TouchableOpacity>
          <Text style={styles.modalHeader}>POPULAR SEARCHES</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
          />
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.cityButton, 
                  selectedAirport === item.iata_code && { backgroundColor: '#FF671F' }
                ]}
                onPress={() => {
                  setSelectedAirport(item.iata_code);
                  if (selectedCity === 'from') {
                    setFrom(item.iata_code);
                  } else {
                    setTo(item.iata_code);
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={{ 
                  color: selectedAirport === item.iata_code ? '#fff' : '#333' 
                }}>
                  {item.iata_code} - {item.city}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonImage: {
    width: 24,
    height: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tripTypeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF671F',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  seatLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  adjustButton: {
    fontSize: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  passengerCount: {
    fontSize: 18,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  searchButton: {
    backgroundColor: '#FF671F',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cityButton: {
    fontSize: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginVertical: 5,
    textAlign: 'center',
  },
});

export default FlightBookingScreen;