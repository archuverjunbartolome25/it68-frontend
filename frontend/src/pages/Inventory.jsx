import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { NavLink } from 'react-router-dom';
import axios from "axios";
import logo from './logo.jpg';
import './Styles.css';
import { FaTools, FaShoppingCart, FaBoxes, FaChartLine, FaRegUser, FaListUl, FaUndo, FaTrashAlt } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function Inventory() {
  const roles = {
  dashboard: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  inventory: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  salesOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor"],
  productionOutput: ["Inventory Custodian","Warehouse Supervisor"],
  returnToVendor: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  disposal: ["Inventory Custodian","Warehouse Supervisor"],
  purchaseOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
  reports: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  suppliers: ["Inventory Custodian","Warehouse Supervisor","Branch Accountant"],
  userManagement: ["Inventory Custodian","Warehouse Supervisor"],
  customers: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
};

const storedRole = localStorage.getItem("role");
const canAccess = (module) => roles[module]?.includes(storedRole);

  const [rawInventoryData, setRawInventoryData] = useState([]);
  
  useEffect(() => {
  fetchInventory(); // your existing function

  const fetchRawMaterials = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/inventory_rawmats");
      setRawInventoryData(res.data);
    } catch (err) {
      console.error("Error fetching raw materials:", err);
    }
  };

  fetchRawMaterials();
}, []);

  const [loading, setLoading] = useState(true);
 // -----------------------------
  // Refs & State
  // -----------------------------
  const submenuRef = useRef(null);
  const location = useLocation();
  const isReportsActive = location.pathname.startsWith("/reports");

  const [showDropdown, setShowDropdown] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedFinishedGood, setSelectedFinishedGood] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newAlertQty, setNewAlertQty] = useState("");

  const [reportsOpen, setReportsOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [stockFilter, setStockFilter] = useState("all");

  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryType, setInventoryType] = useState("normal");
  const [userFirstName, setUserFirstName] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [bomItems, setBOMItems] = useState([]);
  const [selectedFinishedGoodPrice, setSelectedFinishedGoodPrice] = useState(0);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const finishedGoodBOM = {
  "350ml": ["350ml", "Cap", "Label"],
  "500ml": ["500ml", "Cap", "Label"],
  "1L": ["1L", "Cap", "Label"],
  "6L": ["6L", "6L Cap", "Label"],
};

const handleShowBOM = (item) => {
  setSelectedFinishedGood(item); // <-- store it
  setSelectedFinishedGoodPrice(item.unit_cost || 0);

  const bomRawMaterials = finishedGoodBOM[item.item] || [];

  const perCaseMultiplier = inventoryType === "normal"
    ? (item.item === "350ml" || item.item === "500ml" ? 24 :
       item.item === "1L" ? 12 : 1)
    : 1;

  const bomDetails = bomRawMaterials.map((rm) => {
    const displayName = rawMaterialsDisplayNames[rm] || rm;
    const rawMat = rawInventoryData.find(
      (i) => i.item === rm || i.item === displayName
    );
    const availableQty = rawMat ? Number(rawMat.quantity_pieces || 0) : 0;
    const perPieceQty = 1;

    return {
      name: displayName,
      unit: rawMat?.unit || "pcs",
      perCaseQty: perPieceQty * perCaseMultiplier,
      perPieceQty: perPieceQty,
      availableQty: availableQty
    };
  });

  setBOMItems(bomDetails);
  setShowBOMModal(true);
};

  const showMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
};

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ item: "", unit: "", quantity: "" });
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(0);

  // -----------------------------
  // Display names & units
  // -----------------------------
  const finishedGoodsDisplayNames = {
    "350ml": "Bottled Water (350ml)",
    "500ml": "Bottled Water (500ml)",
    "1L": "Bottled Water (1L)",
    "6L": "Gallon Water (6L)",
  };

  const rawMaterialsDisplayNames = {
    "350ml": "Plastic Bottle (350ml)",
    "500ml": "Plastic Bottle (500ml)",
    "1L": "Plastic Bottle (1L)",
    "6L": "Plastic Gallon (6L)",
    "Cap": "Blue Plastic Cap",
    "6L Cap": "Blue Plastic Cap (6L)",
  };

  const finishedGoodsUnits = {
    "350ml": "24 pcs per case",
    "500ml": "24 pcs per case",
    "1L": "12 pcs per case",
    "6L": "1 pc",
  };

    const rawMaterialsUnits = {
    "350ml": "1 pc",
    "500ml": "1 pc",
    "1L": "1 pc",
    "6L": "1 pc",
    "Cap": "1 pc",
    "6L Cap": "1 pc",
    "Label": "20,000 pcs per roll",
    "Stretchfilm": "1 pc",
    "Shrinkfilm": "1 pc",
  };

  const finishedGoodsOrder = ["350ml", "500ml", "1L", "6L"];
  const rawMaterialsOrder = ["350ml","500ml","1L","6L","Cap","6L Cap","Label","Stretchfilm","Shrinkfilm"];

  // -----------------------------
  // Fetch inventory
  // -----------------------------
