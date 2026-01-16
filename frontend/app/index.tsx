import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      await SplashScreen.hideAsync();
      checkAuth();
    }
    prepare();
  }, []);

  const checkAuth = async () => {
    try {
      const credentials = await AsyncStorage.getItem('user_credentials');
      if (credentials) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
    </SafeAreaView>
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
    fontWeight: 'bold',
    color: '#FF6B35',
    letterSpacing: 4,
  },
  loader: {
    marginTop: 32,
  },
});
