import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, R, shadow } from '../constants/theme';

type Props = { text: string; onDismiss: () => void };

export default function AnnouncementModal({ text, onDismiss }: Props) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>📢</Text>
          <Text style={styles.title}>공지사항</Text>
          <Text style={styles.message}>{text}</Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>확인했어요</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(92,61,30,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  card: {
    backgroundColor: C.surface, borderRadius: R.xl, padding: 28,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: C.border, ...shadow,
  },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: C.textDark, marginBottom: 14 },
  message: { fontSize: 15, color: C.textDark, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  btn: {
    backgroundColor: C.primary, borderRadius: R.lg,
    paddingVertical: 14, paddingHorizontal: 48,
  },
  btnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 15 },
});
