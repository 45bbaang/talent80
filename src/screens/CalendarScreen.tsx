import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { MISSIONS, CATEGORY_ORDER } from '../constants/missions';
import { completeMultipleMissions, deleteTransaction } from '../services/walletService';
import { C, R, shadow } from '../constants/theme';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

type TxItem = {
  id: string; type: string; amount: number;
  title: string; createdAt: string; targetDate?: string;
};
type Counts = { [id: string]: number };

export default function CalendarScreen() {
  const { user, userData } = useUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [allTxs, setAllTxs] = useState<TxItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [counts, setCounts] = useState<Counts>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setAllTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as TxItem)));
    }, () => {});
    return () => unsub();
  }, [user]);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const byDate = useMemo(() => {
    const map: { [date: string]: { total: number; items: TxItem[] } } = {};
    for (const tx of allTxs) {
      const dk = tx.targetDate ?? tx.createdAt?.split('T')[0] ?? '';
      if (!dk.startsWith(monthStr)) continue;
      if (!map[dk]) map[dk] = { total: 0, items: [] };
      map[dk].total += Number(tx.amount) || 0;
      map[dk].items.push(tx);
    }
    return map;
  }, [allTxs, monthStr]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMon  = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const selectedTxs  = selectedDate ? (byDate[selectedDate]?.items ?? []) : [];
  const selectedTotal = selectedDate ? (byDate[selectedDate]?.total ?? 0) : 0;

  const totalReward = MISSIONS.reduce((s, m) => s + (counts[m.id] ?? 0) * m.rewardPerCount, 0);
  const totalCount  = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleDeleteTx = async (tx: TxItem) => {
    if (!window.confirm(`"${tx.title}" 삭제할까요?`)) return;
    try { await deleteTransaction(tx.id, user!.uid, tx.amount); }
    catch { window.alert('삭제에 실패했습니다.'); }
  };

  const handleAddMission = async () => {
    if (!user || totalCount === 0) return;
    setSubmitting(true);
    try {
      const parts = MISSIONS.filter(m => (counts[m.id] ?? 0) > 0).map(m => `${m.title} ${counts[m.id]}회`);
      await completeMultipleMissions(
        user.uid, userData?.nickname ?? '이름없음', totalReward, parts.join(', '), selectedDate!
      );
      setCounts({});
      setShowAdd(false);
      window.alert(`${selectedDate}에 +${totalReward} 달란트 추가됐어요! 🎉`);
    } catch { window.alert('추가에 실패했습니다.'); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={styles.container}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{year}년 {MONTH_NAMES[month]}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMon}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week headers */}
      <View style={styles.weekRow}>
        {WEEK.map((d, i) => (
          <Text key={d} style={[styles.weekDay,
            i === 0 && { color: C.spend },
            i === 6 && { color: '#7090D4' }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={styles.cell} />;
          const ds = toDateStr(day);
          const data = byDate[ds];
          const isToday = ds === today;
          const isSun = i % 7 === 0;
          const isSat = i % 7 === 6;
          return (
            <TouchableOpacity key={ds} style={[styles.cell, isToday && styles.todayCell]} onPress={() => setSelectedDate(ds)}>
              <Text style={[styles.dayNum, isToday && styles.todayNum,
                isSun && { color: C.spend }, isSat && { color: '#7090D4' }]}>
                {day}
              </Text>
              {data && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{data.total > 0 ? `+${data.total}` : data.total}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day detail modal */}
      <Modal visible={!!selectedDate && !showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selectedDate}</Text>
              {selectedDate && (
                <Text style={[styles.sheetTotal, { color: selectedTotal >= 0 ? C.earn : C.spend }]}>
                  {selectedTotal >= 0 ? `+${selectedTotal}` : selectedTotal} 달란트
                </Text>
              )}
            </View>
            <ScrollView style={{ maxHeight: 240 }}>
              {selectedTxs.length === 0
                ? <Text style={styles.emptyTx}>이 날 내역이 없어요</Text>
                : selectedTxs.map(tx => (
                  <View key={tx.id} style={styles.txRow}>
                    <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                    <Text style={[styles.txAmt, { color: tx.amount > 0 ? C.earn : C.spend }]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTx(tx)} style={{ padding: 6, marginLeft: 4 }}>
                      <Text>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setCounts({}); setShowAdd(true); }}>
              <Text style={styles.addBtnText}>+ 미션 달란트 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedDate(null)}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add mission modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '85%' }]}>
            <Text style={styles.sheetTitle}>{selectedDate} 미션 추가</Text>
            <ScrollView style={{ flex: 1, marginTop: 12 }}>
              {CATEGORY_ORDER.map(cat => (
                <View key={cat}>
                  <Text style={styles.catLabel}>{cat}</Text>
                  {MISSIONS.filter(m => m.category === cat).map(m => (
                    <View key={m.id} style={styles.missionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.missionName}>{m.title}</Text>
                        <Text style={styles.missionDesc}>{m.description}</Text>
                      </View>
                      <View style={styles.stepper}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setCounts(p => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? 0) - 1) }))}>
                          <Text style={styles.stepTxt}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepCount}>{counts[m.id] ?? 0}</Text>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setCounts(p => ({ ...p, [m.id]: (p[m.id] ?? 0) + 1 }))}>
                          <Text style={styles.stepTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            {totalCount > 0 && (
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddMission} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={C.primary} />
                  : <Text style={styles.submitTxt}>+{totalReward} 달란트 추가하기</Text>}
              </TouchableOpacity>
            )}
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
  container: { flex: 1, backgroundColor: C.bg },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: C.textMid, fontWeight: 'bold' },
  monthTitle: { fontSize: 17, fontWeight: 'bold', color: C.textDark },
  weekRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.textLight },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { width: '14.285714%', height: 58, alignItems: 'center', paddingTop: 6 },
  todayCell: { backgroundColor: C.surfaceAlt, borderRadius: R.md },
  dayNum: { fontSize: 14, color: C.textDark, fontWeight: '500' },
  todayNum: { color: C.primaryDeep, fontWeight: 'bold' },
  badge: { backgroundColor: C.primary, borderRadius: R.sm, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2 },
  badgeText: { color: C.primaryDeep, fontSize: 9, fontWeight: 'bold' },

  overlay: { flex: 1, backgroundColor: 'rgba(92,61,30,0.3)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
    padding: 20, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: C.textDark },
  sheetTotal: { fontSize: 15, fontWeight: 'bold' },
  emptyTx: { textAlign: 'center', color: C.textLight, marginVertical: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  txTitle: { flex: 1, fontSize: 13, color: C.textDark },
  txAmt: { fontSize: 14, fontWeight: 'bold' },
  addBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 14, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 14 },
  closeBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  closeBtnText: { color: C.textLight, fontSize: 14 },

  catLabel: {
    fontSize: 11, fontWeight: 'bold', color: C.textMid,
    backgroundColor: C.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: R.sm, alignSelf: 'flex-start', marginTop: 12, marginBottom: 4,
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  missionName: { fontSize: 14, fontWeight: '600', color: C.textDark },
  missionDesc: { fontSize: 11, color: C.textLight, marginTop: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 16, color: C.textMid, fontWeight: 'bold' },
  stepCount: { fontSize: 15, fontWeight: 'bold', color: C.textDark, minWidth: 20, textAlign: 'center' },
  submitBtn: { backgroundColor: C.primaryDeep, borderRadius: R.lg, padding: 14, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: C.primary, fontWeight: 'bold', fontSize: 14 },
});
