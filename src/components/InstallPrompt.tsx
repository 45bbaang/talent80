import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { C, R, shadow } from '../constants/theme';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosPrompt, setIosPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // 이미 설치된 경우 (standalone 모드) 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS Safari 감지
    const ua = navigator.userAgent;
    const isIOSSafari = /iP(hone|ad|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS/.test(ua);
    if (isIOSSafari) {
      setIsIOS(true);
      setTimeout(() => setIosPrompt(true), 2000);
      return;
    }

    // Android Chrome: beforeinstallprompt 이벤트 감지
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  // Android 설치 배너
  if (visible) {
    return (
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>📱 앱으로 설치하기</Text>
          <Text style={styles.bannerSub}>홈 화면에 추가하면 앱처럼 사용 가능해요</Text>
        </View>
        <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
          <Text style={styles.installBtnText}>설치</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // iOS 안내 팝업
  if (isIOS && iosPrompt) {
    return (
      <View style={styles.iosOverlay}>
        <View style={styles.iosBox}>
          <Text style={styles.iosTitle}>📱 홈 화면에 추가하기</Text>
          <Text style={styles.iosStep}>① 아래 Safari 공유 버튼 탭 (□↑)</Text>
          <Text style={styles.iosStep}>② "홈 화면에 추가" 선택</Text>
          <Text style={styles.iosStep}>③ "추가" 버튼 탭</Text>
          <TouchableOpacity style={styles.iosCloseBtn} onPress={() => setIosPrompt(false)}>
            <Text style={styles.iosCloseBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute' as any,
    bottom: 70,
    left: 12, right: 12,
    backgroundColor: C.primaryDeep,
    borderRadius: R.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow,
    zIndex: 999,
  },
  bannerTitle: { color: C.primary, fontWeight: 'bold', fontSize: 14 },
  bannerSub: { color: C.textLight, fontSize: 11, marginTop: 2 },
  installBtn: {
    backgroundColor: C.primary, borderRadius: R.md,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  installBtnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 14 },
  closeBtn: { padding: 4 },
  closeBtnText: { color: C.textLight, fontSize: 16 },

  iosOverlay: {
    position: 'absolute' as any,
    bottom: 80, left: 16, right: 16,
    zIndex: 999,
  },
  iosBox: {
    backgroundColor: C.bg, borderRadius: R.lg,
    padding: 20, ...shadow,
    borderWidth: 1, borderColor: C.border,
  },
  iosTitle: { fontSize: 16, fontWeight: 'bold', color: C.textDark, marginBottom: 12 },
  iosStep: { fontSize: 14, color: C.textMid, marginBottom: 6 },
  iosCloseBtn: {
    backgroundColor: C.surfaceAlt, borderRadius: R.xl,
    paddingVertical: 10, alignItems: 'center', marginTop: 12,
  },
  iosCloseBtnText: { color: C.textDark, fontWeight: 'bold' },
});
