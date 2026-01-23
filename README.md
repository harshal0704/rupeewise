<div align="center">

  <h1>RupeeWise</h1>
  <p><strong>AI-Powered Financial Wisdom for the Modern Indian Investor</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

## 🚀 Overview

**RupeeWise** is a next-generation personal finance platform designed specifically for the Indian market. By leveraging the power of **Google Gemini AI**, it transforms complex financial data into actionable insights. Whether it's decoding your bank statement, calculating your tax liability under the latest regimes, or simulating investment strategies, RupeeWise is your intelligent financial companion.

Built with a stunning **Neo-Fintech** aesthetic using **Glassmorphism**, RupeeWise offers a premium, intuitive user experience that makes managing money feel effortless.

## ✨ Key Features

- **🧠 AI Transaction Categorization**: Automatically categorizes your UPI and bank transactions into meaningful groups (Food, Travel, Utilities, etc.) using Gemini AI.
- **📄 Smart Statement Parsing**: Upload your bank statement (PDF/Image), and let our AI extract and organize your transaction history instantly.
- **🤖 Personal Financial Advisor**: A chat interface tailored to Indian finance—ask about Mutual Funds, SIPs, Income Tax, or general savings advice.
- **⚖️ Tax Regime Simplifier**: Compare your tax liability under the **Old vs. New Regime** with detailed explanations and breakdowns.
- **🔮 Life Scenario Simulator**: Run "What If" scenarios (buying a car, saving for a home) to see how they impact your financial future.
- **📈 Market Hub**: Get real-time status of **Nifty 50** & **Sensex**, screen stocks based on custom criteria, and visualize historical performance.
- **💹 Investment Simulator**: Visualize how your money grows with different strategies (SIP, Lumpsum, Buy-on-Dip) over time.
- **🎨 Modern UI/UX**: A sleek, dark-themed interface featuring smooth animations, gradients, and glassmorphism elements.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Blazing fast build and performance.
- **Styling**: Vanilla CSS (Modern CSS Variables, Flexbox/Grid, Glassmorphism).
- **AI Integration**: [Google Gemini AI](https://deepmind.google/technologies/gemini/) - Powering all intelligence features.
- **Backend & Auth**: [Supabase](https://supabase.com/) - Secure authentication and real-time database.
- **Charts**: [Recharts](https://recharts.org/) - Beautiful, responsive data visualization.
- **Icons**: [Lucide React](https://lucide.dev/) - Clean and consistent iconography.

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Supabase Account**
- **Google Gemini API Key**

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/rupeewise.git
    cd rupeewise
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your keys:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🚀 Deployment

RupeeWise is optimized for deployment on **Vercel**.

👉 **[Read the Full Deployment Guide](./DEPLOYMENT.md)**

### Quick Vercel Setup:
1.  Import project to Vercel.
2.  Add Environment Variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel.
3.  Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">
  <small>Built with ❤️ for India 🇮🇳</small>
</div>
