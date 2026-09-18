import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { C, R, shadow } from '../constants/theme';

export default function NicknameScreen() {
  const { updateNickname } = useUser();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) { setError('닉네임을 입력해주세요.'); return; }
    if (trimmed.length > 10) { setError('닉네임은 10자 이하로 입력해주세요.'); return; }
    setLoading(true);
    try {
      await updateNickname(trimmed);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏷️</Text>
      <Text style={styles.title}>닉네임을 정해주세요</Text>

      <TextInput
        style={styles.input}
        placeholder=""
        value={nickname}
        onChangeText={t => { setNickname(t); setError(''); }}
        maxLength={10}
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.primaryDeep} />
          : <Text style={styles.btnText}>시작하기 🎉</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: C.textDark, marginBottom: 32 },
  input: {
    width: '100%', maxWidth: 320,
    borderWidth: 2, borderColor: C.border, borderRadius: R.xl,
    padding: 16, fontSize: 18, textAlign: 'center',
    backgroundColor: C.surface, color: C.textDark, marginBottom: 8,
  },
  error: { color: C.spend, marginBottom: 8, fontSize: 13 },
  btn: {
    backgroundColor: C.primary, width: '100%', maxWidth: 320,
    paddingVertical: 18, borderRadius: R.xl, alignItems: 'center', marginTop: 8,
    ...shadow,
  },
  btnText: { color: C.primaryDeep, fontSize: 16, fontWeight: 'bold' },
});
