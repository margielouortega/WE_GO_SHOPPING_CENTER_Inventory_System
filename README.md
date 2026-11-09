# WE GO SHOPPING CENTER — Inventory Management System

A full-stack inventory management system built with React JS + Vite, Node.js, Express, and JSON file storage.

## Features
- Dashboard with product count, stock units, low-stock alerts, inventory value, and category summaries
- Product CRUD: add, view, edit, delete
- Product categories: Canned Goods, Noodles, Frozen Goods
- Stock-in and stock-out transactions
- Prevents stock-out quantities greater than available stock
- Product and transaction search
- Transaction history
- CSV inventory export
- Responsive blue, white, and gray interface
- Custom WE GO SHOPPING CENTER logo

## Requirements
- Node.js 18 or newer
- npm

## Run locally

Open two terminals in VS Code.

### Terminal 1 — Backend
```bash
cd backend
npm install
node server.js
```
The API runs at `http://localhost:5000`.
Test it at `http://localhost:5000/api/health`.

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the local Vite URL shown in the terminal (normally `http://localhost:5173`).

## JSON storage
Data is stored in:
- `backend/data/products.json`
- `backend/data/movements.json`

The backend creates these files if they do not exist. Keep the `backend/data` directory writable. JSON storage is suitable for this academic/demo project; it is not designed for concurrent production workloads.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server status |
| GET | `/api/products` | List/search/filter products |
| POST | `/api/products` | Add product |
| PUT | `/api/products/:id` | Edit product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/movements` | Record stock-in or stock-out |
| GET | `/api/movements` | List/search transactions |
| GET | `/api/dashboard` | Dashboard summary |

## Deployment notes

### Render (backend)
- Create a **Web Service** from the GitHub repository.
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Free instances may sleep when inactive. JSON files on an ephemeral filesystem may reset after redeployment/restart; persistent disk availability depends on the hosting plan.

### Vercel (frontend)
- Import the same repository into Vercel.
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variable:
  - `VITE_API_URL` = your deployed backend URL followed by `/api`
  - Example: `https://your-backend.onrender.com/api`
- Redeploy after setting the environment variable.

For deployment, configure CORS to restrict access to your actual frontend domain if the system is used beyond a classroom demo.

## Demo checklist
1. Add a product in each of the three categories.
2. Search for a product by name or code.
3. Edit a product and verify the change.
4. Record stock-in and confirm quantity increases.
5. Record stock-out and confirm quantity decreases.
6. Attempt to stock out more than available; verify the API rejects it.
7. Check dashboard totals, low-stock alerts, and transaction history.
8. Export the product list to CSV.

## Ready-to-deploy files
- `render.yaml` contains the Render backend service settings.
- `frontend/vercel.json` contains the Vercel Vite build/output settings.
- `.gitignore` excludes dependencies, build output, and local environment files.
- `DEPLOY_TO_GITHUB_VERCEL_RENDER.md` provides the complete VS Code → GitHub → Render/Vercel deployment walkthrough.

**Start here:** open `DEPLOY_TO_GITHUB_VERCEL_RENDER.md`.
