/**
 * Firestore Seed Script
 * Run with: npx ts-node src/seedFirestore.ts
 * Or via: npm run seed
 *
 * Pushes mockup data into:
 * Collection: "CMG Al-Estimation" > Document: "root" > Collection: "biddings"
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin using environment variables
const firebaseConfig = {
  credential: cert({
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  }),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// --- Mockup Data (mirrors INITIAL_* constants from App.tsx) ---

const INITIAL_STAFF_DATA = [
  { id: 1, position: "Project Manager", qty: 1, rate: 65000, duration: null },
  { id: 2, position: "Site Engineer", qty: 2, rate: 35000, duration: null },
  { id: 3, position: "Safety Officer", qty: 1, rate: 25000, duration: null },
  { id: 4, position: "Admin/Store", qty: 1, rate: 18000, duration: null },
];

const INITIAL_ACCOMMODATION_DATA = [
  { id: 1, item: "Camp Room (ห้องพักคนงาน)", qty: 20, rate: 1500, duration: null },
  { id: 2, item: "Utilities (ค่าน้ำ-ไฟ แคมป์)", qty: 1, rate: 10000, duration: null },
  { id: 3, item: "Staff Accommodation (บ้านพัก Staff)", qty: 1, rate: 15000, duration: null },
];

const INITIAL_GENERAL_EXPENSE_DATA = [
  { id: 1, item: "Office Supplies (วัสดุสำนักงาน)", qty: 1, rate: 3000, duration: null },
  { id: 2, item: "Communication (ค่าโทรศัพท์/เน็ต)", qty: 1, rate: 2500, duration: null },
  { id: 3, item: "Printing & Copying (ค่าถ่ายเอกสาร)", qty: 1, rate: 4000, duration: null },
  { id: 4, item: "Drinking Water & Maid (น้ำดื่ม/แม่บ้าน)", qty: 1, rate: 5000, duration: null },
];

const INITIAL_INSURANCE_DATA = [
  { id: 1, item: "Third Party Liability", qty: 1, unit: "Lot", rate: 24000, duration: 1 },
  { id: 2, item: "Workmen Compensation", qty: 1, unit: "Lot", rate: 36000, duration: 1 },
  { id: 3, item: "Equipment Insurance", qty: 1, unit: "Lot", rate: 18000, duration: 1 },
  { id: 4, item: "All Risk Insurance", qty: 1, unit: "Lot", rate: 50000, duration: 1 },
];

const INITIAL_SAFETY_EXPENSE_DATA = [
  { id: 1, item: "PPE (อุปกรณ์ป้องกันส่วนบุคคล)", qty: 20, rate: 500, duration: null },
  { id: 2, item: "Safety Signage & Barricade", qty: 1, rate: 3000, duration: null },
  { id: 3, item: "Safety Training & Activities", qty: 1, rate: 2000, duration: null },
];

const INITIAL_MACHINERY_DATA = [
  { id: 1, item: "Tower Crane / Mobile Crane", qty: 1, rate: 120000, duration: null },
  { id: 2, item: "รถกระบะ (Pickup)", qty: 2, rate: 25000, duration: null },
  { id: 3, item: "เครื่องกำเนิดไฟฟ้า (Generator)", qty: 1, rate: 8000, duration: null },
];

const DEFAULT_FINANCIALS = {
  enabled: true,
  advanceBondEnabled: true,
  performBondEnabled: true,
  warrantyBondEnabled: true,
  taxEnabled: true,
  advanceBondPct: 10,
  advanceBondMos: 6,
  performBondPct: 10,
  performBondMos: 12,
  warrantyBondPct: 5,
  warrantyBondMos: 24,
  overheadProfitPct: 15,
};

// Sample projects to seed
const SAMPLE_PROJECTS = [
  {
    id: "CMG-BID-25-001",
    project: {
      biddingNo: "CMG-BID-25-001",
      name: "โครงการก่อสร้างอาคารสำนักงาน A",
      client: "บริษัท ABC จำกัด",
      duration: 12,
    },
    directItems: [
      { id: 101, desc: "งานเสาเข็มเจาะ ขนาด 0.60 ม.", spec: "PC 0.60m", unit: "ต้น", qty: 120, matRate: 8500, labRate: 2500, eqRate: 1500 },
      { id: 102, desc: "งานคอนกรีตฐานราก (240 กก./ซม2)", spec: "240 ksc", unit: "ลบ.ม.", qty: 85, matRate: 1900, labRate: 450, eqRate: 0 },
      { id: 103, desc: "งานเหล็กเสริมฐานราก (DB)", spec: "SD40", unit: "กก.", qty: 12000, matRate: 23, labRate: 4.5, eqRate: 0 },
      { id: 104, desc: "งานไม้แบบ", spec: "-", unit: "ตร.ม.", qty: 800, matRate: 0, labRate: 140, eqRate: 180 },
    ],
  },
  {
    id: "CMG-BID-25-002",
    project: {
      biddingNo: "CMG-BID-25-002",
      name: "โครงการปรับปรุงโรงงาน B",
      client: "บริษัท XYZ อุตสาหกรรม จำกัด",
      duration: 6,
    },
    directItems: [
      { id: 201, desc: "งานทุบรื้อถอนผนังเดิม", spec: "-", unit: "เหมา", qty: 1, matRate: 0, labRate: 80000, eqRate: 20000 },
      { id: 202, desc: "งานก่ออิฐมวลเบา", spec: "7.5 ซม.", unit: "ตร.ม.", qty: 350, matRate: 235, labRate: 105, eqRate: 0 },
      { id: 203, desc: "งานฉาบปูน", spec: "1:3", unit: "ตร.ม.", qty: 700, matRate: 70, labRate: 140, eqRate: 0 },
      { id: 204, desc: "งานทาสีภายใน", spec: "TOA Plast 2000", unit: "ตร.ม.", qty: 700, matRate: 35, labRate: 45, eqRate: 0 },
    ],
  },
];

async function seedData() {
  console.log("🔥 Starting Firestore seed...");
  console.log(`📂 Target: CMG Al-Estimation > root > biddings`);

  const collectionRef = db
    .collection("CMG Al-Estimation")
    .doc("root")
    .collection("biddings");

  for (const project of SAMPLE_PROJECTS) {
    const { id, ...data } = project;
    const docData = {
      ...data,
      staffEnabled: true,
      staff: INITIAL_STAFF_DATA,
      accommodationEnabled: true,
      accommodation: INITIAL_ACCOMMODATION_DATA,
      generalExpenseEnabled: true,
      generalExpense: INITIAL_GENERAL_EXPENSE_DATA,
      insuranceDataEnabled: true,
      insuranceData: INITIAL_INSURANCE_DATA,
      safetyExpenseEnabled: true,
      safetyExpense: INITIAL_SAFETY_EXPENSE_DATA,
      machineryEnabled: true,
      machinery: INITIAL_MACHINERY_DATA,
      financials: DEFAULT_FINANCIALS,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await collectionRef.doc(id).set(docData);
    console.log(`  ✅ Seeded project: ${id} - ${data.project.name}`);
  }

  console.log("\n✅ Seed complete! Projects added to Firebase.");
  console.log("   Collection path: CMG Al-Estimation > root > biddings");
  process.exit(0);
}

seedData().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
