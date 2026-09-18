import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { useFonts } from 'expo-font';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase/config';
import { UserProvider, useUser } from './src/context/UserContext';
import AuthScreen from './src/screens/AuthScreen';
import NicknameScreen from './src/screens/NicknameScreen';
import WalletScreen from './src/screens/WalletScreen';
import MissionScreen from './src/screens/MissionScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AdminScreen from './src/screens/AdminScreen';
import AnnouncementModal from './src/components/AnnouncementModal';
import { C } from './src/constants/theme';

const Tab = createBottomTabNavigator();

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.frame, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 430, flex: 1, backgroundColor: C.bg, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

const TAB_ICONS: Record<string, any> = {
  Wallet:   require('./assets/TabBar/wallet.png'),
  Mission:  require('./assets/TabBar/mission.png'),
  Calendar: require('./assets/TabBar/calendar.png'),
};

const TAB_LABELS: Record<string, string> = {
  Wallet: 'Wallet',
  Mission: 'Mission',
  Calendar: 'Calendar',
};

function TabHeader({ name }: { name: string }) {
  const icon = TAB_ICONS[name];
  const label = TAB_LABELS[name] ?? name;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon && (
        <Image
          source={icon}
          style={{ width: 22, height: 22 }}
          resizeMode="contain"
        />
      )}
      <Text style={{ fontFamily: 'PyeongChangPeace-Bold', fontSize: 18, color: C.textDark }}>
        {label}
      </Text>
    </View>
  );
}

type AnnouncementData = { text: string; active: boolean; updatedAt: string };

function AppContent() {
  const { user, userData, authLoading } = useUser();
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const [fontsLoaded] = useFonts({
    'PyeongChangPeace-Bold': require('./assets/fonts/PyeongChangPeace-Bold.ttf'),
  });

  // 공지사항 실시간 감지
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'config', 'announcement'), (snap) => {
      if (!snap.exists()) { setAnnouncement(null); return; }
      const data = snap.data() as AnnouncementData;
      setAnnouncement(data);
      // 이번 세션에 이미 본 공지인지 확인
      try {
        const seen = sessionStorage.getItem('announcementSeen');
        setAnnouncementDismissed(seen === data.updatedAt);
      } catch {
        setAnnouncementDismissed(false);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try {
      if (announcement) sessionStorage.setItem('announcementSeen', announcement.updatedAt);
    } catch {}
  };

  if (authLoading || !fontsLoaded) {
    return (
      <MobileFrame>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </MobileFrame>
    );
  }

  if (!user) {
    return <SafeAreaProvider><MobileFrame><AuthScreen /></MobileFrame></SafeAreaProvider>;
  }

  if (!userData?.nickname) {
    return <SafeAreaProvider><MobileFrame><NicknameScreen /></MobileFrame></SafeAreaProvider>;
  }

  const isAdmin = userData.role === 'admin';
  const showAnnouncement = !!announcement?.active && !announcementDismissed;

  return (
    <SafeAreaProvider>
      <MobileFrame>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => {
              const iconSrc = TAB_ICONS[route.name];
              return {
                headerStyle: { backgroundColor: C.bg, shadowColor: 'transparent', elevation: 0 },
                headerTintColor: C.textDark,
                headerRight: () => (
                  <Text style={{ marginRight: 16, fontSize: 13, color: C.textMid, fontWeight: '600' }}>
                    {userData.nickname}님
                  </Text>
                ),
                tabBarActiveTintColor: C.primaryDeep,
                tabBarInactiveTintColor: C.textLight,
                tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1, height: 60 },
                tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
                tabBarItemStyle: { paddingTop: 4 },
                tabBarIcon: ({ focused }) =>
                  iconSrc ? (
                    <Image
                      source={iconSrc}
                      style={{ width: 26, height: 26, opacity: focused ? 1 : 0.45 }}
                      resizeMode="contain"
                    />
                  ) : null,
              };
            }}
          >
            <Tab.Screen name="Wallet"   component={WalletScreen}   options={{ title: 'Wallet',   headerTitle: () => <TabHeader name="Wallet" /> }} />
            <Tab.Screen name="Mission"  component={MissionScreen}  options={{ title: 'Mission',  headerTitle: () => <TabHeader name="Mission" /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar', headerTitle: () => <TabHeader name="Calendar" /> }} />
            {isAdmin && (
              <Tab.Screen
                name="Admin"
                component={AdminScreen}
                options={{
                  title: 'Admin',
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' as any },
                }}
              />
            )}
          </Tab.Navigator>
        </NavigationContainer>

        {/* 전체 공지 팝업 */}
        {showAnnouncement && (
          <AnnouncementModal
            text={announcement!.text}
            onDismiss={handleDismissAnnouncement}
          />
        )}
      </MobileFrame>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <UserProvider><AppContent /></UserProvider>;
}
