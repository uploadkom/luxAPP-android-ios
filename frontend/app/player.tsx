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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const type = params.type as string || 'live'; // 'live', 'vod', 'series'

  useEffect(() => {
    loadStreamUrl();
    
    // Hide controls after 5 seconds
    const timer = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadStreamUrl = async () => {
    try {
      let endpoint = `${API_URL}/api/live/stream-url`;
      
      // Ako je VOD ili series, koristi drugi endpoint
      if (type === 'vod' || type === 'series') {
        endpoint = `${API_URL}/api/vod/stream-url`;
      }
      
      const response = await axios.post(endpoint, {
        username,
        password,
        stream_id: parseInt(streamId),
        extension: 'm3u8',
      });
      
      if (response.data.stream_url) {
        setStreamUrl(response.data.stream_url);
      } else {
        // Ako API ne radi, koristi test URL za VOD
        if (type === 'vod' || type === 'series') {
          setStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        } else {
          setStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading stream URL:', error);
      
      // Fallback test streamovi
      if (type === 'vod' || type === 'series') {
        setStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      } else {
        setStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      }
      
      setLoading(false);
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
        setError('Greška pri reprodukciji: ' + status.error);
      }
    } else {
      setBuffering(status.isBuffering);
      setPlaying(status.isPlaying);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Učitavanje {type === 'vod' ? 'filma' : type === 'series' ? 'serije' : 'stream-a'}...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>Nazad</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
              <View style={[
                styles.typeBadge,
                type === 'live' ? styles.liveBadge : 
                type === 'vod' ? styles.vodBadge : 
                styles.seriesBadge
              ]}>
                <View style={styles.typeIndicator} />
                <Text style={styles.typeText}>
                  {type === 'live' ? 'UŽIVO' : type === 'vod' ? 'FILM' : 'SERIJA'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    fontWeight: 'normal',
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
    fontWeight: '500',
    color: '#F44336',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'normal',
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
    fontWeight: 'bold',
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  vodBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  seriesBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});