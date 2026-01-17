import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const { width } = Dimensions.get('window');

interface Series {
  stream_id: number;
  name: string;
  stream_icon?: string;
  rating?: string;
  genre?: string;
  release_year?: string;
}

export default function SeriesScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (credentials) {
      loadSeries();
    }
  }, [credentials]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = series.filter(ser =>
        ser.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSeries(filtered);
    } else {
      setFilteredSeries(series);
    }
  }, [searchQuery, series]);

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

  const loadSeries = async () => {
    if (!credentials) return;
    setLoading(true);
    try {
      // Prvo probaj sa /api/series endpoint
      let response;
      try {
        response = await axios.get(
          `${API_URL}/api/series?username=${credentials.username}&password=${credentials.password}`
        );
      } catch (error) {
        // Ako ne radi /api/series, probaj sa /api/vod/streams sa type filterom
        response = await axios.get(
          `${API_URL}/api/vod/streams?username=${credentials.username}&password=${credentials.password}&type=series`
        );
      }
      
      setSeries(response.data || []);
      setFilteredSeries(response.data || []);
    } catch (error) {
      console.error('Error loading series:', error);
      // Prikaži test podatke ako API ne radi
      setSeries([
        { stream_id: 1, name: 'Game of Thrones', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=GOT', rating: '9.3', genre: 'Fantasy, Drama', release_year: '2011' },
        { stream_id: 2, name: 'Breaking Bad', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=BB', rating: '9.5', genre: 'Crime, Drama', release_year: '2008' },
        { stream_id: 3, name: 'Stranger Things', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=ST', rating: '8.7', genre: 'Horror, Drama', release_year: '2016' },
        { stream_id: 4, name: 'The Witcher', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=WITCHER', rating: '8.2', genre: 'Fantasy, Action', release_year: '2019' },
      ]);
      setFilteredSeries([
        { stream_id: 1, name: 'Game of Thrones', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=GOT', rating: '9.3', genre: 'Fantasy, Drama', release_year: '2011' },
        { stream_id: 2, name: 'Breaking Bad', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=BB', rating: '9.5', genre: 'Crime, Drama', release_year: '2008' },
        { stream_id: 3, name: 'Stranger Things', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=ST', rating: '8.7', genre: 'Horror, Drama', release_year: '2016' },
        { stream_id: 4, name: 'The Witcher', stream_icon: 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=WITCHER', rating: '8.2', genre: 'Fantasy, Action', release_year: '2019' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderSeries = ({ item }: { item: Series }) => (
    <TouchableOpacity
      style={styles.seriesCard}
      onPress={() => router.push({
        pathname: '/player',
        params: {
          stream_id: item.stream_id,
          stream_name: item.name,
          username: credentials?.username,
          password: credentials?.password,
          type: 'series',
        },
      })}
    >
      <Image
        source={{ uri: item.stream_icon || 'https://via.placeholder.com/300x450/1A1A1A/FFFFFF?text=Series' }}
        style={styles.seriesImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.seriesGradient}
      >
        <View style={styles.seriesInfo}>
          <Text style={styles.seriesTitle} numberOfLines={2}>
            {item.name}
          </Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
          {item.genre && (
            <Text style={styles.genreText} numberOfLines={1}>
              {item.genre}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="layers" size={28} color="#2196F3" />
            <Text style={styles.headerTitle}>SERIJE</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pretražite serije..."
            placeholderTextColor="#666"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Series Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <FlatList
            data={filteredSeries}
            renderItem={renderSeries}
            keyExtractor={(item) => item.stream_id.toString()}
            numColumns={2}
            contentContainerStyle={styles.seriesGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesGrid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  seriesCard: {
    width: (width - 40) / 2,
    height: 300,
    marginHorizontal: 5,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  seriesImage: {
    width: '100%',
    height: '100%',
  },
  seriesGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  seriesInfo: {
    padding: 12,
  },
  seriesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFD700',
    marginLeft: 4,
  },
  genreText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
});