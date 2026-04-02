/**
 * IMPORTANT: Dependencies required
 * - react
 * - react-dom
 * - lucide-react
 * - firebase
 */

declare const __initial_auth_token: string | undefined;

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  LayoutDashboard,
  HardHat,
  Truck,
  FileText,
  Plus,
  Trash2,
  Save,
  Calculator,
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Wand2,
  Search,
  RotateCcw,
  ArrowLeft,
  Copy,
  MoreVertical,
  FolderOpen,
  Sparkles,
  Loader2,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
  Cloud,
  CloudOff,
  Printer,
  FileSpreadsheet,
  FilePlus,
  Calendar,
  Database,
  Paperclip,
} from "lucide-react";

// --- Firebase SDK Imports ---
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";

// Shared collection path: CMG Al-Estimation > root > biddings
const FIRESTORE_COLLECTION = ["CMG Al-Estimation", "root", "biddings"] as const;

// --- Constants & Default Data ---

const APP_VERSION = "v.2.6 (New Total Cost Structure)";

const DEFAULT_PROJECT_INFO = {
  biddingNo: "CMG-BID-XX-XXX",
  name: "โครงการใหม่ (New Project)",
  client: "-",
  duration: 12,
};

const DEFAULT_BOND_ITEMS = [
  { id: 1, name: "Bid bond", contractPct: 5, premiumPct: 0, interestPctYear: 2, months: 3 },
  { id: 2, name: "Performance bond", contractPct: 10, premiumPct: 0, interestPctYear: 2.5, months: 48 },
  { id: 3, name: "Advance bond", contractPct: 15, premiumPct: 2, interestPctYear: 2, months: 48 },
  { id: 4, name: "Warranty bond", contractPct: 5, premiumPct: 0, interestPctYear: 2, months: 12 },
];

const DEFAULT_FINANCIALS = {
  enabled: true,
  contractAmount: 0,
  bondItems: DEFAULT_BOND_ITEMS.map((b) => ({ ...b })),
  taxEnabled: true,
  overheadProfitPct: 15,
};

// --- Mock Data Item Templates ---
const INITIAL_STAFF_DATA = [
  { id: 1, position: "Project Manager", qty: 1, rate: 65000, duration: null },
  { id: 2, position: "Site Engineer", qty: 2, rate: 35000, duration: null },
  { id: 3, position: "Safety Officer", qty: 1, rate: 25000, duration: null },
  { id: 4, position: "Admin/Store", qty: 1, rate: 18000, duration: null },
];

const INITIAL_ACCOMMODATION_DATA = [
  {
    id: 1,
    item: "Camp Room (ห้องพักคนงาน)",
    qty: 20,
    rate: 1500,
    duration: null,
  },
  {
    id: 2,
    item: "Utilities (ค่าน้ำ-ไฟ แคมป์)",
    qty: 1,
    rate: 10000,
    duration: null,
  },
  {
    id: 3,
    item: "Staff Accommodation (บ้านพัก Staff)",
    qty: 1,
    rate: 15000,
    duration: null,
  },
];

const INITIAL_GENERAL_EXPENSE_DATA = [
  {
    id: 1,
    item: "Office Supplies (วัสดุสำนักงาน)",
    qty: 1,
    rate: 3000,
    duration: null,
  },
  {
    id: 2,
    item: "Communication (ค่าโทรศัพท์/เน็ต)",
    qty: 1,
    rate: 2500,
    duration: null,
  },
  {
    id: 3,
    item: "Printing & Copying (ค่าถ่ายเอกสาร)",
    qty: 1,
    rate: 4000,
    duration: null,
  },
  {
    id: 4,
    item: "Drinking Water & Maid (น้ำดื่ม/แม่บ้าน)",
    qty: 1,
    rate: 5000,
    duration: null,
  },
];

const INITIAL_INSURANCE_DATA = [
  {
    id: 1,
    item: "Third Party Liability",
    qty: 1,
    unit: "Lot",
    rate: 24000,
    duration: 1,
  },
  {
    id: 2,
    item: "Workmen Compensation",
    qty: 1,
    unit: "Lot",
    rate: 36000,
    duration: 1,
  },
  {
    id: 3,
    item: "Equipment Insurance",
    qty: 1,
    unit: "Lot",
    rate: 18000,
    duration: 1,
  },
  {
    id: 4,
    item: "All Risk Insurance",
    qty: 1,
    unit: "Lot",
    rate: 50000,
    duration: 1,
  },
];

const INITIAL_SAFETY_EXPENSE_DATA = [
  {
    id: 1,
    item: "PPE (อุปกรณ์ป้องกันส่วนบุคคล)",
    qty: 20,
    rate: 500,
    duration: null,
  },
  {
    id: 2,
    item: "Safety Signage & Barricade",
    qty: 1,
    rate: 3000,
    duration: null,
  },
  {
    id: 3,
    item: "Safety Training & Activities",
    qty: 1,
    rate: 2000,
    duration: null,
  },
];

const INITIAL_MACHINERY_DATA = [
  {
    id: 1,
    item: "Tower Crane / Mobile Crane",
    qty: 1,
    rate: 120000,
    duration: null,
  },
  { id: 2, item: "รถกระบะ (Pickup)", qty: 2, rate: 25000, duration: null },
  {
    id: 3,
    item: "เครื่องกำเนิดไฟฟ้า (Generator)",
    qty: 1,
    rate: 8000,
    duration: null,
  },
];

// --- Standard Unit Rate Database ---
const STANDARD_RATES_DB = [
  {
    keywords: ["เสาเข็ม", "0.60"],
    mat: 8500,
    lab: 2500,
    eq: 1500,
    unit: "ต้น",
  },
  { keywords: ["คอนกรีต", "240"], mat: 1900, lab: 450, eq: 0, unit: "ลบ.ม." },
  { keywords: ["คอนกรีต", "280"], mat: 2050, lab: 450, eq: 0, unit: "ลบ.ม." },
  { keywords: ["คอนกรีต", "180"], mat: 1800, lab: 450, eq: 0, unit: "ลบ.ม." },
  { keywords: ["เหล็กเสริม", "DB"], mat: 23, lab: 4.5, eq: 0, unit: "กก." },
  { keywords: ["เหล็กเสริม", "RB"], mat: 24, lab: 5, eq: 0, unit: "กก." },
  { keywords: ["ไม้แบบ"], mat: 0, lab: 140, eq: 180, unit: "ตร.ม." },
  { keywords: ["อิฐมอญ"], mat: 200, lab: 160, eq: 0, unit: "ตร.ม." },
  { keywords: ["อิฐมวลเบา"], mat: 235, lab: 105, eq: 0, unit: "ตร.ม." },
  { keywords: ["ฉาบ"], mat: 70, lab: 140, eq: 0, unit: "ตร.ม." },
  {
    keywords: ["กระเบื้อง", "60x60"],
    mat: 350,
    lab: 200,
    eq: 0,
    unit: "ตร.ม.",
  },
  {
    keywords: ["กระเบื้องยาง", "SPC"],
    mat: 350,
    lab: 100,
    eq: 0,
    unit: "ตร.ม.",
  },
  { keywords: ["ทาสี", "ภายใน"], mat: 35, lab: 45, eq: 0, unit: "ตร.ม." },
  { keywords: ["ทาสี", "ภายนอก"], mat: 45, lab: 55, eq: 0, unit: "ตร.ม." },
  { keywords: ["ฝ้า", "ฉาบเรียบ"], mat: 180, lab: 120, eq: 0, unit: "ตร.ม." },
  {
    keywords: ["หลังคา", "Metal Sheet"],
    mat: 220,
    lab: 100,
    eq: 0,
    unit: "ตร.ม.",
  },
];

// --- Helper Functions ---
const formatTHB = (num: any) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(num || 0);
};

