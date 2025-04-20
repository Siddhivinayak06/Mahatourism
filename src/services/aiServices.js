import axios from 'axios';

// Replace with your actual AI service API key and endpoint
const API_KEY = 'your_api_key_here';
const API_ENDPOINT = 'https://api.youraiprovider.com/travel-recommendations';

export const generateTravelPlan = async (preferences) => {
  // In a real app, this would call an external AI service
  // For demo purposes, we'll simulate an API response
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock response based on user preferences
  const duration = Math.floor((preferences.endDate - preferences.startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    summary: `Based on your preferences, we've created a personalized ${duration}-day itinerary for ${preferences.destination}. This plan focuses on ${preferences.interests.join(', ')} with a ${preferences.travelStyle} travel style and a budget of ₹${preferences.budget}.`,
    attractions: [
      {
        name: `${preferences.destination} Historical Museum`,
        category: preferences.interests.includes('History') ? 'History' : 'Culture',
        description: `One of the most important cultural landmarks in ${preferences.destination}, featuring exhibits that span centuries of local history and art.`
      },
      {
        name: `${preferences.destination} Central Park`,
        category: preferences.interests.includes('Nature') ? 'Nature' : 'Recreation',
        description: 'A beautiful urban oasis with walking paths, gardens, and recreational areas. Perfect for a morning stroll or afternoon picnic.'
      },
      {
        name: `${preferences.destination} Old Town`,
        category: preferences.interests.includes('Architecture') ? 'Architecture' : 'Sightseeing',
        description: 'The historic center features cobblestone streets and well-preserved buildings dating back centuries. Take a guided walking tour to learn about the architectural significance.'
      },
      {
        name: `${preferences.destination} Food Market`,
        category: preferences.interests.includes('Food') ? 'Food' : 'Shopping',
        description: 'An authentic local market where you can sample regional delicacies and purchase fresh ingredients. Popular with locals and tourists alike.'
      },
      {
        name: `${preferences.destination} Beachfront`,
        category: preferences.interests.includes('Beaches') ? 'Beaches' : 'Nature',
        description: 'A stunning coastline with crystal clear waters and white sand beaches. Perfect for swimming, sunbathing, or water activities.'
      }
    ],
    accommodations: [
      {
        name: preferences.travelStyle === 'luxury' ? 'Grand Hotel' : (preferences.travelStyle === 'budget' ? 'Backpacker Hostel' : 'City Center Suites'),
        pricePerNight: preferences.travelStyle === 'luxury' ? 3500 : (preferences.travelStyle === 'budget' ? 60 : 150),
        description: preferences.travelStyle === 'luxury' ? 
          'A 5-star hotel with exceptional service, spa facilities, and fine dining restaurants.' : 
          (preferences.travelStyle === 'budget' ? 
          'A clean, friendly hostel with dormitory and private rooms, communal kitchen, and social atmosphere.' : 
          'A comfortable mid-range hotel with good amenities and a central location.')
      },
      {
        name: preferences.travelStyle === 'luxury' ? 'Waterfront Resort' : (preferences.travelStyle === 'budget' ? 'Budget Inn' : 'Boutique Hotel'),
        pricePerNight: preferences.travelStyle === 'luxury' ? 4000 : (preferences.travelStyle === 'budget' ? 75 : 180),
        description: preferences.travelStyle === 'luxury' ? 
          'An exclusive beachfront property with private balconies, infinity pools, and world-class dining.' : 
          (preferences.travelStyle === 'budget' ? 
          'A simple but comfortable accommodation with basic amenities and friendly staff.' : 
          'A charming hotel with unique character, personalized service, and local flavor.')
      }
    ],
    dining: [
      {
        name: 'Local Delights Restaurant',
        cuisine: 'Regional',
        description: 'Authentic local cuisine made with fresh ingredients. A must-visit to experience the true flavors of the region.'
      },
      {
        name: preferences.travelStyle === 'luxury' ? 'Michelin Star Restaurant' : 'Street Food Market',
        cuisine: preferences.travelStyle === 'luxury' ? 'Fine Dining' : 'Street Food',
        description: preferences.travelStyle === 'luxury' ? 
          'An award-winning restaurant offering innovative cuisine and an extensive wine list.' : 
          'Experience the authentic flavors of the region through various street food vendors offering delicious and affordable dishes.'
      },
      {
        name: 'Waterfront Café',
        cuisine: 'International',
        description: 'A scenic spot to enjoy breakfast or lunch with beautiful views of the water. Menu features a mix of local and international dishes.'
      }
    ]
  };
};

export const generateItinerary = async (preferences, recommendations) => {
  // In a real app, this would call an external AI service
  // For demo purposes, we'll simulate an API response
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const startDate = new Date(preferences.startDate);
  const endDate = new Date(preferences.endDate);
  const duration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  const itinerary = {
    days: []
  };
  
  // Generate a day-by-day itinerary
  for (let i = 0; i < duration; i++) {
    const dayActivities = [];
    
    // Morning activity
    dayActivities.push({
      time: '09:00 AM',
      title: i === 0 ? 'Arrival and Check-in' : recommendations.attractions[i % recommendations.attractions.length].name,
      description: i === 0 ? 
        `Arrive in ${preferences.destination} and check into your accommodation. Take some time to freshen up and get oriented.` :
        recommendations.attractions[i % recommendations.attractions.length].description,
      location: i === 0 ? recommendations.accommodations[0].name : null
    });
    
    // Lunch
    dayActivities.push({
      time: '12:30 PM',
      title: 'Lunch',
      description: `Enjoy lunch at ${recommendations.dining[i % recommendations.dining.length].name}, known for their ${recommendations.dining[i % recommendations.dining.length].cuisine} cuisine.`,
      location: recommendations.dining[i % recommendations.dining.length].name
    });
    
    // Afternoon activity
    dayActivities.push({
      time: '02:30 PM',
      title: recommendations.attractions[(i + 1) % recommendations.attractions.length].name,
      description: recommendations.attractions[(i + 1) % recommendations.attractions.length].description,
      location: null
    });
    
    // Dinner
    dayActivities.push({
      time: '07:00 PM',
      title: 'Dinner',
      description: `Enjoy dinner at ${recommendations.dining[(i + 2) % recommendations.dining.length].name}, which offers ${recommendations.dining[(i + 2) % recommendations.dining.length].cuisine} dishes in a lovely atmosphere.`,
      location: recommendations.dining[(i + 2) % recommendations.dining.length].name
    });
    
    // Evening activity for non-arrival/departure days
    if (i !== 0 && i !== duration - 1) {
      dayActivities.push({
        time: '09:00 PM',
        title: preferences.interests.includes('Nightlife') ? 'Nightlife Experience' : 'Evening Leisure',
        description: preferences.interests.includes('Nightlife') ? 
          `Experience the vibrant nightlife of ${preferences.destination} with a visit to local bars and entertainment venues.` :
          `Relax at your accommodation or take a peaceful evening stroll through ${preferences.destination}.`,
        location: null
      });
    }
    
    // Special case for departure day
    if (i === duration - 1) {
      dayActivities[dayActivities.length - 1] = {
        time: '07:00 PM',
        title: 'Departure',
        description: `Check out of your accommodation and depart from ${preferences.destination}. If you have time before your departure, consider visiting any attractions you might have missed.`,
        location: null
      };
    }
    
    // Add day notes based on interests and travel style
    let notes = `Tips for Day ${i + 1}: `;
    
    if (preferences.interests.includes('Food')) {
      notes += 'Be sure to try the local specialty dishes today. ';
    }
    
    if (preferences.interests.includes('Photography')) {
      notes += 'Bring your camera as there are great photo opportunities. ';
    }
    
    if (preferences.travelStyle === 'budget') {
      notes += 'Look for free attractions and affordable dining options to stay within budget. ';
    } else if (preferences.travelStyle === 'luxury') {
      notes += 'Consider booking a private tour or VIP experience to enhance your day. ';
    }
    
    itinerary.days.push({
      activities: dayActivities,
      notes: notes
    });
  }
  
  return itinerary;
};
