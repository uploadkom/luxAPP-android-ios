import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (credentials) {
      loadMovie();
    }
  }, [credentials]);

  const loadCredentials = async () => {
    try {
      const creds = await AsyncStorage.getItem('user_credentials');
      if (creds) {
        setCredentials(JSON.parse(creds));
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  const loadMovie = async () => {
    if (!credentials) return;
    
    try {
      // Ovde treba da pozoveš API za detalje filma
      // Za sada ćemo prikazati samo ID
      setMovie({
        id: params.id,
        name: `Film ID: ${params.id}`,
        plot: 'Detalji filma će biti dostupni uskoro.',
        rating: '8.5',
        release_year: '2024',
        duration: '120min',
      });
    } catch (error) {
      console.error('Error loading movie:', error);
      Alert.alert('Greška', 'Neuspešno učitavanje detalja filma');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (credentials && movie) {
      router.push({
        pathname: '/player',
        params: {
          stream_id: movie.id,
          stream_name: movie.name,
          username: credentials.username,
          password: credentials.password,
          type: 'vod',
        },
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FILM</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Movie Poster */}
          <View style={styles.posterContainer}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.posterGradient}
            >
              <Image
                source={{ uri: 'https://via.placeholder.com/400x600/1A1A1A/FFFFFF?text=Movie+Poster' }}
                style={styles.posterImage}
                resizeMode="cover"
              />
            </LinearGradient>
          </View>

          {/* Movie Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.movieTitle}>{movie.name}</Text>
            
            <View style={styles.metaInfo}>
              {movie.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{movie.rating}</Text>
                </View>
              )}
              {movie.release_year && (
                <Text style={styles.metaText}>{movie.release_year}</Text>
              )}
              {movie.duration && (
                <Text style={styles.metaText}>{movie.duration}</Text>
              )}
            </View>

            <Text style={styles.plotText}>{movie.plot}</Text>

            {/* Play Button */}
            <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
              <LinearGradient
                colors={['#FF6B35', '#FF8C5A']}
                style={styles.playButtonGradient}
              >
                <Ionicons name="play" size={24} color="#FFF" />
                <Text style={styles.playButtonText}>REPRODUKUJ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  posterContainer: {
    width: width,
    height: width * 1.5,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  infoContainer: {
    padding: 20,
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 5,
  },
  metaText: {
    fontSize: 16,
    color: '#999',
    marginRight: 15,
  },
  plotText: {
    fontSize: 16,
    color: '#CCC',
    lineHeight: 24,
    marginBottom: 30,
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 30,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
});
