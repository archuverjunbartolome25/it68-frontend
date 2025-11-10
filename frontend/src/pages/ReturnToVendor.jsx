import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import { FaTools, FaUndo, FaTrashAlt, FaShoppingCart, FaBoxes, FaChartLine, FaRegUser, FaListUl } from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function ReturnToVendor() {
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🆕 add this
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const submenuRef = useRef(null);
  const location = useLocation();
  const isReportsActive = location.pathname.startsWith("/reports");
  const [reportsOpen, setReportsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const showMessage = (message) => {
  setSuccessMessage(message);
  setTimeout(() => setSuccessMessage(""), 3000);
};

  const [userFullName, setUserFullName] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  // 🔍 For viewing order details
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const filteredOrders = orders
  .filter(order => {
    const customer = customers.find(c => c.id === order.customer_id);
    const customerName = customer ? customer.name.toLowerCase() : "";
    const location = order.location ? order.location.toLowerCase() : "";
    const rtvNumber = order.rtv_number ? order.rtv_number.toLowerCase() : "";
    const status = order.status ? order.status.toLowerCase() : "";
    const dateOrdered = order.date_ordered ? order.date_ordered.toLowerCase() : "";
    const dateReturned = order.date_returned ? order.date_returned.toLowerCase() : "";
    const search = searchTerm.toLowerCase();

    // Match any field
    return (
      customerName.includes(search) ||
      location.includes(search) ||
      rtvNumber.includes(search) ||
      status.includes(search) ||
      dateOrdered.includes(search) ||
      dateReturned.includes(search)
    );
  })
  .filter(order => {
    if (!filterDate) return true;
    return order.date_returned === filterDate;
  });


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    customer_id: "",
    location: "",
    date_ordered: "",
    date_returned: "",
    quantities: {
      "350ml": "",
      "500ml": "",
      "1L": "",
      "6L": "",
    },
    status: "Pending",
  });
  const handleQuantityChange = (e) => {
    const { name, value } = e.target;
    setNewReturn((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [name]: value,
      },
    }));
  };

const handleAddReturn = async () => {
  // 🆕 Generate Return to Vendor Number
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const rtvNumber = `RTV-${datePart}-${randomPart}`;

  const newData = { ...newReturn, rtv_number: rtvNumber };

  await axios.post("http://localhost:8000/api/return-to-vendor", newData);
  fetchOrders();
  setIsAddModalOpen(false);
  showMessage("✅ Return to Vendor added successfully!");
};

const handleRowClick = (order) => {
  const formattedOrder = {
    ...order,
    quantities: {
      "350ml": order.qty_350ml || 0,
      "500ml": order.qty_500ml || 0,
      "1L": order.qty_1l || 0,
      "6L": order.qty_6l || 0,
    },
  };
  setSelectedReturn(formattedOrder);
  setIsDetailsModalOpen(true);
};


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmployeeID = localStorage.getItem("employeeID");
        if (!storedEmployeeID) return;

        const response = await axios.get(`http://localhost:8000/api/users/${storedEmployeeID}`);
        if (response.data) {
          const fullName = `${response.data.firstname || ""} ${response.data.lastname || ""}`.trim();
          setUserFullName(fullName || "Unknown User");
          setEmployeeID(response.data.employee_id || storedEmployeeID);
          setUserFirstName(response.data.firstname || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

const fetchOrders = async () => {
  try {
    setLoading(true);
    const res = await axios.get("http://localhost:8000/api/return-to-vendor");
    setOrders(res.data);
  } catch (err) {
    showMessage("❌ Failed to fetch return to vendor records.");
  } finally {
    setLoading(false);
  }
};

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/customers");
      setCustomers(res.data);
    } catch (err) {
      showMessage("❌ Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const handleSelectAll = (e) => {
    setSelectedRows(e.target.checked ? orders.map((_, i) => i) : []);
  };

  const handleRowCheckbox = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const confirmDelete = async () => {
    const idsToDelete = selectedRows.map((index) => orders[index].id);
    try {
      await axios.delete("http://localhost:8000/api/return-to-vendor", {
        data: { ids: idsToDelete },
      });
      const remaining = orders.filter((_, i) => !selectedRows.includes(i));
      setOrders(remaining);
      setSelectedRows([]);
      showMessage("✅ Selected record(s) deleted successfully!");
    } catch (err) {
      console.error("Error deleting records:", err);
      showMessage("❌ Failed to delete records.");
    } finally {
      setShowDeleteConfirm(false); // 🆕 close modal after delete
    }
  };

  const isAllSelected = selectedRows.length > 0 && selectedRows.length === orders.length;

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
              <div className="profile-circle">
                {userFullName ? userFullName.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
              </div>
              <div className="profile-text">
                <strong>{userFullName}</strong>
                <small>{employeeID}</small>
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
                {userFirstName}
              </option>
              <option value="logout">Logout</option>
            </select>
          </div>
        </div>
 
        <h2 className="topbar-title">RETURN TO VENDOR</h2>
<hr />
        <div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap">
  <div className="d-flex gap-2">
    <input
      type="text"
      placeholder="Search"
      className="form-control"
      style={{ width: "250px" }}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
    <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              // 🔄 Reset modal fields before opening
              setNewReturn({
                customer_id: "",
                location: "",
                date_ordered: "",
                date_returned: "",
                quantities: {
                  "350ml": "",
                  "500ml": "",
                  "1L": "",
                  "6L": "",
                },
              });
              setIsAddModalOpen(true); // then show modal
            }}
          >
            + Add Product
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedRows.length === 0}
          >
            <FaTrashAlt /> Delete
          </button>
        </div>
        </div>
