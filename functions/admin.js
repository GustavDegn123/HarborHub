// functions/admin.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp(); // bruger projektets default credentials
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
