import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, R, shadow } from '../constants/theme';

interface Props {
  visible: boolean;
  itemName: string;
  price: number;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentConfirmModal({ visible, itemName, price, balance, onConfirm, onCancel }: Props) {
  const canAfford = balance >= price;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>결제 확인</Text>
          <View style={styles.itemBox}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.price}>{price} 달란트</Text>
          </View>
          <Text style={styles.balance}>
            현재 잔액: <Text style={styles.balanceBold}>{balance} 달란트</Text>
          </Text>
          {!canAfford && <Text style={styles.error}>잔액이 부족합니다.</Text>}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !canAfford && styles.disabledBtn]}
              onPress={canAfford ? onConfirm : undefined}
              disabled={!canAfford}
            >
              {/* @ts-ignore */}
              <Text translate="no" style={styles.confirmBtnText}>결제하기</Text>
            </TouchableOpacity>
          </View>
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
    padding: 28, width: '85%', maxWidth: 320,
    alignItems: 'center', ...shadow,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: C.textDark, marginBottom: 16 },
  itemBox: {
    backgroundColor: C.surface, borderRadius: R.md,
    padding: 20, width: '100%', alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: C.textDark, marginBottom: 8 },
  price: { fontSize: 32, fontWeight: 'bold', color: C.primaryDeep },
  balance: { fontSize: 13, color: C.textMid, marginBottom: 6 },
  balanceBold: { fontWeight: 'bold', color: C.textDark },
  error: { color: C.spend, fontSize: 13, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  cancelBtn: {
    flex: 1, backgroundColor: C.surfaceAlt, borderRadius: R.xl,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: C.textMid, fontWeight: 'bold', fontSize: 15 },
  confirmBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: R.xl,
    paddingVertical: 13, alignItems: 'center',
  },
  confirmBtnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 15 },
  disabledBtn: { backgroundColor: C.border },
});