<hr />
<div className="d-flex gap-3">
<h2 className="topbar-title">List of Returns:</h2>
  <input
    type="date"
    className="form-control"
    style={{ width: "180px" }}
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
  />
  <button
    className="btn btn-secondary btn-sm"
    onClick={() => setFilterDate("")} // Show all
  >
    Show All
  </button>
</div>

 <div className="topbar-inventory-box">
<table className="custom-table">
  <thead>
    <tr>
      <th>
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={handleSelectAll}
        />
      </th>
      <th>Return to Vendor #</th>
      <th>Customer Name</th>
      <th>Date Ordered</th>
      <th>Date Returned</th>
      <th>Status</th>
    </tr>
  </thead>
<tbody>
  {loading ? (
    // 🦴 Skeleton placeholders (5 rows)
    [...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td><Skeleton width={25} height={20} /></td>
        <td><Skeleton width={150} height={20} /></td>
        <td><Skeleton width={120} height={20} /></td>
        <td><Skeleton width={120} height={20} /></td>
        <td><Skeleton width={80} height={20} /></td>
        <td><Skeleton width={80} height={20} /></td>
      </tr>
    ))
  ) : currentOrders.length > 0 ? (
    currentOrders.map((order, index) => {
      const customer = customers.find((c) => c.id === order.customer_id);
      const name = customer ? customer.name : "Unknown";
      const globalIndex = indexOfFirstItem + index;

      return (
        <tr
          key={order.id}
          onClick={() => handleRowClick(order)}
          style={{ cursor: "pointer" }}
        >
          <td>
          <input
            type="checkbox"
            checked={selectedRows.includes(globalIndex)}
            onChange={() => handleRowCheckbox(globalIndex)}
            onClick={(e) => e.stopPropagation()} // ⛔ stops row click
          />
          </td>
          <td>{order.rtv_number || "N/A"}</td>
          <td>{name}</td>
          <td>{formatDate(order.date_ordered)}</td>
          <td>{formatDate(order.date_returned)}</td>
          <td>
            <span
              className={`badge ${
                order.status === "Approved" ? "bg-success" : "bg-warning text-dark"
              }`}
            >
              {order.status}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="5" className="text-center text-muted py-3">
        No return records found
      </td>
    </tr>
  )}
</tbody>
</table>

  <div className="d-flex justify-content-between mt-2">
    <button
      className="btn btn-sm btn-light"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(currentPage - 1)}
    >
      ← Previous
    </button>
    <button
      className="btn btn-sm btn-light"
      disabled={indexOfLastItem >= orders.length}
      onClick={() => setCurrentPage(currentPage + 1)}
    >
      Next →
    </button>
  </div>
</div>
</div>
      {/* Add Return to Vendor Modal */}
{isAddModalOpen && (
  <div className="custom-modal-backdrop">
    <div className="custom-modal" style={{width:"400px"}}>
    <div className="modal-header">
      <h5><strong>Add Production Output</strong></h5>
      <button
        type="button"
        className="btn-close"
        onClick={() => setIsAddModalOpen(false)}
      ></button>
    </div>
<hr />
      {/* Customer Name */}
      <div className="mb-2">
        <label><strong>Customer Name:</strong></label>
        <select
          className="form-control"
          value={newReturn.customer_id}
          onChange={(e) => {
            const customerId = e.target.value;
            const selected = customers.find(c => c.id == customerId);
            setNewReturn({
              ...newReturn,
              customer_id: customerId,
              location: selected ? selected.shipping_address : ''
            });
          }}
        >
        <option value="">Select a Customer</option>
        {customers
          .filter(customer => customer.status === "Active") // filter inactive
          .map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))
        }
        </select>
      </div>

      {/* Location */}
      <div className="mb-2">
        <label><strong>Location:</strong></label>
        <input
          className="form-control"
          value={newReturn.location || ""}
          readOnly
        />
      </div>

      {/* Dates */}
      <div className="mb-2">
        <label><strong>Date Ordered:</strong></label>
        <input
          type="date"
          className="form-control"
          value={newReturn.date_ordered}
          onChange={(e) =>
            setNewReturn({ ...newReturn, date_ordered: e.target.value })
          }
        />
      </div>

      <div className="mb-2">
        <label><strong>Date Returned:</strong></label>
        <input
          type="date"
          className="form-control"
          value={newReturn.date_returned}
          onChange={(e) =>
            setNewReturn({ ...newReturn, date_returned: e.target.value })
          }
        />
      </div>

{/* Quantities */}
<hr/>
<div className="mb-2">
  <label><strong>Quantities:</strong></label>
  <hr/>
  <div className="d-flex flex-column gap-2">

    {/* 350ml */}
    <div className="d-flex align-items-center gap-2">
      <label style={{ width: "100px", flexShrink: 0 }}><strong>350ml:</strong></label>
      <input
        type="text"
        className="form-control"
        name="350ml"
        style={{ maxWidth: "80px" }}
        value={newReturn.quantities["350ml"] ? Number(newReturn.quantities["350ml"]).toLocaleString() : ""}
        onChange={(e) => {
          const value = e.target.value.replace(/,/g, "");
          handleQuantityChange({ target: { name: "350ml", value } });
        }}
      />
    </div>

    {/* 500ml */}
    <div className="d-flex align-items-center gap-2">
      <label style={{ width: "100px", flexShrink: 0 }}><strong>500ml:</strong></label>
      <input
        type="text"
        className="form-control"
        name="500ml"
        style={{ maxWidth: "80px" }}
        value={newReturn.quantities["500ml"] ? Number(newReturn.quantities["500ml"]).toLocaleString() : ""}
        onChange={(e) => {
          const value = e.target.value.replace(/,/g, "");
          handleQuantityChange({ target: { name: "500ml", value } });
        }}
      />
    </div>

    {/* 1L */}
    <div className="d-flex align-items-center gap-2">
      <label style={{ width: "100px", flexShrink: 0 }}><strong>1L:</strong></label>
      <input
        type="text"
        className="form-control"
        name="1L"
        style={{ maxWidth: "80px" }}
        value={newReturn.quantities["1L"] ? Number(newReturn.quantities["1L"]).toLocaleString() : ""}
        onChange={(e) => {
          const value = e.target.value.replace(/,/g, "");
          handleQuantityChange({ target: { name: "1L", value } });
        }}
      />
    </div>

    {/* 6L */}
    <div className="d-flex align-items-center gap-2">
      <label style={{ width: "100px", flexShrink: 0 }}><strong>6L:</strong></label>
      <input
        type="text"
        className="form-control"
        name="6L"
        style={{ maxWidth: "80px" }}
        value={newReturn.quantities["6L"] ? Number(newReturn.quantities["6L"]).toLocaleString() : ""}
        onChange={(e) => {
          const value = e.target.value.replace(/,/g, "");
          handleQuantityChange({ target: { name: "6L", value } });
        }}
      />
    </div>

  </div>
</div>

<hr/>
      {/* Actions */}
      <div className="text-end">
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleAddReturn}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}

      {showDeleteConfirm && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal">
            <h5>Confirm Delete</h5>
            <p>Are you sure you want to delete the selected return(s)?</p>
            <div className="text-end">
              <button className="btn btn-danger btn-sm me-2" onClick={confirmDelete}>Yes</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>No</button>
            </div>
          </div>
        </div>
      )} 

