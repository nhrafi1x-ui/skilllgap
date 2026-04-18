import { initializeApp, getApps, getApp } from "firebase/app";
import * as authSDK from "firebase/auth";
import * as firestoreSDK from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { mockAuth, mockDb } from "./lib/mockFirebase";

// Check if we should use mock (if keys are placeholder or if we want to ensure offline stability)
const useMock = !firebaseConfig.apiKey || 
                firebaseConfig.apiKey.includes('YOUR_API_KEY') || 
                (firebaseConfig.apiKey.startsWith('AIzaSyA4') && firebaseConfig.projectId.includes('remixed')) || 
                !firebaseConfig.appId;

let realApp: any;
let realAuth: any;
let realDb: any;
let _isDemoMode = useMock;

if (!useMock) {
    try {
        const apps = getApps();
        if (apps.length === 0) {
            realApp = initializeApp(firebaseConfig);
            realAuth = authSDK.getAuth(realApp);
            
            const dbId = (firebaseConfig as any).firestoreDatabaseId;
            const settings = {
                experimentalForceLongPolling: true,
            };

            if (dbId && dbId !== "(default)") {
                realDb = firestoreSDK.initializeFirestore(realApp, settings, dbId);
            } else {
                realDb = firestoreSDK.initializeFirestore(realApp, settings);
            }
        } else {
            realApp = getApp();
            realAuth = authSDK.getAuth(realApp);
            realDb = firestoreSDK.getFirestore(realApp);
        }
    } catch (e) {
        console.error("🔥 Firebase initialization failed CRITICALLY:", e);
        _isDemoMode = true;
    }
}

// Current active instances (exported as 'auth' and 'db' for simple usage, 
// but wrappers will manage the switching logic internally)
export let auth: any = _isDemoMode ? mockAuth : realAuth;
export let db: any = _isDemoMode ? mockDb : realDb;

export const setDemoMode = (val: boolean) => {
    _isDemoMode = val;
    auth = val ? mockAuth : realAuth;
    db = val ? mockDb : realDb;
    console.info(val ? "🔄 Switched to Demo Mode (Offline)" : "⚡ Switched to Live Mode (Cloud Firestore)");
};

export const getIsDemoMode = () => _isDemoMode;

if (useMock || !realDb) {
    if (!useMock) console.warn("Firebase config present but initialization failed. Falling back to Demo Mode.");
    else console.info("Firebase is in Demo Mode (Mock API). Provide valid config to enable Cloud Firestore.");
    auth = mockAuth;
    db = mockDb;
    _isDemoMode = true;
}

// --- Auth Wrappers ---
export const onAuthStateChanged = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.onAuthStateChanged(args[1]);
    return authSDK.onAuthStateChanged(realAuth, args[1], args[2]);
};

export const signInWithEmailAndPassword = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithEmailAndPassword(args[1], args[2]);
    return authSDK.signInWithEmailAndPassword(realAuth, args[1], args[2]);
};

export const createUserWithEmailAndPassword = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithEmailAndPassword(args[1], args[2]); 
    return authSDK.createUserWithEmailAndPassword(realAuth, args[1], args[2]);
};

export const signOut = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signOut();
    return authSDK.signOut(realAuth);
};

export const signInAnonymously = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInAnonymously();
    return authSDK.signInAnonymously(realAuth);
};

export const signInWithPopup = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithPopup();
    return authSDK.signInWithPopup(realAuth, args[1]);
};

export const sendPasswordResetEmail = (...args: any[]) => {
    if (_isDemoMode) return Promise.resolve();
    return authSDK.sendPasswordResetEmail(realAuth, args[1]);
};

export const GoogleAuthProvider = authSDK.GoogleAuthProvider;

// --- Safety Wrappers to handle Mock vs Real SDK differences ---

export const doc = (parent: any, path: string, ...segments: string[]) => {
    if (_isDemoMode) return mockDb.doc(path, ...segments);
    // If caller passed the mockDb but we are in Live Mode, switch to realDb
    const actualParent = (parent === mockDb) ? realDb : parent;
    return firestoreSDK.doc(actualParent, path, ...segments);
};

export const getDoc = (docRef: any) => {
    if (_isDemoMode) return mockDb.getDoc(docRef);
    return firestoreSDK.getDoc(docRef);
};

export const setDoc = (docRef: any, data: any, options?: any) => {
    if (_isDemoMode) return mockDb.setDoc(docRef, data, options);
    return firestoreSDK.setDoc(docRef, data, options);
};

export const updateDoc = (docRef: any, data: any) => {
    if (_isDemoMode) return mockDb.updateDoc(docRef, data);
    return firestoreSDK.updateDoc(docRef, data);
};

export const collection = (parent: any, path: string, ...segments: string[]) => {
    if (_isDemoMode) return mockDb.collection(path, ...segments);
    const actualParent = (parent === mockDb) ? realDb : parent;
    return firestoreSDK.collection(actualParent, path, ...segments);
};

export const query = (q: any, ...constraints: any[]) => {
    if (_isDemoMode) return mockDb.query(q, ...constraints);
    return firestoreSDK.query(q, ...constraints);
};

export const where = (field: string, op: any, value: any) => {
    if (_isDemoMode) return [field, op, value]; 
    return firestoreSDK.where(field, op, value);
};

export const onSnapshot = (ref: any, onNext: any, onError?: any) => {
    if (_isDemoMode) return mockDb.onSnapshot(ref, onNext);
    return firestoreSDK.onSnapshot(ref, onNext, onError);
};

export const getDocFromServer = (docRef: any) => {
    if (_isDemoMode) return mockDb.getDoc(docRef);
    return firestoreSDK.getDocFromServer(docRef);
};

export const addDoc = (colRef: any, data: any) => {
    if (_isDemoMode) return mockDb.addDoc(colRef, data);
    return firestoreSDK.addDoc(colRef, data);
};

export const deleteDoc = (docRef: any) => {
    if (_isDemoMode) return mockDb.deleteDoc(docRef);
    return firestoreSDK.deleteDoc(docRef);
};

export const serverTimestamp = () => {
    if (_isDemoMode) return new Date();
    return firestoreSDK.serverTimestamp();
};

export const Timestamp = firestoreSDK.Timestamp;
