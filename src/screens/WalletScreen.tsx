import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { deleteTransaction } from '../services/walletService';
import { useUser } from '../context/UserContext';
import { C, R, shadow } from '../constants/theme';
import InquiryModal from '../components/InquiryModal';
import QRScannerModal from '../components/QRScannerModal';
import PaymentConfirmModal from '../components/PaymentConfirmModal';
import ReceiptModal from '../components/ReceiptModal';
import { payWithQR } from '../services/walletService';

type Transaction = {
  id: string;
  type: 'EARN_MISSION' | 'SPEND_QR';
  amount: number;
  title: string;
  createdAt: string;
};

export default function WalletScreen() {
  const { user, userData, logout, removeAccount, updateNickname } = useUser();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 문의 모달
  const [showInquiry, setShowInquiry] = useState(false);

  // QR 결제 플로우
  const [showQR, setShowQR] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [qrItem, setQrItem] = useState<{ name: string; price: number } | null>(null);

  const handleQRScan = (data: { name: string; price: number }) => {
    setQrItem(data);
    setShowQR(false);
    setShowConfirm(true);
  };

  const handleConfirmPay = async () => {
    if (!qrItem || !user) return;
    setShowConfirm(false);
    try {
      const userName = userData?.nickname ?? userData?.name ?? '이름없음';
      await payWithQR(user.uid, userName, qrItem);
      setShowReceipt(true);
    } catch (e: any) {
      window.alert(e.message ?? '결제에 실패했습니다.');
    }
  };

  // 닉네임 수정 상태
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(txQuery, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    }, () => {});
    return () => unsub();
  }, [user]);

  const balance = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return ''; }
  };

  const handleEditStart = () => {
    setNewNickname(userData?.nickname ?? '');
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    const trimmed = newNickname.trim();
    if (!trimmed) { window.alert('닉네임을 입력해주세요.'); return; }
    if (trimmed.length > 10) { window.alert('닉네임은 10자 이하로 입력해주세요.'); return; }
    setSaving(true);
    try {
      await updateNickname(trimmed);
      setIsEditing(false);
    } catch {
      window.alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Transaction) => {
    const label = item.amount > 0 ? `${item.amount}개 차감` : `${Math.abs(item.amount)}개 환불`;
    if (!window.confirm(`"${item.title}" 내역을 삭제할까요?\n달란트가 ${label}됩니다.`)) return;
    try {
      await deleteTransaction(item.id, user!.uid, item.amount);
    } catch {
      window.alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCacheRefresh = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;
    await logout();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말 회원탈퇴 하시겠습니까?\n탈퇴하면 달란트 정보가 모두 삭제됩니다.')) return;
    if (!window.confirm('한 번 더 확인합니다. 정말 탈퇴하시겠습니까?')) return;
    try {
      await removeAccount();
    } catch (e: any) {
      window.alert(e.message ?? '탈퇴 처리 중 오류가 발생했습니다. 다시 로그인 후 시도해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileImgWrap}>
            <Image source={require('../../assets/Walleticon/profile.png')} style={styles.profileImg} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            {isEditing ? (
              /* 닉네임 수정 모드 */
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nicknameInput}
                  value={newNickname}
                  onChangeText={setNewNickname}
                  maxLength={10}
                  autoFocus
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleEditSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color={C.primaryDeep} />
                    : <Text style={styles.saveBtnText}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 닉네임 표시 모드 */
              <View style={styles.nicknameRow}>
                <Text style={styles.profileName}>{userData?.nickname}님</Text>
                {/* 닉네임 수정 버튼 */}
                <TouchableOpacity style={styles.editIconBtn} onPress={handleEditStart}>
                  <Image source={require('../../assets/Walleticon/edit.png')} style={styles.editIconImg} resizeMode="contain" />
                </TouchableOpacity>
                {/* 관리자 칩 — 관리자만 보임 */}
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.adminChip}
                    onPress={() => navigation.navigate('Admin' as never)}
                  >
                    <Text style={styles.adminChipText}>🛡 관리자</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.profileEmail}>{userData?.email ?? ''}</Text>
          </View>
        </View>

        <View style={styles.profileBtns}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setShowInquiry(true)}
          >
            <Text style={styles.profileBtnText}>문의</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={handleCacheRefresh}>
            <Text style={styles.profileBtnText}>업데이트</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
            <Text style={styles.profileBtnText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.profileBtn, styles.redBtn]} onPress={handleDeleteAccount}>
            <Text style={[styles.profileBtnText, { color: C.spend }]}>✖ 탈퇴</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 잔액 카드 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>보유 달란트</Text>
        <Text style={styles.balanceAmount}>{balance} 달란트</Text>
      </View>

      <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={require('../../assets/Walleticon/qr-scan.png')} style={styles.qrBtnIcon} resizeMode="contain" />
          <Text style={styles.qrBtnText}>QR 스캔 결제</Text>
        </View>
      </TouchableOpacity>

      <InquiryModal visible={showInquiry} onClose={() => setShowInquiry(false)} />
      <QRScannerModal visible={showQR} onScan={handleQRScan} onClose={() => setShowQR(false)} />
      <PaymentConfirmModal
        visible={showConfirm}
        itemName={qrItem?.name ?? ''}
        price={qrItem?.price ?? 0}
        balance={balance}
        onConfirm={handleConfirmPay}
        onCancel={() => setShowConfirm(false)}
      />
      <ReceiptModal
        visible={showReceipt}
        itemName={qrItem?.name ?? ''}
        price={qrItem?.price ?? 0}
        onClose={() => { setShowReceipt(false); setQrItem(null); }}
      />

      <Text style={styles.historyTitle}>미션 기록</Text>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.txItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{item.title}</Text>
              <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.amount > 0 ? C.earn : C.spend }]}>
              {item.amount > 0 ? '+' : ''}{item.amount} 달란트
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
              <Text style={styles.delBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>아직 거래 내역이 없어요</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },

  profileCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border, ...shadow,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileImgWrap: {
    width: 52, height: 52, borderRadius: 26, marginRight: 12,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  profileImg: { width: 40, height: 40 },

  /* 닉네임 표시 */
  nicknameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  profileName: { fontSize: 17, fontWeight: 'bold', color: C.textDark },
  editIconBtn: { padding: 2 },
  editIconImg: { width: 16, height: 16 },
  adminChip: {
    backgroundColor: C.surfaceAlt, borderRadius: R.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.border,
  },
  adminChipText: { fontSize: 11, color: C.textMid, fontWeight: '700' },

  /* 닉네임 수정 모드 */
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nicknameInput: {
    flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: R.md,
    paddingHorizontal: 10, paddingVertical: 5, fontSize: 15, color: C.textDark,
    backgroundColor: C.bg,
  },
  saveBtn: {
    backgroundColor: C.primary, borderRadius: R.md,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  saveBtnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 15 },
  cancelBtn: {
    backgroundColor: C.surfaceAlt, borderRadius: R.md,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  cancelBtnText: { color: C.textLight, fontWeight: 'bold', fontSize: 14 },

  profileEmail: { fontSize: 11, color: C.textLight, marginTop: 3 },
  profileBtns: { flexDirection: 'row', gap: 8 },
  profileBtn: {
    flex: 1, backgroundColor: C.surfaceAlt, borderRadius: R.md,
    paddingVertical: 8, alignItems: 'center',
  },
  profileBtnText: { fontSize: 12, color: C.textDark, fontWeight: '600' },
  redBtn: { backgroundColor: '#FFF0EC' },

  balanceCard: {
    backgroundColor: C.primary, borderRadius: R.xl, padding: 26,
    alignItems: 'center', marginBottom: 12, ...shadow,
  },
  balanceLabel: { color: C.primaryDeep, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  balanceAmount: { color: C.primaryDeep, fontSize: 36, fontWeight: 'bold' },

  qrBtn: {
    backgroundColor: C.primaryDeep, borderRadius: R.xl, padding: 14,
    alignItems: 'center', marginBottom: 20, ...shadow,
  },
  qrBtnIcon: { width: 22, height: 22 },
  qrBtnText: { color: C.primary, fontSize: 15, fontWeight: 'bold' },

  historyTitle: { fontSize: 14, fontWeight: 'bold', color: C.textMid, marginBottom: 8 },
  txItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.md, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  txTitle: { fontSize: 14, color: C.textDark, fontWeight: '500' },
  txDate: { fontSize: 11, color: C.textLight, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
  delBtn: { padding: 8, marginLeft: 8 },
  delBtnText: { fontSize: 16 },
  empty: { textAlign: 'center', color: C.textLight, marginTop: 40 },
});
