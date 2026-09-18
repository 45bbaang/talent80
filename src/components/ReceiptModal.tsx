import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, R, shadow } from '../constants/theme';

interface Props {
  visible: boolean;
  itemName: string;
  price: number;
  onClose: () => void;
}

export default function ReceiptModal({ visible, itemName, price, onClose }: Props) {
  const [seconds, setSeconds] = useState(180);

  useEffect(() => {
    if (!visible) return;
    setSeconds(180);
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = seconds / 180;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.title}>결제 완료!</Text>

          <View style={styles.receiptBox}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.price}>-{price} 달란트</Text>
          </View>

          <Text style={styles.timerLabel}>물건 수령 확인 시간</Text>
          <Text style={styles.timer}>{mins}:{String(secs).padStart(2, '0')}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` as any }]} />
          </View>

          <Text style={styles.timerNote}>시간 내에 판매자에게 이 화면을 보여주세요</Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  container: {
    backgroundColor: C.bg, borderRadius: R.lg,
    padding: 32, width: '88%', maxWidth: 340,
    alignItems: 'center', ...shadow,
  },
  successIcon: { fontSize: 52, color: C.earn, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: C.textDark, marginBottom: 20 },
  receiptBox: {
    backgroundColor: C.surface, borderRadius: R.md,
    padding: 18, width: '100%', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  itemName: { fontSize: 16, color: C.textDark, fontWeight: '600', marginBottom: 6 },
  price: { fontSize: 26, fontWeight: 'bold', color: C.spend },
  timerLabel: { fontSize: 12, color: C.textMid, marginBottom: 6 },
  timer: { fontSize: 52, fontWeight: 'bold', color: C.primaryDeep, marginBottom: 12 },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: C.border,
    borderRadius: 3, overflow: 'hidden', marginBottom: 10,
  },
  progressBar: {
    height: 6, backgroundColor: C.primary, borderRadius: 3,
  },
  timerNote: { fontSize: 12, color: C.textMid, textAlign: 'center', marginBottom: 24 },
  closeBtn: {
    backgroundColor: C.surfaceAlt, borderRadius: R.xl,
    paddingVertical: 10, paddingHorizontal: 36,
  },
  closeBtnText: { color: C.textDark, fontWeight: 'bold', fontSize: 15 },
});