{/* 🔍 Details Modal */}
{isDetailsModalOpen && selectedReturn && (
  <div className="custom-modal-backdrop">
    <div className="custom-modal" style={{width:"450px"}}>
      <div className="modal-header">
      <h5><strong>Return Details</strong></h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setIsDetailsModalOpen(false)}
          ></button>
      </div>
      <hr />

    <p><strong>Return to Vendor #:</strong> {selectedReturn.rtv_number || "N/A"}</p>
      <p><strong>Customer Name:</strong> {
        customers.find(c => c.id === selectedReturn.customer_id)?.name || "Unknown"
      }</p>
      <p><strong>Location:</strong> {selectedReturn.location || "N/A"}</p>
      <p><strong>Date Ordered:</strong> {formatDate(selectedReturn.date_ordered)}</p>
      <p><strong>Date Returned:</strong> {formatDate(selectedReturn.date_returned)}</p>
      <p><strong>Quantities:</strong></p>
      <div className="d-flex justify-content-center" style={{ width: "100%" }}>
<table className="table table-sm table-bordered text-center">
  <thead>
    <tr>
      <th>Size</th>
      <th>Quantity</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(selectedReturn.quantities || {})
      .filter(([size, qty]) => qty > 0)
      .map(([size, qty]) => (
        <tr key={size}>
          <td>{size}</td>
          <td>{qty}</td>
        </tr>
      ))}
  </tbody>
</table>
</div>
<hr/>
<div className="text-end mt-3">
  {selectedReturn.status === "Pending" ? (
    <button
      className="btn btn-success btn-sm"
      onClick={async () => {
        try {
          await axios.put(
            `http://localhost:8000/api/return-to-vendor/${selectedReturn.id}`,
            { status: "Approved" }
          );
          showMessage("✅ Return has been approved!");
          setIsDetailsModalOpen(false);
          fetchOrders();
        } catch (err) {
          console.error("Error approving return:", err);
          showMessage("❌ Failed to approve return.");
        }
      }}
    >
      Approve
    </button>
  ) : (
    <button className="btn btn-secondary btn-sm" disabled>
      Approved
    </button>
  )}
</div>
    </div>
  </div>
)}
{successMessage && (
<div className="success-message">
{successMessage}
</div>
)}
    </div>
  );
}

export default ReturnToVendor;
