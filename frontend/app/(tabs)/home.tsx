import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const { width } = Dimensions.get('window');

interface Category {
  category_id: string;
  category_name: string;
}

interface Stream {
  stream_id: number;
  name: string;
  stream_icon?: string;
  tv_archive?: number;
}

interface Movie {
  stream_id: number;
  name: string;
  stream_icon?: string;
  rating?: string;
  genre?: string;
  release_year?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any>(null);
  const [featuredStreams, setFeaturedStreams] = useState<Stream[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [latestMovies, setLatestMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const creds = await AsyncStorage.getItem('user_credentials');
      if (creds) {
        const parsed = JSON.parse(creds);
        setCredentials(parsed);
        setUsername(parsed.username || 'Korisnik');
        loadHomeData(parsed);
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  const loadHomeData = async (creds: any) => {
    try {
      // Load featured streams (limit to 6)
      const streamsRes = await axios.get(
        `${API_URL}/api/live/streams?username=${creds.username}&password=${creds.password}&limit=6`
      );
      setFeaturedStreams(streamsRes.data || []);

      // Load live categories (limit to 5)
      const categoriesRes = await axios.get(
        `${API_URL}/api/live/categories?username=${creds.username}&password=${creds.password}`
      );
      setLiveCategories(categoriesRes.data?.slice(0, 5) || []);

      // Load VOD categories (limit to 5)
      const vodRes = await axios.get(
        `${API_URL}/api/vod/categories?username=${creds.username}&password=${creds.password}`
      );
      setVodCategories(vodRes.data?.slice(0, 5) || []);

      // Load latest movies (limit to 4)
      const moviesRes = await axios.get(
        `${API_URL}/api/vod/streams?username=${creds.username}&password=${creds.password}&limit=4`
      );
      setLatestMovies(moviesRes.data || []);

    } catch (error: any) {
      console.error('Error loading home data:', error);
      Alert.alert(
        'Greška',
        error.response?.data?.detail || 'Server nije dostupan'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (credentials) {
      await loadHomeData(credentials);
    }
    setRefreshing(false);
  };

  const renderFeaturedItem = ({ item }: { item: Stream }) => (
    <TouchableOpacity
      style={styles.featuredItem}
      onPress={() => router.push({
        pathname: '/player',
        params: {
          stream_id: item.stream_id,
          stream_name: item.name,
          username: credentials?.username,
          password: credentials?.password,
        },
      })}
    >
      <Image
        source={{ uri: item.stream_icon || 'https://via.placeholder.com/300x170/1A1A1A/FFFFFF?text=TV' }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      >
        <Text style={styles.featuredTitle} numberOfLines={1}>
          {item.name}
        </Text>
        {item.tv_archive === 1 && (
          <View style={styles.liveBadge}>
            <Ionicons name="time" size={12} color="#FFF" />
            <Text style={styles.liveText}>ARHIVA</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => router.push(`/(tabs)/live?category=${item.category_id}`)}
    >
      <LinearGradient
        colors={['#FF6B35', '#FF8C5A']}
        style={styles.categoryIcon}
      >
        <Ionicons name="tv" size={24} color="#FFF" />
      </LinearGradient>
      <Text style={styles.categoryName} numberOfLines={1}>
        {item.category_name}
      </Text>
    </TouchableOpacity>
  );

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => Alert.alert('Info', 'Player za filmove će biti dodan uskoro')}
    >
      <Image
        source={{ uri: item.stream_icon || 'https://via.placeholder.com/150x225/1A1A1A/FFFFFF?text=Movie' }}
        style={styles.movieImage}
        resizeMode="cover"
      />
      {item.rating && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      )}
      <Text style={styles.movieTitle} numberOfLines={1}>
        {item.name}
      </Text>
      {item.release_year && (
        <Text style={styles.movieYear}>{item.release_year}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Učitavanje sadržaja...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#000000', 'transparent']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Dobrodošli</Text>
              <Text style={styles.usernameText}>{username}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
        >
          {/* Featured Streams */}
          {featuredStreams.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Istaknuti kanali</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/live')}>
                  <Text style={styles.seeAllText}>Svi kanali</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={featuredStreams}
                renderItem={renderFeaturedItem}
                keyExtractor={(item) => item.stream_id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
              />
            </View>
          )}

          {/* Live Categories */}
          {liveCategories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Kategorije TV</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/live')}>
                  <Text style={styles.seeAllText}>Sve kategorije</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={liveCategories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.category_id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>
          )}

          {/* Latest Movies */}
          {latestMovies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Najnoviji filmovi</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/vod')}>
                  <Text style={styles.seeAllText}>Svi filmovi</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={latestMovies}
                renderItem={renderMovieItem}
                keyExtractor={(item) => item.stream_id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moviesList}
              />
            </View>
          )}

          {/* Quick Access */}
          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionTitle}>Brzi pristup</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={styles.quickAccessItem}
                onPress={() => router.push('/(tabs)/live')}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8C5A']}
                  style={styles.quickAccessIcon}
                >
                  <Ionicons name="tv" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={styles.quickAccessText}>Uživo TV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessItem}
                onPress={() => router.push('/(tabs)/vod')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  style={styles.quickAccessIcon}
                >
                  <Ionicons name="film" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={styles.quickAccessText}>Filmovi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessItem}
                onPress={() => router.push('/(tabs)/series')}
              >
                <LinearGradient
                  colors={['#2196F3', '#03A9F4']}
                  style={styles.quickAccessIcon}
                >
                  <MaterialCommunityIcons name="movie-play" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={styles.quickAccessText}>Serije</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessItem}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <LinearGradient
                  colors={['#9C27B0', '#E91E63']}
                  style={styles.quickAccessIcon}
                >
                  <Ionicons name="settings" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={styles.quickAccessText}>Podešavanja</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              LUXUZ TV - Premium IPTV usluga
            </Text>
            <Text style={styles.infoSubtext}>
              {featuredStreams.length > 0 
                ? `${featuredStreams.length} kanala dostupno` 
                : 'Učitavanje sadržaja...'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCCCCC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#999',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  featuredList: {
    paddingHorizontal: 20,
  },
  featuredItem: {
    width: width * 0.7,
    height: 170,
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 4,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCC',
    textAlign: 'center',
  },
  moviesList: {
    paddingHorizontal: 20,
  },
  movieItem: {
    width: 150,
    marginRight: 15,
  },
  movieImage: {
    width: 150,
    height: 225,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 2,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  movieYear: {
    fontSize: 12,
    color: '#999',
  },
  quickAccessSection: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  infoSection: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  infoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});