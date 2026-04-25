import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log("Firebase Connected Successfully");
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
        // This is actually a good sign - it means we reached the server
        console.log("Firebase reachable (Permissions active)");
        return;
    }
    console.error("Firebase connection check failed:", error);
  }
}

testConnection();
