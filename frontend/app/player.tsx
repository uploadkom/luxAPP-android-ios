import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const { width, height } = Dimensions.get('window');

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);
  
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string>('');
  
  const streamId = params.stream_id as string;
  const streamName = params.stream_name as string;
  const username = params.username as string;
  const password = params.password as string;

  useEffect(() => {
    loadStreamUrl();
    
    // Hide controls after 5 seconds
    const timer = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadStreamUrl = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/live/stream-url`, {
        username,
        password,
        stream_id: parseInt(streamId),
        extension: 'm3u8',
      });
      
      setStreamUrl(response.data.stream_url);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stream URL:', error);
      setError('Neuspešno učitavanje stream-a');
      setLoading(false);
      Alert.alert('Greška', 'Neuspešno učitavanje stream-a');
    }
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (playing) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setPlaying(!playing);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      setTimeout(() => setShowControls(false), 5000);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
        setError('Greška pri reprodukciji');
      }
    } else {
      setBuffering(status.isBuffering);
      setPlaying(status.isPlaying);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Učitavanje stream-a...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: streamUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
        />

        {buffering && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.bufferingText}>Buferovanje...</Text>
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.backIconButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {streamName}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={playing ? 'pause' : 'play'}
                  size={48}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>UŽIVO</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
    color: '#F44336',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#000000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    width: width,
    height: height,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bufferingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#CCCCCC',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backIconButton: {
    padding: 8,
  },
  streamTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
  },
});