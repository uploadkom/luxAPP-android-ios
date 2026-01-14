import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
    'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
    'Rubik-Bold': require('../assets/fonts/Rubik-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
        checkAuth();
      }
    }
    prepare();
  }, [fontsLoaded]);

  const checkAuth = async () => {
    try {
      const credentials = await AsyncStorage.getItem('user_credentials');
      if (credentials) {
        router.replace('/(tabs)/live');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#000000', '#1A1A1A', '#000000']}
      style={styles.container}
    >
      <View style={styles.logoCircle}>
        <Ionicons name="tv" size={56} color="#FF6B35" />
      </View>
      <Text style={styles.logo}>LUXUZ TV</Text>
      <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  logo: {
    fontSize: 56,
    fontFamily: 'Rubik-Bold',
    color: '#FF6B35',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 107, 53, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  loader: {
    marginTop: 32,
  },
});