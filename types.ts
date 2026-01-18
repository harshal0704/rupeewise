export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
  paymentMethod: 'UPI' | 'Card' | 'Cash';
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
