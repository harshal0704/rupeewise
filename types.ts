export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
  paymentMethod: 'UPI' | 'Card' | 'Cash' | 'NetBanking' | 'Other';
}

export interface InvestmentScenario {
  monthlyInvestment: number;
  years: number;
  expectedReturnRate: number;
  inflationRate: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export enum TaxRegime {
  OLD = 'Old Regime',
  NEW = 'New Regime'
}

export interface TaxDetails {
  grossIncome: number;
  deductions: number; // 80C, 80D, etc. (Relevant for Old)
  regime: TaxRegime;
}

export interface SimulationResult {
  year: number;
  investedAmount: number;
  wealth: number;
  purchasingPower: number;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface TradeCharges {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalTax: number;
  totalAmount: number;
}

// ═══════════════════════════════════════════════
// CA SYSTEM TYPES
// ═══════════════════════════════════════════════

export interface IncomeBreakdown {
  salary: number;
  business: number;
  capitalGains: {
    stcg: number;       // 15% / 20%
    ltcg: number;       // 10% / 12.5%
    stcgDebt: number;   // Slab
    ltcgDebt: number;   // 20%
  };
  houseProperty: number;
  other: number;
}

export interface DeductionBreakdown {
  section80C: number;   // PPF, ELSS, LIC, etc.
  section80D: number;   // Health Insurance
  section80E: number;   // Education Loan
  section80G: number;   // Donations
  hra: number;
  lta: number;
  nps80CCD: number;
  homeLoanInterest24B: number; // Section 24B
  savingsInterest80TTA: number; // Section 80TTA/TTB
  standardDeduction: number;
}

export interface ITRDocument {
  id: string;
  userId: string;
  assessmentYear: string;
  financialYear: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  filingStatus: 'Filed' | 'Pending' | 'Processing' | 'Error';
  extractedData: {
    grossIncome?: number;
    totalIncome?: number;
    totalDeductions?: number;
    taxableIncome?: number;
    taxPaid?: number;
    refundAmount?: number;
    regime?: 'Old' | 'New';
    incomeSources?: IncomeBreakdown;
    deductions?: Partial<DeductionBreakdown>;
    formType?: string;
    pan?: string;
    acknowledgementNumber?: string;
    filingDate?: string;
  };
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  gstRate?: number;
}

export interface Invoice {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency: string;
  gstNumber?: string;
  lineItems: InvoiceLineItem[];
  category?: string;
  expenseType: 'Business' | 'Personal' | 'Mixed';
  status: 'Draft' | 'Approved' | 'Rejected' | 'Booked';
  journalEntry?: string;
  anomalyFlag: boolean;
  anomalyReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxEstimate {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOldRegime: number;
  taxNewRegime: number;
  recommendedRegime: 'Old' | 'New';
  savings: number;
  effectiveRate: number;
  monthlyTds: number;
  slabBreakdown: { slab: string; rate: string; tax: number }[];
  surcharge: number;
  cess: number;
}

export interface OptimizationSuggestion {
  title: string;
  description: string;
  action: string;
  potentialSavings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CitedAdvice {
  text: string;
  citations: { section: string; source: string; excerpt: string }[];
  confidence: 'High' | 'Medium' | 'Low';
  disclaimer: string;
}

export interface TaxProfile {
  income: IncomeBreakdown;
  deductions: DeductionBreakdown;
  regime: TaxRegime;
  financialYear: string;
  assessmentYear: string;
}
