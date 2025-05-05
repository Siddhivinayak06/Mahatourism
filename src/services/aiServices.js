// aiServices.js - Complete implementation with Gemini AI

import axios from 'axios';

// Replace with your actual Gemini API key
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

export const generateTravelPlan = async (preferences) => {
  try {
    // Calculate trip duration
    const duration = Math.floor((preferences.endDate - preferences.startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Construct prompt for Gemini
    const prompt = `You are a travel expert AI assistant. Generate a comprehensive travel plan for a trip to ${preferences.destination}.
    
    Trip Details:
    - Destination: ${preferences.destination}
    - Duration: ${duration} days (from ${preferences.startDate.toLocaleDateString()} to ${preferences.endDate.toLocaleDateString()})
    - Budget: ₹${preferences.budget}
    - Travel Style: ${preferences.travelStyle} (${preferences.travelStyle === 'budget' ? 'economical options' : preferences.travelStyle === 'luxury' ? 'high-end experiences' : 'mid-range balanced options'})
    - Interests: ${preferences.interests.join(', ')}
    
    Please provide JSON output in the following structure:
    {
      "summary": "Brief description of the overall travel plan",
      "attractions": [
        {
          "name": "Attraction Name",
          "category": "One of the interests",
          "description": "Description of the attraction"
        }
      ],
      "accommodations": [
        {
          "name": "Accommodation Name",
          "pricePerNight": 1000,
          "description": "Description of the accommodation"
        }
      ],
      "dining": [
        {
          "name": "Restaurant Name",
          "cuisine": "Cuisine Type",
          "description": "Description of the restaurant"
        }
      ]
    }
    
    Please ensure the response is valid JSON and always includes all required fields.`;
    
    console.log("Sending prompt to Gemini API:", prompt);
    
    // Call Gemini API
    const response = await axios.post(
      GEMINI_API_ENDPOINT,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        }
      }
    );
    
    // Extract content from Gemini response
    const generatedContent = response.data.candidates[0].content.parts[0].text;
    
    // Parse the content to extract JSON
    const jsonData = extractJsonFromText(generatedContent);
    
    // If JSON parsing fails, create a structured response from text
    if (!jsonData) {
      console.warn("Failed to parse JSON from Gemini response, using fallback parsing");
      return parseGeminiTextResponse(generatedContent, preferences);
    }
    
    // Validate the parsed JSON has the expected structure
    const validatedData = validateAndRepairJsonData(jsonData, preferences);
    
    return validatedData;
  } catch (error) {
    console.error('Error in travel plan generation:', error);
    // Fallback to mock data in case of API failure
    return generateMockTravelPlan(preferences);
  }
};

