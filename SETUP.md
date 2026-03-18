# RupeeWise Setup Guide

This guide explains how to set up the RupeeWise application and lists all the required external APIs.

## Required APIs & Services

### 1. Supabase (Database & Authentication)
**Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**How to get them:**
1. Create an account at [Supabase](https://supabase.com/).
2. Start a new project.
3. Once created, go to **Project Settings -> API**.
4. Copy the `Project URL` to `VITE_SUPABASE_URL`.
5. Copy the `anon / public` key to `VITE_SUPABASE_ANON_KEY`.
*(Note: Run the provided `schema_repair.sql` in the Supabase SQL Editor to set up the necessary tables.)*

### 2. Finnhub (Market Data)
**Variable:**
- `VITE_FINNHUB_API_KEY`

**How to get it:**
1. Sign up at [Finnhub.io](https://finnhub.io/).
2. On your dashboard, you will find your free API Key.
3. Paste it into the `VITE_FINNHUB_API_KEY` variable.

### 3. EODHD (End of Day Historical Data)
**Variable:**
- `VITE_EODHD_API_TOKEN`

**How to get it:**
1. Sign up at [EODHD APIs](https://eodhistoricaldata.com/).
2. Navigate to your dashboard or API Settings to find your API Token.
3. Paste it into `VITE_EODHD_API_TOKEN`.

### 4. Google Gemini AI (AI Coach Features)
**Variable:**
- `VITE_GEMINI_API_KEY`

**How to get it:**
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **Get API Key** and create a new key.
4. Paste it into `VITE_GEMINI_API_KEY`.

### 5. Cloudinary (Profile Picture Uploads)
**Variables:**
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

**How to get them:**
1. Sign up at [Cloudinary](https://cloudinary.com/).
2. From the dashboard, copy your **Cloud Name** into `VITE_CLOUDINARY_CLOUD_NAME`.
3. Go to **Settings -> Upload**. Scroll down to **Upload Presets** and click **Add Upload Preset**.
4. Set the "Signing Mode" to **Unsigned**.
5. Save, and copy the name of the preset you just created into `VITE_CLOUDINARY_UPLOAD_PRESET`.

## Running the App
Once you have retrieved all API keys, place them in your `.env` file at the root of the project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_EODHD_API_TOKEN=your_eodhd_token

VITE_GEMINI_API_KEY=your_gemini_key

VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Then run the development server:
```bash
npm install
npm run dev
```
