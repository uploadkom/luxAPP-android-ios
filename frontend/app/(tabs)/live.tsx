import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Dimensions,
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
}

interface Stream {
  stream_id: number;
  name: string;
  stream_icon?: string;
  tv_archive?: number;
  epg_channel_id?: string;
}

interface Credentials {
  username: string;
  password: string;
  user_info?: any;
}

export default function LiveTVScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (credentials) {
      loadCategories();
      loadStreams();
      loadFavorites();
    }
  }, [credentials]);

  useEffect(() => {
    if (selectedCategory && credentials) {
      loadStreams(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = streams.filter(stream =>
        stream.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStreams(filtered);
    } else {
      setFilteredStreams(streams);
    }
  }, [searchQuery, streams]);

  const loadCredentials = async () => {
    try {
      const creds = await AsyncStorage.getItem('user_credentials');
      if (creds) {
        const parsed = JSON.parse(creds);
        setCredentials(parsed);
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await AsyncStorage.getItem('favorites');
      if (favs) {
        setFavorites(JSON.parse(favs));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadCategories = async () => {
    if (!credentials) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/live/categories?username=${credentials.username}&password=${credentials.password}`
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreams = async (categoryId?: string) => {
    if (!credentials) return;
    setStreamsLoading(true);
    try {
      let url = `${API_URL}/api/live/streams?username=${credentials.username}&password=${credentials.password}`;
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      const response = await axios.get(url);
      setStreams(response.data || []);
      setFilteredStreams(response.data || []);
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setStreamsLoading(false);
    }
  };

  const toggleFavorite = async (streamId: number) => {
    try {
      let newFavorites = [...favorites];
      if (newFavorites.includes(streamId)) {
        newFavorites = newFavorites.filter(id => id !== streamId);
      } else {
        newFavorites.push(streamId);
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePlayStream = (stream: Stream) => {
    router.push({
      pathname: '/player',
      params: {
        stream_id: stream.stream_id,
        stream_name: stream.name,
        username: credentials?.username,
        password: credentials?.password,
        type: 'live',
      },
    });
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.category_id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item.category_id)}
    >
      <LinearGradient
        colors={selectedCategory === item.category_id ? ['#FF6B35', '#FF8C5A'] : ['#1A1A1A', '#1A1A1A']}
        style={styles.categoryGradient}
      >
        <Text
          style={[
            styles.categoryText,
            selectedCategory === item.category_id && styles.categoryTextActive,
          ]}
        >
          {item.category_name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderStream = ({ item }: { item: Stream }) => (
    <TouchableOpacity
      style={styles.streamCard}
      onPress={() => handlePlayStream(item)}
    >
      <View style={styles.streamMain}>
        <View style={styles.streamIcon}>
          {item.stream_icon ? (
            <Image
              source={{ uri: item.stream_icon }}
              style={styles.streamIconImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="tv" size={32} color="#FF6B35" />
          )}
        </View>
        <View style={styles.streamInfo}>
          <Text style={styles.streamName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.streamMeta}>
            {item.tv_archive === 1 && (
              <View style={styles.archiveBadge}>
                <Ionicons name="time" size={12} color="#FFF" />
                <Text style={styles.archiveText}>ARHIVA</Text>
              </View>
            )}
            {item.epg_channel_id && (
              <View style={styles.epgBadge}>
                <Ionicons name="calendar" size={12} color="#FFF" />
                <Text style={styles.epgText}>EPG</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.stream_id)}
      >
        <Ionicons
          name={favorites.includes(item.stream_id) ? "heart" : "heart-outline"}
          size={24}
          color={favorites.includes(item.stream_id) ? "#FF4444" : "#666"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="tv" size={28} color="#FF6B35" />
          <Text style={styles.headerTitle}>UŽIVO TV</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="filter" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Pretražite kanale..."
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
          <LinearGradient
            colors={!selectedCategory ? ['#FF6B35', '#FF8C5A'] : ['#1A1A1A', '#1A1A1A']}
            style={styles.categoryGradient}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextActive,
              ]}
            >
              SVE
            </Text>
          </LinearGradient>
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

      {/* Streams */}
      <View style={styles.streamsContainer}>
        {streamsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <FlatList
            data={filteredStreams}
            renderItem={renderStream}
            keyExtractor={(item) => item.stream_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.streamsList}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#CCCCCC',
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
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChipActive: {},
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  streamsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  streamsList: {
    paddingBottom: 20,
  },
  streamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  streamMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streamIcon: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  streamIconImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  streamInfo: {
    flex: 1,
  },
  streamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  streamMeta: {
    flexDirection: 'row',
  },
  archiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
  },
  archiveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 3,
  },
  epgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  epgText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 3,
  },
  favoriteButton: {
    padding: 8,
  },
});