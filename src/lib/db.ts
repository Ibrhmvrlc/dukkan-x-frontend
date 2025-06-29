// src/lib/db.ts
import { openDB } from 'idb';

const DB_NAME = 'dukkanx';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }

      // Diğer store'lar da buraya eklenecek
      // ürünler, siparisler, vs.
    },
  });
};
