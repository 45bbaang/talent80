import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MISSIONS, CATEGORY_ORDER, Mission } from '../constants/missions';
import { completeMultipleMissions } from '../services/walletService';
import { useUser } from '../context/UserContext';
import { C, R, shadow } from '../constants/theme';

type Counts = { [id: string]: number };

export default function MissionScreen() {
  const { user, userData } = useUser();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(false);

  const increment = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const decrement = (id: string) => setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalReward = MISSIONS.reduce((sum, m) => sum + (counts[m.id] ?? 0) * m.rewardPerCount, 0);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const parts = MISSIONS
        .filter(m => (counts[m.id] ?? 0) > 0)
        .map(m => `${m.title} ${counts[m.id]}회`);
      await completeMultipleMissions(
        user.uid,
        userData?.nickname ?? user.displayName ?? '이름없음',
        totalReward,
        parts.join(', ')
      );
      setCounts({});
      window.alert(`+${totalReward} 달란트가 지갑에 담겼어요 🎉`);
    } catch {
      window.alert('적립에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    missions: MISSIONS.filter(m => m.category === cat),
  }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {grouped.map(group => (
          <View key={group.category}>
            <Text style={styles.categoryLabel}>{group.category}</Text>
            {group.missions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                count={counts[mission.id] ?? 0}
                onIncrement={() => increment(mission.id)}
                onDecrement={() => decrement(mission.id)}
              />
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {totalCount > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>총 {totalCount}회 수행  ·  +{totalReward} 달란트</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color={C.primary} />
              : <Text style={styles.submitText}>미션완료</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function MissionCard({ mission, count, onIncrement, onDecrement }: {
  mission: Mission; count: number; onIncrement: () => void; onDecrement: () => void;
}) {
  return (
    <View style={[styles.card, count > 0 && styles.cardActive]}>
      <View style={styles.cardLeft}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDesc}>{mission.description}</Text>
        <Text style={styles.missionReward}>+{mission.rewardPerCount} 달란트</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={onDecrement}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{count}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={onIncrement}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: C.textDark, marginBottom: 16 },
  categoryLabel: {
    fontSize: 12, fontWeight: 'bold', color: C.textMid,
    backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: R.sm, alignSelf: 'flex-start', marginVertical: 8, letterSpacing: 0.3,
  },
  card: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cardActive: {
    borderColor: C.primary, backgroundColor: '#FFFBEE',
  },
  cardLeft: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: 'bold', color: C.textDark },
  missionDesc: { fontSize: 12, color: C.textLight, marginTop: 2 },
  missionReward: { fontSize: 12, color: C.textMid, marginTop: 4, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, color: C.textMid, fontWeight: 'bold' },
  countText: { fontSize: 16, fontWeight: 'bold', color: C.textDark, minWidth: 24, textAlign: 'center' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.primary, padding: 16, alignItems: 'center',
    borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg,
  },
  bottomText: { color: C.primaryDeep, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  submitBtn: {
    backgroundColor: C.primaryDeep, paddingVertical: 13, paddingHorizontal: 32,
    borderRadius: R.lg, width: '100%', alignItems: 'center',
  },
  submitText: { color: C.primary, fontWeight: 'bold', fontSize: 15 },
});
