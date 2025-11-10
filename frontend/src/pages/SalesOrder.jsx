import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from 'react-router-dom';
import logo from './logo.jpg';
import './Styles.css';
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import { FaTools, FaUndo, FaTrashAlt, FaShoppingCart, FaBoxes, FaChartLine, FaRegUser, FaListUl } from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function SalesOrder() {
  const [isDeliveredModalOpen, setIsDeliveredModalOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
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

  const [selectedDate, setSelectedDate] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const submenuRef = useRef(null);
    const location = useLocation();
    const isReportsActive = location.pathname.startsWith("/reports");
    const [reportsOpen, setReportsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [overviewOpen, setOverviewOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempType, setTempType] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [userFullName, setUserFullName] = useState("");
    const [employeeID, setEmployeeID] = useState("");
    const [userFirstName, setUserFirstName] = useState("");
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
      
const formatOrderNumber = (order) => {
    // Add a check to ensure the 'order' object and its properties exist
    // This prevents the "Cannot read properties of undefined" error
    if (!order || !order.date || !order.id) {
        return 'N/A'; // Return a default value if data is missing
    }

    // Convert the date to a string and remove hyphens
    const datePart = order.date.toString().replace(/-/g, '');

    // Convert the ID to a string and pad it with leading zeros
    const idPart = String(order.id).padStart(4, '0');

    // Return the formatted order number
    return `SO-${datePart}-${idPart}`;
};

    // --- Filter Orders ---
  const filteredOrders = orders.filter(order => {
    const customer = customers.find(c => c.id === order.customer_id);
    const customerName = customer ? customer.name : "";

    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatOrderNumber(order).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !selectedDate || order.date === selectedDate;

    return matchesSearch && matchesDate;
  });

// --- Pagination states ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const storedEmployeeID = localStorage.getItem("employeeID");
      if (!storedEmployeeID) return;

      const response = await axios.get(`http://localhost:8000/api/users/${storedEmployeeID}`);

      if (response.data) {
        // Safely build full name
        const fullName = `${response.data.firstname || ""} ${response.data.lastname || ""}`.trim();
        setUserFullName(fullName || "Unknown User");

        // Use employee_id if exists, otherwise fallback to stored
        setEmployeeID(response.data.employee_id || storedEmployeeID);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  fetchUserData();
}, []);

  const fetchData = async () => {
    try {
      const employeeID = localStorage.getItem("employeeID");
      if (employeeID) {
        const userRes = await axios.get(`http://localhost:8000/api/users/${employeeID}`);
        if (userRes.data) {
          setUserFirstName(userRes.data.firstname || "");
          setUserFullName(`${userRes.data.firstname || ""} ${userRes.data.lastname || ""}`);
          setEmployeeID(userRes.data.employeeID || "");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }
      useEffect(() => {
    fetchData();
  }, []);

const [prices, setPrices] = useState({});

const fetchPrices = async () => {
  try {
    const res = await axios.get("http://localhost:8000/api/inventories");
    const priceObj = {};
    res.data.forEach(item => {
      priceObj[item.item] = Number(item.unit_cost); // assuming unit_cost exists
    });
    setPrices(priceObj);
  } catch (err) {
    console.error("Failed to fetch prices:", err);
  }
};

useEffect(() => {
  fetchPrices();
}, []);


    const [newOrder, setNewOrder] = useState({
        products: [],
        quantities: { '350ml': '', '500ml': '', '1L': '', '6L': '' },
        location: '',
        customer_id: '',
        delivery_date: '',
        date: '',
        order_type: 'Standard Order'
    });
    
    // === ADDED: New State for Product Totals and Grand Total ===
    const [productTotals, setProductTotals] = useState({
        '350ml': 0,
        '500ml': 0,
        '1L': 0,
        '6L': 0,
    });
    const [grandTotal, setGrandTotal] = useState(0);

        // === Handler Functions ===
    const showMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 3000);
    };  


const fetchOrders = async (type = "Sales Order") => {
  try {
    setLoading(true); // ⬅️ Start loading
    let url = "http://localhost:8000/api/sales-orders";
    const res = await axios.get(url, { params: { interface_type: type } });
    // Sort by newest (most recent date first)
    const sortedOrders = [...res.data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrders(sortedOrders);
  } catch (err) {
    showMessage("❌ Failed to fetch orders.");
  } finally {
    setLoading(false); // ⬅️ Stop loading
  }
};

const fetchCustomers = async () => {
  try {
    setLoading(true);
    const res = await axios.get("http://localhost:8000/api/customers");
    setCustomers(res.data);
  } catch (err) {
    showMessage("❌ Failed to fetch customers.");
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
        fetchOrders(filterType);
        fetchCustomers();
    }, [filterType]);

    const handleSelectAll = (e) => {
        setSelectedRows(e.target.checked ? orders.map((_, i) => i) : []);
    };

    const handleRowCheckbox = (index) => {
        setSelectedRows((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

const confirmDelete = async () => {
  const idsToDelete = selectedRows.map(index => orders[index].id);

  try {
    // Send bulk delete request with array of IDs
    await axios.delete("http://localhost:8000/api/sales-orders", {
      data: { ids: idsToDelete },
    });

    const remainingOrders = orders.filter((_, i) => !selectedRows.includes(i));
    setOrders(remainingOrders);
    setSelectedRows([]);
    setShowDeleteConfirm(false);
    showMessage("✅ Selected order(s) deleted successfully!");
  } catch (err) {
    setShowDeleteConfirm(false);
    console.error("Error deleting orders:", err.response?.data || err.message);
    showMessage("❌ Failed to delete order(s).");
  }
};



    const handleDelete = () => {
        if (!selectedRows.length) return;
        setShowDeleteConfirm(true);
    };

    const isAllSelected = selectedRows.length > 0 && selectedRows.length === orders.length;

    const openModal = (index) => {
        setSelectedOrderIndex(index);
        setTempType(orders[index].order_type);
        setIsModalOpen(true);
    };

    const handleQuantityChange = (e) => {
        const { name, value } = e.target;
        const newQuantities = {
            ...newOrder.quantities,
            [name]: parseInt(value) || 0,
        };
        setNewOrder(prev => ({
            ...prev,
            quantities: newQuantities,
        }));

        const newProductTotals = {
            ...productTotals,
            [name]: (parseInt(value) || 0) * prices[name]
        };
        setProductTotals(newProductTotals);

        const total = Object.values(newProductTotals).reduce((sum, current) => sum + current, 0);
        setGrandTotal(total);
    };


const handleAddOrder = async () => {
  const payload = {
    employee_id: localStorage.getItem("employeeID"),
    customer_id: newOrder.customer_id,
    location: newOrder.location,
    date: newOrder.date,
    delivery_date: newOrder.delivery_date,
    order_type: newOrder.order_type,
    products: Object.keys(newOrder.quantities)
      .filter(key => Number(newOrder.quantities[key]) > 0)
      .join(", "),
    quantities: newOrder.quantities,
    amount: grandTotal,
    qty_350ml: Number(newOrder.quantities["350ml"]) || 0,
    qty_500ml: Number(newOrder.quantities["500ml"]) || 0,
    qty_1L: Number(newOrder.quantities["1L"]) || 0,
    qty_6L: Number(newOrder.quantities["6L"]) || 0,
    status: "Pending",
  };

  try {
    // Save order
    const res = await axios.post("http://localhost:8000/api/sales-orders", payload);

    // ✅ Use returned order directly (no need for GET)
    setOrders((prev) => {
    const updated = [...prev, res.data.data];
    return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

    // Reset form
    setGrandTotal(0);
    setProductTotals({ "350ml": 0, "500ml": 0, "1L": 0, "6L": 0 });
    setIsAddModalOpen(false);
    setNewOrder({
      products: [],
      quantities: { "350ml": "", "500ml": "", "1L": "", "6L": "" },
      location: "",
      customer_id: "",
      delivery_date: "",
      date: "",
      order_type: "CSO",
    });

    showMessage("✅ Sales order successfully added!");
  } catch (err) {
    console.error("Error adding order:", err.response?.data || err.message);
    showMessage("❌ Failed to add order.");
  }
};


    const handleGeneratePdf = async () => {
        if (selectedOrderIndex === null) return;
        
        const orderId = orders[selectedOrderIndex].id;
        
        try {
            const response = await axios.get(`http://localhost:8000/api/sales-orders/${orderId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SalesOrder-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            showMessage("❌ Failed to generate PDF.");
        }
    };

const selectedCustomer = customers.find(c => c.id == newOrder?.customer_id);

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
{/* Topbar */}
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
<h2 className="topbar-title">SALES ORDER</h2>
<hr />
<div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap">
  {/* Left side: dropdown + search */}
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

  {/* Right side: buttons */}
  <div className="d-flex gap-2">
    <button
      className="btn btn-primary btn-sm"
      onClick={() => setIsAddModalOpen(true)}
    >
      + Add Order
    </button>

    <button
      className="btn btn-danger btn-sm"
      onClick={handleDelete}
      disabled={selectedRows.length === 0}
    >
      <FaTrashAlt /> Delete
    </button>
  </div>
</div>
<hr />
  <div className="d-flex gap-3">
<h2 className="topbar-title">List of Orders:</h2>
    <input
      type="date"
      className="form-control"
      style={{ width: "180px" }}
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
    <button
      className="btn btn-secondary btn-sm"
      onClick={() => setSelectedDate("")}
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
        <th>Sales Order #</th>
        <th>Customer Name</th>
        <th>Date Ordered</th>
        <th>Expected Delivery Date</th>
        <th>Date Delivered</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
<tbody>
  {loading ? (
    // 🦴 Skeleton loading placeholder (5 rows)
    [...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td><Skeleton width={20} height={20} /></td>
        <td><Skeleton width={120} height={20} /></td>
        <td><Skeleton width={100} height={20} /></td>
        <td><Skeleton width={100} height={20} /></td>
        <td><Skeleton width={180} height={20} /></td>
        <td><Skeleton width={100} height={20} /></td>
        <td><Skeleton width={100} height={20} /></td>
        <td><Skeleton width={80} height={20} /></td>
      </tr>
    ))
  ) : currentOrders.length > 0 ? (
    // ✅ Real data when loaded
    currentOrders.map((order, index) => {
      const customer = customers.find(c => c.id === order?.customer_id);
      const customerName = order.customer?.name || customers.find(c => c.id === order?.customer_id)?.name || "Unknown";
      const globalIndex = indexOfFirstItem + index;

      return (
        <tr
          key={order?.id || `order-${globalIndex}`}
          onClick={() => openModal(globalIndex)}
          style={{ cursor: "pointer" }}
        >
          <td onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedRows.includes(globalIndex)}
              onChange={() => handleRowCheckbox(globalIndex)}
            />
          </td>
          <td>{formatOrderNumber(order)}</td>
          <td>{customerName}</td>
          <td>{formatDate(order?.date || "N/A")}</td>
          <td>{formatDate(order?.delivery_date || "N/A")}</td>
          <td>{formatDate(order?.date_delivered || "N/A")}</td>
          <td>
            {order?.amount != null
              ? `₱${Number(order.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "N/A"}
          </td>
          <td>
            <span
              className={`badge ${
                order.status === "Delivered"
                  ? "bg-success"
                  : order.status === "Processing"
                  ? "bg-warning text-dark"
                  : "bg-warning text-dark"
              }`}
            >
              {order.status || "Pending"}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    // ⚠️ No data available
    <tr>
      <td colSpan="5" className="text-center text-gray-500 py-3">
        No sales orders found.
      </td>
    </tr>
  )}
</tbody>
  </table>
  {/* Pagination */}
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
    disabled={indexOfLastItem >= filteredOrders.length}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next &rarr;
  </button>
</div>
</div>
</div>

{/* Add Order Modal */}
{isAddModalOpen && (
    <div className="custom-modal-backdrop">
        <div className="custom-modal" style={{width:"500px"}}>
          <div className="modal-header">
            <h5><strong>Add New Order</strong></h5>
                      <button
            type="button"
            className="btn-close"
            onClick={() => setIsAddModalOpen(false)}
          ></button>
          </div>
          <hr />
            <div className="mb-2">
                <label><strong>Customer Name:</strong></label>
    <select
      className="form-control"
      value={newOrder.customer_id}
      onChange={(e) => {
        const customerId = e.target.value;
        const selected = customers.find(c => c.id == customerId);
        setNewOrder({
          ...newOrder,
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
<div className="mb-2 d-flex flex-column">
    <label><strong>Location:</strong></label>
    <span>{selectedCustomer ? selectedCustomer.shipping_address : ''}</span>
</div>

<div className="mb-2">
    <label><strong>Date:</strong></label>
    <input type="date" className="form-control" value={newOrder.date} onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} />
</div>

<div className="mb-2">
    <label><strong>Expected Delivery Date:</strong></label>
    <input type="date" className="form-control" value={newOrder.delivery_date} onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })} />
</div>

<div className="mb-2">
  <label><strong>Quantities:</strong></label>
  <div className="d-flex flex-column gap-2">
    {["350ml", "500ml", "1L", "6L"].map((product) => (
      <div key={product} className="d-flex align-items-center gap-2">
        <label style={{ width: '100px', flexShrink: 0 }}>
          <strong>{product}:</strong>
        </label>
        <input
          type="text"
          className="form-control"
          name={product}
          style={{ maxWidth: '80px' }}
          value={newOrder.quantities[product] ? Number(newOrder.quantities[product]).toLocaleString() : ""}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, ''); // remove commas
            handleQuantityChange({ target: { name: product, value } });
          }}
        />
        <span>x ₱{prices[product]?.toFixed(2) || 0}</span>
        <span className="ms-auto">
          <strong>
            Total: ₱{productTotals[product].toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </span>
      </div>
    ))}
  </div>
</div>
  <hr />
{/* Overall Total Amount */}
<div className="mb-2 d-flex justify-content-between align-items-center">
    <strong className="">Overall Total Amount: </strong>
    <span >
    <strong>
      ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </strong>
    </span>
</div>
  <hr />
<div className="text-end">
    <button
  className="btn btn-primary btn-sm me-2"
  onClick={() => setIsReviewModalOpen(true)}
>
  Review Summary
</button>
</div>
</div>
</div>
)}
{/* Review Summary Modal */}
{isReviewModalOpen && (
  <div className="custom-modal-backdrop">
    <div className="custom-modal" style={{ width: "500px" }}>
      <div className="modal-header">
        <h5><strong>Review Order Summary</strong></h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => setIsReviewModalOpen(false)}
        ></button>
      </div>
      <hr />

      <div className="mb-2">
        <p><strong>Customer:</strong> {selectedCustomer?.name || "N/A"}</p>
        <p><strong>Location:</strong> {selectedCustomer?.shipping_address || "N/A"}</p>
        <p><strong>Date Ordered:</strong> {newOrder.date || "N/A"}</p>
        <p><strong>Expected Delivery Date:</strong> {newOrder.delivery_date || "N/A"}</p>
      </div>

      <hr />

      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {["350ml", "500ml", "1L", "6L"].map((product) => {
            const qty = Number(newOrder.quantities[product]) || 0;
            if (qty === 0) return null;
            return (
              <tr key={product}>
                <td>{product}</td>
                <td>{qty.toLocaleString()}</td>
                <td>₱{prices[product].toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                <td>₱{(qty * prices[product]).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-end mt-2">
        <strong>Grand Total: </strong>
        ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </div>

      <hr />

      <div className="text-end">
        <button
          className="btn btn-secondary btn-sm me-2"
          onClick={() => setIsReviewModalOpen(false)}
        >
          Cancel
        </button>
        <button
          className="btn btn-success btn-sm"
          onClick={() => {
            handleAddOrder();
            setIsReviewModalOpen(false);
          }}
        >
          Confirm Order
        </button>
      </div>
    </div>
  </div>
)}

{/* Order Details Modal */}
{isModalOpen && selectedOrderIndex !== null && (
  <div className="custom-modal-backdrop">
    <div className="custom-modal" style={{width:"450px"}}>
      <div className="modal-header">
      <h5><strong>Order Details</strong></h5>
      <button
      type="button"
      className="btn-close"
      onClick={() => setIsModalOpen(false)}
    ></button>
      </div>
      <hr />
      <p><strong>Sales Order #:</strong> {formatOrderNumber(orders[selectedOrderIndex])}</p>
      <p><strong>Customer Name:</strong> {customers.find(c => c.id === orders[selectedOrderIndex].customer_id)?.name || 'Unknown'}</p>
      <p><strong>Location:</strong> {orders[selectedOrderIndex].location}</p>
      <p><strong>Product/s:</strong> {orders[selectedOrderIndex].products}</p>
<p><strong>Quantities:</strong></p>
<table className="table table-bordered text-center" style={{width:"395px"}}>
  <thead>
    <tr>
      <th>Size</th>
      <th>Quantity</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(orders[selectedOrderIndex]?.quantities || {})
      .filter(([size, qty]) => qty > 0) // Only show sizes with quantity > 0
      .map(([size, qty]) => (
        <tr key={size}>
          <td>{size}</td>
          <td>{qty.toLocaleString()}</td>
        </tr>
    ))}
  </tbody>
</table>

      <p><strong>Date Ordered:</strong> {formatDate(orders[selectedOrderIndex].date)}</p>
      <p><strong>Expected Delivery Date:</strong> {formatDate(orders[selectedOrderIndex].delivery_date)}</p>
      <p><strong>Date Delivered: </strong> 
        {orders[selectedOrderIndex].date_delivered 
          ? formatDate(orders[selectedOrderIndex].date_delivered) 
          : "Pending"}
      </p>
      <p>
        <strong>Amount:</strong> ₱{Number(orders[selectedOrderIndex].amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p><strong>Status: </strong> 
        <span
          className={`badge ${
            orders[selectedOrderIndex].status === "Delivered"
              ? "bg-success"
              : orders[selectedOrderIndex].status === "Processing"
              ? "bg-warning text-dark"
              : "bg-warning text-dark"
          }`}
        >
          {orders[selectedOrderIndex].status || "Pending"}
        </span>
      </p>
<hr/>
      <div className="text-end">
  {orders[selectedOrderIndex].status !== "Delivered" && (
    <button
      className="btn btn-primary btn-sm me-2"
      onClick={() => setIsDeliveredModalOpen(true)}
    >
      Mark as Delivered
    </button>
  )}
        <button className="btn btn-success btn-sm me-2" onClick={handleGeneratePdf}>
          Generate PDF
        </button>
      </div>
    </div>
  </div>
)}
{isDeliveredModalOpen && (
  <div className="custom-modal-backdrop">
    <div className="custom-modal" style={{ width: "400px" }}>
      <div className="modal-header">
        <h5><strong>Select Date of Delivered</strong></h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => setIsDeliveredModalOpen(false)}
        ></button>
      </div>
      <hr />
      <div className="mb-3">
        <label><strong>Date Delivered:</strong></label>
        <input
          type="date"
          className="form-control"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
      </div>
      <div className="text-end">
        <button
          className="btn btn-secondary btn-sm me-2"
          onClick={() => setIsDeliveredModalOpen(false)}
        >
          Cancel
        </button>
        <button
          className="btn btn-success btn-sm"
          onClick={async () => {
            try {
              const order = orders[selectedOrderIndex];
              await axios.put(`http://localhost:8000/api/sales-orders/${order.id}/mark-delivered`, {
                date_delivered: deliveryDate,
              });
              
              // ✅ Update UI instantly
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === order.id
                    ? { ...o, status: "Delivered", date_delivered: deliveryDate }
                    : o
                )
              );
              showMessage("✅ Order marked as Delivered!");
              setIsDeliveredModalOpen(false);
              setIsModalOpen(false);
            } catch (error) {
              console.error("Error marking as delivered:", error);
              showMessage("❌ Failed to mark order as Delivered.");
            }
          }}
          disabled={!deliveryDate}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="custom-modal-backdrop">
                    <div className="custom-modal">
                        <h5>Confirm Delete</h5>
                        <p>Are you sure you want to delete the selected order(s)?</p>
                        <div className="text-end">
                            <button className="btn btn-danger btn-sm me-2" onClick={confirmDelete}>Yes</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>No</button>
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

export default SalesOrder;