import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, R, shadow } from '../constants/theme';

interface Props {
  visible: boolean;
  onScan: (data: { name: string; price: number }) => void;
  onClose: () => void;
}

export default function QRScannerModal({ visible, onScan, onClose }: Props) {
  const [error, setError] = useState('');
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;
    setError('');
    let stopped = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped) return;
      const scanner = new Html5Qrcode('qr-reader-div');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          try {
            const data = JSON.parse(decodedText);
            if (typeof data.name === 'string' && typeof data.price === 'number') {
              scanner.stop().then(() => {
                scannerRef.current = null;
                onScan(data);
              }).catch(() => {});
            } else {
              setError('올바른 QR 코드가 아닙니다.');
            }
          } catch {
            setError('QR 코드를 읽을 수 없습니다.');
          }
        },
        () => {}
      ).catch(() => {
        setError('카메라 접근 권한이 필요합니다.\n브라우저 주소창 옆 카메라 아이콘을 허용해주세요.');
      });
    });

    return () => {
      stopped = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [visible]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>QR 코드 스캔</Text>
          <Text style={styles.subtitle}>판매 부스의 QR 코드를 비춰주세요</Text>
          <View nativeID="qr-reader-div" style={styles.qrArea} />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  container: {
    backgroundColor: C.bg, borderRadius: R.lg,
    padding: 24, width: '92%', maxWidth: 360,
    alignItems: 'center', ...shadow,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: C.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textMid, marginBottom: 16, textAlign: 'center' },
  qrArea: { width: 300, height: 300, marginBottom: 12 },
  error: { color: C.spend, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  closeBtn: {
    backgroundColor: C.surfaceAlt, borderRadius: R.xl,
    paddingVertical: 10, paddingHorizontal: 36, marginTop: 8,
  },
  closeBtnText: { color: C.textDark, fontWeight: 'bold', fontSize: 15 },
});
