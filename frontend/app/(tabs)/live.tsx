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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

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

interface Credentials {
  username: string;
  password: string;
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

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (credentials) {
      loadCategories();
      loadStreams();
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
      <View style={styles.streamIcon}>
        {item.stream_icon ? (
          <Image
            source={{ uri: item.stream_icon }}
            style={styles.streamIconImage}
            resizeMode=\"contain\"
          />
        ) : (
          <Ionicons name=\"tv\" size={32} color=\"#FF6B35\" />
        )}
      </View>
      <View style={styles.streamInfo}>
        <Text style={styles.streamName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.tv_archive === 1 && (
          <View style={styles.archiveBadge}>
            <Text style={styles.archiveText}>ARHIVA</Text>
          </View>
        )}
      </View>
      <Ionicons name=\"play-circle\" size={40} color=\"#FF6B35\" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size=\"large\" color=\"#FF6B35\" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name=\"tv\" size={28} color=\"#FF6B35\" />
          <Text style={styles.headerTitle}>UŽIVO</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name=\"search\" size={20} color=\"#666\" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder=\"Pretra\u017eite kanale...\"
          placeholderTextColor=\"#666\"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name=\"close-circle\" size={20} color=\"#666\" />
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
            <ActivityIndicator size=\"large\" color=\"#FF6B35\" />
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
    fontFamily: 'Rubik-Regular',
    color: '#CCCCCC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
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
    fontFamily: 'Rubik-Regular',
    color: '#FFFFFF',
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontFamily: 'Rubik-Medium',
    color: '#CCCCCC',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  streamsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  streamsList: {
    paddingBottom: 16,
  },
  streamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  streamIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  streamIconImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  streamInfo: {
    flex: 1,
  },
  streamName: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  archiveBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  archiveText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    color: '#000000',
  },
});
