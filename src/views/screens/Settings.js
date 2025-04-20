// SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../../consts/colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://192.168.1.6:5000/api';

const Settings = ({ route, navigation }) => {
  const [userId,setUserId] = useState(null);
  
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
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    locationServices: true,
    saveSearchHistory: true,
    language: 'English',
    currency: 'INR',
    appVersion: '1.0.0',
  });
  useEffect(() => {
    console.log("Settings received params:", route.params);
  }, []);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [languageModal, setLanguageModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);

  const languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD'];

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    if (!userId) return;
    
    // try {
    //   setLoading(true);
    //   const response = await axios.get(`${API_BASE_URL}/users/${userId}/settings`);
    //   if (response.data) {
    //     setSettings(prevSettings => ({
    //       ...prevSettings,
    //       ...response.data
    //     }));
    //   }
    //   setLoading(false);
    // } catch (err) {
    //   console.error('Error fetching user settings:', err);
    //   setLoading(false);
    // }
  };

  const updateSetting = async (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
    
    if (!userId) return;
    
    try {
      await axios.put(`${API_BASE_URL}/users/${userId}/settings`, {
        [key]: value
      });
    } catch (err) {
      console.error(`Error updating setting ${key}:`, err);
      // Revert setting if update fails
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: !value
      }));
      Alert.alert('Error', `Failed to update setting. Please try again.`);
    }
  };

  const handleChangePassword = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }
    
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/users/${userId}/password`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setLoading(false);
      setChangePasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordError('');
      
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      setLoading(false);
      
      if (err.response && err.response.status === 401) {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
      
      console.error('Error changing password:', err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!userId) {
              Alert.alert('Error', 'User ID not found. Please log in again.');
              return;
            }
            
            try {
              setLoading(true);
              await axios.delete(`${API_BASE_URL}/users/${userId}`);
              setLoading(false);
              
              // Redirect to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
              });
              
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
            } catch (err) {
              setLoading(false);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              console.error('Error deleting account:', err);
            }
          },
        },
      ],
    );
  };

  const renderSettingSwitch = (title, description, key) => (
    <View style={style.settingItem}>
      <View style={style.settingTextContainer}>
        <Text style={style.settingTitle}>{title}</Text>
        <Text style={style.settingDescription}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#e0e0e0', true: `${COLORS.primary}50` }}
        thumbColor={settings[key] ? COLORS.primary : '#f4f3f4'}
        ios_backgroundColor="#e0e0e0"
        onValueChange={(value) => updateSetting(key, value)}
        value={settings[key]}
      />
    </View>
  );

  const renderSettingOption = (title, value, onPress, icon) => (
    <TouchableOpacity style={style.settingItem} onPress={onPress}>
      <View style={style.settingTextContainer}>
        <Text style={style.settingTitle}>{title}</Text>
        <Text style={style.settingValue}>{value}</Text>
      </View>
      <Icon name={icon} size={24} color={COLORS.grey} />
    </TouchableOpacity>
  );

  const ChangePasswordModal = () => (
    <Modal
      visible={changePasswordModal}
      transparent
      animationType="slide"
    >
      <View style={style.modalOverlay}>
        <View style={style.modalContainer}>
          <Text style={style.modalTitle}>Change Password</Text>
          
          <View style={style.modalForm}>
            <Text style={style.inputLabel}>Current Password</Text>
            <TextInput
              style={style.input}
              placeholder="Enter current password"
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
            />
            
            <Text style={style.inputLabel}>New Password</Text>
            <TextInput
              style={style.input}
              placeholder="Enter new password"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
            />
            
            <Text style={style.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={style.input}
              placeholder="Confirm new password"
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
            />
            
            {passwordError ? <Text style={style.errorText}>{passwordError}</Text> : null}
          </View>
          
          <View style={style.modalButtons}>
            <TouchableOpacity
              style={[style.modalButton, style.cancelButton]}
              onPress={() => {
                setChangePasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
            >
              <Text style={style.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[style.modalButton, style.saveButton]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={style.saveButtonText}>Change</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const LanguageModal = () => (
    <Modal
      visible={languageModal}
      transparent
      animationType="slide"
    >
      <View style={style.modalOverlay}>
        <View style={style.modalContainer}>
          <Text style={style.modalTitle}>Select Language</Text>
          
          <ScrollView style={style.modalOptionsList}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  style.modalOption,
                  settings.language === language && style.selectedOption
                ]}
                onPress={() => {
                  updateSetting('language', language);
                  setLanguageModal(false);
                }}
              >
                <Text
                  style={[
                    style.modalOptionText,
                    settings.language === language && style.selectedOptionText
                  ]}
                >
                  {language}
                </Text>
                {settings.language === language && (
                  <Icon name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={[style.modalButton, style.cancelButton, { marginTop: 15 }]}
            onPress={() => setLanguageModal(false)}
          >
            <Text style={style.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CurrencyModal = () => (
    <Modal
      visible={currencyModal}
      transparent
      animationType="slide"
    >
      <View style={style.modalOverlay}>
        <View style={style.modalContainer}>
          <Text style={style.modalTitle}>Select Currency</Text>
          
          <ScrollView style={style.modalOptionsList}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  style.modalOption,
                  settings.currency === currency && style.selectedOption
                ]}
                onPress={() => {
                  updateSetting('currency', currency);
                  setCurrencyModal(false);
                }}
              >
                <Text
                  style={[
                    style.modalOptionText,
                    settings.currency === currency && style.selectedOptionText
                  ]}
                >
                  {currency}
                </Text>
                {settings.currency === currency && (
                  <Icon name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={[style.modalButton, style.cancelButton, { marginTop: 15 }]}
            onPress={() => setCurrencyModal(false)}
          >
            <Text style={style.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={style.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={style.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>
      
      {loading && (
        <View style={style.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={style.container}>
          <Text style={style.sectionTitle}>App Preferences</Text>
          
          {renderSettingSwitch(
            'Notifications',
            'Receive push notifications for offers and updates',
            'notifications'
          )}
          
          {renderSettingSwitch(
            'Email Notifications',
            'Receive promotional emails and newsletters',
            'emailNotifications'
          )}
          
          {renderSettingSwitch(
            'Dark Mode',
            'Use dark theme throughout the app',
            'darkMode'
          )}
          
          {renderSettingSwitch(
            'Location Services',
            'Allow app to access your location',
            'locationServices'
          )}
          
          {renderSettingSwitch(
            'Save Search History',
            'Save your search history for future recommendations',
            'saveSearchHistory'
          )}
          
          {renderSettingOption(
            'Language',
            settings.language,
            () => setLanguageModal(true),
            'keyboard-arrow-right'
          )}
          
          {renderSettingOption(
            'Currency',
            settings.currency,
            () => setCurrencyModal(true),
            'keyboard-arrow-right'
          )}
          
          <Text style={style.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={style.settingButton}
            onPress={() => setChangePasswordModal(true)}
          >
            <View style={style.settingButtonContent}>
              <Icon name="lock" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>Change Password</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={style.settingButton}
            onPress={() => navigation.navigate('ProfileScreen', { userId })}
          >
            <View style={style.settingButtonContent}>
              <Icon name="person" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>Edit Profile</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[style.settingButton, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
          >
            <View style={style.settingButtonContent}>
              <Icon name="delete" size={22} color="#F44336" />
              <Text style={[style.settingButtonText, { color: '#F44336' }]}>Delete Account</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <Text style={style.sectionTitle}>About</Text>
          
          <TouchableOpacity
            style={style.settingButton}
            onPress={() => navigation.navigate('AboutUs')}
          >
            <View style={style.settingButtonContent}>
              <Icon name="info" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>About Us</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={style.settingButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={style.settingButtonContent}>
              <Icon name="security" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>Privacy Policy</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={style.settingButton}
            onPress={() => navigation.navigate('TermsConditions')}
          >
            <View style={style.settingButtonContent}>
              <Icon name="description" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>Terms & Conditions</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[style.settingButton, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <View style={style.settingButtonContent}>
              <Icon name="contact-support" size={22} color={COLORS.primary} />
              <Text style={style.settingButtonText}>Contact Us</Text>
            </View>
            <Icon name="keyboard-arrow-right" size={24} color={COLORS.grey} />
          </TouchableOpacity>
          
          <View style={style.versionContainer}>
            <Text style={style.versionText}>
              MahaTourism v{settings.appVersion}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <ChangePasswordModal />
      <LanguageModal />
      <CurrencyModal />
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.grey,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.primary,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.grey,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: 20,
  },
  inputLabel: {
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
    marginBottom: 15,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: -5,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: COLORS.grey,
    marginRight: 10,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOptionsList: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: `${COLORS.primary}10`,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default Settings;