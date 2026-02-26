# Deploying RupeeWise to Render

You requested information for the **Web Service** fields, but please note that for a React/Vite application like RupeeWise, the **Static Site** service type is usually preferred (and often free).

## Option 1: Static Site (Recommended)

**If you go back and select "Static Site" instead of "Web Service":**

*   **Root Directory**: (Leave Blank)
*   **Build Command**: `npm install && npm run build`
*   **Publish Directory**: `dist`
*   *(No Start Command is needed)*

---

## Option 2: Web Service (What you are currently looking at)

If you must use a Web Service (e.g. prompt requires a Start Command):

### 1. Root Directory
*   **Value**: (Leave Blank)
*   **Reason**: Your `package.json` is in the main folder, not a subfolder.

### 2. Build Command
*   **Value**: `npm install && npm run build`
*   **Reason**: This installs dependencies and compiles your React app into the `dist` folder.

### 3. Start Command
*   **Value**: `npm run preview -- --host 0.0.0.0 --port $PORT`
*   **Reason**: This tells Vite to serve your built application (`dist`) and listen on the port Render assigns (usually 10000). The `preview` command is defined in your `package.json`.

**Alternative Start Command** (If the above fails):
`npx serve -s dist -l $PORT`

### 4. Environment Variables
Don't forget to scroll down to the "Environment Variables" section and add:
*   `GEMINI_API_KEY`: (Your Google Gemini API Key)
*   `VITE_SUPABASE_URL`: (Your Supabase URL)
*   `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
