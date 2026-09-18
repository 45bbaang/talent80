import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import {
  collection, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { deleteTransaction, adminAdjustBalance } from '../services/walletService';
import { replyToInquiry, saveAnnouncement } from '../services/inquiryService';
import { C, R, shadow } from '../constants/theme';

type UserDoc = {
  id: string; nickname?: string; name: string; email: string;
  balance: number; totalEarned: number; role?: string;
};
type TxItem = {
  id: string; title: string; amount: number;
  type: string; createdAt: string; targetDate?: string;
};
type Inquiry = {
  id: string; userId: string; userNickname: string;
  message: string; createdAt: string;
  reply?: string | null; repliedAt?: string | null;
};

type Tab = '회원' | '문의' | '공지';

export default function AdminScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('회원');

  // ─── 회원 탭 ───
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [selected, setSelected] = useState<UserDoc | null>(null);
  const [userTxs, setUserTxs] = useState<TxItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addAmt, setAddAmt] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [adding, setAdding] = useState(false);

  // ─── 문의 탭 ───
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // ─── 공지 탭 ───
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnn, setSavingAnn] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc));
      list.sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
      setUsers(list);
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selected) { setUserTxs([]); return; }
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', selected.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setUserTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as TxItem)));
    }, () => {});
    return () => unsub();
  }, [selected]);

  // 문의 탭 진입 시 불러오기
  useEffect(() => {
    if (activeTab !== '문의') return;
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)));
    }, () => {});
    return () => unsub();
  }, [activeTab]);

  const totalUsers   = users.length;
  const totalEarned  = users.reduce((s, u) => s + (u.totalEarned ?? 0), 0);
  const totalBalance = users.reduce((s, u) => s + (u.balance ?? 0), 0);

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return ''; }
  };

  const handleDeleteTx = async (tx: TxItem) => {
    if (!window.confirm(`"${tx.title}" 삭제할까요?`)) return;
    try { await deleteTransaction(tx.id, selected!.id, tx.amount); }
    catch { window.alert('삭제에 실패했습니다.'); }
  };

  const handleAdd = async () => {
    const amt = parseInt(addAmt);
    if (isNaN(amt) || amt === 0) { window.alert('달란트 수를 입력해주세요. (차감은 마이너스: -10)'); return; }
    if (!addTitle.trim()) { window.alert('내용을 입력해주세요.'); return; }
    setAdding(true);
    try {
      await adminAdjustBalance(selected!.id, selected!.nickname ?? selected!.name, amt, addTitle.trim());
      setAddAmt(''); setAddTitle(''); setShowAdd(false);
      window.alert(`${amt > 0 ? '+' : ''}${amt} 달란트 조정됐어요!`);
    } catch { window.alert('처리에 실패했습니다.'); }
    finally { setAdding(false); }
  };

  const handleReply = async (inquiry: Inquiry) => {
    if (!replyText.trim()) { window.alert('답변을 입력해주세요.'); return; }
    setReplying(true);
    try {
      await replyToInquiry(inquiry.id, replyText.trim());
      setReplyText('');
      setExpandedInquiry(null);
      window.alert('답변이 등록됐어요!');
    } catch { window.alert('답변 등록에 실패했습니다.'); }
    finally { setReplying(false); }
  };

  const handleSaveAnnouncement = async (active: boolean) => {
    if (active && !announcementText.trim()) { window.alert('공지 내용을 입력해주세요.'); return; }
    setSavingAnn(true);
    try {
      await saveAnnouncement(announcementText.trim(), active);
      window.alert(active ? '공지가 켜졌어요! 모든 사용자에게 팝업이 표시됩니다.' : '공지가 꺼졌어요.');
    } catch { window.alert('저장에 실패했습니다.'); }
    finally { setSavingAnn(false); }
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Wallet' as never)}>
        <Text style={styles.backBtnText}>← 돌아가기</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalUsers}</Text>
          <Text style={styles.statLabel}>전체 회원</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalEarned}</Text>
          <Text style={styles.statLabel}>총 지급</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalBalance}</Text>
          <Text style={styles.statLabel}>총 잔액</Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(['회원', '문의', '공지'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === '문의' && inquiries.filter(i => !i.reply).length > 0
                ? `문의 (${inquiries.filter(i => !i.reply).length})`
                : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══ 회원 탭 ═══ */}
      {activeTab === '회원' && (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.userCard} onPress={() => setSelected(item)}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userName}>{item.nickname ?? item.name}</Text>
                  {item.role === 'admin' && (
                    <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>관리자</Text></View>
                  )}
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <Text style={styles.userBalance}>{item.balance ?? 0}달란트</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>회원이 없어요</Text>}
        />
      )}

      {/* ═══ 문의 탭 ═══ */}
      {activeTab === '문의' && (
        <ScrollView>
          {inquiries.length === 0
            ? <Text style={styles.empty}>문의가 없어요</Text>
            : inquiries.map(inq => (
              <View key={inq.id} style={[styles.inqCard, !inq.reply && styles.inqCardPending]}>
                <TouchableOpacity onPress={() => {
                  setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id);
                  setReplyText(inq.reply ?? '');
                }}>
                  <View style={styles.inqHeader}>
                    <Text style={styles.inqUser}>{inq.userNickname}</Text>
                    <View style={[styles.inqBadge, inq.reply ? styles.inqBadgeDone : styles.inqBadgeWait]}>
                      <Text style={styles.inqBadgeText}>{inq.reply ? '답변완료' : '대기중'}</Text>
                    </View>
                    <Text style={styles.inqDate}>{fmt(inq.createdAt)}</Text>
                  </View>
                  <Text style={styles.inqMsg} numberOfLines={expandedInquiry === inq.id ? undefined : 2}>
                    {inq.message}
                  </Text>
                  {inq.reply && expandedInquiry !== inq.id && (
                    <Text style={styles.inqReplyPreview} numberOfLines={1}>답변: {inq.reply}</Text>
                  )}
                </TouchableOpacity>

                {expandedInquiry === inq.id && (
                  <View style={styles.replyBox}>
                    {inq.reply && (
                      <View style={styles.existingReply}>
                        <Text style={styles.existingReplyLabel}>기존 답변</Text>
                        <Text style={styles.existingReplyText}>{inq.reply}</Text>
                      </View>
                    )}
                    <TextInput
                      style={styles.replyInput}
                      placeholder={inq.reply ? '답변 수정하기...' : '답변 입력하기...'}
                      placeholderTextColor={C.textLight}
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity style={styles.replyBtn} onPress={() => handleReply(inq)} disabled={replying}>
                      {replying
                        ? <ActivityIndicator color={C.primaryDeep} size="small" />
                        : <Text style={styles.replyBtnText}>{inq.reply ? '답변 수정' : '답변 등록'}</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          }
        </ScrollView>
      )}

      {/* ═══ 공지 탭 ═══ */}
      {activeTab === '공지' && (
        <ScrollView>
          <View style={styles.annCard}>
            <Text style={styles.annTitle}>📢 전체 공지 관리</Text>
            <Text style={styles.annDesc}>
              공지를 켜면 모든 사용자가 앱을 열 때 팝업이 표시됩니다.{'\n'}
              세션당 한 번만 표시되고, "확인했어요"를 누르면 닫힙니다.
            </Text>
            <TextInput
              style={styles.annInput}
              placeholder="공지 내용을 입력하세요..."
              placeholderTextColor={C.textLight}
              value={announcementText}
              onChangeText={setAnnouncementText}
              multiline
              numberOfLines={5}
            />
            <View style={styles.annBtnRow}>
              <TouchableOpacity
                style={[styles.annBtn, styles.annBtnOn]}
                onPress={() => handleSaveAnnouncement(true)}
                disabled={savingAnn}
              >
                {savingAnn
                  ? <ActivityIndicator color={C.primaryDeep} size="small" />
                  : <Text style={styles.annBtnOnText}>공지 켜기 📢</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.annBtn, styles.annBtnOff]}
                onPress={() => handleSaveAnnouncement(false)}
                disabled={savingAnn}
              >
                <Text style={styles.annBtnOffText}>공지 끄기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* User detail modal */}
      <Modal visible={!!selected && !showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetName}>{selected?.nickname ?? selected?.name}님</Text>
                <Text style={styles.sheetEmail}>{selected?.email}</Text>
              </View>
              <Text style={styles.sheetBalance}>{selected?.balance ?? 0} 달란트</Text>
            </View>
            <TouchableOpacity style={styles.addTxBtn} onPress={() => { setAddAmt(''); setAddTitle(''); setShowAdd(true); }}>
              <Text style={styles.addTxBtnText}>+ 달란트 추가 / 차감</Text>
            </TouchableOpacity>
            <Text style={styles.txListTitle}>거래 내역</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {userTxs.length === 0
                ? <Text style={styles.empty}>거래 내역이 없어요</Text>
                : userTxs.map(tx => (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                      <Text style={styles.txDate}>{fmt(tx.createdAt)}</Text>
                    </View>
                    <Text style={[styles.txAmt, { color: tx.amount > 0 ? C.earn : C.spend }]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTx(tx)} style={{ padding: 8, marginLeft: 4 }}>
                      <Text>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add/deduct modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.addSheet}>
            <Text style={styles.sheetName}>{selected?.nickname ?? selected?.name}님 달란트 조정</Text>
            <TextInput
              style={styles.input}
              placeholder="달란트 수 (차감: -5, 추가: 10)"
              value={addAmt}
              onChangeText={setAddAmt}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="내용 (예: 캠프 특별 미션)"
              value={addTitle}
              onChangeText={setAddTitle}
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} disabled={adding}>
              {adding ? <ActivityIndicator color={C.primary} /> : <Text style={styles.confirmBtnText}>확인</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.closeBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backBtnText: { fontSize: 14, color: C.textMid, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, ...shadow,
  },
  statNum: { fontSize: 20, fontWeight: 'bold', color: C.primaryDeep },
  statLabel: { fontSize: 11, color: C.textLight, marginTop: 2, textAlign: 'center' },

  // 탭
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: R.lg,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: C.primaryDeep, borderColor: C.primaryDeep },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: C.textMid },
  tabBtnTextActive: { color: C.primary },

  // 회원 목록
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.lg, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  rank: { fontSize: 12, color: C.textLight, fontWeight: 'bold', marginRight: 10, minWidth: 24 },
  userName: { fontSize: 14, fontWeight: '600', color: C.textDark },
  adminBadge: { backgroundColor: C.surfaceAlt, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText: { fontSize: 10, color: C.textMid, fontWeight: 'bold' },
  userEmail: { fontSize: 11, color: C.textLight, marginTop: 2 },
  userBalance: { fontSize: 13, fontWeight: 'bold', color: C.primaryDeep, marginRight: 4 },
  chevron: { fontSize: 20, color: C.border },

  // 문의
  inqCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  inqCardPending: { borderColor: C.primary, borderWidth: 1.5 },
  inqHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  inqUser: { fontSize: 13, fontWeight: 'bold', color: C.textDark, flex: 1 },
  inqBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  inqBadgeDone: { backgroundColor: '#EEF8F2' },
  inqBadgeWait: { backgroundColor: '#FFF3D8' },
  inqBadgeText: { fontSize: 10, fontWeight: 'bold', color: C.textMid },
  inqDate: { fontSize: 10, color: C.textLight },
  inqMsg: { fontSize: 14, color: C.textDark, lineHeight: 20 },
  inqReplyPreview: { fontSize: 11, color: C.earn, marginTop: 4, fontStyle: 'italic' },
  replyBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  existingReply: { backgroundColor: '#EEF8F2', borderRadius: R.md, padding: 10, marginBottom: 8 },
  existingReplyLabel: { fontSize: 10, fontWeight: 'bold', color: C.earn, marginBottom: 3 },
  existingReplyText: { fontSize: 13, color: C.textDark },
  replyInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.md,
    padding: 12, fontSize: 14, color: C.textDark, backgroundColor: C.bg,
    minHeight: 72, textAlignVertical: 'top',
  },
  replyBtn: {
    backgroundColor: C.primaryDeep, borderRadius: R.lg,
    padding: 12, alignItems: 'center', marginTop: 8,
  },
  replyBtnText: { color: C.primary, fontWeight: 'bold', fontSize: 13 },

  // 공지
  annCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 20,
    borderWidth: 1, borderColor: C.border, ...shadow,
  },
  annTitle: { fontSize: 16, fontWeight: 'bold', color: C.textDark, marginBottom: 8 },
  annDesc: { fontSize: 12, color: C.textMid, lineHeight: 18, marginBottom: 14 },
  annInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.md,
    padding: 14, fontSize: 14, color: C.textDark, backgroundColor: C.bg,
    minHeight: 110, textAlignVertical: 'top', marginBottom: 14,
  },
  annBtnRow: { flexDirection: 'row', gap: 10 },
  annBtn: { flex: 1, borderRadius: R.lg, padding: 14, alignItems: 'center' },
  annBtnOn: { backgroundColor: C.primaryDeep },
  annBtnOff: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  annBtnOnText: { color: C.primary, fontWeight: 'bold', fontSize: 14 },
  annBtnOffText: { color: C.textMid, fontWeight: 'bold', fontSize: 14 },

  empty: { textAlign: 'center', color: C.textLight, marginTop: 24, fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(92,61,30,0.3)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
    padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: C.border,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sheetName: { fontSize: 18, fontWeight: 'bold', color: C.textDark },
  sheetEmail: { fontSize: 12, color: C.textLight, marginTop: 2 },
  sheetBalance: { fontSize: 20, fontWeight: 'bold', color: C.primaryDeep },
  addTxBtn: { backgroundColor: C.primaryDeep, borderRadius: R.lg, padding: 12, alignItems: 'center', marginBottom: 12 },
  addTxBtnText: { color: C.primary, fontWeight: 'bold', fontSize: 14 },
  txListTitle: { fontSize: 12, fontWeight: 'bold', color: C.textMid, marginBottom: 6 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  txTitle: { fontSize: 13, color: C.textDark },
  txDate: { fontSize: 11, color: C.textLight, marginTop: 1 },
  txAmt: { fontSize: 14, fontWeight: 'bold' },
  closeBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  closeBtnText: { color: C.textLight, fontSize: 14 },

  addSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border,
  },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.lg,
    padding: 14, fontSize: 14, marginTop: 12, color: C.textDark, backgroundColor: C.bg,
  },
  confirmBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 14, alignItems: 'center', marginTop: 16 },
  confirmBtnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 15 },
});
