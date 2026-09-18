import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { C, R, shadow } from '../constants/theme';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosPrompt, setIosPrompt] = useState(false);
  const [kakaoVisible, setKakaoVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // 이미 설치된 경우 (standalone 모드) 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ua = navigator.userAgent;

    // 카카오톡 인앱 브라우저 감지
    if (/KAKAOTALK/i.test(ua)) {
      setKakaoVisible(true);
      return;
    }

    // iOS Safari 감지
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

    // 3초 후에도 이벤트 없으면 수동 안내 배너 표시
    const fallback = setTimeout(() => {
      if (!deferredPrompt) setVisible(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallback);
    };
  }, []);

  const openInChrome = () => {
    const url = window.location.href;
    // Android: intent URL로 Chrome 강제 실행
    window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  // 카카오톡 인앱 브라우저 안내
  if (kakaoVisible) {
    return (
      <View style={styles.kakaoBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kakaoTitle}>Chrome으로 열어주세요</Text>
          <Text style={styles.kakaoSub}>카카오톡에서는 앱 설치 및 카메라 기능이 제한돼요</Text>
        </View>
        <TouchableOpacity style={styles.chromeBtn} onPress={openInChrome}>
          <Text style={styles.chromeBtnText}>Chrome 열기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setKakaoVisible(false)}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Android 설치 배너
  if (visible) {
    return (
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>📱 앱으로 설치하기</Text>
          <Text style={styles.bannerSub}>
            {deferredPrompt
              ? '홈 화면에 추가하면 앱처럼 사용 가능해요'
              : 'Chrome 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"'}
          </Text>
        </View>
        {deferredPrompt && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Text style={styles.installBtnText}>설치</Text>
          </TouchableOpacity>
        )}
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

  kakaoBanner: {
    position: 'absolute' as any,
    bottom: 70,
    left: 12, right: 12,
    backgroundColor: '#FEE500',
    borderRadius: R.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow,
    zIndex: 999,
  },
  kakaoTitle: { color: '#3C1E1E', fontWeight: 'bold', fontSize: 14 },
  kakaoSub: { color: '#7A5C5C', fontSize: 11, marginTop: 2 },
  chromeBtn: {
    backgroundColor: '#3C1E1E', borderRadius: R.md,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  chromeBtnText: { color: '#FEE500', fontWeight: 'bold', fontSize: 13 },
});
