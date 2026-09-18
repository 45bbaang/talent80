import { db } from '../firebase/config';
import { doc, collection, addDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function submitInquiry(userId: string, userNickname: string, message: string) {
  await addDoc(collection(db, 'inquiries'), {
    userId, userNickname, message,
    createdAt: new Date().toISOString(),
    reply: null,
    repliedAt: null,
  });
}

export async function replyToInquiry(inquiryId: string, reply: string) {
  await updateDoc(doc(db, 'inquiries', inquiryId), {
    reply,
    repliedAt: new Date().toISOString(),
  });
}

export async function saveAnnouncement(text: string, active: boolean) {
  await setDoc(doc(db, 'config', 'announcement'), {
    text, active,
    updatedAt: new Date().toISOString(),
  });
}