const fetchInventory = async () => {
  try {
    setLoading(true);
    const endpoint =
      inventoryType === "raw"
        ? "http://localhost:8000/api/inventory_rawmats"
        : "http://localhost:8000/api/inventories";

    const res = await axios.get(endpoint);
    setInventoryData(res.data);
  } catch (err) {
    console.error("Error fetching inventory:", err);
  } finally {
    setLoading(false);
  }
};

  // -----------------------------
  // Fetch user info
  // -----------------------------
  useEffect(() => {
    fetchInventory();

    const fetchUserInfo = async () => {
      try {
        const storedEmployeeID = localStorage.getItem("employeeID");
        if (!storedEmployeeID) return;

        const response = await axios.get(
          `http://localhost:8000/api/users/${storedEmployeeID}`
        );

        if (response.data) {
          setEmployeeID(response.data.employee_id || storedEmployeeID);
          setUserFullName(`${response.data.firstname || ""} ${response.data.lastname || ""}`);
          setUserFirstName(response.data.firstname || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserInfo();
    setSearchTerm("");
    setCurrentPage(1);
  }, [inventoryType]);

  // -----------------------------
  // Quantity color logic
  // -----------------------------
  const getQuantityColor = (quantity, itemName) => {
    const foundItem = inventoryData.find((i) => i.item === itemName);
    const alertLevel = foundItem?.low_stock_alert ?? 10;

    if (quantity <= alertLevel) return "text-danger";
    if (quantity <= alertLevel * 1.5) return "text-warning";
    return "text-success";
  };

  // -----------------------------
  // Filter & sort
  // -----------------------------
  const filteredItems = inventoryData.filter((i) => {
    const matchesSearch = i.item.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStock = true;
    const colorClass = getQuantityColor(i.quantity, i.item);
    if (stockFilter === "normal") matchesStock = colorClass === "text-success";
    else if (stockFilter === "warning") matchesStock = colorClass === "text-warning";
    else if (stockFilter === "low") matchesStock = colorClass === "text-danger";

    return matchesSearch && matchesStock;
  });

  const sortByCustomOrder = (items, orderArray) =>
    [...items].sort((a, b) => {
      const aName = a.item.replace(/\s*\(.*\)$/, "");
      const bName = b.item.replace(/\s*\(.*\)$/, "");
      return orderArray.indexOf(aName) - orderArray.indexOf(bName);
    });

  const sortedItems =
    inventoryType === "raw"
      ? sortByCustomOrder(filteredItems, rawMaterialsOrder)
      : sortByCustomOrder(filteredItems, finishedGoodsOrder);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  // -----------------------------
  // Add / Alert handlers
  // -----------------------------
const handleAddItem = async () => {
  if (!newItem.item || !newItem.unit || (inventoryType === "raw" && !newItem.conversion)) {
    showMessage("❌ Please fill in all required fields");
    return;
  }

  try {
    const endpoint =
      inventoryType === "raw"
        ? "http://localhost:8000/api/inventory_rawmats/add"
        : "http://localhost:8000/api/inventories/receive";

    const payload =
      inventoryType === "raw"
        ? {
            item: newItem.item,
            unit: newItem.unit,
            conversion: Number(newItem.conversion),
            quantity: 0,
            quantity_pieces: 0,
          }
        : {
            item: newItem.item,
            unit: newItem.unit,
            quantity: Number(newItem.quantity),
            quantity_pcs: Number(newItem.quantity_pcs || 0),
          };

    await axios.post(endpoint, payload);

    fetchInventory();
    setShowAddModal(false);
    setNewItem({ item: "", unit: "", quantity: "", quantity_pcs: "", conversion: "" });
    showMessage("✅ Item added successfully!");
  } catch (err) {
    console.error("Error adding new item:", err);
    showMessage("❌ Failed to add new item");
  }
};

  const handleOpenAlertModal = (item) => {
    setSelectedItem(item);
    setNewAlertQty(item.low_stock_alert || "");
    setShowAlertModal(true);
  };

  const handleSaveAlert = async () => {
    if (!selectedItem) return;

    try {
      const endpoint =
        inventoryType === "raw"
          ? `http://localhost:8000/api/inventory_rawmats/${selectedItem.id}/update-alert`
          : `http://localhost:8000/api/inventories/${selectedItem.id}/update-alert`;

      await axios.put(endpoint, { low_stock_alert: Number(newAlertQty) });

      setShowAlertModal(false);
      fetchInventory();
      showMessage("✅ Alert quantity updated successfully");
    } catch (err) {
      console.error("Error updating alert:", err);
      showMessage("❌ Failed to update alert quantity");
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
  <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`} style={{width:"1397px"}}>
{/* Sidebar */}
<aside className={`sidebar ${isSidebarOpen ? "" : "collapsed"} ${overviewOpen ? "scrollable" : ""}`}>
          <button
          className={`sidebar-toggle-switch ${isSidebarOpen ? "on" : "off"}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          <span className="toggle-circle"></span>
        </button>
  <div className="text-center mb-4">
    <img src={logo} alt="Logo" className="login-logo" />
  </div>
  <ul className="list-unstyled">
    {canAccess("dashboard") && (
    <li>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineDashboard /> Dashboard
      </NavLink>
    </li>
    )}
     {canAccess("inventory") && (
    <li>
      <NavLink to="/inventory" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineInventory2 /> Inventory
      </NavLink>
    </li>
    )}
     {canAccess("salesOrder") && (
    <li>
      <NavLink to="/sales-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <BiPurchaseTag /> Sales Order
      </NavLink>
    </li>
    )}
     {canAccess("productionOutput") && (
    <li>
      <NavLink to="/production-output" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTools className="icon"/> Production Output
      </NavLink>
    </li>
    )}
    {canAccess("returnToVendor") && (
    <li>
      <NavLink to="/return-to-vendor" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaUndo className="icon"/> Return To Vendor
      </NavLink>
    </li>
    )}
     {canAccess("disposal") && (
    <li>
      <NavLink to="/disposal" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTrashAlt className="icon"/> Disposal
      </NavLink>
    </li>
      )}
    {canAccess("purchaseOrder") && (
    <li>
      <NavLink to="/purchase-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaListUl className="icon"/> Purchase Order
      </NavLink>
    </li>
      )}
    
    {canAccess("reports") && (
    <li>
      <NavLink
        to="/reports/demand-report"
        className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}
      >
        <TbReportSearch className="icon" /> Reports
      </NavLink>
    </li>
    )}
    {canAccess("suppliers") && (
    <li>
      <NavLink to="/suppliers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Suppliers
      </NavLink>
    </li>
    )}
    {canAccess("userManagement") && (
    <li>
      <NavLink to="/user-management" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> User Management
      </NavLink>
    </li>
    )}
    {canAccess("customers") && (
    <li>
      <NavLink to="/customers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Customers
      </NavLink>
    </li>
    )}
  </ul>
</aside>

      <div className="main-content">

<div className="topbar">
  <div className="topbar-left">
        <div className="profile-dropdown">
      <div
        className="profile-circle"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {userFullName
          ? userFullName.split(" ").map((n) => n[0]).join("").toUpperCase()
          : "U"}
      </div>
      <div className="profile-text">
        <strong className="fullname">{userFullName}</strong>
        <small className="employee">{employeeID}</small>
      </div>
    </div>
  </div>

  <div className="topbar-right">
          <select
            className="profile-select"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "logout") {
                localStorage.clear();
                window.location.href = "/";
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              <strong>{userFirstName}</strong>
            </option>
            <option value="logout">Logout</option>
          </select>
    </div>
</div>

<h2 className="topbar-title">INVENTORY</h2>
<hr />
    <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
    {/* Left side: search + dropdown */}
    <div className="d-flex gap-2">
      <select
        className="custom-select"
        style={{ width: "200px" }}
        value={inventoryType}
        onChange={(e) => setInventoryType(e.target.value)}
      >
        <option value="normal">Finished Goods</option>
        <option value="raw">Raw Materials</option>
      </select>
    </div>

    {/* Right side: Add Item button */}
    <button
      className="btn btn-primary btn-sm"
      onClick={() => setShowAddModal(true)}
    >
      + Add Item
    </button>
    </div>
<hr />
<div style={{display:"flex", flexDirection:"row", gap:"20px"}}>
<h2 className="topbar-title">Reports</h2>

  {/* Stock Filter Dropdown */}
  <select
    className="form-select form-select-sm"
    style={{ width: "150px" }}
    value={stockFilter}
    onChange={(e) => setStockFilter(e.target.value)}
  >
    <option value="all">All Stocks</option>
    <option value="normal">Normal</option>
    <option value="warning">Warning</option>
    <option value="low">Low Stock</option>
  </select>

    {/* Legend */}
  <div className="d-flex align-items-center gap-1">
    <span style={{ width: "15px", height: "15px", backgroundColor: "green", display: "inline-block" }}></span>
    <small>Normal</small>
  </div>
  <div className="d-flex align-items-center gap-1">
    <span style={{ width: "15px", height: "15px", backgroundColor: "yellow", display: "inline-block", border: "1px solid #ccc" }}></span>
    <small>Warning</small>
  </div>
  <div className="d-flex align-items-center gap-1">
    <span style={{ width: "15px", height: "15px", backgroundColor: "red", display: "inline-block" }}></span>
    <small>Low Stock</small>
    </div>
    </div>
<div className="topbar-inventory-box mt-2">
<table className="custom-table">
  <thead>
    <tr>
      <th>Items</th>
      <th>Unit of Measurement</th>
      {inventoryType === "normal" ? (
        <>
          <th>Unit Cost</th>
          <th>Quantity (Unit)</th>
          <th>Quantity (Pieces)</th>
        </>
      ) : (
        <>
          <th>Supplier</th>
          <th>Unit Cost</th>
          <th>Quantity (Unit)</th>
          <th>Quantity (Pieces)</th>
        </>
      )}
      <th>Action</th>
    </tr>
  </thead>

  <tbody>
    {loading ? (
      // 🦴 Skeleton loading rows
      [...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td><Skeleton width={150} /></td>
          <td><Skeleton width={100} /></td>
          {inventoryType === "normal" ? (
            <>
              <td><Skeleton width={80} /></td>
              <td><Skeleton width={80} /></td>
            </>
          ) : (
            <>
              <td><Skeleton width={120} /></td>
              <td><Skeleton width={90} /></td>
              <td><Skeleton width={80} /></td>
              <td><Skeleton width={80} /></td>
            </>
          )}
          <td><Skeleton width={90} /></td>
        </tr>
      ))
    ) : currentItems.length > 0 ? (
      currentItems.map((item) => (
        <tr
          key={item.id}
          onClick={() => inventoryType === "normal" && handleShowBOM(item)}
          style={{ cursor: inventoryType === "normal" ? "pointer" : "default" }}
        >
          {/* 🧾 Item Name */}
          <td>
            {inventoryType === "raw"
              ? rawMaterialsDisplayNames[item.item] || item.item
              : finishedGoodsDisplayNames[item.item] || item.item}
          </td>

          {/* 📏 Unit */}
          <td>
            {inventoryType === "raw"
              ? rawMaterialsUnits[item.item] || item.unit
              : finishedGoodsUnits[item.item] || item.unit}
          </td>

          {/* 📦 Quantities */}
          {inventoryType === "normal" ? (
            <>
              <td>
              {item.unit_cost
                ? `₱${Number(item.unit_cost).toLocaleString()}`
                : "—"}
              </td>
              {/* Quantity (Unit) */}
              <td
                className={getQuantityColor(item.quantity, item.item)}
                style={{ fontWeight: "bold" }}
              >
                {Number(item.quantity).toLocaleString()}
              </td>

              {/* Quantity (Pieces) */}
              <td className="text-muted" style={{ fontWeight: "bold" }}>
                {Number(item.quantity_pcs || 0).toLocaleString()}
              </td>
            </>
          ) : (
            <>
              {/* 🏭 Supplier Name */}
              <td>{item.supplier_name || "—"}</td>

              {/* 💰 Unit Cost */}
              <td>
                {item.unit_cost
                  ? `₱${Number(item.unit_cost).toLocaleString()}`
                  : "—"}
              </td>

              {/* Quantity (Unit) */}
              <td
                className={getQuantityColor(item.quantity, item.item)}
                style={{ fontWeight: "bold" }}
              >
                {Number(item.quantity).toLocaleString()}
              </td>

              {/* Quantity (Pieces) */}
              <td className="text-muted" style={{ fontWeight: "bold" }}>
                {Number(item.quantity_pieces || 0).toLocaleString()}
              </td>
            </>
          )}

          {/* ⚙️ Action */}
          <td>
            <button
              className="btn btn-sm btn-outline-secondary mt-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAlertModal(item);
              }}
            >
              Set Alert
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan={inventoryType === "normal" ? "6" : "7"}
          className="text-center"
        >
          No items found
        </td>
      </tr>
    )}
  </tbody>
</table>


  {/* Pagination moved OUTSIDE table */}
  <div className="d-flex justify-content-between mt-2">
    <button
      className="btn btn-sm btn-light"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(currentPage - 1)}
    >
      &larr; Previous
    </button>
    <button
      className="btn btn-sm btn-light"
      disabled={indexOfLastItem >= sortedItems.length}
      onClick={() => setCurrentPage(currentPage + 1)}
    >
      Next &rarr;
    </button>
  </div>
</div>

{showBOMModal &&
  ReactDOM.createPortal(
    <div className="custom-modal-backdrop" onClick={() => setShowBOMModal(false)}>
      <div
        className="custom-modal bg-white rounded shadow"
        style={{ width: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5><strong>Product Details </strong></h5>
          <button type="button" className="btn-close" onClick={() => setShowBOMModal(false)}></button>
        </div>
        <hr/>
        <strong>{finishedGoodsDisplayNames[selectedFinishedGood?.item] || selectedFinishedGood?.item}</strong>
    <div class="d-flex justify-content-between mt-2">
      <p><strong>Price: ₱{selectedFinishedGood.unit_cost}</strong></p>
<button
  className="btn btn-sm btn-primary h-25"
  onClick={(e) => {
    e.stopPropagation(); 
    setNewPrice(selectedFinishedGood.unit_cost || 0);
    setShowPriceModal(true);
  }}
>
  Change Price
</button>
</div>
<h5><strong>Materials Needed: </strong></h5>
        <hr />  
<table className="custom-table">
  <thead>
    <tr>
      <th>Raw Material</th>
      <th>Unit</th>
      <th>Per Case</th>
      <th>Per Piece</th>
      <th>Available Qty</th>
    </tr>
  </thead>
  <tbody>
    {bomItems.map((rm, idx) => (
      <tr key={idx}>
        <td>{rm.name}</td>
        <td>{rm.unit}</td>
        <td>{rm.perCaseQty.toLocaleString()}</td>
        <td>{rm.perPieceQty.toLocaleString()}</td>
        <td>{rm.availableQty.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>
      </div>
    </div>,
    document.body
  )}
  
{showPriceModal &&
  ReactDOM.createPortal(
    <div className="custom-modal-backdrop" onClick={() => setShowPriceModal(false)}>
      <div
        className="custom-modal bg-white rounded shadow"
        style={{ width: "400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5><strong>Change Price</strong></h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowPriceModal(false)}
          ></button>
        </div>
        <hr />
        <div className="mb-3">
          <label><strong>New Price (₱)</strong></label>
          <input
            type="number"
            className="form-control"
            value={newPrice}
            onChange={(e) => setNewPrice(Number(e.target.value))}
            step="0.01"
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await axios.put(
                  `http://localhost:8000/api/inventories/${selectedFinishedGood.id}/update-price`,
                  { unit_cost: newPrice }
                );
                setSelectedFinishedGood(prev => ({
                  ...prev,
                  unit_cost: newPrice
                }));
                setShowPriceModal(false);
                showMessage("✅ Price updated successfully!");
              } catch (err) {
                console.error("Error updating price:", err);
                showMessage("❌ Failed to update price");
              }
            }}
          >
            Save
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowPriceModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

{showAddModal &&
  ReactDOM.createPortal(
    <div className="custom-modal-backdrop" onClick={() => setShowAddModal(false)}>
      <div
        className="custom-modal w-25 bg-white rounded shadow"
        style={{ width: "500px" }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className="modal-header">
        <h5>
          <strong>
            Add New {inventoryType === "raw" ? "Raw Material" : "Finished Good"}
          </strong>
        </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowAddModal(false)}
          ></button>
          </div>
        <hr />

        <div className="mb-2">
          <label><strong>Item Name</strong></label>
          <input
            type="text"
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Item Name"
            value={newItem.item}
            onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
          />
        </div>

        <div className="mb-2">
          <label><strong>Unit</strong></label>
          <input
            type="text"
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Unit (e.g., pcs, box)"
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
          />
        </div>

      {inventoryType === "raw" && (
        <div className="mb-2">
          <label><strong>Quantity per Unit (Conversion)</strong></label>
          <input
            type="number"
            className="form-control"
            style={{ width: "100%" }}
            placeholder="e.g., 24 means 1:24"
            value={newItem.conversion || ""}
            onChange={(e) => setNewItem({ ...newItem, conversion: e.target.value })}
          />
        </div>
      )}

<hr/>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-primary" onClick={handleAddItem}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

            {showAlertModal &&
  ReactDOM.createPortal(
    <div className="custom-modal-backdrop" onClick={() => setShowAlertModal(false)}>
      <div
        className="custom-modal "
        style={{ width: "260px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
        <h5><strong>Set Low Stock Alert</strong></h5>
          <button
              type="button"
              className="btn-close"
              onClick={() => setShowAlertModal(false)}
            ></button>
          </div>
        <hr />
        <p className="mb-2"><strong>Item:</strong> {selectedItem?.item}</p>

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Enter alert quantity"
          value={newAlertQty}
          onChange={(e) => setNewAlertQty(e.target.value)}
        />

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-primary" onClick={handleSaveAlert}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
          </div>
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
  );
}

export default Inventory;
