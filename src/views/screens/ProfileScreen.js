// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../../consts/colors';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5000/api';

const ProfileScreen = ({ route, navigation }) => {
  const { userId, userFullName, userEmail, userMobile } = route.params || {};
  useEffect(() => {
    console.log("Profile received params:", route.params);
  }, []);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: userEmail || '',
    mobile: userMobile || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
      const userProfile = response.data;
      
      setUserData({
        lastName: userProfile.last_name || userlastName || '',
        firstName: userProfile.first_name || userFirstName || '',
        email: userProfile.email || userEmail || '',
        mobile: userProfile.phone_number || userMobile || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zipCode: userProfile.zip_code || '',
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user profile');
      setLoading(false);
      console.error('Error fetching user profile:', err);
    }
  };

  const saveUserProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }
    
    try {
      setLoading(true);
      
      const updatedUserData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        mobile: userData.mobile,  // Fixed: use mobile from userData
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zipCode,
      };
      
      await axios.put(`${API_BASE_URL}/users/${userId}`, updatedUserData);
      
      setIsEditing(false);
      setLoading(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating user profile:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const renderProfileFields = () => {
    if (isEditing) {
      return (
        <View style={style.formContainer}>
          <View style={style.formGroup}>
            <Text style={style.label}>First Name</Text>
            <TextInput
              style={style.input}
              value={userData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              placeholder="Enter your first name"
            />
          </View>
          <View style={style.formGroup}>
            <Text style={style.label}>last Name</Text>
            <TextInput
              style={style.input}
              value={userData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              placeholder="Enter your last name"
            />
          </View>
          <View style={style.formGroup}>
            <Text style={style.label}>Email</Text>
            <TextInput
              style={style.input}
              value={userData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              editable={false} // Email cannot be changed
            />
          </View>
          
          <View style={style.formGroup}>
            <Text style={style.label}>Mobile</Text>
            <TextInput
              style={style.input}
              value={userData.mobile}
              onChangeText={(text) => handleInputChange('mobile', text)}
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={style.formGroup}>
            <Text style={style.label}>Address</Text>
            <TextInput
              style={style.input}
              value={userData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Enter your address"
            />
          </View>
          
          <View style={style.formRow}>
            <View style={[style.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={style.label}>City</Text>
              <TextInput
                style={style.input}
                value={userData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
              />
            </View>
            
            <View style={[style.formGroup, { flex: 1 }]}>
              <Text style={style.label}>State</Text>
              <TextInput
                style={style.input}
                value={userData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                placeholder="State"
              />
            </View>
          </View>
          
          <View style={style.formGroup}>
            <Text style={style.label}>ZIP Code</Text>
            <TextInput
              style={style.input}
              value={userData.zipCode}
              onChangeText={(text) => handleInputChange('zipCode', text)}
              placeholder="ZIP Code"
              keyboardType="numeric"
            />
          </View>
          
          <View style={style.buttonRow}>
            <TouchableOpacity 
              style={[style.button, style.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={style.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[style.button, style.saveButton]}
              onPress={saveUserProfile}
            >
              <Text style={style.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={style.profileInfoContainer}>
          <View style={style.infoRow}>
            <Icon name="person" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>First Name:</Text>
            <Text style={style.infoValue}>{userData.firstName}</Text>
          </View>
          <View style={style.infoRow}>
            <Icon name="person" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>Last Name:</Text>
            <Text style={style.infoValue}>{userData.lastName}</Text>
          </View>
          <View style={style.infoRow}>
            <Icon name="email" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>Email:</Text>
            <Text style={style.infoValue}>{userData.email}</Text>
          </View>
          
          <View style={style.infoRow}>
            <Icon name="phone" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>Mobile:</Text>
            <Text style={style.infoValue}>{userData.mobile}</Text>
          </View>
          
          <View style={style.infoRow}>
            <Icon name="home" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>Address:</Text>
            <Text style={style.infoValue}>{userData.address || 'Not provided'}</Text>
          </View>
          
          <View style={style.infoRow}>
            <Icon name="location-city" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>City:</Text>
            <Text style={style.infoValue}>{userData.city || 'Not provided'}</Text>
          </View>
          
          <View style={style.infoRow}>
            <Icon name="map" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>State:</Text>
            <Text style={style.infoValue}>{userData.state || 'Not provided'}</Text>
          </View>
          
          <View style={style.infoRow}>
            <Icon name="my-location" size={20} color={COLORS.grey} />
            <Text style={style.infoLabel}>ZIP Code:</Text>
            <Text style={style.infoValue}>{userData.zipCode || 'Not provided'}</Text>
          </View>
          
          <TouchableOpacity 
            style={[style.button, style.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={style.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={style.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={style.headerTitle}>My Profile</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={style.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={style.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={style.errorContainer}>
            <Icon name="error" size={40} color={COLORS.primary} />
            <Text style={style.errorText}>{error}</Text>
            <TouchableOpacity style={style.retryButton} onPress={fetchUserProfile}>
              <Text style={style.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={style.container}>
            <View style={style.profileImageContainer}>
              <Image
                source={require('../../assets/user-avatar.jpeg')}
                style={style.profileImage}
              />
              {!isEditing && (
                <TouchableOpacity style={style.changePhotoButton}>
                  <Text style={style.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {renderProfileFields()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  container: {
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  profileInfoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.grey,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: COLORS.grey,
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
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
    padding: 50,
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
});

export default ProfileScreen;