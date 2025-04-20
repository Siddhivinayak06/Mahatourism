import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { generateTravelPlan } from '../../services/aiServices';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Define colors object for consistent styling
const COLORS = {
  primary: '#F75D37',
  primaryLight: '#FFF1EE',
  primaryDark: '#D94E2E',
  white: '#FFFFFF',
  black: '#222222',
  gray: '#8E8E93',
  lightGray: '#E5E5EA',
  background: '#F9F9FB'
};

const PreferencesScreen = ({ navigation }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [budget, setBudget] = useState(1000);
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [interests, setInterests] = useState([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const availableInterests = [
    'History', 'Art', 'Food', 'Nature', 'Adventure', 
    'Shopping', 'Beaches', 'Nightlife', 'Architecture', 'Local Culture'
  ];

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleGeneratePlan = async () => {
    if (!destination) {
      alert('Please enter a destination');
      return;
    }
    
    setLoading(true);
    
    const preferences = {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      interests
    };
    
    try {
      const recommendations = await generateTravelPlan(preferences);
      setLoading(false);
      navigation.navigate('ResultsScreen', { recommendations, preferences });
    } catch (error) {
      setLoading(false);
      alert('Failed to generate travel plan. Please try again.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Your Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Where would you like to go?</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Destination</Text>
          <View style={styles.inputContainer}>
            <Icon name="place" size={22} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="Enter city, country, or region"
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <Text style={styles.label}>Travel Dates</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartDatePicker(true)}
            >
              <Icon name="calendar-today" size={18} color={COLORS.primary} style={styles.dateIcon} />
              <Text style={styles.dateText}>From: {formatDate(startDate)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="calendar-today" size={18} color={COLORS.primary} style={styles.dateIcon} />
              <Text style={styles.dateText}>To: {formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
          
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
          
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
              minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Budget (₹)</Text>
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetText}>₹{budget}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>₹1000</Text>
              <Slider
                style={styles.slider}
                minimumValue={1000}
                maximumValue={100000}
                step={100}
                value={budget}
                onValueChange={setBudget}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.primary}
              />
              <Text style={styles.sliderLabel}>₹10,0000</Text>
            </View>
          </View>
          
          <Text style={styles.label}>Travel Style</Text>
          <View style={styles.styleContainer}>
            <TouchableOpacity 
              style={[styles.styleButton, travelStyle === 'budget' && styles.styleButtonSelected]}
              onPress={() => setTravelStyle('budget')}
            >
              <Icon 
                name="currency-rupee" 
                size={20} 
                color={travelStyle === 'budget' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.styleText, travelStyle === 'budget' && styles.styleTextSelected]}>
                Budget
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.styleButton, travelStyle === 'balanced' && styles.styleButtonSelected]}
              onPress={() => setTravelStyle('balanced')}
            >
              <Icon 
                name="balance" 
                size={20} 
                color={travelStyle === 'balanced' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.styleText, travelStyle === 'balanced' && styles.styleTextSelected]}>
                Balanced
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.styleButton, travelStyle === 'luxury' && styles.styleButtonSelected]}
              onPress={() => setTravelStyle('luxury')}
            >
              <Icon 
                name="diamond" 
                size={20} 
                color={travelStyle === 'luxury' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.styleText, travelStyle === 'luxury' && styles.styleTextSelected]}>
                Luxury
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Interests</Text>
          <Text style={styles.subLabel}>Select all that apply</Text>
          <View style={styles.interestsContainer}>
            {availableInterests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestButton,
                  interests.includes(interest) && styles.selectedInterest
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[
                  styles.interestText,
                  interests.includes(interest) && styles.selectedInterestText
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleGeneratePlan}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="explore" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>Generate Travel Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  backButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.black,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.black,
  },
  subLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: -8,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.black,
    fontSize: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flex: 0.48,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    color: COLORS.black,
    fontSize: 14,
  },
  budgetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.gray,
    width: 50,
    textAlign: 'center',
  },
  styleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.31,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  styleButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  styleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  styleTextSelected: {
    color: COLORS.white,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestButton: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  interestText: {
    color: COLORS.black,
    fontSize: 14,
  },
  selectedInterest: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectedInterestText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PreferencesScreen;