import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { generateItinerary } from '../../services/aiServices';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

const ResultsScreen = ({ route, navigation }) => {
  const { recommendations, preferences } = route.params;
  const [loading, setLoading] = useState(false);
  
  const handleCreateItinerary = async () => {
    setLoading(true);
    try {
      const itinerary = await generateItinerary(preferences, recommendations);
      setLoading(false);
      navigation.navigate('ItineraryScreen', { itinerary, preferences });
    } catch (error) {
      setLoading(false);
      alert('Failed to create itinerary. Please try again.');
      console.error(error);
    }
  };

  const renderTags = (tags) => {
    return (
      <View style={styles.tagContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Discover {preferences.destination}</Text>
        <Text style={styles.subtitle}>Personalized recommendations for your trip</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="sparkles" size={22} color="#F75D37" />
          <Text style={styles.summaryTitle}>AI Trip Summary</Text>
        </View>
        <Text style={styles.summaryText}>{recommendations.summary}</Text>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons name="attractions" size={24} color="#F75D37" />
          <Text style={styles.sectionTitle}>Recommended Attractions</Text>
        </View>
        
        {recommendations.attractions.map((attraction, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{attraction.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(attraction.category) }]}>
                <Text style={styles.cardCategory}>{attraction.category}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{attraction.description}</Text>
            {renderTags(['Popular', 'Must Visit'])}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <AntDesign
                  key={star}
                  name={star <= 4.5 ? "star" : "staro"}
                  size={16}
                  color="#FFD700"
                />
              ))}
              <Text style={styles.rating}>4.5</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="bed-outline" size={24} color="#F75D37" />
          <Text style={styles.sectionTitle}>Accommodation Options</Text>
        </View>
        
        {recommendations.accommodations.map((accommodation, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{accommodation.name}</Text>
              <Text style={styles.cardPrice}>₹{accommodation.pricePerNight}/night</Text>
            </View>
            <Text style={styles.cardDescription}>{accommodation.description}</Text>
            {renderTags(['WiFi', 'Breakfast included'])}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4].map((star) => (
                <AntDesign
                  key={star}
                  name="star"
                  size={16}
                  color="#FFD700"
                />
              ))}
              <AntDesign name="staro" size={16} color="#FFD700" />
              <Text style={styles.rating}>4.0</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="restaurant-outline" size={24} color="#F75D37" />
          <Text style={styles.sectionTitle}>Dining Recommendations</Text>
        </View>
        
        {recommendations.dining.map((restaurant, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{restaurant.name}</Text>
              <View style={[styles.cuisineBadge, { backgroundColor: getCuisineColor(restaurant.cuisine) }]}>
                <Text style={styles.cardCategory}>{restaurant.cuisine}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{restaurant.description}</Text>
            {renderTags(['Outdoor Seating', 'Local Favorite'])}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <AntDesign
                  key={star}
                  name={star <= 4.7 ? "star" : "staro"}
                  size={16}
                  color="#FFD700"
                />
              ))}
              <Text style={styles.rating}>4.7</Text>
            </View>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateItinerary}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.createButtonText}>Create Detailed Itinerary</Text>
            <AntDesign name="right" size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Based on your preferences: {preferences.duration} days, {preferences.budget} budget
        </Text>
      </View>
    </ScrollView>
  );
};

// Helper functions for dynamic colors
const getCategoryColor = (category) => {
  const colors = {
    'Historical': '#FFD1DC',
    'Nature': '#D1FFDD',
    'Cultural': '#D1E3FF',
    'Adventure': '#FFE8D1',
    'Entertainment': '#E8D1FF',
  };
  return colors[category] || '#F1F1F1';
};

const getCuisineColor = (cuisine) => {
  const colors = {
    'Italian': '#FFD1DC',
    'Japanese': '#D1FFDD',
    'Mexican': '#FFE8D1',
    'French': '#D1E3FF',
    'Local': '#E8D1FF',
  };
  return colors[cuisine] || '#F1F1F1';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F75D37',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 3,
    color: '#2c3e50',
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cuisineBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardCategory: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  cardPrice: {
    fontSize: 16,
    color: '#F75D37',
    fontWeight: 'bold',
    backgroundColor: '#fff5f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#2980b9',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 6,
  },
  createButton: {
    backgroundColor: '#F75D37',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#F75D37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 8,
  },
  footer: {
    marginHorizontal: 20,
    marginBottom: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  footerText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
  }
});

export default ResultsScreen;