export const generateItinerary = async (preferences, recommendations) => {
  try {
    const startDate = new Date(preferences.startDate);
    const endDate = new Date(preferences.endDate);
    const duration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Create a condensed version of recommendations to include in the prompt
    const attractionsList = recommendations.attractions
      .map(a => `${a.name} (${a.category})`)
      .join(', ');
    
    const accommodationsList = recommendations.accommodations
      .map(a => `${a.name} (₹${a.pricePerNight}/night)`)
      .join(', ');
    
    const diningList = recommendations.dining
      .map(d => `${d.name} (${d.cuisine})`)
      .join(', ');
    
    // Construct prompt for Gemini
    const prompt = `You are a travel expert AI. Based on the following trip details and recommendations, create a detailed day-by-day itinerary.
    
    Trip Details:
    - Destination: ${preferences.destination}
    - Duration: ${duration} days (from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})
    - Travel Style: ${preferences.travelStyle}
    - Interests: ${preferences.interests.join(', ')}
    
    Available Attractions: ${attractionsList}
    Available Accommodations: ${accommodationsList}
    Available Dining Options: ${diningList}
    
    Please generate a JSON response with the following structure:
    {
      "days": [
        {
          "date": "Date in MM/DD/YYYY format",
          "activities": [
            {
              "time": "Time in format like 09:00 AM",
              "title": "Activity title",
              "description": "Activity description",
              "location": "Optional location name"
            }
          ],
          "notes": "Tips and notes for the day"
        }
      ]
    }
    
    Make sure the response is a valid JSON object and includes all required fields.`;
    
    console.log("Sending itinerary prompt to Gemini API:", prompt);
    
    // Call Gemini API
    const response = await axios.post(
      GEMINI_API_ENDPOINT,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        }
      }
    );
    
    // Extract content from Gemini response
    const generatedContent = response.data.candidates[0].content.parts[0].text;
    
    // Parse the content to extract JSON
    const jsonData = extractJsonFromText(generatedContent);
    
    // If JSON parsing fails, create a structured itinerary from text
    if (!jsonData || !jsonData.days || !Array.isArray(jsonData.days) || jsonData.days.length === 0) {
      console.warn("Failed to parse JSON from Gemini itinerary response, using fallback");
      return generateMockItinerary(preferences, recommendations);
    }
    
    // Ensure each day has the required structure
    const validatedDays = jsonData.days.map((day, index) => {
      if (!day.activities || !Array.isArray(day.activities)) {
        day.activities = [];
      }
      
      // Ensure each activity has the required fields
      const validatedActivities = day.activities.map(activity => {
        return {
          time: activity.time || '12:00 PM',
          title: activity.title || 'Activity',
          description: activity.description || 'Enjoy your time in ' + preferences.destination,
          location: activity.location || null
        };
      });
      
      // If no activities were found, add default ones
      if (validatedActivities.length === 0) {
        validatedActivities.push({
          time: '09:00 AM',
          title: index === 0 ? 'Arrival' : 'Morning Activity',
          description: index === 0 ? 
            `Arrive in ${preferences.destination} and check into your accommodation.` :
            `Explore ${preferences.destination} at your own pace.`,
          location: null
        });
      }
      
      return {
        date: day.date || new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toLocaleDateString(),
        activities: validatedActivities,
        notes: day.notes || `Tips for Day ${index + 1}: Enjoy your time in ${preferences.destination}!`
      };
    });
    
    return {
      days: validatedDays
    };
  } catch (error) {
    console.error('Error generating itinerary with Gemini:', error);
    // Fallback to mock data in case of API failure
    return generateMockItinerary(preferences, recommendations);
  }
};

// Improved helper function to extract JSON from Gemini's text response
const extractJsonFromText = (text) => {
  try {
    // Look for content between triple backticks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonText = jsonMatch[1].trim();
      return JSON.parse(jsonText);
    }
    
    // Look for content within curly braces (when not in a code block)
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      const jsonText = braceMatch[0].trim();
      return JSON.parse(jsonText);
    }
    
    console.error("Could not extract JSON from text:", text);
    return null;
  } catch (error) {
    console.error('Error parsing JSON from Gemini response:', error);
    console.error('Raw text:', text);
    return null;
  }
};

