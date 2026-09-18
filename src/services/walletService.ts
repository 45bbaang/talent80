import { db } from '../firebase/config';
import {
  doc,
  collection,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore';

export async function completeMultipleMissions(
  userId: string,
  userName: string,
  totalReward: number,
  summaryTitle: string,
  targetDate?: string
) {
  const date = targetDate ?? new Date().toISOString().split('T')[0];
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error('사용자를 찾을 수 없습니다.');

    const current = userSnap.data();
    transaction.update(userRef, {
      balance: (current.balance ?? 0) + totalReward,
      totalEarned: (current.totalEarned ?? 0) + totalReward,
    });

    const txRef = doc(collection(db, 'transactions'));
    transaction.set(txRef, {
      userId,
      userName,
      type: 'EARN_MISSION',
      amount: totalReward,
      title: summaryTitle,
      targetDate: date,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function deleteTransaction(
  transactionId: string,
  userId: string,
  amount: number
) {
  const userRef = doc(db, 'users', userId);
  const txRef = doc(db, 'transactions', transactionId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error('사용자를 찾을 수 없습니다.');

    const current = userSnap.data();
    transaction.update(userRef, {
      balance: (current.balance ?? 0) - amount,
      totalEarned: amount > 0
        ? (current.totalEarned ?? 0) - amount
        : current.totalEarned ?? 0,
    });

    transaction.delete(txRef);
  });
}

export async function adminAdjustBalance(
  userId: string,
  userName: string,
  amount: number,
  title: string
) {
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error('사용자를 찾을 수 없습니다.');
    const current = userSnap.data();
    const update: Record<string, number> = { balance: (current.balance ?? 0) + amount };
    if (amount > 0) update.totalEarned = (current.totalEarned ?? 0) + amount;
    transaction.update(userRef, update);
    const txRef = doc(collection(db, 'transactions'));
    transaction.set(txRef, {
      userId, userName,
      type: amount > 0 ? 'ADMIN_ADD' : 'ADMIN_DEDUCT',
      amount, title,
      targetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
  });
}

export async function payWithQR(
  userId: string,
  userName: string,
  qrData: { name: string; price: number }
) {
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error('사용자를 찾을 수 없습니다.');

    const current = userSnap.data();
    if ((current.balance ?? 0) < qrData.price) {
      throw new Error('잔액 부족');
    }

    transaction.update(userRef, {
      balance: current.balance - qrData.price,
    });

    const txRef = doc(collection(db, 'transactions'));
    transaction.set(txRef, {
      userId,
      userName,
      type: 'SPEND_QR',
      amount: -qrData.price,
      title: qrData.name,
      targetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
  });
}