const safeFloat = (value: any) => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// UI Components
const Card = ({ children, title, icon: Icon, action, className = "" }: any) => (
  <div
    className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className}`}
  >
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-blue-600" />}
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Main Application Component ---
export default function CostEstimator() {
  const [user, setUser] = useState<any>(null);
  const [biddings, setBiddings] = useState<any[]>([]);
  const [selectedBiddingId, setSelectedBiddingId] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("project");

  const [draftProject, setDraftProject] = useState<any>(null);

  const fileInputRef = useRef<any>(null);
  const saveTimeoutRef = useRef<any>(null);
  const attachFileRef = useRef<any>(null);
  const attachTargetRef = useRef<any>({ type: null, id: null });
  const bidDocFileRef = useRef<any>(null);
  const bidDocTargetIdRef = useRef<any>(null);

  // --- Auth & Data Loading ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Auth resolved but no user (shouldn't happen with anonymous) - unblock UI
        setIsDataLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch from PUBLIC shared collection
  useEffect(() => {
    if (user) {
      setIsDataLoaded(false);
      const biddingsRef = collection(
        db,
        ...FIRESTORE_COLLECTION
      );
      const q = query(biddingsRef, orderBy("createdAt", "desc"), limit(50));
      const unsubscribeData = onSnapshot(
        q,
        (snapshot: any) => {
          const loadedBiddings = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBiddings(loadedBiddings);
          setIsDataLoaded(true);
        },
        (error: any) => {
          console.error("Data Fetch Error:", error);
          setIsDataLoaded(true);
        }
      );
      return () => unsubscribeData();
    }
  }, [user]);

  // --- Firestore Actions ---
  // Helper: strip temporary UI-only fields (like _qtyInput) before saving
  const cleanDataForFirestore = (data: any) => {
    const cleaned = { ...data };
    if (cleaned.directItems) {
      cleaned.directItems = cleaned.directItems.map((item: any) => {
        const { _qtyInput, _matRateInput, _labRateInput, _eqRateInput, ...rest } = item;
        return rest;
      });
    }
    return cleaned;
  };

  const saveToFirestore = async (biddingData: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(
        db,
        ...FIRESTORE_COLLECTION,
        biddingData.id
      );
      const { id, ...rawData } = biddingData;
      const dataToSave = cleanDataForFirestore(rawData);
      await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleCreateNewProject = () => {
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const biddingNo = `CMG-BID-${new Date()
      .getFullYear()
      .toString()
      .substr(-2)}-${randomSuffix}`;

    const newDraft = {
      id: "DRAFT",
      project: { ...DEFAULT_PROJECT_INFO, biddingNo: biddingNo },
      directItems: [],
      staffEnabled: true,
      staff: [...INITIAL_STAFF_DATA],
      accommodationEnabled: true,
      accommodation: [...INITIAL_ACCOMMODATION_DATA],
      generalExpenseEnabled: true,
      generalExpense: [...INITIAL_GENERAL_EXPENSE_DATA],
      insuranceDataEnabled: true,
      insuranceData: [...INITIAL_INSURANCE_DATA],
      safetyExpenseEnabled: true,
      safetyExpense: [...INITIAL_SAFETY_EXPENSE_DATA],
      machineryEnabled: true,
      machinery: [...INITIAL_MACHINERY_DATA],
      financials: { ...DEFAULT_FINANCIALS },
      directAttachments: [],
      indirectAttachments: [],
      biddingDocs: [],
    };

    setDraftProject(newDraft);
    setSelectedBiddingId("DRAFT");
    setActiveMenu("project");
  };

  const handleSaveDraftProject = async () => {
    if (!user || !draftProject) return;

    const biddingNo = draftProject.project.biddingNo;
    if (!biddingNo || biddingNo.trim() === "") {
      alert("กรุณาระบุเลขที่โครงการ (Bidding No.) ก่อนบันทึก");
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(
        db,
        ...FIRESTORE_COLLECTION,
        biddingNo
      );
      const { id, ...rawData } = draftProject;
      const dataToSave = cleanDataForFirestore(rawData);

      await setDoc(docRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setDraftProject(null);
      setSelectedBiddingId(biddingNo);
      alert(`บันทึกโครงการ ${biddingNo} เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error("Save Draft Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBiddingFromFirestore = async (biddingId: any, e: any) => {
    if (e) e.stopPropagation();
    if (!user) return;
    if (
      window.confirm("ยืนยันการลบโครงการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")
    ) {
      const docRef = doc(
        db,
        ...FIRESTORE_COLLECTION,
        biddingId
      );
      await deleteDoc(docRef);
      if (selectedBiddingId === biddingId) setSelectedBiddingId(null);
    }
  };

  const duplicateBiddingInFirestore = async (biddingId: any, e: any) => {
    if (e) e.stopPropagation();
    if (!user) return;
    const source = biddings.find((b) => b.id === biddingId);
    if (!source) return;

    const newBiddingNo = `${source.project.biddingNo}-COPY-${Math.floor(
      Math.random() * 100
    )}`;

    const { id, createdAt, ...dataToCopy } = source;
    const newBidding = {
      ...dataToCopy,
      project: {
        ...dataToCopy.project,
        biddingNo: newBiddingNo,
        name: `${dataToCopy.project.name} (Copy)`,
      },
      createdAt: serverTimestamp(),
    };

    const docRef = doc(
      db,
      ...FIRESTORE_COLLECTION,
      newBiddingNo
    );
    await setDoc(docRef, newBidding);
  };

  const currentBidding = useMemo(() => {
    if (selectedBiddingId === "DRAFT") return draftProject;
    return biddings.find((b) => b.id === selectedBiddingId);
  }, [biddings, selectedBiddingId, draftProject]);

  const updateCurrentBidding = (section: any, newValueOrFn: any) => {
    if (!currentBidding) return;
    const currentValue = currentBidding[section];
    const newValue =
      typeof newValueOrFn === "function"
        ? newValueOrFn(currentValue)
        : newValueOrFn;

    if (selectedBiddingId === "DRAFT") {
      setDraftProject((prev: any) => ({ ...prev, [section]: newValue }));
    } else {
      const updatedBidding = { ...currentBidding, [section]: newValue };
      setBiddings((prev: any) =>
        prev.map((b: any) => (b.id === selectedBiddingId ? updatedBidding : b))
      );
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToFirestore(updatedBidding);
      }, 1000);
    }
  };

  const setProject = (val: any) => updateCurrentBidding("project", val);
  const setDirectItems = (val: any) => updateCurrentBidding("directItems", val);
  const setStaff = (val: any) => updateCurrentBidding("staff", val);
  const setStaffEnabled = (val: any) => updateCurrentBidding("staffEnabled", val);
  const setAccommodation = (val: any) => updateCurrentBidding("accommodation", val);
  const setAccommodationEnabled = (val: any) =>
    updateCurrentBidding("accommodationEnabled", val);
  const setGeneralExpense = (val: any) =>
    updateCurrentBidding("generalExpense", val);
  const setGeneralExpenseEnabled = (val: any) =>
    updateCurrentBidding("generalExpenseEnabled", val);
  const setInsuranceData = (val: any) => updateCurrentBidding("insuranceData", val);
  const setInsuranceDataEnabled = (val: any) =>
    updateCurrentBidding("insuranceDataEnabled", val);
  const setSafetyExpense = (val: any) => updateCurrentBidding("safetyExpense", val);
  const setSafetyExpenseEnabled = (val: any) =>
    updateCurrentBidding("safetyExpenseEnabled", val);
  const setMachinery = (val: any) => updateCurrentBidding("machinery", val);
  const setMachineryEnabled = (val: any) =>
    updateCurrentBidding("machineryEnabled", val);
  const setFinancials = (val: any) => updateCurrentBidding("financials", val);
  const setDirectAttachments = (val: any) => updateCurrentBidding("directAttachments", val);
  const setIndirectAttachments = (val: any) => updateCurrentBidding("indirectAttachments", val);
  const setBiddingDocs = (val: any) => updateCurrentBidding("biddingDocs", val);

  // --- Calculations ---
  const directCostSummary = useMemo(() => {
    if (!currentBidding)
      return { matTotal: 0, labTotal: 0, eqTotal: 0, grandTotal: 0 };
    let matTotal = 0,
      labTotal = 0,
      eqTotal = 0;
    (currentBidding.directItems || []).forEach((item: any) => {
      matTotal += (item.qty || 0) * (item.matRate || 0);
      labTotal += (item.qty || 0) * (item.labRate || 0);
      eqTotal += (item.qty || 0) * (item.eqRate || 0);
    });
    return {
      matTotal,
      labTotal,
      eqTotal,
      grandTotal: matTotal + labTotal + eqTotal,
    };
  }, [currentBidding]);

  const timeBasedIndirect = useMemo(() => {
    if (!currentBidding)
      return {
        staffCost: 0,
        accomCost: 0,
        genExpenseCost: 0,
        insuranceTotal: 0,
        safetyTotal: 0,
        machineCost: 0,
        subTotal: 0,
      };
    const duration = safeFloat(currentBidding.project?.duration);

    const calcCost = (items: any, enabled: any, isInsurance = false) => {
      if (enabled === false) return 0;
      return (items || []).reduce((acc: any, curr: any) => {
        const effectiveDuration = isInsurance
          ? 1
          : curr.duration !== undefined && curr.duration !== null
            ? safeFloat(curr.duration)
            : duration;
        return acc + (curr.qty || 0) * (curr.rate || 0) * effectiveDuration;
      }, 0);
    };

    const staffCost = calcCost(
      currentBidding.staff,
      currentBidding.staffEnabled
    );
    const accomCost = calcCost(
      currentBidding.accommodation,
      currentBidding.accommodationEnabled
    );
    const genExpenseCost = calcCost(
      currentBidding.generalExpense,
      currentBidding.generalExpenseEnabled
    );
    const insuranceTotal = calcCost(
      currentBidding.insuranceData,
      currentBidding.insuranceDataEnabled,
      true
    );
    const safetyTotal = calcCost(
      currentBidding.safetyExpense,
      currentBidding.safetyExpenseEnabled
    );
    const machineCost = calcCost(
      currentBidding.machinery,
      currentBidding.machineryEnabled
    );

    return {
      staffCost,
      accomCost,
      genExpenseCost,
      insuranceTotal,
      safetyTotal,
      machineCost,
      subTotal:
        staffCost +
        accomCost +
        genExpenseCost +
        insuranceTotal +
        safetyTotal +
        machineCost,
    };
  }, [currentBidding]);

  // UPDATE v.2.6: Modified to Exclude OH&P from Indirect Total
  const financialIndirect = useMemo(() => {
    const fin = currentBidding?.financials;
    if (!currentBidding || fin?.enabled === false)
      return {
        totalBankCharge: 0,
        insuranceCost: 0,
        taxCost: 0,
        ohProfitCost: 0,
        grandTotalIndirect: 0,
        subTotalBeforeOH: 0,
      };

    // Contract Amount from user input (or fallback to baseCost)
    const baseCost = directCostSummary.grandTotal + timeBasedIndirect.subTotal;
    const contractAmt = safeFloat(fin.contractAmount) || baseCost;

    // Calculate bond costs from bondItems
    // Premium and Interest are calculated from Contract Amount directly
    const bondItems = fin.bondItems || [];
    const totalBankCharge = bondItems.reduce((sum: number, item: any) => {
      const bondAmount = contractAmt * (safeFloat(item.contractPct) / 100);
      const premiumAmount = bondAmount * (safeFloat(item.premiumPct) / 100);
      const interestAmount = bondAmount * (safeFloat(item.interestPctYear) / 100) * (safeFloat(item.months) / 12);
      return sum + premiumAmount + interestAmount;
    }, 0);
    const insuranceCost = 0;

    // Tax = 0.1% of Contract Amount
    const taxCost = fin.taxEnabled !== false ? contractAmt * 0.001 : 0;
    const costForTaxBase = baseCost + totalBankCharge + insuranceCost;

    // New SubTotal (Construction Cost BEFORE OH&P)
    const subTotalBeforeOH = costForTaxBase + taxCost;

    // OH & Profit = % of SubTotal
    const ohProfitCost =
      subTotalBeforeOH * (safeFloat(fin.overheadProfitPct) / 100);

    // Total Indirect (EXCLUDING OH&P) - for display in Table 2
    const totalIndirectNoOH =
      timeBasedIndirect.subTotal + totalBankCharge + insuranceCost + taxCost;

    return {
      totalBankCharge,
      insuranceCost,
      taxCost,
      ohProfitCost,
      grandTotalIndirect: totalIndirectNoOH,
      subTotalBeforeOH,
    };
  }, [
    directCostSummary.grandTotal,
    timeBasedIndirect.subTotal,
    currentBidding,
  ]);

  const totalProjectCost =
    financialIndirect.subTotalBeforeOH + financialIndirect.ohProfitCost;

  const buildDirectItemRows = (items: any[] = []) => {
    const rows: any[] = [];
    const mainNoById = new Map<any, number>();
    const subCountByMainId = new Map<any, number>();
    let mainCounter = 0;

    items.forEach((item: any) => {
      const isSub = item.type === "sub";
      const parentId = item.parentId;
      const parentMainNo = parentId ? mainNoById.get(parentId) : undefined;

      if (isSub && parentMainNo) {
        const currentSub = (subCountByMainId.get(parentId) || 0) + 1;
        subCountByMainId.set(parentId, currentSub);
        rows.push({
          item,
          displayNo: `${parentMainNo}.${currentSub}`,
          isMain: false,
        });
        return;
      }

      mainCounter += 1;
      mainNoById.set(item.id, mainCounter);
      rows.push({
        item: { ...item, type: "main", parentId: null },
        displayNo: `${mainCounter}`,
        isMain: true,
      });
    });

    return rows;
  };

  const directItemRows = useMemo(
    () => buildDirectItemRows(currentBidding?.directItems || []),
    [currentBidding?.directItems]
  );

  // --- Handlers ---
  const handleAddRow = (setter: any, template: any) => {
    const isInsurance = template.unit === "Lot";
    const newTemplate = {
      ...template,
      id: Date.now(),
      duration: isInsurance ? 1 : null,
    };
    setter((prev: any) => [...(prev || []), newTemplate]);
  };
  const handleRemoveRow = (setter: any, id: any) => {
    setter((prev: any) => prev.filter((item: any) => item.id !== id));
  };
  const handleInputChange = (setter: any, id: any, field: any, value: any) => {
    setter((prev: any) =>
      prev.map((item: any) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddDirectMainItem = () => {
    setDirectItems((prev: any[]) => [
      ...(prev || []),
      {
        id: `main_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "main",
        parentId: null,
        desc: "Main Item ใหม่...",
        spec: "-",
        unit: "หน่วย",
        qty: 1,
        matRate: 0,
        labRate: 0,
        eqRate: 0,
      },
    ]);
  };

  const handleAddDirectSubItem = (mainId: any) => {
    setDirectItems((prev: any[]) => {
      const items = [...(prev || [])];
      const mainIndex = items.findIndex((item: any) => item.id === mainId);
      if (mainIndex === -1) return items;

      // Find the insertion point: after the last existing sub of this mainId
      // Stop as soon as we hit a non-sub item OR a sub belonging to a different parent
      let insertIndex = mainIndex + 1;
      while (insertIndex < items.length) {
        const cur = items[insertIndex];
        if (cur.type === "sub" && cur.parentId === mainId) {
          insertIndex += 1;
        } else {
          break;
        }
      }

      const newSub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "sub",
        parentId: mainId,
        desc: "Sub Item ใหม่...",
        spec: "-",
        unit: "หน่วย",
        qty: 1,
        matRate: 0,
        labRate: 0,
        eqRate: 0,
      };

      items.splice(insertIndex, 0, newSub);
      return items;
    });
  };

  const handleRemoveDirectItem = (id: any) => {
    setDirectItems((prev: any[]) => {
      const items = prev || [];
      const target = items.find((item: any) => item.id === id);
      if (!target) return items;

      if ((target.type || "main") === "main") {
        return items.filter(
          (item: any) => item.id !== id && item.parentId !== id
        );
      }

      return items.filter((item: any) => item.id !== id);
    });
  };

  const handleBidDocFileUpload = async (e: any) => {
    const selected = Array.from(e.target.files || []) as File[];
    if (selected.length === 0) return;
    const docId = bidDocTargetIdRef.current;

    if (!currentBidding || selectedBiddingId === "DRAFT") {
      alert("กรุณาบันทึกโครงการก่อนอัปโหลดไฟล์");
      e.target.value = "";
      return;
    }

    setIsSaving(true);
    try {
      const uploadPromises = selected.map(async (file: File) => {
        const filePath = `biddingDocs/${currentBidding.id}/${docId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return { name: file.name, url: downloadURL, path: filePath };
      });
      const newFiles = await Promise.all(uploadPromises);
      setBiddingDocs((prev: any) =>
        prev.map((doc: any) =>
          doc.id === docId
            ? { ...doc, files: [...(doc.files || []), ...newFiles] }
            : doc
        )
      );
    } catch (error: any) {
      console.error("Bid Doc Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์: " + (error.message || ""));
    } finally {
      setIsSaving(false);
      e.target.value = "";
    }
  };

  const handleAttachmentFileChange = async (e: any) => {
    const selected = Array.from(e.target.files || []) as File[];
    if (selected.length === 0) return;
    const { type, id } = attachTargetRef.current;
    const setter = type === "direct" ? setDirectAttachments : setIndirectAttachments;
    
    if (!currentBidding || selectedBiddingId === "DRAFT") {
      alert("กรุณาบันทึกโครงการก่อนอัปโหลดไฟล์");
      e.target.value = "";
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Uploading files to Firebase Storage...", selected.map(f => f.name));
      
      // Upload files to Firebase Storage
      const uploadPromises = selected.map(async (file: File) => {
        const timestamp = Date.now();
        const filePath = `attachments/${currentBidding.id}/${type}/${id}/${timestamp}_${file.name}`;
        console.log("Uploading to path:", filePath);
        
        const storageRef = ref(storage, filePath);
        
        // Upload with timeout
        const uploadTask = uploadBytes(storageRef, file);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Upload timeout - 30s")), 30000)
        );
        
        await Promise.race([uploadTask, timeoutPromise]);
        console.log("Upload successful, getting download URL...");
        
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Got download URL:", downloadURL.substring(0, 50) + "...");
        
        return {
          name: file.name,
          url: downloadURL,
          path: filePath
        };
      });
      
      const newFiles = await Promise.all(uploadPromises);
      console.log("All uploads complete:", newFiles.length, "files");
      
      setter((prev: any) =>
        prev.map((item: any) =>
          item.id === id
            ? { ...item, files: [...(item.files || []), ...newFiles] }
            : item
        )
      );
      
      alert(`อัปโหลด ${newFiles.length} ไฟล์สำเร็จ`);
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
      e.target.value = "";
    }
  };

  const handleEstimateRate = (id: any) => {
    const item = currentBidding.directItems.find((i: any) => i.id === id);
    if (!item) return;
    const searchText = `${item.desc} ${item.spec}`.toLowerCase();
    let bestMatch: any = null;
    let maxScore = 0;
    STANDARD_RATES_DB.forEach((dbItem: any) => {
      let score = 0;
      dbItem.keywords.forEach((keyword: string) => {
        if (searchText.includes(keyword.toLowerCase())) score++;
      });
      if (score > maxScore) {
        maxScore = score;
        bestMatch = dbItem;
      }
    });
    if (bestMatch && maxScore > 0) {
      setDirectItems((prev: any) =>
        prev.map((row: any) => {
          if (row.id === id) {
            return {
              ...row,
              matRate: bestMatch ? bestMatch.mat : 0,
              labRate: bestMatch ? bestMatch.lab : 0,
              eqRate: bestMatch.eq,
              unit: row.unit === "หน่วย" ? bestMatch.unit : row.unit,
            };
          }
          return row;
        })
      );
      alert(
        `Estimator: พบข้อมูลใกล้เคียง "${bestMatch.keywords.join(
          " "
        )}" \nอัปเดตราคาเรียบร้อยแล้ว`
      );
    } else {
      alert(
        "Estimator: ไม่พบข้อมูลราคามาตรฐานสำหรับรายการนี้ \nกรุณากรอกราคาด้วยตนเอง"
      );
    }
  };

  const handleClearProjectInfo = () => {
    if (window.confirm("คุณต้องการล้างข้อมูลโครงการทั้งหมดใช่หรือไม่?"))
      setProject({ biddingNo: "", name: "", client: "", duration: 0 });
  };

  const handleDownloadTemplate = (type = "direct") => {
    const bom = "\uFEFF";
    let csvHeader, exampleRow;
    if (type === "staff") {
      csvHeader = "Position,Qty,Rate\n";
      exampleRow = "ตำแหน่ง,1,20000\n";
    } else if (type === "insurance") {
      csvHeader = "Item,Qty,Unit,Cost\n";
      exampleRow = "ประกันภัย,1,Lot,20000\n";
    } else if (
      ["accommodation", "general", "safety", "machinery"].includes(type)
    ) {
      csvHeader = "Item,Qty,Rate\n";
      exampleRow = "รายการ,1,5000\n";
    } else {
      csvHeader = "Type,Description,Spec,Unit,Qty\n";
      exampleRow =
        "main,งานโครงสร้าง (Main Item),สเปคหลัก,เหมา,1\n" +
        "sub,งานขุดดิน (Sub Item),ความลึก 1.5ม.,ลบ.ม.,100\n" +
        "sub,งานถมดิน (Sub Item),-,ลบ.ม.,80\n" +
        "main,งานสถาปัตยกรรม (Main Item),-,เหมา,1\n" +
        "sub,งานก่ออิฐฉาบปูน (Sub Item),-,ตร.ม.,200\n";
    }
    const blob = new Blob([bom + csvHeader + exampleRow], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BOQ_Template_${type}.csv`;
    link.click();
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split("\n");
      const newItems: any[] = [];

      // Detect if new format (has "Type" column) or old format
      const headerLine = lines[0]?.toLowerCase() || "";
      const hasTypeCol = headerLine.startsWith("type");
      const startIndex = headerLine.includes("description") || headerLine.startsWith("type") ? 1 : 0;

      // Track last main item id for sub-item linking
      let lastMainId: any = null;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        if (hasTypeCol) {
          // New format: Type,Description,Spec,Unit,Qty
          const itemType = (parts[0] || "main").trim().toLowerCase();
          const isMain = itemType !== "sub";
          const id = Date.now() + i + Math.floor(Math.random() * 9999);
          if (isMain) lastMainId = id;
          newItems.push({
            id,
            type: isMain ? "main" : "sub",
            parentId: isMain ? null : lastMainId,
            desc: parts[1] || "",
            spec: parts[2] || "-",
            unit: parts[3] || "หน่วย",
            qty: safeFloat(parts[4]),
            matRate: 0,
            labRate: 0,
            eqRate: 0,
          });
        } else {
          // Old format: Description,Spec,Unit,Qty — all become main items
          if (parts.length >= 1)
            newItems.push({
              id: Date.now() + i,
              type: "main",
              parentId: null,
              desc: parts[0] || "",
              spec: parts[1] || "",
              unit: parts[2] || "หน่วย",
              qty: safeFloat(parts[3]),
              matRate: 0,
              labRate: 0,
              eqRate: 0,
            });
        }
      }
      if (
        newItems.length > 0 &&
        window.confirm(`Found ${newItems.length} items (${newItems.filter((x:any)=>x.type==="main").length} main, ${newItems.filter((x:any)=>x.type==="sub").length} sub). Append?`)
      )
        setDirectItems((prev: any[]) => [...(prev || []), ...newItems]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleUploadIndirectCSV = (e: any, setter: any, keyField: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split("\n");
      const newItems: any[] = [];
      let startIndex = 1;
      const isInsurance = keyField === "insurance";

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (isInsurance && parts.length >= 4) {
          newItems.push({
            id: Date.now() + i,
            item: parts[0] || "",
            qty: safeFloat(parts[1]),
            unit: parts[2] || "Lot",
            rate: safeFloat(parts[3]),
            duration: 1,
          });
        } else if (!isInsurance && parts.length >= 3) {
          newItems.push({
            id: Date.now() + i,
            [keyField]: parts[0] || "",
            qty: safeFloat(parts[1]),
            rate: safeFloat(parts[2]),
            duration: null,
          });
        }
      }
      if (
        newItems.length > 0 &&
        window.confirm(`Found ${newItems.length} items. Append?`)
      )
        setter((prev: any[]) => [...(prev || []), ...newItems]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAIEstimateAll = async () => {
    if (
      !currentBidding.directItems ||
      currentBidding.directItems.length === 0
    ) {
      alert("กรุณาเพิ่มรายการ BOQ ก่อนทำการประเมิน");
      return;
    }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    setIsAnalyzing(true);
    try {
      const itemsListString = currentBidding.directItems
        .map(
          (item: any, index: any) =>
            `Item ${index + 1}: ${item.desc} (Spec: ${item.spec || "-"
            }, Unit: ${item.unit || "-"}, Qty: ${item.qty || 1})`
        )
        .join("\n");
      const promptText = `You are a Senior Quantity Surveyor and Cost Engineer in Thailand.
      Analyze the input (Construction BOQ, Summary, or Line items) and estimate Direct Cost.
      RULES:
      1. **Always Output:** Even if input is vague, provide a best-guess estimate based on standard Thai construction rates (2024-2025).
      2. **Safety:** Process ALL construction terms (digging, cutting, chemicals) - they are safe work descriptions.
      3. **Structure:** If input is a paragraph, split it into logical line items.
      MANDATORY FIELDS & DEFAULTS:
      - description: Item name (Thai).
      - spec: Spec details (Default: "-").
      - quantity: Number (Default: 1).
      - unit: Unit (Default: "เหมา").
      - material_rate: Cost (Default: 0).
      - material_note: Basis (e.g. "ราคาตลาด"). IF EMPTY, USE "ราคากลาง".
      - labor_rate: Cost (Default: 0).
      - labor_note: Basis (e.g. "ค่าแรงขั้นต่ำ"). IF EMPTY, USE "ค่าแรงมาตรฐาน".
      - equipment_rate: Cost (Default: 0).
      - equipment_note: Details. IF EMPTY, USE "-".
      OUTPUT: JSON Array ONLY. No Markdown.
      [{ "description": "...", "spec": "...", "quantity": 0, "unit": "...", "material_rate": 0, "material_note": "...", "labor_rate": 0, "labor_note": "...", "equipment_rate": 0, "equipment_note": "..." }]
      INPUT Items to Estimate:
      ${itemsListString}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 || response.status === 429) {
          // 402 Payment Required or 429 Too Many Requests -> DO NOT remove key
          throw new Error(
            `โควตาการใช้งาน API Key ของคุณเต็ม หรือติดข้อจำกัด (Error ${response.status}). ระบบจะจำ Key เดิมไว้ กรุณารอหรือเปลี่ยน Key หากจำเป็น`
          );
        } else if (response.status === 403 || response.status === 400) {
          throw new Error(
            "API Key ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง (403/400)."
          );
        }
        throw new Error(
          `API Error: ${response.status} ${errorData.error?.message || ""}`
        );
      }

      const data = await response.json();
      let aiResponseText = data.candidates[0].content.parts[0].text;
      aiResponseText = aiResponseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const estimatedRates = JSON.parse(aiResponseText);
      setDirectItems((prev: any[]) =>
        prev.map((item: any, index: any) => {
          const estimate = estimatedRates[index];
          if (estimate) {
            return {
              ...item,
              desc: estimate.description || item.desc,
              spec: estimate.spec || item.spec,
              unit: estimate.unit || item.unit,
              matRate: estimate.material_rate || 0,
              labRate: estimate.labor_rate || 0,
              eqRate: estimate.equipment_rate || 0,
            };
          }
          return item;
        })
      );
      alert("✅ AI ประเมินราคาเรียบร้อยแล้ว (Direct Cost Estimated)");
    } catch (error: any) {
      console.error("AI Estimation Error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const bom = "\uFEFF";
    // Table Header
    let table = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
    <style>
      .header { font-weight: bold; font-size: 14pt; }
      .subheader { font-weight: bold; font-size: 12pt; margin-top: 10px; }
      .label { text-align: left; }
      .value { text-align: right; }
      .total-row { font-weight: bold; background-color: #dcfce7; border-top: 1px solid #000; }
      .grand-total { font-weight: bold; font-size: 14pt; background-color: #dcfce7; color: #000; }
    </style>
    </head>
    <body>
    <table>
      <tr><td colspan="3" class="header">โครงการ: ${currentBidding.project.name
      }</td></tr>
      <tr><td colspan="3" class="header">เจ้าของโครงการ: ${currentBidding.project.client
      }</td></tr>
      <tr><td></td></tr>
      <tr><td colspan="3" class="subheader">1. Direct Cost Breakdown</td></tr>
      <tr><td class="label">Material Cost</td><td class="value">${formatTHB(
        directCostSummary.matTotal
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Labour Cost</td><td class="value">${formatTHB(
        directCostSummary.labTotal
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Equipment Cost</td><td class="value">${formatTHB(
        directCostSummary.eqTotal
      )}</td><td>บาท</td></tr>
      <tr class="total-row"><td class="label">Total Direct Cost</td><td class="value">${formatTHB(
        directCostSummary.grandTotal
      )}</td><td>บาท</td></tr>
      <tr><td></td></tr>
      <tr><td colspan="3" class="subheader">2. Indirect Cost Breakdown</td></tr>
      <tr><td class="label">Staff Cost</td><td class="value">${formatTHB(
        timeBasedIndirect.staffCost
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Temporary Facility</td><td class="value">${formatTHB(
        timeBasedIndirect.accomCost
      )}</td><td>บาท</td></tr>
      <tr><td class="label">General Field Expense</td><td class="value">${formatTHB(
        timeBasedIndirect.genExpenseCost
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Insurances</td><td class="value">${formatTHB(
        timeBasedIndirect.insuranceTotal
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Safety Expense</td><td class="value">${formatTHB(
        timeBasedIndirect.safetyTotal
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Machinery (Indirect)</td><td class="value">${formatTHB(
        timeBasedIndirect.machineCost
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Bank Charges (Bond Fees)</td><td class="value">${formatTHB(
        financialIndirect.totalBankCharge
      )}</td><td>บาท</td></tr>
      <tr><td class="label">Tax (0.1%)</td><td class="value">${formatTHB(
        financialIndirect.taxCost
      )}</td><td>บาท</td></tr>
      <tr class="total-row"><td class="label">Total Indirect Cost</td><td class="value">${formatTHB(
        financialIndirect.grandTotalIndirect
      )}</td><td>บาท</td></tr>
      <tr><td></td></tr>
      <tr><td colspan="3" class="subheader">3. Total Cost Summary</td></tr>
      <tr><td class="label">1. Total Direct Cost</td><td class="value">${formatTHB(
        directCostSummary.grandTotal
      )}</td><td>บาท</td></tr>
      <tr><td class="label">2. Total Indirect Cost</td><td class="value">${formatTHB(
        financialIndirect.grandTotalIndirect
      )}</td><td>บาท</td></tr>
      <tr style="font-weight: bold; background-color: #f0fdf4;"><td class="label">3. Sub Total (1+2)</td><td class="value">${formatTHB(
        financialIndirect.subTotalBeforeOH
      )}</td><td>บาท</td></tr>
      <tr style="color: #ea580c;"><td class="label">4. Overhead & Profit (${currentBidding.financials.overheadProfitPct
      }%)</td><td class="value">${formatTHB(
        financialIndirect.ohProfitCost
      )}</td><td>บาท</td></tr>
      <tr class="grand-total"><td class="label">Grand Total (3+4)</td><td class="value">${formatTHB(
        totalProjectCost
      )}</td><td>บาท</td></tr>
    </table>
    </body>
    </html>
    `;

    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Cost_Report_${currentBidding.project.biddingNo}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDirectCostExcel = () => {
    const rows = buildDirectItemRows(currentBidding.directItems || []);

    // Pre-compute sub-item totals per main item
    const mainTotals = new Map<any, number>();
    rows.forEach((row: any) => {
      if (!row.isMain) {
        const parentId = row.item.parentId;
        const cost = (row.item.qty || 0) * ((row.item.matRate || 0) + (row.item.labRate || 0) + (row.item.eqRate || 0));
        mainTotals.set(parentId, (mainTotals.get(parentId) || 0) + cost);
      }
    });

    const rowsHtml = rows.map((row: any) => {
      const item = row.item;
      const cost = (item.qty || 0) * ((item.matRate || 0) + (item.labRate || 0) + (item.eqRate || 0));
      const subTotal = row.isMain && mainTotals.has(item.id) ? (mainTotals.get(item.id) ?? 0) : null;
      const displayCost = row.isMain && subTotal !== null ? subTotal : cost;

      if (row.isMain) {
        return `
        <tr style="background-color:#f1f5f9; font-weight:bold;">
          <td style="background-color:#e2e8f0;">${row.displayNo}</td>
          <td>${item.desc}</td>
          <td>${item.spec || '-'}</td>
          <td style="text-align:center">${item.unit}</td>
          <td style="text-align:right">${item.qty}</td>
          <td style="text-align:right">${item.matRate || ''}</td>
          <td style="text-align:right">${item.labRate || ''}</td>
          <td style="text-align:right">${item.eqRate || ''}</td>
          <td style="text-align:right; font-weight:bold">${displayCost.toLocaleString('th-TH', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>`;
      } else {
        return `
        <tr>
          <td style="padding-left:20px; color:#64748b;">${row.displayNo}</td>
          <td style="padding-left:20px;">${item.desc}</td>
          <td>${item.spec || '-'}</td>
          <td style="text-align:center">${item.unit}</td>
          <td style="text-align:right">${item.qty}</td>
          <td style="text-align:right; color:#1d4ed8">${item.matRate || ''}</td>
          <td style="text-align:right; color:#c2410c">${item.labRate || ''}</td>
          <td style="text-align:right; color:#7c3aed">${item.eqRate || ''}</td>
          <td style="text-align:right">${cost.toLocaleString('th-TH', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>`;
      }
    }).join("");

    let table = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
    <style>
      .header { font-weight: bold; font-size: 14pt; }
      .table-header { font-weight: bold; background-color: #334155; color: white; text-align: center; }
      td { border: 1px solid #cbd5e1; padding: 5px; font-size: 11pt; }
    </style>
    </head>
    <body>
    <table>
      <tr><td colspan="9" class="header">Direct Cost Breakdown: ${currentBidding.project.name}</td></tr>
      <tr><td colspan="9">Bidding No: ${currentBidding.project.biddingNo} &nbsp;&nbsp; Client: ${currentBidding.project.client}</td></tr>
      <tr><td></td></tr>
      <tr class="table-header">
        <td>#</td>
        <td>Description</td>
        <td>Spec</td>
        <td>Unit</td>
        <td>Qty</td>
        <td>Mat Rate</td>
        <td>Lab Rate</td>
        <td>Eq Rate</td>
        <td>Total Cost (฿)</td>
      </tr>
      ${rowsHtml}
      <tr><td></td></tr>
      <tr style="font-weight: bold; background-color:#dcfce7;">
        <td colspan="8" style="text-align: right;">Grand Total Direct Cost (฿)</td>
        <td style="text-align:right">${directCostSummary.grandTotal.toLocaleString('th-TH', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>
    </table>
    </body>
    </html>`;

    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Direct_Cost_${currentBidding.project.biddingNo}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 relative">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg text-blue-600 mb-4">
            <Calculator size={48} />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">
            CMG Cost Estimator
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            ระบบประมาณราคาก่อสร้างและจัดการต้นทุนโครงการ (Construction Cost
            Estimation)
          </p>
          <div className="flex justify-center items-center gap-2 text-xs text-orange-600 bg-orange-50 py-1 px-3 rounded-full w-fit mx-auto border border-orange-200">
            <Database size={12} /> Public Data Mode: Projects are shared across all users
          </div>
        </div>

        {biddings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-slate-200">
            <FolderOpen size={64} className="mx-auto text-slate-300 mb-6" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">
              ยังไม่มีโครงการในระบบ
            </h2>
            <p className="text-slate-500 mb-8">
              เริ่มต้นใช้งานโดยการสร้างโครงการใหม่
            </p>
            <button
              onClick={handleCreateNewProject}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
            >
              <Plus size={24} /> สร้างโครงการใหม่ (New Project)
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <FolderOpen className="text-blue-500" /> โครงการของคุณ (
                {biddings.length})
              </h2>
              <button
                onClick={handleCreateNewProject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow flex items-center gap-2 transition-all"
              >
                <Plus size={18} /> สร้างโครงการใหม่
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {biddings.map((bid) => (
                <div
                  key={bid.id}
                  onClick={() => setSelectedBiddingId(bid.id)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => duplicateBiddingInFirestore(bid.id, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Copy Project"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => deleteBiddingFromFirestore(bid.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className="font-mono text-xs text-slate-500">
                        {bid.project?.biddingNo}
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">
                        {bid.project?.name || "Untitled Project"}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-500 mt-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Users size={14} /> {bid.project?.client || "-"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> Duration:{" "}
                      {bid.project?.duration || 0} Months
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      Last Update:{" "}
                      {bid.updatedAt
                        ? new Date(
                          bid.updatedAt.seconds * 1000
                        ).toLocaleDateString()
                        : "New"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-2 left-2 text-xs text-slate-300 font-mono pointer-events-none z-50 opacity-60">
        {APP_VERSION}
      </div>
    </div>
  );

  const renderProjectInfo = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">
          ข้อมูลโครงการ (Project Information)
        </h2>
        {selectedBiddingId === "DRAFT" && (
          <button
            onClick={handleSaveDraftProject}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}{" "}
            บันทึกโครงการ (Save Project)
          </button>
        )}
      </div>
      <Card
        title="รายละเอียดทั่วไป"
        icon={Building2}
        action={
          <button
            onClick={handleClearProjectInfo}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} /> ล้างข้อมูล
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Bidding No.
            </label>
            <input
              type="text"
              className="w-full md:w-1/2 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-slate-50"
              value={currentBidding.project.biddingNo}
              onChange={(e) =>
                setProject({
                  ...currentBidding.project,
                  biddingNo: e.target.value,
                })
              }
              placeholder="Ex. CMG-BID-XX-XXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ชื่อโครงการ
            </label>
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentBidding.project.name}
              onChange={(e) =>
                setProject({ ...currentBidding.project, name: e.target.value })
              }
              placeholder="ระบุชื่อโครงการ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              เจ้าของโครงการ (Client)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentBidding.project.client}
              onChange={(e) =>
                setProject({
                  ...currentBidding.project,
                  client: e.target.value,
                })
              }
              placeholder="ระบุชื่อเจ้าของโครงการ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ระยะเวลาก่อสร้าง (เดือน)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentBidding.project.duration}
                onChange={(e) =>
                  setProject({
                    ...currentBidding.project,
                    duration: safeFloat(e.target.value),
                  })
                }
              />
              <span className="text-slate-500">เดือน</span>
            </div>
            <p className="text-xs text-orange-500 mt-1">
              *มีผลต่อการคำนวณค่าแรง Staff และค่าเช่าเครื่องจักร
            </p>
          </div>
        </div>
      </Card>

      {/* Bidding Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <span className="text-red-600 font-bold text-sm">Note: Bidding Document list</span>
        </div>
        <div className="p-4">
          <input
            type="file"
            ref={bidDocFileRef}
            onChange={handleBidDocFileUpload}
            multiple
            className="hidden"
          />
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-slate-700 text-sm">Bidding Document list</span>
            <button
              onClick={() => {
                const newDoc = { id: Date.now(), description: "", docType: "TOR", files: [] };
                setBiddingDocs((prev: any) => [...(prev || []), newDoc]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              + Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-green-100 text-slate-700 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-14">Item</th>
                  <th className="border border-slate-300 p-2 text-left">Description</th>
                  <th className="border border-slate-300 p-2 text-center w-44">Document Type</th>
                  <th className="border border-slate-300 p-2 text-left">Upload file</th>
                  <th className="border border-slate-300 p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(currentBidding.biddingDocs || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 p-4 text-center text-slate-400 text-xs">
                      ยังไม่มีรายการ กด + Add Item เพื่อเพิ่ม
                    </td>
                  </tr>
                ) : (
                  (currentBidding.biddingDocs || []).map((doc: any, idx: number) => (
                    <tr key={doc.id} className="hover:bg-slate-50 bg-orange-50">
                      <td className="border border-slate-300 p-2 text-center text-slate-600 font-mono text-xs">{idx + 1}</td>
                      <td className="border border-slate-300 p-2">
                        <input
                          type="text"
                          value={doc.description || ""}
                          onChange={(e) =>
                            setBiddingDocs((prev: any) =>
                              prev.map((d: any) => d.id === doc.id ? { ...d, description: e.target.value } : d)
                            )
                          }
                          className="w-full p-1 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                          placeholder="ระบุคำอธิบายเอกสาร"
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <select
                          value={doc.docType || "TOR"}
                          onChange={(e) =>
                            setBiddingDocs((prev: any) =>
                              prev.map((d: any) => d.id === doc.id ? { ...d, docType: e.target.value } : d)
                            )
                          }
                          className="w-full p-1 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        >
                          <option value="TOR">TOR</option>
                          <option value="Drawing">Drawing</option>
                          <option value="RFQ">RFQ</option>
                          <option value="Specification">Specification</option>
                          <option value="BOQ">BOQ</option>
                          <option value="ราคากลาง">ราคากลาง</option>
                          <option value="Project Over View">Project Over View</option>
                          <option value="other doc.">other doc.</option>
                        </select>
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              bidDocTargetIdRef.current = doc.id;
                              bidDocFileRef.current?.click();
                            }}
                            disabled={selectedBiddingId === "DRAFT"}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold self-start transition-colors ${
                              selectedBiddingId === "DRAFT"
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                            }`}
                            title={selectedBiddingId === "DRAFT" ? "บันทึกโครงการก่อนอัปโหลด" : "อัปโหลดไฟล์"}
                          >
                            <Paperclip size={11} /> อัปโหลด
                            {(doc.files || []).length > 0 && (
                              <span className="ml-1 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                                {(doc.files || []).length}
                              </span>
                            )}
                          </button>
                          {(doc.files || []).length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {(doc.files || []).map((f: any, fi: number) => (
                                <div key={fi} className="flex items-center gap-1 bg-blue-50 rounded px-1.5 py-0.5">
                                  <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:text-blue-800 underline truncate max-w-[200px]"
                                    title={f.name}
                                  >
                                    {f.name}
                                  </a>
                                  <button
                                    onClick={() =>
                                      setBiddingDocs((prev: any) =>
                                        prev.map((d: any) =>
                                          d.id === doc.id
                                            ? { ...d, files: d.files.filter((_: any, i: number) => i !== fi) }
                                            : d
                                        )
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 shrink-0 ml-auto text-xs"
                                    title="ลบไฟล์"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <button
                          onClick={() =>
                            setBiddingDocs((prev: any) => prev.filter((d: any) => d.id !== doc.id))
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="ลบแถวนี้"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setActiveMenu("direct")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          ถัดไป: Direct Cost <Truck size={18} />
        </button>
      </div>
    </div>
  );

  const renderDirectCost = () => {
    const { matTotal, labTotal, eqTotal, grandTotal } = directCostSummary;
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Direct Cost (ต้นทุนทางตรง)
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportDirectCostExcel}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm text-sm"
            >
              <FileSpreadsheet size={18} /> Export Excel
            </button>
            <button
              onClick={() => handleDownloadTemplate("direct")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-sm text-sm"
            >
              <Download size={18} /> Template
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Upload size={20} /> Upload CSV
            </button>
            <button
              onClick={handleAIEstimateAll}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all shadow-md ${isAnalyzing
                ? "bg-purple-300 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600"
                }`}
            >
              {isAnalyzing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Sparkles size={20} />
              )}
              {isAnalyzing
                ? "กำลังวิเคราะห์ราคา..."
                : "AI Auto Estimate (All Items)"}
            </button>
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold border border-emerald-200">
              Total: {formatTHB(grandTotal)}
            </div>
          </div>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
              <tr>
                <th className="p-3 w-10">#</th>
                <th className="p-3 w-64">Description</th>
                <th className="p-3">Spec</th>
                <th className="p-3 w-16 text-center">Unit</th>
                <th className="p-3 w-32 text-center">Qty</th>
                <th className="p-3 w-32 bg-blue-50 text-blue-800 text-right">
                  MAT. Rate
                </th>
                <th className="p-3 w-32 bg-orange-50 text-orange-800 text-right">
                  LAB. Rate
                </th>
                <th className="p-3 w-32 bg-purple-50 text-purple-800 text-right">
                  EQ. Rate
                </th>
                <th className="p-3 w-32 text-right">Total Cost</th>
                <th className="p-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {directItemRows.map((row: any) => {
                const item = row.item;
                return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50 group ${row.isMain ? "bg-slate-50/60" : ""}`}
                >
                  <td className="p-3 text-slate-400 font-semibold">{row.displayNo}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) =>
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "desc",
                          e.target.value
                        )
                      }
                      className={`w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none ${row.isMain ? "font-semibold" : "pl-6"}`}
                      placeholder={row.isMain ? "ระบุ Main item..." : "ระบุ Sub item..."}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.spec}
                      onChange={(e) =>
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "spec",
                          e.target.value
                        )
                      }
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                      placeholder="ระบุสเปก..."
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "unit",
                          e.target.value
                        )
                      }
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-center"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.qty === 0 ? "" : (item._qtyInput !== undefined ? item._qtyInput : Number(item.qty).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }))}
                      onBlur={() => {
                        // When blurring, format it back to the clean comma version.
                        const num = safeFloat(item._qtyInput !== undefined ? item._qtyInput : item.qty);
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "qty",
                          num
                        );
                        handleInputChange(setDirectItems, item.id, "_qtyInput", undefined); // Clear temp
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow typing decimals and commas
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "_qtyInput",
                          val
                        );
                        // Also update real parsed qty immediately for total calculations
                        handleInputChange(
                          setDirectItems,
                          item.id,
                          "qty",
                          safeFloat(val.replace(/,/g, ""))
                        );
                      }}
                      className="w-full bg-transparent border p-1 rounded text-right font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-3 bg-blue-50/50">
                    <input
                      type="text"
                      value={item.matRate === 0 && !item._matRateInput ? "" : (item._matRateInput !== undefined ? item._matRateInput : Number(item.matRate).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }))}
                      onBlur={() => {
                        const num = safeFloat(item._matRateInput !== undefined ? item._matRateInput : item.matRate);
                        handleInputChange(setDirectItems, item.id, "matRate", num);
                        handleInputChange(setDirectItems, item.id, "_matRateInput", undefined);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange(setDirectItems, item.id, "_matRateInput", val);
                        handleInputChange(setDirectItems, item.id, "matRate", safeFloat(val.replace(/,/g, "")));
                      }}
                      className="w-full bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none text-right placeholder-blue-300"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-3 bg-orange-50/50">
                    <input
                      type="text"
                      value={item.labRate === 0 && !item._labRateInput ? "" : (item._labRateInput !== undefined ? item._labRateInput : Number(item.labRate).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }))}
                      onBlur={() => {
                        const num = safeFloat(item._labRateInput !== undefined ? item._labRateInput : item.labRate);
                        handleInputChange(setDirectItems, item.id, "labRate", num);
                        handleInputChange(setDirectItems, item.id, "_labRateInput", undefined);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange(setDirectItems, item.id, "_labRateInput", val);
                        handleInputChange(setDirectItems, item.id, "labRate", safeFloat(val.replace(/,/g, "")));
                      }}
                      className="w-full bg-transparent border-b border-orange-200 focus:border-orange-500 outline-none text-right placeholder-orange-300"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-3 bg-purple-50/50">
                    <input
                      type="text"
                      value={item.eqRate === 0 && !item._eqRateInput ? "" : (item._eqRateInput !== undefined ? item._eqRateInput : Number(item.eqRate).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }))}
                      onBlur={() => {
                        const num = safeFloat(item._eqRateInput !== undefined ? item._eqRateInput : item.eqRate);
                        handleInputChange(setDirectItems, item.id, "eqRate", num);
                        handleInputChange(setDirectItems, item.id, "_eqRateInput", undefined);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange(setDirectItems, item.id, "_eqRateInput", val);
                        handleInputChange(setDirectItems, item.id, "eqRate", safeFloat(val.replace(/,/g, "")));
                      }}
                      className="w-full bg-transparent border-b border-purple-200 focus:border-purple-500 outline-none text-right placeholder-purple-300"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700">
                    {formatTHB(
                      (item.qty || 0) *
                      ((item.matRate || 0) +
                        (item.labRate || 0) +
                        (item.eqRate || 0))
                    )}
                  </td>
                  <td className="p-3 flex items-center justify-center gap-2">
                    {row.isMain && (
                      <button
                        onClick={() => handleAddDirectSubItem(item.id)}
                        className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-full transition-colors"
                        title="Add Sub Item"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEstimateRate(item.id)}
                      className="p-1.5 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-full transition-colors"
                      title="Estimate Unit Rate"
                    >
                      <Wand2 size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveDirectItem(item.id)}
                      className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleAddDirectMainItem}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={18} /> เพิ่ม Main Item
            </button>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-blue-600 text-sm">Material Cost</p>
            <p className="text-xl font-bold text-blue-800">
              {formatTHB(matTotal)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <p className="text-orange-600 text-sm">Labor Cost</p>
            <p className="text-xl font-bold text-orange-800">
              {formatTHB(labTotal)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-purple-600 text-sm">Equipment Cost</p>
            <p className="text-xl font-bold text-purple-800">
              {formatTHB(eqTotal)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderIndirectTable = (
    title: any,
    items: any,
    setter: any,
    template: any,
    keyField: any = "item",
    enabled: any,
    setEnabled: any
  ) => {
    const inputId = `csv-upload-${title.replace(/\s+/g, "-").toLowerCase()}`;
    const isInsurance = title.includes("Insurances");
    let templateType = "general";
    if (title.includes("Staff")) templateType = "staff";
    else if (isInsurance) templateType = "insurance";
    else if (title.includes("Machinery")) templateType = "machinery";

    return (
      <Card
        title={title}
        className="mb-6"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnabled(!enabled)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors mr-2 ${enabled
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}{" "}
              {enabled ? "ใช้งาน (Active)" : "ไม่ใช้งาน (Inactive)"}
            </button>
            <div
              className={`flex items-center gap-2 ${enabled ? "" : "opacity-50 pointer-events-none"
                }`}
            >
              <button
                onClick={() => handleDownloadTemplate(templateType)}
                className="flex items-center gap-1 text-slate-500 hover:text-blue-600 text-xs px-2 py-1 rounded border border-slate-200 hover:border-blue-200 transition-all"
              >
                <Download size={14} /> Template
              </button>
              <input
                type="file"
                id={inputId}
                onChange={(e) =>
                  handleUploadIndirectCSV(
                    e,
                    setter,
                    isInsurance ? "insurance" : keyField
                  )
                }
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={() => document.getElementById(inputId)?.click()}
                className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 text-xs px-2 py-1 rounded border border-slate-200 hover:border-emerald-200 transition-all"
              >
                <Upload size={14} /> Upload CSV
              </button>
            </div>
          </div>
        }
      >
        <div
          className={`transition-opacity duration-200 ${enabled ? "" : "opacity-50 pointer-events-none grayscale"
            }`}
        >
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">รายการ (Item)</th>
                <th className="p-2 w-24 text-center">จำนวน (Qty)</th>
                {isInsurance ? (
                  <>
                    <th className="p-2 w-32 text-center">Lot (Unit)</th>
                    <th className="p-2 w-32 text-right">ราคา (Cost)</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 w-32 text-right">ราคา/เดือน (Rate)</th>
                    <th className="p-2 w-24 text-center">ระยะเวลา (เดือน)</th>
                  </>
                )}
                <th className="p-2 w-32 text-right">รวม (Total)</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(items || []).map((item: any) => (
                <tr key={item.id}>
                  <td className="p-2">
                    <input
                      value={item[keyField]}
                      onChange={(e) =>
                        handleInputChange(
                          setter,
                          item.id,
                          keyField,
                          e.target.value
                        )
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleInputChange(
                          setter,
                          item.id,
                          "qty",
                          safeFloat(e.target.value)
                        )
                      }
                      className="w-full text-center bg-slate-50 border rounded p-1"
                    />
                  </td>
                  {isInsurance ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit || "Lot"}
                          onChange={(e) =>
                            handleInputChange(
                              setter,
                              item.id,
                              "unit",
                              e.target.value
                            )
                          }
                          className="w-full text-center bg-slate-50 border rounded p-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleInputChange(
                              setter,
                              item.id,
                              "rate",
                              safeFloat(e.target.value)
                            )
                          }
                          className="w-full text-right bg-slate-50 border rounded p-1"
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleInputChange(
                              setter,
                              item.id,
                              "rate",
                              safeFloat(e.target.value)
                            )
                          }
                          className="w-full text-right bg-slate-50 border rounded p-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={
                            item.duration !== undefined &&
                              item.duration !== null
                              ? item.duration
                              : currentBidding.project.duration
                          }
                          onChange={(e) =>
                            handleInputChange(
                              setter,
                              item.id,
                              "duration",
                              safeFloat(e.target.value)
                            )
                          }
                          className={`w-full text-center border rounded p-1 ${item.duration !== undefined &&
                            item.duration !== null
                            ? "bg-white"
                            : "bg-slate-50 text-slate-500"
                            }`}
                          placeholder={currentBidding.project.duration}
                        />
                      </td>
                    </>
                  )}
                  <td className="p-2 text-right font-medium">
                    {formatTHB(
                      (item.qty || 0) *
                      (item.rate || 0) *
                      (isInsurance
                        ? 1
                        : item.duration !== undefined &&
                          item.duration !== null
                          ? safeFloat(item.duration)
                          : safeFloat(currentBidding.project.duration))
                    )}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleRemoveRow(setter, item.id)}
                      className="text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <button
              onClick={() => handleAddRow(setter, template)}
              className="text-blue-600 text-xs flex items-center gap-1"
            >
              <Plus size={14} /> เพิ่มรายการ
            </button>
          </div>
        </div>
      </Card>
    );
  };

  const renderIndirectCost = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800">
          Indirect Cost (ต้นทุนทางอ้อม)
        </h2>
        {renderIndirectTable(
          "3.1 บุคลากร (Indirect Staff)",
          currentBidding.staff,
          setStaff,
          { position: "ตำแหน่งใหม่", qty: 1, rate: 20000, duration: null },
          "position",
          currentBidding.staffEnabled,
          setStaffEnabled
        )}
        {renderIndirectTable(
          "3.2 Temporary Facility",
          currentBidding.accommodation,
          setAccommodation,
          { item: "รายการใหม่", qty: 1, rate: 5000, duration: null },
          "item",
          currentBidding.accommodationEnabled,
          setAccommodationEnabled
        )}
        {renderIndirectTable(
          "3.3 General Field Expense (รายจ่ายประจำโดยทั่วไป)",
          currentBidding.generalExpense,
          setGeneralExpense,
          { item: "รายการใหม่", qty: 1, rate: 3000, duration: null },
          "item",
          currentBidding.generalExpenseEnabled,
          setGeneralExpenseEnabled
        )}
        {renderIndirectTable(
          "3.4 Insurances (ค่าประกันภัยต่างๆ)",
          currentBidding.insuranceData,
          setInsuranceData,
          { item: "รายการใหม่", qty: 1, unit: "Lot", rate: 1000, duration: 1 },
          "item",
          currentBidding.insuranceDataEnabled,
          setInsuranceDataEnabled
        )}
        {renderIndirectTable(
          "3.5 Safety Expense (ค่าใช้จ่ายในด้านความปลอดภัยต่างๆ)",
          currentBidding.safetyExpense,
          setSafetyExpense,
          { item: "รายการใหม่", qty: 1, rate: 1000, duration: null },
          "item",
          currentBidding.safetyExpenseEnabled,
          setSafetyExpenseEnabled
        )}
        {renderIndirectTable(
          "3.6 เครื่องจักร (Machinery - Time Based)",
          currentBidding.machinery,
          setMachinery,
          { item: "เครื่องจักรใหม่", qty: 1, rate: 10000, duration: null },
          "item",
          currentBidding.machineryEnabled,
          setMachineryEnabled
        )}

        <Card
          title="3.7 - 3.9 ค่าธรรมเนียม ธนาคาร/ภาษี/กำไร (Financials)"
          icon={DollarSign}
          action={
            <button
              onClick={() =>
                setFinancials({
                  ...currentBidding.financials,
                  enabled: !currentBidding.financials.enabled,
                })
              }
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${currentBidding.financials.enabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
                }`}
            >
              {currentBidding.financials.enabled ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}{" "}
              {currentBidding.financials.enabled
                ? "ใช้งาน (Active)"
                : "ไม่ใช้งาน (Inactive)"}
            </button>
          }
        >
          <div
            className={`transition-opacity duration-200 ${currentBidding.financials.enabled
              ? ""
              : "opacity-50 pointer-events-none grayscale"
              }`}
          >
            {/* Contract Amount */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-semibold text-slate-700 whitespace-nowrap">Contract</span>
              <input
                type="text"
                value={
                  currentBidding.financials.contractAmount
                    ? safeFloat(currentBidding.financials.contractAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : ""
                }
                placeholder={(directCostSummary.grandTotal + timeBasedIndirect.subTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFinancials({
                    ...currentBidding.financials,
                    contractAmount: safeFloat(e.target.value.replace(/,/g, "")),
                  })
                }
                className="w-52 border-2 border-orange-300 bg-orange-50 p-2 rounded text-right font-medium focus:border-orange-500 focus:outline-none"
              />
              <span className="text-slate-500 font-medium">THB</span>
            </div>

            {/* + Add Item */}
            <button
              onClick={() => {
                const items = currentBidding.financials.bondItems || [];
                const maxId = items.reduce((m: number, b: any) => Math.max(m, b.id || 0), 0);
                setFinancials({
                  ...currentBidding.financials,
                  bondItems: [
                    ...items,
                    { id: maxId + 1, name: "New bond", contractPct: 0, premiumPct: 0, interestPctYear: 2, months: 12 },
                  ],
                });
              }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-3"
            >
              <Plus size={16} /> Add item
            </button>

            {/* Bond Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-gray-400 bg-white px-2 py-1 w-8">Item</th>
                    <th colSpan={3} className="border border-gray-400 bg-white px-2 py-1 text-center">Type of Bond</th>
                    <th colSpan={2} className="border border-gray-400 bg-green-100 px-2 py-1 text-center">Premium front free</th>
                    <th colSpan={3} className="border border-gray-400 bg-orange-100 px-2 py-1 text-center">Interest</th>
                    <th rowSpan={2} className="border border-gray-400 bg-white px-2 py-1 text-center w-28">Total</th>
                    <th rowSpan={2} className="border border-gray-400 bg-white px-1 py-1 w-8"></th>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-white px-2 py-1 text-center"></th>
                    <th className="border border-gray-400 bg-white px-2 py-1 text-center">% of Contract</th>
                    <th className="border border-gray-400 bg-white px-2 py-1 text-center">Amount</th>
                    <th className="border border-gray-400 bg-green-100 px-2 py-1 text-center">%</th>
                    <th className="border border-gray-400 bg-green-100 px-2 py-1 text-center">Amount</th>
                    <th className="border border-gray-400 bg-orange-100 px-2 py-1 text-center">%/year</th>
                    <th className="border border-gray-400 bg-orange-100 px-2 py-1 text-center">Nos. Month</th>
                    <th className="border border-gray-400 bg-orange-100 px-2 py-1 text-center">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentBidding.financials.bondItems || []).map((item: any, idx: number) => {
                    const contractAmt = safeFloat(currentBidding.financials.contractAmount) || (directCostSummary.grandTotal + timeBasedIndirect.subTotal);
                    const bondAmount = contractAmt * (safeFloat(item.contractPct) / 100);
                    const premiumAmount = bondAmount * (safeFloat(item.premiumPct) / 100);
                    const interestAmount = bondAmount * (safeFloat(item.interestPctYear) / 100) * (safeFloat(item.months) / 12);
                    const rowTotal = premiumAmount + interestAmount;

                    const updateBondItem = (field: string, value: any) => {
                      const items = [...(currentBidding.financials.bondItems || [])];
                      items[idx] = { ...items[idx], [field]: value };
                      setFinancials({ ...currentBidding.financials, bondItems: items });
                    };

                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-400 px-2 py-1 text-center">{idx + 1}</td>
                        {/* Name + % of Contract + Amount */}
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateBondItem("name", e.target.value)}
                            className="w-full bg-transparent focus:outline-none px-1"
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="number"
                            value={item.contractPct}
                            onChange={(e) => updateBondItem("contractPct", safeFloat(e.target.value))}
                            className="w-16 border border-orange-300 bg-orange-50 p-1 rounded text-center focus:border-orange-500 focus:outline-none"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-1 text-right font-mono">
                          {bondAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {/* Premium */}
                        <td className="border border-gray-400 px-1 py-1 bg-green-50">
                          <input
                            type="number"
                            value={item.premiumPct}
                            onChange={(e) => updateBondItem("premiumPct", safeFloat(e.target.value))}
                            className="w-14 border border-orange-300 bg-orange-50 p-1 rounded text-center focus:border-orange-500 focus:outline-none"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-1 text-right font-mono bg-green-50">
                          {premiumAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {/* Interest */}
                        <td className="border border-gray-400 px-1 py-1 bg-orange-50">
                          <input
                            type="number"
                            value={item.interestPctYear}
                            onChange={(e) => updateBondItem("interestPctYear", safeFloat(e.target.value))}
                            className="w-16 border border-orange-300 bg-orange-50 p-1 rounded text-center focus:border-orange-500 focus:outline-none"
                            step="0.1"
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1 bg-orange-50">
                          <input
                            type="number"
                            value={item.months}
                            onChange={(e) => updateBondItem("months", safeFloat(e.target.value))}
                            className="w-14 border border-orange-300 bg-orange-50 p-1 rounded text-center focus:border-orange-500 focus:outline-none"
                          />
                        </td>
                        {/* Interest Amount */}
                        <td className="border border-gray-400 px-2 py-1 text-right font-mono bg-orange-50">
                          {interestAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {/* Total = Premium Amount + Interest Amount */}
                        <td className="border border-gray-400 px-2 py-1 text-right font-mono font-semibold">
                          {rowTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {/* Delete */}
                        <td className="border border-gray-400 px-1 py-1 text-center">
                          <button
                            onClick={() => {
                              const items = (currentBidding.financials.bondItems || []).filter((_: any, i: number) => i !== idx);
                              setFinancials({ ...currentBidding.financials, bondItems: items });
                            }}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Grand Total Row */}
                  <tr className="bg-emerald-50 font-bold">
                    <td colSpan={10} className="border border-gray-400 px-2 py-2 text-right">Grand total</td>
                    <td className="border border-gray-400 px-2 py-2 text-right font-mono text-emerald-700">
                      {financialIndirect.totalBankCharge.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setFinancials({
                      ...currentBidding.financials,
                      taxEnabled: !currentBidding.financials.taxEnabled,
                    })
                  }
                  className={`p-1 rounded-full ${currentBidding.financials.taxEnabled !== false
                    ? "text-emerald-600"
                    : "text-slate-400"
                    }`}
                >
                  {currentBidding.financials.taxEnabled !== false ? (
                    <ToggleRight size={18} />
                  ) : (
                    <ToggleLeft size={18} />
                  )}
                </button>
                <span>Tax (อากรแสตมป์ 0.1%):</span>
              </div>
              <span className="font-medium">
                {formatTHB(financialIndirect.taxCost)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderReport = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold mb-2">Total Project Cost</h2>
          <p className="opacity-80">
            {currentBidding.project.name} ({currentBidding.project.duration}{" "}
            เดือน)
          </p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-sm opacity-60 mb-1">Estimated Grand Total</p>
          <p className="text-4xl font-bold text-emerald-400">
            {formatTHB(totalProjectCost)}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 print:hidden">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <FileSpreadsheet size={20} /> Export Excel
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Printer size={20} /> Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        <Card title="1. Direct Cost Breakdown" className="h-full">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr>
                <td className="py-3">Material Cost</td>
                <td className="py-3 text-right font-medium">
                  {formatTHB(directCostSummary.matTotal)}
                </td>
              </tr>
              <tr>
                <td className="py-3">Labor Cost</td>
                <td className="py-3 text-right font-medium">
                  {formatTHB(directCostSummary.labTotal)}
                </td>
              </tr>
              <tr>
                <td className="py-3">Equipment Cost</td>
                <td className="py-3 text-right font-medium">
                  {formatTHB(directCostSummary.eqTotal)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="py-3 pl-2">Total Direct Cost</td>
                <td className="py-3 text-right pr-2">
                  {formatTHB(directCostSummary.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card title="2. Indirect Cost Breakdown" className="h-full">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr>
                <td className="py-2">Staff Cost</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.staffCost)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Temporary Facility</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.accomCost)}
                </td>
              </tr>
              <tr>
                <td className="py-2">General Field Expense</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.genExpenseCost)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Insurances</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.insuranceTotal)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Safety Expense</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.safetyTotal)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Machinery (Indirect)</td>
                <td className="py-2 text-right">
                  {formatTHB(timeBasedIndirect.machineCost)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500">
                  Bank Charges (Bond Fees)
                </td>
                <td className="py-2 text-right text-slate-500">
                  {formatTHB(financialIndirect.totalBankCharge)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500">Insurance & Tax</td>
                <td className="py-2 text-right text-slate-500">
                  {formatTHB(
                    financialIndirect.insuranceCost + financialIndirect.taxCost
                  )}
                </td>
              </tr>
              {/* Removed OH&P Row from here */}
              <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <td className="py-3 pl-2">Total Indirect Cost</td>
                <td className="py-3 text-right pr-2">
                  {formatTHB(financialIndirect.grandTotalIndirect)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {/* NEW: 3. Total Cost Summary Section */}
      <Card title="3. Total Cost Summary" className="print:hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr>
              <td className="py-3 pl-4">1. Total Direct Cost</td>
              <td className="py-3 text-right pr-4 font-medium">
                {formatTHB(directCostSummary.grandTotal)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pl-4">2. Total Indirect Cost</td>
              <td className="py-3 text-right pr-4 font-medium">
                {formatTHB(financialIndirect.grandTotalIndirect)}
              </td>
            </tr>
            <tr className="bg-[#dcfce7] font-bold text-lg text-emerald-900 border-t border-b border-emerald-100">
              <td className="py-4 pl-4">3. Sub Total (1+2)</td>
              <td className="py-4 text-right pr-4">
                {formatTHB(financialIndirect.subTotalBeforeOH)}
              </td>
            </tr>
            <tr className="bg-orange-50">
              <td className="py-4 pl-4 flex items-center gap-3">
                <span className="font-bold text-orange-800">
                  4. Overhead & Profit (%):
                </span>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-orange-200">
                  <input
                    type="number"
                    value={currentBidding.financials.overheadProfitPct}
                    onChange={(e) =>
                      setFinancials({
                        ...currentBidding.financials,
                        overheadProfitPct: safeFloat(e.target.value),
                      })
                    }
                    className="w-16 text-center font-bold outline-none text-orange-700"
                  />
                  <span className="font-bold text-orange-800">%</span>
                </div>
              </td>
              <td className="py-4 text-right pr-4 font-bold text-orange-700">
                {formatTHB(financialIndirect.ohProfitCost)}
              </td>
            </tr>
            <tr className="bg-slate-800 text-white font-bold text-xl">
              <td className="py-5 pl-4">Grand Total (3+4)</td>
              <td className="py-5 text-right pr-4">
                {formatTHB(totalProjectCost)}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="Cost Analysis Ratio" className="print:hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-4">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">
              Direct vs Indirect
            </div>
            <div className="text-2xl font-bold text-slate-700">
              {Math.round(
                (directCostSummary.grandTotal / totalProjectCost) * 100
              )}{" "}
              :{" "}
              {Math.round(
                (financialIndirect.grandTotalIndirect / totalProjectCost) * 100
              )}
            </div>
          </div>
          <div className="h-12 w-px bg-slate-200 hidden md:block"></div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Material Ratio</div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                (directCostSummary.matTotal / totalProjectCost) * 100
              )}
              %
            </div>
          </div>
          <div className="h-12 w-px bg-slate-200 hidden md:block"></div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Labor Ratio</div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(
                (directCostSummary.labTotal / totalProjectCost) * 100
              )}
              %
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAttachmentFile = () => {
    const renderAttachSection = (
      title: string,
      items: any[],
      setter: any,
      type: "direct" | "indirect"
    ) => (
      <div className="mb-6">
        <div className="flex justify-between items-center px-3 py-2 bg-[#f5f500] border border-yellow-500">
          <span className="font-bold text-sm text-slate-900">{title}</span>
          <button
            onClick={() =>
              handleAddRow(setter, { refItem: "", description: "", files: [] })
            }
            className="text-sm font-semibold text-slate-800 hover:text-blue-700 transition-colors"
          >
            + Add Item
          </button>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#fef08a]">
              <th className="p-2 border border-yellow-400 text-left font-bold text-slate-800 w-32">Ref.Item</th>
              <th className="p-2 border border-yellow-400 text-center font-bold text-slate-800">Description</th>
              <th className="p-2 border border-yellow-400 text-center font-bold text-slate-800 w-56">Upload file</th>
              <th className="p-2 border border-yellow-400 text-center font-bold text-slate-800 w-14"></th>
            </tr>
          </thead>
          <tbody>
            {(items || []).length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-slate-400 bg-[#fefce8] border border-yellow-200 italic text-sm"
                >
                  ไม่มีรายการ — กด + Add Item เพื่อเพิ่ม
                </td>
              </tr>
            )}
            {(items || []).map((item: any) => (
              <tr key={item.id} className="bg-[#fefce8] hover:bg-yellow-100 group">
                <td className="p-2 border border-yellow-300">
                  <input
                    type="text"
                    value={item.refItem}
                    onChange={(e) =>
                      handleInputChange(setter, item.id, "refItem", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-transparent focus:border-yellow-500 outline-none text-slate-800"
                    placeholder="Ref..."
                  />
                </td>
                <td className="p-2 border border-yellow-300">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleInputChange(setter, item.id, "description", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-transparent focus:border-yellow-500 outline-none text-slate-800"
                    placeholder="รายละเอียด..."
                  />
                </td>
                <td className="p-2 border border-yellow-300">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        attachTargetRef.current = { type, id: item.id };
                        attachFileRef.current?.click();
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-semibold transition-colors self-start"
                    >
                      <Paperclip size={12} /> เลือกไฟล์
                      {(item.files || []).length > 0 && (
                        <span className="ml-1 bg-slate-800 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                          {(item.files || []).length}
                        </span>
                      )}
                    </button>
                    {(item.files || []).length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {item.files.map((file: {name: string, url: string}, fi: number) => (
                          <div key={fi} className="flex items-center gap-1 bg-yellow-100 rounded px-1.5 py-0.5">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-800 truncate max-w-[140px] underline cursor-pointer"
                              title={`เปิด ${file.name} ในแท็บใหม่`}
                            >
                              {file.name}
                            </a>
                            <button
                              onClick={() =>
                                setter((prev: any) =>
                                  prev.map((it: any) =>
                                    it.id === item.id
                                      ? { ...it, files: it.files.filter((_: any, idx: number) => idx !== fi) }
                                      : it
                                  )
                                )
                              }
                              className="text-red-400 hover:text-red-600 shrink-0 ml-auto"
                              title="ลบไฟล์นี้"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 border border-yellow-300 text-center">
                  <button
                    onClick={() => handleRemoveRow(setter, item.id)}
                    className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Attachment File (เอกสารแนบ)</h2>
          <button
            onClick={() => saveToFirestore(currentBidding)}
            disabled={isSaving || selectedBiddingId === "DRAFT"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedBiddingId === "DRAFT"
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : isSaving
                  ? "bg-blue-300 text-white cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save
              </>
            )}
          </button>
        </div>
        <input
          type="file"
          ref={attachFileRef}
          onChange={handleAttachmentFileChange}
          multiple
          className="hidden"
        />
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          {renderAttachSection(
            "1. Direct Cost Attachment",
            currentBidding.directAttachments || [],
            setDirectAttachments,
            "direct"
          )}
          {renderAttachSection(
            "2. Indirect Cost Attachment",
            currentBidding.indirectAttachments || [],
            setIndirectAttachments,
            "indirect"
          )}
        </div>
      </div>
    );
  };

  // Sidebar Menu Map
  const MENU_LABELS = {
    project: "1. ข้อมูลโครงการ",
    direct: "2. Direct Cost",
    indirect: "3. Indirect Cost",
    report: "4. Total Cost Report",
    attachment: "5. Attachment file",
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10 print:hidden">
      <div className="p-6 border-b border-slate-800">
        <button
          onClick={() => setSelectedBiddingId(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <h1
          className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent truncate"
          title={currentBidding.project.name}
        >
          {currentBidding.project.biddingNo}
        </h1>
        {/* Conditional Save Status */}
        <div className="flex items-center gap-2 mt-2">
          {selectedBiddingId === "DRAFT" ? (
            <span className="text-xs text-orange-400 flex items-center gap-1 font-bold">
              Unsaved Draft
            </span>
          ) : isSaving ? (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Saving...
            </span>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Cloud size={10} /> Saved
            </span>
          )}
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {Object.keys(MENU_LABELS).map((key) => (
          <button
            key={key}
            onClick={() => setActiveMenu(key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeMenu === key
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            {key === "project" && <Building2 size={20} />}
            {key === "direct" && <HardHat size={20} />}
            {key === "indirect" && <Briefcase size={20} />}
            {key === "report" && <FileText size={20} />}
            {key === "attachment" && <Paperclip size={20} />}
            <span className="font-medium capitalize">{MENU_LABELS[key as keyof typeof MENU_LABELS]}</span>
          </button>
        ))}
      </nav>
      {/* Sidebar Version Label */}
      <div className="p-4 text-xs text-slate-600 text-center font-mono opacity-50">
        {APP_VERSION}
      </div>
    </div>
  );

  // 1. Initial Loading State
  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-slate-600">
          Loading Public Project Data...
        </span>
      </div>
    );
  }

  // 2. Dashboard View (When no project is selected)
  if (!selectedBiddingId) {
    return renderDashboard();
  }

  // 3. Project Editor View (When a project IS selected)
  if (!currentBidding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-slate-600">Loading Project...</span>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      {renderSidebar()}

      {/* Printable Report Section (Hidden by default, Visible on print) */}
      <div className="hidden print:block p-8 bg-white text-black font-sans w-full">
        <div className="mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            สรุปผลการประมาณราคา (Project Cost Summary)
          </h1>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex">
              <span className="w-40 font-bold">โครงการ:</span>{" "}
              <span>{currentBidding.project.name}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-bold">เจ้าของโครงการ:</span>{" "}
              <span>{currentBidding.project.client}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-bold">Bidding No.:</span>{" "}
              <span>{currentBidding.project.biddingNo}</span>
            </div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
          {/* Direct Cost */}
          <thead>
            <tr className="bg-gray-100 text-left">
              <th colSpan={2} className="p-2 border border-gray-300 font-bold">
                1. Direct Cost Breakdown
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300">Material Cost</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(directCostSummary.matTotal)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Labour Cost</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(directCostSummary.labTotal)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Equipment Cost</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(directCostSummary.eqTotal)} บาท
              </td>
            </tr>
            <tr className="bg-[#dcfce7] font-bold">
              <td className="p-2 border border-gray-300">Total Direct Cost</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(directCostSummary.grandTotal)} บาท
              </td>
            </tr>
          </tbody>

          {/* Indirect Cost */}
          <thead>
            <tr className="bg-gray-100 text-left">
              <th
                colSpan={2}
                className="p-2 border border-gray-300 font-bold mt-4"
              >
                2. Indirect Cost Breakdown
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300">Staff Cost</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.staffCost)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Temporary Facility</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.accomCost)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">
                General Field Expense
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.genExpenseCost)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Insurances</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.insuranceTotal)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Safety Expense</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.safetyTotal)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">
                Machinery (Indirect)
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(timeBasedIndirect.machineCost)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">
                Bank Charges (Bond Fees)
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(financialIndirect.totalBankCharge)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">Tax & OH</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(financialIndirect.taxCost)} บาท
              </td>
            </tr>
            <tr className="bg-[#dcfce7] font-bold">
              <td className="p-2 border border-gray-300">
                Total Indirect Cost
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(financialIndirect.grandTotalIndirect)} บาท
              </td>
            </tr>
          </tbody>

          {/* Grand Total Section */}
          <thead>
            <tr className="bg-gray-100 text-left">
              <th
                colSpan={2}
                className="p-2 border border-gray-300 font-bold mt-4"
              >
                3. Total Cost Summary
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300">
                1. Total Direct Cost
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(directCostSummary.grandTotal)} บาท
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300">
                2. Total Indirect Cost
              </td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(financialIndirect.grandTotalIndirect)} บาท
              </td>
            </tr>
            <tr className="bg-[#dcfce7] font-bold">
              <td className="p-2 border border-gray-300">3. Sub Total (1+2)</td>
              <td className="p-2 border border-gray-300 text-right">
                {formatTHB(financialIndirect.subTotalBeforeOH)} บาท
              </td>
            </tr>
            <tr className="bg-orange-50">
              <td className="p-2 border border-gray-300 font-bold text-orange-800">
                4. Overhead & Profit (
                {currentBidding.financials.overheadProfitPct}%)
              </td>
              <td className="p-2 border border-gray-300 text-right font-bold text-orange-800">
                {formatTHB(financialIndirect.ohProfitCost)} บาท
              </td>
            </tr>
            <tr className="bg-slate-800 text-white font-bold text-lg">
              <td className="p-3 border border-gray-300">Grand Total (3+4)</td>
              <td className="p-3 border border-gray-300 text-right">
                {formatTHB(totalProjectCost)} บาท
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 text-xs text-gray-500 text-right">
          Printed from CMG Estimation Hub on{" "}
          {new Date().toLocaleDateString("th-TH")}
        </div>
      </div>

      <main className="flex-1 ml-64 p-8 print:hidden">
        {activeMenu === "project" && renderProjectInfo()}
        {activeMenu === "direct" && renderDirectCost()}
        {activeMenu === "indirect" && renderIndirectCost()}
        {activeMenu === "report" && renderReport()}
        {activeMenu === "attachment" && renderAttachmentFile()}
      </main>

      {/* Fixed Bottom Left Version Label v.2.6 */}
      <div className="fixed bottom-2 left-2 text-xs text-slate-300 font-mono pointer-events-none z-50 opacity-60">
        {APP_VERSION}
      </div>
    </div>
  );
}