// Helper function to validate and repair JSON data
const validateAndRepairJsonData = (jsonData, preferences) => {
  const result = {
    summary: jsonData.summary || `Based on your preferences, we've created a personalized itinerary for ${preferences.destination}.`,
    attractions: [],
    accommodations: [],
    dining: []
  };
  
  // Validate and repair attractions
  if (jsonData.attractions && Array.isArray(jsonData.attractions)) {
    result.attractions = jsonData.attractions.map(attraction => {
      return {
        name: attraction.name || `${preferences.destination} Attraction`,
        category: attraction.category || preferences.interests[0] || 'Sightseeing',
        description: attraction.description || `A popular attraction in ${preferences.destination}.`
      };
    });
  }
  
  // If no attractions were found, create default ones
  if (result.attractions.length === 0) {
    preferences.interests.slice(0, 5).forEach(interest => {
      result.attractions.push({
        name: `${preferences.destination} ${interest} Experience`,
        category: interest,
        description: `Explore the best of ${interest.toLowerCase()} that ${preferences.destination} has to offer.`
      });
    });
    
    // Ensure we have at least one attraction
    if (result.attractions.length === 0) {
      result.attractions.push({
        name: `${preferences.destination} City Tour`,
        category: 'Sightseeing',
        description: `Explore the highlights of ${preferences.destination} on this comprehensive tour.`
      });
    }
  }
  
  // Validate and repair accommodations
  if (jsonData.accommodations && Array.isArray(jsonData.accommodations)) {
    result.accommodations = jsonData.accommodations.map(accommodation => {
      return {
        name: accommodation.name || `${preferences.destination} Hotel`,
        pricePerNight: accommodation.pricePerNight || 1000,
        description: accommodation.description || `A comfortable place to stay in ${preferences.destination}.`
      };
    });
  }
  
  // If no accommodations were found, create default ones based on travel style
  if (result.accommodations.length === 0) {
    const duration = Math.floor((preferences.endDate - preferences.startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    result.accommodations = [
      {
        name: preferences.travelStyle === 'luxury' ? 'Grand Hotel' : (preferences.travelStyle === 'budget' ? 'Backpacker Hostel' : 'City Center Suites'),
        pricePerNight: preferences.travelStyle === 'luxury' ? Math.floor(preferences.budget/duration * 0.4) : (preferences.travelStyle === 'budget' ? Math.floor(preferences.budget/duration * 0.15) : Math.floor(preferences.budget/duration * 0.25)),
        description: preferences.travelStyle === 'luxury' ? 
          'A 5-star hotel with exceptional service, spa facilities, and fine dining restaurants.' : 
          (preferences.travelStyle === 'budget' ? 
          'A clean, friendly hostel with dormitory and private rooms, communal kitchen, and social atmosphere.' : 
          'A comfortable mid-range hotel with good amenities and a central location.')
      },
      {
        name: preferences.travelStyle === 'luxury' ? 'Waterfront Resort' : (preferences.travelStyle === 'budget' ? 'Budget Inn' : 'Boutique Hotel'),
        pricePerNight: preferences.travelStyle === 'luxury' ? Math.floor(preferences.budget/duration * 0.45) : (preferences.travelStyle === 'budget' ? Math.floor(preferences.budget/duration * 0.18) : Math.floor(preferences.budget/duration * 0.28)),
        description: preferences.travelStyle === 'luxury' ? 
          'An exclusive beachfront property with private balconies, infinity pools, and world-class dining.' : 
          (preferences.travelStyle === 'budget' ? 
          'A simple but comfortable accommodation with basic amenities and friendly staff.' : 
          'A charming hotel with unique character, personalized service, and local flavor.')
      }
    ];
  }
  
  // Validate and repair dining options
  if (jsonData.dining && Array.isArray(jsonData.dining)) {
    result.dining = jsonData.dining.map(restaurant => {
      return {
        name: restaurant.name || `${preferences.destination} Restaurant`,
        cuisine: restaurant.cuisine || 'Local',
        description: restaurant.description || `Enjoy delicious food in ${preferences.destination}.`
      };
    });
  }
  
  // If no dining options were found, create default ones
  if (result.dining.length === 0) {
    result.dining = [
      {
        name: 'Local Delights Restaurant',
        cuisine: 'Regional',
        description: `Authentic ${preferences.destination} cuisine made with fresh ingredients. A must-visit to experience the true flavors of the region.`
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
    ];
  }
  
  return result;
};

// Function to parse unstructured text response from Gemini into structured data
const parseGeminiTextResponse = (text, preferences) => {
  const duration = Math.floor((preferences.endDate - preferences.startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Extract summary (first paragraph)
  const summaryMatch = text.match(/^(.*?)(?:\n|$)/);
  const summary = summaryMatch 
    ? summaryMatch[1] 
    : `Based on your preferences, we've created a personalized ${duration}-day itinerary for ${preferences.destination}.`;
  
  // Extract attractions (look for sections with attraction names)
  const attractions = [];
  const attractionMatches = text.matchAll(/(\d+\.\s*)?([A-Za-z\s']+)(?:\s*\(([A-Za-z\s]+)\))?:\s*([^\n]+)/g);
  
  for (const match of attractionMatches) {
    if (attractions.length >= 5) break;
    
    const name = match[2].trim();
    // Attempt to match the attraction to an interest, or use a default
    const category = match[3] || 
      preferences.interests.find(interest => text.includes(interest)) || 
      preferences.interests[0] || 
      'Sightseeing';
    const description = match[4].trim();
    
    attractions.push({ name, category, description });
  }
  
  // If no attractions were found, create some based on interests
  if (attractions.length === 0) {
    preferences.interests.slice(0, 5).forEach(interest => {
      attractions.push({
        name: `${preferences.destination} ${interest} Experience`,
        category: interest,
        description: `Explore the best of ${interest.toLowerCase()} that ${preferences.destination} has to offer.`
      });
    });
  }
  
  // Create accommodations based on travel style
  const accommodations = [
    {
      name: preferences.travelStyle === 'luxury' ? 'Grand Hotel' : (preferences.travelStyle === 'budget' ? 'Backpacker Hostel' : 'City Center Suites'),
      pricePerNight: preferences.travelStyle === 'luxury' ? Math.floor(preferences.budget/duration * 0.4) : (preferences.travelStyle === 'budget' ? Math.floor(preferences.budget/duration * 0.15) : Math.floor(preferences.budget/duration * 0.25)),
      description: preferences.travelStyle === 'luxury' ? 
        'A 5-star hotel with exceptional service, spa facilities, and fine dining restaurants.' : 
        (preferences.travelStyle === 'budget' ? 
        'A clean, friendly hostel with dormitory and private rooms, communal kitchen, and social atmosphere.' : 
        'A comfortable mid-range hotel with good amenities and a central location.')
    },
    {
      name: preferences.travelStyle === 'luxury' ? 'Waterfront Resort' : (preferences.travelStyle === 'budget' ? 'Budget Inn' : 'Boutique Hotel'),
      pricePerNight: preferences.travelStyle === 'luxury' ? Math.floor(preferences.budget/duration * 0.45) : (preferences.travelStyle === 'budget' ? Math.floor(preferences.budget/duration * 0.18) : Math.floor(preferences.budget/duration * 0.28)),
      description: preferences.travelStyle === 'luxury' ? 
        'An exclusive beachfront property with private balconies, infinity pools, and world-class dining.' : 
        (preferences.travelStyle === 'budget' ? 
        'A simple but comfortable accommodation with basic amenities and friendly staff.' : 
        'A charming hotel with unique character, personalized service, and local flavor.')
    }
  ];
  
  // Create dining options based on interests
  const dining = [
    {
      name: 'Local Delights Restaurant',
      cuisine: 'Regional',
      description: `Authentic ${preferences.destination} cuisine made with fresh ingredients. A must-visit to experience the true flavors of the region.`
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
  ];
  
  return {
    summary,
    attractions,
    accommodations,
    dining
  };
};

// Fallback mock function if the API fails
const generateMockTravelPlan = (preferences) => {
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
        pricePerNight: preferences.travelStyle === 'luxury' ? 3500 : (preferences.travelStyle === 'budget' ? 600 : 1500),
        description: preferences.travelStyle === 'luxury' ? 
          'A 5-star hotel with exceptional service, spa facilities, and fine dining restaurants.' : 
          (preferences.travelStyle === 'budget' ? 
          'A clean, friendly hostel with dormitory and private rooms, communal kitchen, and social atmosphere.' : 
          'A comfortable mid-range hotel with good amenities and a central location.')
      },
      {
        name: preferences.travelStyle === 'luxury' ? 'Waterfront Resort' : (preferences.travelStyle === 'budget' ? 'Budget Inn' : 'Boutique Hotel'),
        pricePerNight: preferences.travelStyle === 'luxury' ? 4000 : (preferences.travelStyle === 'budget' ? 750 : 1800),
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

// Fallback mock function for itinerary generation if the API fails
const generateMockItinerary = (preferences, recommendations) => {
  const startDate = new Date(preferences.startDate);
  const endDate = new Date(preferences.endDate);
  const duration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  const itinerary = {
    days: []
  };
  
  // Generate a day-by-day itinerary
  for (let i = 0; i < duration; i++) {
    const dayActivities = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
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
    let notes = `Tips for Day ${i + 1} (${currentDate.toLocaleDateString()}): `;
    
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
      date: currentDate.toLocaleDateString(),
      activities: dayActivities,
      notes: notes
    });
  }
  
  return itinerary;
};
