import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IP_ADDRESS, PORT } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// console.log(IP_ADDRESS, PORT);

import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios'; // Import axios for API calls

const Stack = createNativeStackNavigator();
const { width, height } = Dimensions.get('window');

const IntroScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      navigation.replace('Login');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.introText, { opacity: fadeAnim }]}>
        MahaTourism
      </Animated.Text>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Function to store user data in AsyncStorage
  const storeUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userId', userData.id.toString());
      await AsyncStorage.setItem('userFullName', userData.fullName);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('userMobile', userData.mobileNumber);
      console.log('User data stored successfully');
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`http://192.168.1.6:${PORT}/api/login`, {
        mobileNumber,
        password,
      });
      const userData = response.data.user;
      
      // Store user data in AsyncStorage
      await storeUserData(userData);
      
      // Navigate to HomeScreen with all user data
      navigation.navigate('HomeScreen', { 
        userId: userData.id, 
        userFullName: userData.fullName,
        userEmail: userData.email,
        userMobile: userData.mobileNumber
      });
    } catch (error) {
      setErrorMessage('Invalid mobile number or password');
      console.error('Login error:', error);
      
      // dummy login
      // navigation.navigate('HomeScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>MahaTourism</Text>
        <Text style={styles.subHeaderText}>Discover Maharashtra</Text>
      </View>

      <View style={styles.formContainer}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Image 
              source={showPassword ? require('../../assets/icons/eyeshow.png') : require('../../assets/icons/eyehide.png')} 
              style={styles.eyeIcon} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton}>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
            <Text style={styles.link}>New User? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  introText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF671F',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
    marginBottom: height * 0.05,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF671F',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  loginButton: {
    backgroundColor: '#FF671F',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  link: {
    color: '#FF671F',
    fontSize: 16,
  },
});

export default LoginScreen;