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
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface Stream {
  stream_id: number;
  num: number;
  name: string;
  stream_type: string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id?: string;
  tv_archive?: number;
}

interface Credentials {
  username: string;
  password: string;
  user_info?: any;
}

export default function HomeScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(false);

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
    if (credentials && selectedCategory) {
      loadStreams(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCredentials = async () => {
    try {
      const creds = await AsyncStorage.getItem('user_credentials');
      if (creds) {
        setCredentials(JSON.parse(creds));
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
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
      Alert.alert('Greška', 'Neuspešno učitavanje kategorija');
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
    } catch (error) {
      console.error('Error loading streams:', error);
      Alert.alert('Greška', 'Neuspešno učitavanje kanala');
    } finally {
      setStreamsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Odjava',
      'Da li ste sigurni da želite da se odjavite?',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user_credentials');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handlePlayStream = (stream: Stream) => {
    router.push({
      pathname: '/player',
      params: {
        stream_id: stream.stream_id,
        stream_name: stream.name,
        username: credentials?.username,
        password: credentials?.password,
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
        {item.tv_archive === 1 && (
          <View style={styles.archiveBadge}>
            <Text style={styles.archiveText}>ARHIVA</Text>
          </View>
        )}
      </View>
      <Ionicons name="play-circle" size={32} color="#FF6B35" />
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LUXUZ TV</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#FF6B35" />
        </TouchableOpacity>
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
            SVE
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

      {/* Streams */}
      <View style={styles.streamsContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? categories.find((c) => c.category_id === selectedCategory)?.category_name
            : 'Svi Kanali'}
        </Text>
        {streamsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <FlatList
            data={streams}
            renderItem={renderStream}
            keyExtractor={(item) => item.stream_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.streamsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#1A1A1A',
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#FF6B35',
    letterSpacing: 2,
  },
  categoriesContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#CCCCCC',
  },
  categoryTextActive: {
    color: '#000000',
  },
  streamsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    marginVertical: 16,
  },
  streamsList: {
    paddingBottom: 16,
  },
  streamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  streamIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streamIconImage: {
    width: 48,
    height: 48,
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