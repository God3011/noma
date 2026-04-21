import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDbkynKV1hNAaXzEWu91nxree0xJdgpoQE',
  authDomain: 'noma-bd0da.firebaseapp.com',
  projectId: 'noma-bd0da',
  storageBucket: 'noma-bd0da.firebasestorage.app',
  messagingSenderId: '374486509345',
  appId: '1:374486509345:web:6f2f47dc8f2585202d8060',
  measurementId: 'G-WWYH50QHWR',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
