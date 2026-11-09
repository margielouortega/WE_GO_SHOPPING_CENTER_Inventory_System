# Upload to GitHub, deploy to Vercel and Render

This project is arranged as one GitHub repository with two deployable folders:
- `frontend/` → Vercel
- `backend/` → Render

## 1. Open the project in VS Code
1. Download and extract `WE_GO_SHOPPING_CENTER_Inventory_System_Ready_for_GitHub_Vercel_Render.zip`.
2. Open VS Code and choose **File → Open Folder**.
3. Select the extracted `WE_GO_SHOPPING_CENTER_Inventory_System` folder (the folder containing `frontend`, `backend`, and `render.yaml`).

## 2. Upload the complete project to GitHub
1. Sign in to https://github.com and create a **New repository** named `we-go-shopping-center-inventory`.
2. Choose Public or Private, then create it. Do not add a README, `.gitignore`, or license; these are already included.
3. In VS Code, open **Terminal → New Terminal**. Make sure the terminal is at the project root (the folder containing `frontend` and `backend`).
4. Run these commands one at a time, replacing the URL with your own GitHub repository URL:

```bash
git init
git add .
git commit -m "Initial inventory system upload"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/we-go-shopping-center-inventory.git
git push -u origin main
```

If Git is not installed, install it from https://git-scm.com/downloads, restart VS Code, and repeat. Complete the GitHub sign-in prompt if requested.

**Important:** Upload the whole project folder/repository. Do not upload only `frontend` or only `backend`.

## 3. Deploy the backend on Render
1. Open https://render.com and sign in.
2. Choose **New → Web Service**.
3. Connect GitHub and select `we-go-shopping-center-inventory`.
4. Use these settings:

| Setting | Value |
|---|---|
| Name | `we-go-shopping-center-api` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |

5. Choose an available instance plan and click **Deploy Web Service**.
6. When live, copy the Render service URL, e.g. `https://we-go-shopping-center-api.onrender.com`.
7. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. A successful response contains `"status":"ok"`.

A `render.yaml` Blueprint file is included as an alternative for Render's Blueprint flow. With the manual Web Service flow above, enter the settings in the table.

## 4. Deploy the frontend on Vercel
1. Open https://vercel.com and sign in with the same GitHub account.
2. Choose **Add New → Project** and import `we-go-shopping-center-inventory`.
3. Set these project settings:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add this Environment Variable before deploying:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

Replace the example with your actual Render URL. Keep `/api` at the end and do not add a trailing slash.
5. Click **Deploy** and wait for Vercel to finish.
6. Open the Vercel website URL and test adding a product.

If you change `VITE_API_URL` later, go to **Vercel → Project → Settings → Environment Variables**, save the change, then redeploy the latest deployment.

## 5. Final connection check
- Render health URL returns `"status":"ok"`.
- Open the Vercel website.
- Add a test product in Canned Goods, Noodles, or Frozen Goods.
- Refresh and confirm it remains listed.
- Test stock-in, stock-out, search, dashboard, and transaction history.

## Important: JSON data persistence on Render
This project stores data in `backend/data/`. Render's normal service filesystem is temporary, so data may be lost on restart or redeploy. For persistent data, configure a Render Persistent Disk on a plan that supports it, mounted at the absolute path to this project's `backend/data` directory. Do not assume the temporary filesystem is permanent.

## Common problems
- **Frontend cannot connect:** Test the Render health URL, then check that Vercel's `VITE_API_URL` is exactly the Render URL plus `/api`.
- **Environment variable change has no effect:** Redeploy Vercel.
- **Render build fails:** Check Root Directory `backend`, Start Command `npm start`, and Render logs.
- **Vercel build fails:** Check Root Directory `frontend`, Output Directory `dist`, and Vercel build logs.
- **Git push is rejected:** Confirm the terminal is in the project root and the remote URL is your own repository URL.

## Official guides
- GitHub: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- Render: https://render.com/docs/web-services
- Render persistent disks: https://render.com/docs/disks
- Vercel Vite: https://vercel.com/docs/frameworks/frontend/vite
- Vercel environment variables: https://vercel.com/docs/environment-variables
