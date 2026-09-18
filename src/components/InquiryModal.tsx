import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { submitInquiry } from '../services/inquiryService';
import { useUser } from '../context/UserContext';
import { C, R } from '../constants/theme';

type Inquiry = {
  id: string;
  message: string;
  createdAt: string;
  reply?: string | null;
  repliedAt?: string | null;
};

type Props = { visible: boolean; onClose: () => void };

export default function InquiryModal({ visible, onClose }: Props) {
  const { user, userData } = useUser();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !visible) return;
    const q = query(collection(db, 'inquiries'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setInquiries(list);
    }, () => {});
    return () => unsub();
  }, [user, visible]);

  const handleSubmit = async () => {
    if (!message.trim()) { window.alert('문의 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      await submitInquiry(user!.uid, userData?.nickname ?? '이름없음', message.trim());
      setMessage('');
      window.alert('문의가 접수됐어요! 곧 답변 드릴게요 😊');
    } catch {
      window.alert('전송에 실패했습니다. 다시 시도해주세요.');
    } finally { setSubmitting(false); }
  };

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return ''; }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>📋 문의하기</Text>
          <Text style={styles.subtitle}>답변은 이 화면에서만 볼 수 있어요 (비공개)</Text>

          <ScrollView style={styles.list}>
            {inquiries.length === 0
              ? <Text style={styles.empty}>문의 내역이 없어요{'\n'}아래에서 첫 문의를 남겨보세요</Text>
              : inquiries.map(item => (
                <View key={item.id} style={styles.inquiryGroup}>
                  {/* 내 문의 — 오른쪽 말풍선 */}
                  <View style={styles.myRow}>
                    <View style={styles.myBubble}>
                      <Text style={styles.myText}>{item.message}</Text>
                      <Text style={styles.timeText}>{fmt(item.createdAt)}</Text>
                    </View>
                  </View>
                  {/* 관리자 답변 — 왼쪽 말풍선 */}
                  {item.reply ? (
                    <View style={styles.replyRow}>
                      <View style={styles.replyBubble}>
                        <Text style={styles.replyLabel}>관리자 답변</Text>
                        <Text style={styles.replyText}>{item.reply}</Text>
                        {item.repliedAt && <Text style={styles.timeText}>{fmt(item.repliedAt)}</Text>}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.replyRow}>
                      <View style={styles.pendingBubble}>
                        <Text style={styles.pendingText}>답변 대기 중...</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))
            }
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="문의 내용을 입력해주세요"
            placeholderTextColor={C.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color={C.primaryDeep} />
              : <Text style={styles.submitText}>문의 보내기</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(92,61,30,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
    padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: C.border,
    maxHeight: '85%',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: C.textDark, marginBottom: 4 },
  subtitle: { fontSize: 11, color: C.textLight, marginBottom: 14 },

  list: { maxHeight: 300 },
  empty: { textAlign: 'center', color: C.textLight, marginVertical: 24, lineHeight: 22 },

  inquiryGroup: { marginBottom: 16 },
  myRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
  myBubble: {
    backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: 12,
    maxWidth: '82%',
  },
  myText: { fontSize: 14, color: C.textDark, lineHeight: 20 },
  timeText: { fontSize: 10, color: C.textLight, marginTop: 4, textAlign: 'right' },

  replyRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  replyBubble: {
    backgroundColor: '#EEF8F2', borderRadius: R.md, padding: 12,
    maxWidth: '82%', borderLeftWidth: 3, borderLeftColor: C.earn,
  },
  replyLabel: { fontSize: 10, fontWeight: 'bold', color: C.earn, marginBottom: 4 },
  replyText: { fontSize: 14, color: C.textDark, lineHeight: 20 },
  pendingBubble: { paddingHorizontal: 8, paddingVertical: 4 },
  pendingText: { fontSize: 11, color: C.textLight, fontStyle: 'italic' },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.md,
    padding: 12, fontSize: 14, color: C.textDark, backgroundColor: C.bg,
    marginTop: 8, minHeight: 76, textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: C.primary, borderRadius: R.lg,
    padding: 14, alignItems: 'center', marginTop: 10,
  },
  submitText: { color: C.primaryDeep, fontWeight: 'bold', fontSize: 14 },
  closeBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  closeBtnText: { color: C.textLight, fontSize: 14 },
});
