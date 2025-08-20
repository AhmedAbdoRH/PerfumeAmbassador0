import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
// يمكنك إضافة المزيد من خدمات Firebase هنا مثل auth/firestore/storage حسب الحاجة

const firebaseConfig = {
  apiKey: 'AIzaSyDKHlDDZ4GFGI8u6oOhfOulD_XFzL3qZBQ',
  authDomain: 'hadaf-pa.firebaseapp.com',
  projectId: 'hadaf-pa',
  storageBucket: 'hadaf-pa.appspot.com',
  messagingSenderId: '755281209375',
  appId: '1:755281209375:web:3a9040a2f0031ea2b14d2a',
  measurementId: 'G-XNBQ73GMJ2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, db, analytics };