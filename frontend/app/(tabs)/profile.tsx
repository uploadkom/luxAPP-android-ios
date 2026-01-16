import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface ProfileItem {
  id: string;
  title: string;
  icon: string;
  iconType: 'ionicons' | 'material' | 'feather';
  color: string;
  route?: string;
  action?: () => void;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Da li ste sigurni da želite da se odjavite?',
      [
        { text: 'Otkaži', style: 'cancel' },
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

  const profileItems: ProfileItem[] = [
    {
      id: 'account',
      title: 'Moj nalog',
      icon: 'person-circle-outline',
      iconType: 'ionicons',
      color: '#FF6B35',
      route: '/profile/account',
    },
    {
      id: 'subscription',
      title: 'Pretplata',
      icon: 'credit-card-outline',
      iconType: 'ionicons',
      color: '#4CAF50',
      route: '/profile/subscription',
    },
    {
      id: 'devices',
      title: 'Uređaji',
      icon: 'devices',
      iconType: 'material',
      color: '#2196F3',
      route: '/profile/devices',
    },
    {
      id: 'history',
      title: 'Istorija gledanja',
      icon: 'history',
      iconType: 'material',
      color: '#9C27B0',
      route: '/profile/history',
    },
    {
      id: 'favorites',
      title: 'Omiljeni sadržaj',
      icon: 'heart-outline',
      iconType: 'ionicons',
      color: '#E91E63',
      route: '/profile/favorites',
    },
    {
      id: 'downloads',
      title: 'Preuzimanja',
      icon: 'download-outline',
      iconType: 'ionicons',
      color: '#FF9800',
      route: '/profile/downloads',
    },
    {
      id: 'parental',
      title: 'Parental kontrola',
      icon: 'shield-checkmark-outline',
      iconType: 'ionicons',
      color: '#00BCD4',
      route: '/profile/parental',
    },
    {
      id: 'help',
      title: 'Pomoć i podrška',
      icon: 'help-circle-outline',
      iconType: 'ionicons',
      color: '#607D8B',
      route: '/profile/help',
    },
    {
      id: 'about',
      title: 'O aplikaciji',
      icon: 'information-circle-outline',
      iconType: 'ionicons',
      color: '#795548',
      route: '/profile/about',
    },
  ];

  const renderIcon = (item: ProfileItem) => {
    const props = { size: 24, color: item.color };
    switch (item.iconType) {
      case 'material':
        return <MaterialCommunityIcons name={item.icon as any} {...props} />;
      case 'feather':
        return <Feather name={item.icon as any} {...props} />;
      default:
        return <Ionicons name={item.icon as any} {...props} />;
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <LinearGradient
          colors={['#FF6B35', '#FF8C5A']}
          style={styles.userCard}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#FFF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>Korisničko ime</Text>
              <Text style={styles.userStatus}>Premium član</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Podešavanja</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color="#FFF" />
              <Text style={styles.settingText}>Tamni režim</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={darkMode ? '#FFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="play-circle-outline" size={24} color="#FFF" />
              <Text style={styles.settingText}>Auto-play</Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={setAutoPlay}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={autoPlay ? '#FFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <Text style={styles.settingText}>Notifikacije</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={notifications ? '#FFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="wifi-outline" size={24} color="#FFF" />
              <Text style={styles.settingText}>Wi-Fi streaming</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={24} color="#FFF" />
              <Text style={styles.settingText}>Kvalitet preuzimanja</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </View>

        {/* Profile Items */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Moj nalog</Text>
          {profileItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.profileItem}
              onPress={() => item.route ? router.push(item.route) : item.action?.()}
            >
              <View style={styles.profileItemLeft}>
                <View style={[styles.profileIcon, { backgroundColor: `${item.color}20` }]}>
                  {renderIcon(item)}
                </View>
                <Text style={styles.profileItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['#FF4444', '#FF6666']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
            <Text style={styles.logoutText}>Odjavi se</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>LUXUZ TV v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 LUXUZ TV. Sva prava zadržana.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userStatus: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  profileSection: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 20,
    paddingBottom: 40,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  appCopyright: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#444',
    marginTop: 4,
  },
});