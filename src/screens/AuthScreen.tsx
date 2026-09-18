import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useFonts } from 'expo-font';
import { AntDesign } from '@expo/vector-icons';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { C, R, shadow } from '../constants/theme';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fontsLoaded] = useFonts({
    'PyeongChangPeace-Bold': require('../../assets/fonts/PyeongChangPeace-Bold.ttf'),
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName ?? '이름없음',
          email: user.email ?? '',
          role: 'user',
          balance: 0,
          totalEarned: 0,
        });
      }
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
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
