import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ItineraryScreen = ({ route }) => {
  const { itinerary, preferences } = route.params;
  const [selectedDay, setSelectedDay] = useState(0);
  
  const getDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };
  
  const days = getDaysBetweenDates(preferences.startDate, preferences.endDate);
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ${preferences.destination} itinerary:\n\n${formatItineraryForSharing()}`,
      });
    } catch (error) {
      alert('Failed to share itinerary');
      console.error(error);
    }
  };
  
  const formatItineraryForSharing = () => {
    let shareText = `${preferences.destination.toUpperCase()} TRAVEL ITINERARY\n\n`;
    
    itinerary.days.forEach((day, index) => {
      const date = days[index].toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      
      shareText += `DAY ${index + 1} - ${date}\n\n`;
      
      day.activities.forEach((activity) => {
        shareText += `${activity.time} - ${activity.title}\n`;
        shareText += `${activity.description}\n`;
        if (activity.location) {
          shareText += `Location: ${activity.location}\n`;
        }
        shareText += '\n';
      });
      
      shareText += '\n';
    });
    
    return shareText;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#F75D37', '#FF8C42']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{preferences.destination} Itinerary</Text>
          <Text style={styles.subtitle}>
            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </LinearGradient>
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.daysScrollView}
          contentContainerStyle={styles.daysScrollViewContent}
        >
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayTab,
                selectedDay === index && styles.selectedDayTab
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayTabText,
                selectedDay === index && styles.selectedDayTabText
              ]}>
                Day {index + 1}
              </Text>
              <Text style={[
                styles.dayTabDate,
                selectedDay === index && styles.selectedDayTabText
              ]}>
                {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
              </Text>
              {selectedDay === index && <View style={styles.selectedIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView 
        style={styles.activitiesContainer}
        contentContainerStyle={styles.activitiesContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {itinerary.days[selectedDay].activities.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{activity.time}</Text>
              <View style={styles.timeConnector} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              {activity.location && (
                <View style={styles.locationContainer}>
                  <Text style={styles.activityLocation}>📍 {activity.location}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
        
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Day Notes</Text>
          <Text style={styles.notesText}>{itinerary.days[selectedDay].notes}</Text>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={handleShare}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#F75D37', '#FF8C42']}
          style={styles.shareGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.shareButtonText}>Share Itinerary</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.9,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  daysScrollView: {
    backgroundColor: '#fff',
    height: 75,
  },
  daysScrollViewContent: {
    paddingHorizontal: 10,
  },
  dayTab: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 75,
  },
  selectedDayTab: {
    backgroundColor: 'rgba(247, 93, 55, 0.04)',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: '#F75D37',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  dayTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
  },
  dayTabDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  selectedDayTabText: {
    color: '#F75D37',
  },
  activitiesContainer: {
    flex: 1,
  },
  activitiesContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0, 
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  timeContainer: {
    width: 80,
    padding: 16,
    backgroundColor: 'rgba(247, 93, 55, 0.06)',
    alignItems: 'center',
    position: 'relative',
  },
  timeConnector: {
    position: 'absolute',
    top: 45,
    right: 0,
    width: 10,
    height: 2,
    backgroundColor: 'rgba(247, 93, 55, 0.3)',
  },
  time: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F75D37',
  },
  activityContent: {
    flex: 1,
    padding: 16,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  activityDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 93, 55, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activityLocation: {
    fontSize: 13,
    color: '#F75D37',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C42',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FF8C42',
  },
  notesText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
  },
  shareButton: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 30 : 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: "#F75D37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ItineraryScreen;