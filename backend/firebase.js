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
    const queryObj = {
      limit(n) {
        return {
          async get() {
            const res = await queryObj.get();
            const docs = res.docs.slice(0, n);
            return {
              docs,
              forEach: (callback) => docs.forEach(doc => callback(doc)),
              empty: docs.length === 0,
            };
          }
        };
      },
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
    return queryObj;
  }
}

class SmartCollectionWrapper {
  constructor(name, parentDocPath = '') {
    this.name = name;
    this.parentDocPath = parentDocPath;
    this.fullPath = parentDocPath ? `${parentDocPath}/${name}` : name;
  }

  getRealCollection() {
    if (useMock) return null;
    try {
      return db.collection(this.fullPath);
    } catch (e) {
      console.warn(`⚠️ Error getting real Firestore collection: ${e.message}. Falling back to Mock.`);
      useMock = true;
      return null;
    }
  }

  async get() {
    const realCol = this.getRealCollection();
    if (realCol) {
      try {
        return await realCol.get();
      } catch (err) {
        console.warn(`⚠️ Firestore get() failed for ${this.fullPath}. Falling back to local Mock DB:`, err.message);
        useMock = true;
      }
    }
    return new MockCollection(this.fullPath).get();
  }

  doc(docId) {
    const self = this;
    const docPath = `${this.fullPath}/${docId}`;
    return {
      id: docId,
      async get() {
        const realCol = self.getRealCollection();
        if (realCol) {
          try {
            return await realCol.doc(docId).get();
          } catch (err) {
            console.warn(`⚠️ Firestore doc.get() failed for ${docPath}. Falling back to local Mock DB:`, err.message);
            useMock = true;
          }
        }
        return new MockCollection(self.fullPath).doc(docId).get();
      },
      async set(data, options = {}) {
        const realCol = self.getRealCollection();
        if (realCol) {
          try {
            return await realCol.doc(docId).set(data, options);
          } catch (err) {
            console.warn(`⚠️ Firestore doc.set() failed for ${docPath}. Falling back to local Mock DB:`, err.message);
            useMock = true;
          }
        }
        return new MockCollection(self.fullPath).doc(docId).set(data, options);
      },
      async update(data) {
        const realCol = self.getRealCollection();
        if (realCol) {
          try {
            return await realCol.doc(docId).update(data);
          } catch (err) {
            console.warn(`⚠️ Firestore doc.update() failed for ${docPath}. Falling back to local Mock DB:`, err.message);
            useMock = true;
          }
        }
        return new MockCollection(self.fullPath).doc(docId).update(data);
      },
      async delete() {
        const realCol = self.getRealCollection();
        if (realCol) {
          try {
            return await realCol.doc(docId).delete();
          } catch (err) {
            console.warn(`⚠️ Firestore doc.delete() failed for ${docPath}. Falling back to local Mock DB:`, err.message);
            useMock = true;
          }
        }
        return new MockCollection(self.fullPath).doc(docId).delete();
      },
      collection(subName) {
        return new SmartCollectionWrapper(subName, docPath);
      }
    };
  }

  where(field, op, value) {
    const self = this;
    const queryObj = {
      limit(n) {
        return {
          async get() {
            const realCol = self.getRealCollection();
            if (realCol) {
              try {
                return await realCol.where(field, op, value).limit(n).get();
              } catch (err) {
                console.warn(`⚠️ Firestore query.limit.get() failed for ${self.fullPath}. Falling back to local Mock DB:`, err.message);
                useMock = true;
              }
            }
            const res = await new MockCollection(self.fullPath).where(field, op, value).get();
            const docs = res.docs.slice(0, n);
            return {
              docs,
              forEach: (callback) => docs.forEach(doc => callback(doc)),
              empty: docs.length === 0,
            };
          }
        };
      },
      async get() {
        const realCol = self.getRealCollection();
        if (realCol) {
          try {
            return await realCol.where(field, op, value).get();
          } catch (err) {
            console.warn(`⚠️ Firestore query.get() failed for ${self.fullPath}. Falling back to local Mock DB:`, err.message);
            useMock = true;
          }
        }
        return new MockCollection(self.fullPath).where(field, op, value).get();
      }
    };
    return queryObj;
  }
}

const dbWrapper = {
  collection(name) {
    return new SmartCollectionWrapper(name);
  }
};

export { dbWrapper as db, isFirebaseConfigured };
