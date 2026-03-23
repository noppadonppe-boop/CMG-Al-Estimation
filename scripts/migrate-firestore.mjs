import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClpmcEdT41POqPrhzrRUYqqdJ24-MTHnU",
  authDomain: "bidding-costestimate.firebaseapp.com",
  projectId: "bidding-costestimate",
  storageBucket: "bidding-costestimate.firebasestorage.app",
  messagingSenderId: "21656266864",
  appId: "1:21656266864:web:15cf949d4ee558be7f6cb5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Source:      /artifacts/default-app-id/public/data/biddings
// Destination: /CMG Al-Estimation/root/biddings

const SOURCE_PATH      = ["artifacts", "default-app-id", "public", "data", "biddings"];
const DEST_PATH        = ["CMG Al-Estimation", "root", "biddings"];

async function migrate() {
  console.log("Reading from:", SOURCE_PATH.join(" > "));
  const sourceCol = collection(db, ...SOURCE_PATH);
  const snapshot = await getDocs(sourceCol);

  if (snapshot.empty) {
    console.log("No documents found in source. Nothing to copy.");
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} document(s). Copying to: ${DEST_PATH.join(" > ")}`);

  let success = 0;
  for (const srcDoc of snapshot.docs) {
    const destRef = doc(db, ...DEST_PATH, srcDoc.id);
    await setDoc(destRef, srcDoc.data());
    console.log(`  Copied: ${srcDoc.id}`);
    success++;
  }

  console.log(`\nDone. ${success}/${snapshot.size} document(s) copied successfully.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
