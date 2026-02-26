# Deployment Guide for RupeeWise

This guide addresses how to deploy the **RupeeWise** application to the web using **Vercel**, which is recommended given the project's configuration.

## Prerequisites

1.  **GitHub Repository**: Ensure your project is pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you haven't already.
3.  **Supabase Project**: You need your Supabase project URL and Anon Key.
4.  **Google Gemini API Key**: You need your API key from Google AI Studio.

## Option 1: Deploy via Vercel Dashboard (Recommended)

1.  **Log in to Vercel** and click **"Add New..."** > **"Project"**.
2.  **Import Git Repository**: Select your `rupeewise` repository.
3.  **Configure Project**:
    *   **Framework Preset**: Select **Vite** (Vercel usually detects this automatically).
    *   **Root Directory**: Leave as `./`.
    *   **Build Command**: `vite build` (default).
    *   **Output Directory**: `dist` (default).
4.  **Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   Add the following variables (copy values from your `.env.local` if you have them):
        *   `GEMINI_API_KEY` : Your Google Gemini API Key.
        *   `VITE_SUPABASE_URL` : Your Supabase Project URL.
        *   `VITE_SUPABASE_ANON_KEY` : Your Supabase Anon Key.
5.  **Deploy**: Click **"Deploy"**.
6.  Vercel will build your project and provide a live URL (e.g., `rupeewise.vercel.app`).

## Option 2: Deploy via Vercel CLI

If you prefer the command line:

1.  Install Vercel CLI:
    ```bash
    npm i -g vercel
    ```
2.  Login:
    ```bash
    vercel login
    ```
3.  Deploy:
    ```bash
    vercel
    ```
4.  Follow the prompts. When asked strictly about settings, accept the defaults.
5.  **Important**: After deployment, go to the Vercel Dashboard for this project, navigate to **Settings > Environment Variables**, and add the variables listed in Option 1. Then trigger a redeploy.

## Post-Deployment Checks

*   **Supabase Auth**: Ensure your Site URL (e.g., `https://rupeewise.vercel.app`) is added to your **Supabase Authentication > URL Configuration > Site URL** and **Redirect URLs**.
*   **Google Auth**: If using Google Auth via Supabase, add the new domain to your Google Cloud Console "Authorized JavaScript origins" and "Authorized redirect URIs".

## Troubleshooting

*   **Build Failures**: Check the Vercel logs. Ensure all dependencies in `package.json` are correct.
*   **Missing API Keys**: If the app works but data doesn't load, double-check your Environment Variables in Vercel settings.
