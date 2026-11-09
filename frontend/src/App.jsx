import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, History, Search,
  Plus, Pencil, Trash2, Boxes, AlertTriangle, PhilippinePeso, Menu, X,
  Download, RefreshCw, ShoppingBasket, CheckCircle2, ChevronRight
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const CATEGORIES = ["Canned Goods", "Noodles", "Frozen Goods"];
const money = n => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n || 0));
const dateTime = value => value ? new Date(value).toLocaleString() : "—";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Check that the backend is running.");
  return data;
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [mobileNav, setMobileNav] = useState(false);

  async function loadAll() {
    try {
      const [p, m, d] = await Promise.all([
        request(`/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(categoryFilter)}`),
        request(`/movements?search=${encodeURIComponent(search)}`),
        request("/dashboard")
      ]);
      setProducts(p); setMovements(m); setDashboard(d);
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  useEffect(() => { loadAll(); }, [search, categoryFilter]);
  useEffect(() => {
    const timer = setTimeout(() => setNotice({ type: "", text: "" }), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const nav = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Products", icon: Package },
    { label: "Stock In", icon: ArrowDownToLine },
    { label: "Stock Out", icon: ArrowUpFromLine },
    { label: "Transaction History", icon: History }
  ];

  function notify(type, text) { setNotice({ type, text }); }
  async function saveProduct(form) {
    setBusy(true);
    try {
      const editing = modal?.mode === "edit";
      await request(editing ? `/products/${modal.product.id}` : "/products", {
        method: editing ? "PUT" : "POST", body: JSON.stringify(form)
      });
      setModal(null); await loadAll(); notify("success", editing ? "Product updated successfully." : "Product added successfully.");
    } catch (e) { notify("error", e.message); }
    finally { setBusy(false); }
  }
  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try { await request(`/products/${product.id}`, { method: "DELETE" }); await loadAll(); notify("success", "Product deleted."); }
    catch (e) { notify("error", e.message); }
  }
  async function saveMovement(form) {
    setBusy(true);
    try {
      await request("/movements", { method: "POST", body: JSON.stringify(form) });
      setModal(null); await loadAll(); notify("success", `Stock ${form.type === "IN" ? "received" : "released"} successfully.`);
    } catch (e) { notify("error", e.message); }
    finally { setBusy(false); }
  }
  function exportCsv() {
    const rows = [["Product Code","Product Name","Category","Unit Price","Quantity","Reorder Level","Stock Value"],
      ...products.map(p => [p.code,p.name,p.category,p.price,p.quantity,p.reorderLevel,p.price*p.quantity])];
    const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "we-go-inventory-report.csv"; link.click(); URL.revokeObjectURL(link.href);
  }

  const title = page;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand">
        <img src="/logo.svg" alt="WE GO Shopping Center logo" />
        <div><strong>WE GO</strong><span>SHOPPING CENTER</span></div>
        <button className="mobile-close" onClick={() => setMobileNav(false)}><X size={19}/></button>
      </div>
      <div className="side-label">MAIN MENU</div>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${page === item.label ? "active" : ""}`} onClick={() => { setPage(item.label); setMobileNav(false); }}>
        <item.icon size={19}/><span>{item.label}</span>{page === item.label && <ChevronRight size={16} className="nav-arrow"/>}
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="store-card"><ShoppingBasket size={20}/><div><b>Store Inventory</b><small>Management System</small></div></div><small>WE GO SHOPPING CENTER · 2026</small></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)} />}
    <main className="main">
      <header className="topbar">
        <div className="top-left"><button className="menu-toggle" onClick={() => setMobileNav(true)}><Menu/></button><div><div className="eyebrow">WE GO SHOPPING CENTER</div><h1>{title}</h1></div></div>
        <div className="top-actions"><div className="today">{new Date().toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div><button className="icon-button" title="Refresh data" onClick={loadAll}><RefreshCw size={18}/></button><div className="avatar">WG</div></div>
      </header>
      {notice.text && <div className={`notice ${notice.type}`}><span>{notice.type === "success" ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}</span>{notice.text}<button onClick={() => setNotice({type:"",text:""})}><X size={16}/></button></div>}
      <section className="content">
        {page === "Dashboard" && <Dashboard dashboard={dashboard} setPage={setPage} />}
        {page === "Products" && <Products products={products} search={search} setSearch={setSearch} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} onAdd={() => setModal({mode:"add"})} onEdit={p => setModal({mode:"edit",product:p})} onDelete={deleteProduct} onExport={exportCsv}/>}
        {(page === "Stock In" || page === "Stock Out") && <MovementPage type={page === "Stock In" ? "IN" : "OUT"} products={products} onMove={() => setModal({mode:"movement",type:page === "Stock In" ? "IN" : "OUT"})} />}
        {page === "Transaction History" && <HistoryPage movements={movements} search={search} setSearch={setSearch}/>}
      </section>
      <footer>© 2026 WE GO SHOPPING CENTER <span>Inventory Management System</span></footer>
    </main>
    {modal && <Modal modal={modal} products={products} onClose={() => setModal(null)} onSaveProduct={saveProduct} onSaveMovement={saveMovement} busy={busy}/>}
  </div>;
}

function Dashboard({ dashboard, setPage }) {
  const d = dashboard || { totalProducts:0,totalUnits:0,lowStockCount:0,inventoryValue:0,lowStock:[],categorySummary:[],recentMovements:[] };
  const stats = [
    { label:"Total Products", value:d.totalProducts, icon:Package, color:"blue", sub:"Unique product items" },
    { label:"Total Stock Units", value:d.totalUnits.toLocaleString(), icon:Boxes, color:"purple", sub:"Units currently available" },
    { label:"Low Stock Items", value:d.lowStockCount, icon:AlertTriangle, color:"orange", sub:"At or below reorder level" },
    { label:"Inventory Value", value:money(d.inventoryValue), icon:PhilippinePeso, color:"green", sub:"Based on current stock" }
  ];
  return <div className="page-stack">
    <div className="welcome-row"><div><h2>Good day! Here's your store overview.</h2><p>Monitor your products and stock movements in one place.</p></div><button className="primary-btn" onClick={() => setPage("Products")}><Plus size={17}/> Manage Products</button></div>
    <div className="stats-grid">{stats.map(s => <div className="stat-card" key={s.label}><div className={`stat-icon ${s.color}`}><s.icon size={21}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-sub">{s.sub}</div></div>)}</div>
    <div className="section-heading"><div><h3>Inventory by Category</h3><p>Current product and stock distribution</p></div></div>
    <div className="category-grid">{(d.categorySummary || []).map((c,i) => <div className="category-card" key={c.category}><div className={`category-mark mark-${i}`}>{i===0?"🥫":i===1?"🍜":"❄️"}</div><div className="category-name">{c.category}</div><div className="category-numbers"><b>{c.products}</b><span>products</span><b>{c.units.toLocaleString()}</b><span>units</span></div><div className="mini-track"><span style={{width:`${d.totalUnits ? c.units/d.totalUnits*100 : 0}%`}}/></div></div>)}</div>
    <div className="two-column">
      <div className="panel"><div className="panel-head"><div><h3>Low Stock Alerts</h3><p>Items that may need replenishment</p></div><span className="count-pill">{d.lowStockCount || 0}</span></div>
        {d.lowStock?.length ? <div className="simple-list">{d.lowStock.slice(0,6).map(p=><div className="simple-row" key={p.id}><div className="product-dot">{p.name.slice(0,1).toUpperCase()}</div><div className="row-main"><b>{p.name}</b><small>{p.code} · {p.category}</small></div><span className="stock-warning">{p.quantity} left</span></div>)}</div> : <div className="empty-state"><CheckCircle2 size={25}/><b>All good!</b><span>No products are currently low on stock.</span></div>}
      </div>
      <div className="panel"><div className="panel-head"><div><h3>Recent Transactions</h3><p>Latest stock activity</p></div><button className="text-btn" onClick={() => setPage("Transaction History")}>View all</button></div>
        {d.recentMovements?.length ? <div className="simple-list">{d.recentMovements.slice(0,6).map(m=><div className="simple-row" key={m.id}><div className={`movement-icon ${m.type==="IN"?"in":"out"}`}>{m.type==="IN"?<ArrowDownToLine size={16}/>:<ArrowUpFromLine size={16}/>}</div><div className="row-main"><b>{m.productName}</b><small>{dateTime(m.createdAt)}</small></div><span className={m.type==="IN"?"qty-in":"qty-out"}>{m.type==="IN"?"+":"−"}{m.quantity}</span></div>)}</div> : <div className="empty-state"><History size={25}/><b>No transactions yet</b><span>Stock activity will appear here.</span></div>}
      </div>
    </div>
  </div>;
}

function Products({ products, search, setSearch, categoryFilter, setCategoryFilter, onAdd, onEdit, onDelete, onExport }) {
  return <div className="page-stack">
    <div className="welcome-row"><div><h2>Product Inventory</h2><p>Add and manage all products available in your store.</p></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> Add Product</button></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input placeholder="Search name, code, or category..." value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button onClick={()=>setSearch("")}><X size={15}/></button>}</div><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All Categories</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><button className="secondary-btn" onClick={onExport}><Download size={16}/> Export CSV</button></div>
    <div className="panel table-panel"><div className="panel-head"><div><h3>All Products</h3><p>{products.length} product(s) found</p></div></div>
      {products.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>UNIT PRICE</th><th>QUANTITY</th><th>STOCK STATUS</th><th className="align-right">ACTIONS</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><div className="product-dot">{p.name.slice(0,1).toUpperCase()}</div><div><b>{p.name}</b><small>{p.code}</small></div></div></td><td><span className="category-tag">{p.category}</span></td><td>{money(p.price)}</td><td><b>{p.quantity}</b> <small>units</small></td><td>{p.quantity<=p.reorderLevel?<span className="status low">Low Stock</span>:<span className="status good">In Stock</span>}</td><td><div className="actions"><button title="Edit" onClick={()=>onEdit(p)}><Pencil size={16}/></button><button title="Delete" className="delete-action" onClick={()=>onDelete(p)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><Package size={30}/><b>No products found</b><span>Add a product or change your search filters.</span></div>}
    </div>
  </div>;
}

function MovementPage({ type, products, onMove }) {
  const incoming = type === "IN";
  return <div className="page-stack"><div className="welcome-row"><div><h2>{incoming?"Stock In":"Stock Out"}</h2><p>{incoming?"Record new stocks received by your store.":"Record products released, sold, or removed from inventory."}</p></div><button className={`primary-btn ${incoming?"":"out-btn"}`} onClick={onMove}>{incoming?<ArrowDownToLine size={17}/>:<ArrowUpFromLine size={17}/>} Record Stock {incoming?"In":"Out"}</button></div>
    <div className="movement-banner"><div className={`large-movement ${incoming?"in":"out"}`}>{incoming?<ArrowDownToLine size={30}/>:<ArrowUpFromLine size={30}/>}</div><div><h3>{incoming?"Receive Inventory":"Release Inventory"}</h3><p>{incoming?"Increase product quantities by recording deliveries and restocks.":"Decrease product quantities when items are sold, issued, damaged, or removed."}</p></div></div>
    <div className="panel"><div className="panel-head"><div><h3>Available Products</h3><p>Select a product when recording a stock movement.</p></div><span className="count-pill">{products.length} products</span></div>
      {products.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>CURRENT STOCK</th><th>REORDER LEVEL</th><th>STATUS</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><div className="product-dot">{p.name.slice(0,1).toUpperCase()}</div><div><b>{p.name}</b><small>{p.code}</small></div></div></td><td>{p.category}</td><td><b>{p.quantity}</b> units</td><td>{p.reorderLevel}</td><td>{p.quantity<=p.reorderLevel?<span className="status low">Low Stock</span>:<span className="status good">In Stock</span>}</td></tr>)}</tbody></table></div>:<div className="empty-state"><Package size={28}/><b>No products available</b><span>Add products before recording stock.</span></div>}
    </div>
  </div>;
}

function HistoryPage({ movements, search, setSearch }) {
  return <div className="page-stack"><div className="welcome-row"><div><h2>Transaction History</h2><p>Review all recorded stock-in and stock-out activities.</p></div></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input placeholder="Search product, code, type, or note..." value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button onClick={()=>setSearch("")}><X size={15}/></button>}</div><span className="count-pill">{movements.length} transactions</span></div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>DATE & TIME</th><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>BALANCE AFTER</th><th>NOTE</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{dateTime(m.createdAt)}</td><td><div className="product-cell"><div className="product-dot">{m.productName?.slice(0,1)}</div><div><b>{m.productName}</b><small>{m.productCode}</small></div></div></td><td><span className={`status ${m.type==="IN"?"good":"out-status"}`}>{m.type==="IN"?"Stock In":"Stock Out"}</span></td><td className={m.type==="IN"?"qty-in":"qty-out"}>{m.type==="IN"?"+":"−"}{m.quantity}</td><td>{m.balanceAfter}</td><td>{m.note || "—"}</td></tr>)}</tbody></table></div>{!movements.length && <div className="empty-state"><History size={28}/><b>No transactions found</b><span>Stock movements will be listed here.</span></div>}</div>
  </div>;
}

function Modal({ modal, products, onClose, onSaveProduct, onSaveMovement, busy }) {
  const editing = modal.mode === "edit";
  const movement = modal.mode === "movement";
  const [form, setForm] = useState(editing ? {
    name:modal.product.name, code:modal.product.code, category:modal.product.category,
    price:modal.product.price, quantity:modal.product.quantity, reorderLevel:modal.product.reorderLevel,
    description:modal.product.description || ""
  } : movement ? { productId:"", type:modal.type, quantity:1, note:"" } : {
    name:"",code:"",category:CATEGORIES[0],price:0,quantity:0,reorderLevel:10,description:""
  });
  const update = e => setForm({...form,[e.target.name]:e.target.value});
  function submit(e) { e.preventDefault(); movement ? onSaveMovement({...form,quantity:Number(form.quantity)}) : onSaveProduct({...form,price:Number(form.price),quantity:Number(form.quantity),reorderLevel:Number(form.reorderLevel)}); }
  const selected = products.find(p=>p.id===form.productId);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal">
    <div className="modal-head"><div><span className="eyebrow">{movement?"INVENTORY MOVEMENT":"PRODUCT MANAGEMENT"}</span><h2>{movement?`Record Stock ${modal.type==="IN"?"In":"Out"}`:editing?"Edit Product":"Add New Product"}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
    <form onSubmit={submit}>
      {movement ? <>
        <label>Product<select name="productId" value={form.productId} onChange={update} required><option value="">Select a product</option>{products.map(p=><option value={p.id} key={p.id}>{p.name} ({p.code}) — {p.quantity} in stock</option>)}</select></label>
        {selected && <div className="selected-stock">Current available stock: <b>{selected.quantity} units</b></div>}
        <label>Quantity<input type="number" name="quantity" min="1" step="1" value={form.quantity} onChange={update} required/></label>
        <label>Note / Reference (optional)<textarea name="note" rows="3" placeholder="e.g. Supplier delivery, sales, damaged goods..." value={form.note} onChange={update}/></label>
      </> : <>
        <div className="form-grid"><label>Product Name *<input name="name" value={form.name} onChange={update} placeholder="e.g. Sardines 155g" required/></label><label>Product Code *<input name="code" value={form.code} onChange={update} placeholder="e.g. CAN-001" required/></label></div>
        <label>Category *<select name="category" value={form.category} onChange={update}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
        <div className="form-grid"><label>Unit Price (₱)<input type="number" name="price" min="0" step="0.01" value={form.price} onChange={update}/></label>{!editing && <label>Opening Stock<input type="number" name="quantity" min="0" step="1" value={form.quantity} onChange={update}/></label>}</div>
        <label>Low Stock Alert Level<input type="number" name="reorderLevel" min="0" step="1" value={form.reorderLevel} onChange={update}/></label>
        <label>Description (optional)<textarea name="description" rows="2" value={form.description} onChange={update} placeholder="Additional product details"/></label>
      </>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy?"Saving...":movement?"Save Transaction":editing?"Update Product":"Add Product"}</button></div>
    </form>
  </div></div>;
}