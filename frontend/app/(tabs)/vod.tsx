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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const { width } = Dimensions.get('window');

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface Movie {
  stream_id: number;
  name: string;
  stream_icon?: string;
  rating?: string;
  genre?: string;
  release_year?: string;
  duration?: string;
  plot?: string;
}

export default function VodScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (credentials) {
      loadCategories();
      loadMovies();
    }
  }, [credentials]);

  useEffect(() => {
    if (selectedCategory && credentials) {
      loadMovies(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = movies.filter(movie =>
        movie.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  }, [searchQuery, movies]);

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

  const loadCategories = async () => {
    if (!credentials) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/vod/categories?username=${credentials.username}&password=${credentials.password}`
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading VOD categories:', error);
    }
  };

  const loadMovies = async (categoryId?: string) => {
    if (!credentials) return;
    setLoading(true);
    try {
      let url = `${API_URL}/api/vod/streams?username=${credentials.username}&password=${credentials.password}`;
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      const response = await axios.get(url);
      setMovies(response.data || []);
      setFilteredMovies(response.data || []);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.category_id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item.category_id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.category_id && styles.categoryTextActive,
        ]}
      >
        {item.category_name}
      </Text>
    </TouchableOpacity>
  );

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => router.push({
        pathname: '/player',
        params: {
          stream_id: item.stream_id,
          stream_name: item.name,
          username: credentials?.username,
          password: credentials?.password,
          type: 'vod',
        },
      })}
    >
      <Image
        source={{ uri: item.stream_icon || 'https://via.placeholder.com/150x225/1A1A1A/FFFFFF?text=Movie' }}
        style={styles.movieImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.movieGradient}
      >
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.movieMeta}>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
            {item.release_year && (
              <Text style={styles.yearText}>{item.release_year}</Text>
            )}
            {item.duration && (
              <Text style={styles.durationText}>{item.duration}</Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="film" size={28} color="#FF6B35" />
          <Text style={styles.headerTitle}>FILMOVI</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="search" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Pretražite filmove..."
          placeholderTextColor="#666"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextActive,
            ]}
          >
            SVI
          </Text>
        </TouchableOpacity>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.category_id}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
        />
      </View>

      {/* Movies Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.stream_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.moviesGrid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  categoriesList: {
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moviesGrid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  movieCard: {
    width: (width - 40) / 2,
    height: 280,
    marginHorizontal: 5,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  movieImage: {
    width: '100%',
    height: '100%',
  },
  movieGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFD700',
    marginLeft: 2,
  },
  yearText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
    marginRight: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
});