import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { Plus, Search, Smartphone, CreditCard, Banknote, Upload, FileText, X, Check } from 'lucide-react';
import { categorizeTransaction, parseBankStatement } from '../services/geminiService';

interface UPITrackerProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
}

const UPITracker: React.FC<UPITrackerProps> = ({ transactions, addTransaction }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  
  // Manual State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant) return;

    setLoadingCategory(true);
    const category = await categorizeTransaction(merchant);
    setLoadingCategory(false);

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-IN'),
      merchant,
      amount: parseFloat(amount),
      category: category,
      type: 'debit',
      paymentMethod: method,
    };

    addTransaction(newTransaction);
    setAmount('');
    setMerchant('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const processStatement = async () => {
    if (!uploadFile) return;
    setIsProcessingFile(true);
    const result = await parseBankStatement(uploadFile);
    setPreviewTransactions(result);
    setIsProcessingFile(false);
  };

  const confirmUpload = () => {
    previewTransactions.forEach(t => addTransaction(t));
    setPreviewTransactions([]);
    setUploadFile(null);
    setActiveTab('manual');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Input Section */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 sticky top-6">
          <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'upload' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upload PDF/Img
            </button>
          </div>

          {activeTab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                   <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow placeholder-gray-400"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Merchant / Description</label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow placeholder-gray-400"
                  placeholder="e.g. Swiggy, Uber, Rent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <div className="flex space-x-2">
                  {['UPI', 'Card', 'Cash'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m as any)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 border transition-all ${method === m ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {m === 'UPI' && <Smartphone size={16} />}
                      {m === 'Card' && <CreditCard size={16} />}
                      {m === 'Cash' && <Banknote size={16} />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingCategory}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center transform active:scale-[0.98]"
              >
                {loadingCategory ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI Categorizing...
                  </span>
                ) : (
                  <>
                    <Plus size={20} className="mr-2" /> Add Transaction
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${uploadFile ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange}
                />
                {uploadFile ? (
                  <>
                    <FileText size={48} className="text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                      className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Click to upload statement</p>
                    <p className="text-xs text-gray-500">Supports PDF, JPG, PNG</p>
                  </>
                )}
              </div>

              {uploadFile && !previewTransactions.length && (
                <button
                  onClick={processStatement}
                  disabled={isProcessingFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg shadow-md transition-all flex justify-center items-center"
                >
                  {isProcessingFile ? (
                    <span className="flex items-center">
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Reading Statement...
                    </span>
                  ) : (
                    'Analyze with AI'
                  )}
                </button>
              )}

              {previewTransactions.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-center">
                    <Check size={16} className="mr-2" />
                    Found {previewTransactions.length} transactions
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {previewTransactions.map((t, i) => (
                      <div key={i} className="p-3 text-sm flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t.merchant}</p>
                          <p className="text-xs text-gray-500">{t.date}</p>
                        </div>
                        <span className="font-bold text-gray-900">₹{t.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => { setPreviewTransactions([]); setUploadFile(null); }}
                      className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={confirmUpload}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm"
                    >
                      Confirm Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg border border-indigo-50 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-3">
                        <Banknote size={24} className="text-gray-300" />
                      </div>
                      <p>No transactions yet. Add one manually or upload a statement!</p>
                    </td>
                  </tr>
                ) : (
                  transactions.slice().reverse().map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{t.date}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{t.merchant}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{t.paymentMethod}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        <span className={t.type === 'debit' ? 'text-gray-900' : 'text-green-600'}>
                           {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UPITracker;
