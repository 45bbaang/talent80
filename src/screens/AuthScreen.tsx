import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useFonts } from 'expo-font';
import { AntDesign } from '@expo/vector-icons';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { C, R, shadow } from '../constants/theme';

const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
const isMobileBrowser = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !isStandalone;
const isMobile = isMobileBrowser;

async function saveUserIfNew(uid: string, displayName: string | null, email: string | null) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: displayName ?? '이름없음',
      email: email ?? '',
      role: 'user',
      balance: 0,
      totalEarned: 0,
    });
  }
}

export default function AuthScreen() {
  const [loading, setLoading] = useState(isMobile);
  const [error, setError] = useState('');

  const [fontsLoaded] = useFonts({
    'PyeongChangPeace-Bold': require('../../assets/fonts/PyeongChangPeace-Bold.ttf'),
  });

  // 모바일: 리다이렉트 후 돌아왔을 때 결과 처리
  useEffect(() => {
    if (!isMobile) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) await saveUserIfNew(result.user.uid, result.user.displayName, result.user.email);
      })
      .catch(() => setError('로그인에 실패했습니다. 다시 시도해주세요.'))
      .finally(() => setLoading(false));
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        await saveUserIfNew(result.user.uid, result.user.displayName, result.user.email);
      }
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/Walleticon/profile.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, fontsLoaded && { fontFamily: 'PyeongChangPeace-Bold' }]}>
        Mission Wallet
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleGoogleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={C.primaryDeep} />
        ) : (
          <View style={styles.btnInner}>
            <AntDesign name="google" size={18} color={C.primaryDeep} />
            <Text style={styles.btnText}>구글 계정으로 시작하기</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: {
    fontSize: 30, fontWeight: 'bold', color: C.textDark, marginBottom: 48,
  },
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: R.xl, alignSelf: 'center', alignItems: 'center',
    ...shadow,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: C.primaryDeep, fontSize: 16, fontWeight: 'bold' },
  error: { color: C.spend, marginBottom: 16, textAlign: 'center' },
});
