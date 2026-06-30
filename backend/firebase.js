import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const isFirebaseConfigured = fs.existsSync(serviceAccountPath);

let db = null;
let useMock = false;

if (isFirebaseConfigured) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('🔥 Firebase Admin SDK initialized successfully. Connected to Firestore.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    useMock = true;
  }
} else {
  console.log('⚠️  firebase-service-account.json not found in backend/ directory.');
  console.log('⚠️  Falling back to a local JSON database (backend/local-db.json) for development testing.');
  useMock = true;
}

// Local mock database implementation reproducing Firestore collection/doc APIs
class MockCollection {
  constructor(collectionName) {
    this.name = collectionName;
    this.dbPath = path.join(__dirname, 'local-db.json');
  }

  _readData() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        fs.writeFileSync(this.dbPath, JSON.stringify({}), 'utf8');
      }
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data || '{}');
    } catch (e) {
      console.error('Error reading mock DB:', e);
      return {};
    }
  }

  _writeData(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing mock DB:', e);
    }
  }

  async get() {
    const allData = this._readData();
    const collectionData = allData[this.name] || {};
    const docs = Object.keys(collectionData).map(id => ({
      id,
      exists: true,
      data: () => collectionData[id],
    }));
    return {
      docs,
      forEach: (callback) => docs.forEach(doc => callback(doc)),
    };
  }

  doc(docId) {
    const self = this;
    return {
      id: docId,
      async get() {
        const allData = self._readData();
        const collectionData = allData[self.name] || {};
        const data = collectionData[docId];
        return {
          exists: !!data,
          id: docId,
          data: () => data,
        };
      },
      async set(data, options = {}) {
        const allData = self._readData();
        if (!allData[self.name]) allData[self.name] = {};
        
        if (options.merge) {
          allData[self.name][docId] = { ...(allData[self.name][docId] || {}), ...data };
        } else {
          allData[self.name][docId] = data;
        }
        self._writeData(allData);
        return { writeTime: new Date() };
      },
      async update(data) {
        const allData = self._readData();
        if (!allData[self.name] || !allData[self.name][docId]) {
          throw new Error(`Document ${docId} does not exist in collection ${self.name}`);
        }
        allData[self.name][docId] = { ...allData[self.name][docId], ...data };
        self._writeData(allData);
        return { writeTime: new Date() };
      },
      async delete() {
        const allData = self._readData();
        if (allData[self.name] && allData[self.name][docId]) {
          delete allData[self.name][docId];
          self._writeData(allData);
        }
        return { writeTime: new Date() };
      },
      collection(subName) {
        // Replicate subcollections by namespacing (e.g. "users/user123/tasks")
        const subCollectionName = `${self.name}/${docId}/${subName}`;
        return new MockCollection(subCollectionName);
      }
    };
  }

  where(field, op, value) {
    const self = this;
    return {
      async get() {
        const allData = self._readData();
        const collectionData = allData[self.name] || {};
        const docs = [];
        for (const id in collectionData) {
          const docData = collectionData[id];
          let match = false;
          if (op === '==') {
            match = docData[field] === value;
          }
          if (match) {
            docs.push({
              id,
              exists: true,
              data: () => docData,
            });
          }
        }
        return {
          docs,
          forEach: (callback) => docs.forEach(doc => callback(doc)),
          empty: docs.length === 0,
        };
      }
    };
  }
}

const dbWrapper = {
  collection(name) {
    if (useMock) {
      return new MockCollection(name);
    }
    return db.collection(name);
  }
};

export { dbWrapper as db, isFirebaseConfigured };
