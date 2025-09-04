import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Spinner,
  Form,
  Label,
  Input,
  Badge,
} from "reactstrap";
import {
  useGetSupplierByIdQuery,
  useCreateSupplierTransactionMutation,
  useUpdateSupplierTransactionMutation,
  useDeleteSupplierTransactionMutation,
} from "../../../slices/supplierSLice";
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Trash, Plus, Save, X } from "react-feather";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";

const MySwal = withReactContent(Swal);

const ViewSupplierTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetSupplierByIdQuery(id);
  const [createSupplierTransaction, { isLoading: isTransactionLoading }] =
    useCreateSupplierTransactionMutation();
  const [updateSupplierTransaction, { isLoading: isUpdatingTransaction }] =
    useUpdateSupplierTransactionMutation();
  const [deleteSupplierTransaction, { isLoading: isDeletingTransaction }] =
    useDeleteSupplierTransactionMutation();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  
  const [transaction, setTransaction] = useState({
    amount: "",
    paymentDate: "",
    modeOfPayment: "cash",
    invoice: ""
  });

  // Get theme from localStorage
  useEffect(() => {
    const getThemeFromStorage = () => {
      const skin = localStorage.getItem('skin');
      if (skin?.toLowerCase()?.includes('dark')) {
        return 'dark';
      }
      return 'light';
    };
    
    setCurrentTheme(getThemeFromStorage());
    
    const interval = setInterval(() => {
      const newTheme = getThemeFromStorage();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTheme]);

  const isDarkTheme = currentTheme?.toLowerCase()?.trim() === "dark" || 
                      currentTheme?.toLowerCase()?.includes("dark");

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-danger text-center mt-5">
        Failed to load supplier or transactions.
      </div>
    );
  }

  const supplier = data.data || data; // adjust if your API response is different
  console.log(supplier);

  // Calculate remaining amount
  const sumTransactions =
    Array.isArray(supplier.transactions) && supplier.transactions.length > 0
      ? supplier.transactions.reduce(
          (sum, t) => sum + (Number(t.paidAmount) || 0),
          0
        )
      : 0;
  const dueAmount = Number(supplier.dueAmount) || 0;
  const paidAmount = Number(supplier.paidAmount) || 0;
  const remainingAmount = dueAmount - sumTransactions;

  // Calculate totals from transactions
  const totalPaidAmount = supplier.transactions && supplier.transactions.length > 0
    ? supplier.transactions.reduce((sum, txn) => sum + Number(txn.paidAmount || 0), 0)
    : 0;
  const totalDueAmount = supplier.transactions && supplier.transactions.length > 0
    ? supplier.transactions.reduce((sum, txn) => sum + Number(txn.dueAmount || 0), 0)
    : 0;
  const totalRemainingAmount = totalPaidAmount - totalDueAmount;

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    setTransaction(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, e) => {
    const value = e.target.value;
    setEditingTransaction(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleRowClick = (rowId) => {
    if (editingTransaction) return; // Don't allow selection while editing
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleInputClick = (e) => {
    // Stop propagation to prevent row click when clicking on inputs
    e.stopPropagation();
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction({
      index: transaction.index,
      amount: transaction.amount,
      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split('T')[0] : "",
      modeOfPayment: transaction.modeOfPayment,
      invoice: transaction.invoice
    });
  };

  const handleDeleteClick = async (transactionIndex) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      customClass: {
        confirmButton: "btn btn-primary",
        cancelButton: "btn btn-outline-danger ms-1",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSupplierTransaction({
            supplierId: id,
            index: transactionIndex
          }).unwrap();
          toast.success("Transaction deleted successfully");
          refetch();
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete transaction");
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    // Validate required fields
    if (!editingTransaction.amount || !editingTransaction.paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate amount
    if (Number(editingTransaction.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updateData = {
        supplierId: id,
        index: editingTransaction.index,
        amount: Number(editingTransaction.amount),
        paymentDate: editingTransaction.paymentDate,
        modeOfPayment: editingTransaction.modeOfPayment,
        invoice: editingTransaction.invoice
      };

      await updateSupplierTransaction(updateData).unwrap();
      toast.success("Transaction updated successfully");
      setEditingTransaction(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => params.row.index + 1,
    },
    {
      field: "amount",
      headerName: "Amount",
      width: isMobile ? 100 : 250,
      minWidth: isMobile ? 80 : 200,
      flex: 1,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold" style={{ fontSize: isMobile ? '10px' : '14px' }}>
          ${params.row.amount || 0}
        </span>
      ),
    },
    {
      field: "paymentDate",
      headerName: "Date",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span style={{ fontSize: isMobile ? '10px' : '14px' }}>
          {params.row.paymentDate ? new Date(params.row.paymentDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: "modeOfPayment",
      headerName: "Mode",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <Badge color="info" className="text-white" style={{ fontSize: isMobile ? '8px' : '12px' }}>
          {params.row.modeOfPayment}
        </Badge>
      ),
    },
    {
      field: "invoice",
      headerName: "Invoice",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span style={{ fontSize: isMobile ? '10px' : '14px' }}>
          {params.row.invoice || 'N/A'}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 150 : 220,
      minWidth: isMobile ? 130 : 180,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex flex-column flex-md-row gap-1 mt-1">
          <Button
            color="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Edit size={isMobile ? 10 : 12} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "Edit"}
          </Button>
          <Button
            color="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row.index);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Trash size={isMobile ? 10 : 12} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  // Prepare data for MUI DataGrid
  const gridData = supplier.transactions ? supplier.transactions.map((txn, index) => ({
    id: txn._id || index,
    index: index,
    ...txn
  })) : [];

  return (
    <>
      <style>
        {`
          @media (max-width: 767.98px) {
            .app-content, .content-area-wrapper, .container, .main-content, .content-wrapper {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              position: relative !important;
            }
            .transactions-application {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            .mobile-container {
              padding: 0 !important;
              z-index: 1 !important;
              margin: 0 !important;
              width: 100vw !important;
              height: calc(100vh - 60px) !important;
              overflow: auto !important;
              max-width: 100vw !important;
              position: fixed !important;
              top: 60px !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
            .mobile-card {
              width: 100vw !important;
              height: calc(100vh - 60px) !important;
              margin: 0 !important;
              border-radius: 0 !important;
              border: none !important;
              max-width: 100vw !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
            .mobile-card-header {
              padding: 1rem !important;
              text-align: center !important;
              border-bottom: 1px solid #e2e8f0 !important;
              background-color: #ffffff !important;
              border-radius: 8px 8px 0 0 !important;
            }
            .mobile-card-header h4 {
              font-size: 18px !important;
              font-weight: 600 !important;
              margin: 0 !important;
            }
            .mobile-card-body {
              padding: 1rem !important;
              height: calc(100vh - 180px) !important;
              overflow: auto !important;
            }
            .mobile-amount-cards {
              display: flex !important;
              flex-direction: row !important;
              gap: 0.25rem !important;
              margin-bottom: 1rem !important;
              justify-content: space-between !important;
            }
            .mobile-amount-card {
              flex: 1 !important;
              text-align: center !important;
              padding: 0.25rem !important;
              font-size: 10px !important;
              min-width: auto !important;
              margin: 0 !important;
            }
            .mobile-form-section {
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .mobile-form-input {
              width: 100% !important;
              margin-bottom: 0.5rem !important;
              font-size: 16px !important;
            }
            .mobile-add-button {
              width: auto !important;
              min-width: 80px !important;
              max-width: 100px !important;
              font-size: 14px !important;
              padding: 0.5rem !important;
            }
            .mobile-button-row {
              display: flex !important;
              flex-direction: row !important;
              gap: 0.25rem !important;
              width: 100% !important;
              justify-content: space-between !important;
            }
            .mobile-button-row .btn {
              flex: 1 !important;
              font-size: 12px !important;
              padding: 0.375rem 0.25rem !important;
              min-width: auto !important;
              max-width: none !important;
            }
            .mobile-table-container {
              height: calc(100vh - 500px) !important;
              overflow: auto !important;
            }
            .btn {
              font-size: 14px !important;
            }
            .form-control {
              font-size: 16px !important;
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              overflow-x: hidden !important;
            }
            .container-fluid {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            .row {
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
            }
            .col, .col-12, .col-md-6, .col-xs-12 {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }
            * {
              box-sizing: border-box !important;
            }
            div[class*="container"] {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            div[class*="content"] {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
          }
          @media (min-width: 768px) {
            .mobile-container {
            z-index: 1 !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .mobile-card {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .container-fluid {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
          }
        `}
      </style>
      <div
        className="container-fluid mobile-container"
        style={{ 
          height: isMobile ? "calc(100vh - 60px)" : "calc(100vh - 100px)", 
          overflow: "auto",
          padding: isMobile ? '0' : '0',
          margin: isMobile ? '0' : '0',
          width: isMobile ? '100vw' : '100%',
          maxWidth: isMobile ? '100vw' : '100%',
          position: isMobile ? 'fixed' : undefined,
          top: isMobile ? '60px' : undefined,
          left: isMobile ? '0' : undefined,
          right: isMobile ? '0' : undefined,
          bottom: isMobile ? '0' : undefined,
          zIndex: isMobile ? '1000' : undefined
        }}
      >
        <div 
          style={{
            width: isMobile ? '100vw' : '100%',
            height: isMobile ? 'calc(100vh - 60px)' : 'auto',
            margin: isMobile ? '0' : '0',
            padding: isMobile ? '0' : '0',
            position: isMobile ? 'absolute' : undefined,
            top: isMobile ? '50px' : undefined,
            left: isMobile ? '0' : undefined,
            right: isMobile ? '0' : undefined,
            bottom: isMobile ? '0' : undefined,
            maxWidth: isMobile ? '100vw' : '100%'
          }}
        >
          <Card 
            className="w-100 mobile-card" 
            style={{
              backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
              border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
              color: isDarkTheme ? '#ffffff' : '#000000',
              width: isMobile ? '100vw' : '100%',
              height: isMobile ? 'calc(100vh - 60px)' : 'auto',
              margin: isMobile ? '0' : '0',
              padding: isMobile ? '0' : '0',
              maxWidth: isMobile ? '100vw' : '100%',
              position: isMobile ? 'absolute' : undefined,
              top: isMobile ? '0' : undefined,
              left: isMobile ? '0' : undefined,
              right: isMobile ? '0' : undefined,
              bottom: isMobile ? '0' : undefined
            }}
          >
            <CardHeader 
              className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-center ${isMobile ? 'mobile-card-header' : ''}`}
              style={{
                backgroundColor: isDarkTheme ? '#23263a' : '#ffffff',
                borderBottom: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
              <CardTitle 
                tag="h4" 
                className={isMobile ? 'mobile-card-header h4' : ''}
                style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
              >
                Transactions for {supplier.supplierName}
              </CardTitle>
              <Button 
                color="secondary" 
                onClick={() => navigate("/apps/suppliers")}
                className={isMobile ? 'w-100 mt-2' : ''}
                style={{ 
                  width: isMobile ? '100%' : 'auto',
                  fontSize: isMobile ? '14px' : '14px',
                  padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
                }}
              >
          Back to Suppliers
        </Button>
      </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
        <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-center mb-2 gap-2`}>
          {isMobile ? (
            <div className="mobile-button-row w-100">
              <Button
                color="info"
                onClick={() => setShowTransactionForm(!showTransactionForm)}
                className="btn"
                style={{ 
                  fontSize: '12px',
                  padding: '0.375rem 0.25rem'
                }}
              >
                <Plus size={12} className="me-1" />
                {showTransactionForm ? "Cancel" : "Add"}
              </Button>
              {editingTransaction && (
                <>
                  <Button
                    color="success"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="btn"
                    style={{ 
                      fontSize: '12px',
                      padding: '0.375rem 0.25rem'
                    }}
                  >
                    {isSubmitting ? <Spinner size="sm" /> : "Save"}
                  </Button>
                  <Button 
                    color="secondary" 
                    onClick={handleCancelEdit}
                    className="btn"
                    style={{ 
                      fontSize: '12px',
                      padding: '0.375rem 0.25rem'
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          ) : (
          <div className="d-flex gap-2">
            <Button
              color="info"
              onClick={() => setShowTransactionForm(!showTransactionForm)}
                style={{ 
                  minWidth: "120px",
                  fontSize: '14px'
                }}
            >
              <Plus size={15} className="me-1" />
              {showTransactionForm ? "Cancel Transaction" : "Add Transaction"}
            </Button>
            {editingTransaction && (
              <>
                <Button
                  color="success"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                    style={{ 
                      minWidth: "100px",
                      fontSize: '14px'
                    }}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                </Button>
                  <Button 
                    color="secondary" 
                    onClick={handleCancelEdit}
                    style={{ 
                      minWidth: "80px",
                      fontSize: '14px'
                    }}
                  >
                  Cancel Edit
                </Button>
              </>
            )}
          </div>
          )}
        </div>

        <div className={`d-flex ${isMobile ? 'mobile-amount-cards' : 'justify-content-around'} align-items-center my-2`}>
          <div
            className={`${isMobile ? 'mobile-amount-card' : 'mb-2'}`}
            style={{
              background: isDarkTheme ? "#4a1a1a" : "#ffe5e5",
              color: isDarkTheme ? "#ff6b6b" : "#b30000",
              borderRadius: 4,
              padding: isMobile ? "4px 2px" : "4px 16px",
              display: "inline-block",
              minWidth: isMobile ? "auto" : 120,
              textAlign: isMobile ? "center" : "right",
              fontWeight: 600,
              fontSize: isMobile ? "10px" : "14px",
              width: isMobile ? "auto" : "auto",
              flex: isMobile ? 1 : "none"
            }}
          >
            {isMobile ? "Rem:" : "Remaining:"} ${data?.totalRemainingAmount || 0}
          </div>
          <div
            className={`${isMobile ? 'mobile-amount-card' : 'mb-2'}`}
            style={{
              background: isDarkTheme ? "#1a4a1a" : "#e5ffe5",
              color: isDarkTheme ? "#6bff6b" : "#00b300",
              borderRadius: 4,
              padding: isMobile ? "4px 2px" : "4px 16px",
              display: "inline-block",
              minWidth: isMobile ? "auto" : 120,
              textAlign: isMobile ? "center" : "right",
              fontWeight: 600,
              fontSize: isMobile ? "10px" : "14px",
              width: isMobile ? "auto" : "auto",
              flex: isMobile ? 1 : "none"
            }}
          >
            {isMobile ? "Due:" : "Due:"} ${data?.totalDueAmount || 0}
          </div>
          <div
            className={`${isMobile ? 'mobile-amount-card' : 'mb-2'}`}
            style={{
              background: isDarkTheme ? "#4a1a1a" : "#ffe5e5",
              color: isDarkTheme ? "#ff6b6b" : "#b30000",
              borderRadius: 4,
              padding: isMobile ? "4px 2px" : "4px 16px",
              display: "inline-block",
              minWidth: isMobile ? "auto" : 120,
              textAlign: isMobile ? "center" : "right",
              fontWeight: 600,
              fontSize: isMobile ? "10px" : "14px",
              width: isMobile ? "auto" : "auto",
              flex: isMobile ? 1 : "none"
            }}
          >
            {isMobile ? "Paid:" : "Paid:"} ${data?.totalPaidAmount || 0}
          </div>
        </div>

        {editingTransaction && (
          <Card 
            className="mb-3" 
            style={{
              backgroundColor: isDarkTheme ? '#23263a' : '#ffffff',
              border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
              color: isDarkTheme ? '#ffffff' : '#000000'
            }}
          >
            <CardHeader style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa' }}>
              <CardTitle tag="h5" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Edit Transaction</CardTitle>
            </CardHeader>
            <CardBody style={{ backgroundColor: isDarkTheme ? '#23263a' : '#ffffff' }}>
              <Form onSubmit={handleSaveEdit}>
                <div className="row">
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Paid/Due Amount</Label>
                    <Input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Payment Date</Label>
                    <Input
                      type="date"
                      value={editingTransaction.paymentDate}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, paymentDate: e.target.value }))}
                      required
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Mode of Payment</Label>
                    <Input
                      type="select"
                      value={editingTransaction.modeOfPayment}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, modeOfPayment: e.target.value }))}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit</option>
                    </Input>
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Invoice</Label>
                    <Input
                      type="text"
                      value={editingTransaction.invoice}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, invoice: e.target.value }))}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {showTransactionForm && (
          <Form
            className="mt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              
              const transactionPayload = {
                supplierId: id,
                amount: Number(transaction.amount),
                paymentDate: transaction.paymentDate,
                modeOfPayment: transaction.modeOfPayment,
                invoice: transaction.invoice,
              };

              console.log('Sending transaction to backend:', transactionPayload);
              try {
                await createSupplierTransaction(transactionPayload).unwrap();
                toast.success("Transaction added successfully!");
                setShowTransactionForm(false);
                setTransaction({
                  amount: "",
                  paymentDate: "",
                  modeOfPayment: "cash",
                  invoice: "",
                });
                refetch();
              } catch (error) {
                toast.error(
                  error?.data?.message || "Failed to add transaction"
                );
              }
            }}
          >
            <div className="row">
              <div className={`col-md-2 ${isMobile ? 'col-12' : ''} mb-1`}>
                <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Paid/Due Amount</Label>
                <Input
                  type="number"
                  value={transaction.amount}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      amount: e.target.value,
                    })
                  }
                  required
                  className={isMobile ? 'mobile-form-input' : ''}
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    fontSize: isMobile ? '16px' : '14px'
                  }}
                />
              </div>
              <div className={`col-md-2 ${isMobile ? 'col-12' : ''} mb-1`}>
                <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Payment Date</Label>
                <Input
                  type="date"
                  value={transaction.paymentDate}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      paymentDate: e.target.value,
                    })
                  }
                  required
                  className={isMobile ? 'mobile-form-input' : ''}
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    fontSize: isMobile ? '16px' : '14px'
                  }}
                />
              </div>
              <div className={`col-md-2 ${isMobile ? 'col-12' : ''} mb-1`}>
                <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Mode of Payment</Label>
                <Input
                  type="select"
                  value={transaction.modeOfPayment}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      modeOfPayment: e.target.value,
                    })
                  }
                  className={isMobile ? 'mobile-form-input' : ''}
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    fontSize: isMobile ? '16px' : '14px'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="credit">Credit</option>
                </Input>
              </div>
              <div className={`col-md-2 ${isMobile ? 'col-12' : ''} mb-1`}>
                <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Invoice</Label>
                <Input
                  type="text"
                  value={transaction.invoice}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      invoice: e.target.value,
                    })
                  }
                  className={isMobile ? 'mobile-form-input' : ''}
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    fontSize: isMobile ? '16px' : '14px'
                  }}
                />
              </div>
            </div>
            <Button
              color="success"
              type="submit"
              disabled={isTransactionLoading}
              className={isMobile ? 'w-100' : ''}
              style={{ 
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
              }}
            >
              {isTransactionLoading ? (
                <Spinner size="sm" />
              ) : (
                "Save Transaction"
              )}
            </Button>
          </Form>
        )}

        {gridData.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No transactions found</p>
          </div>
        ) : (
          <div className="mobile-table-container" style={{ height: 400, width: '100%', marginBottom: "40px" }}>
            <DataGrid
              key={currentTheme}
              rows={gridData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              autoHeight={false}
              getRowId={(row) => row.id}
              sx={{
                bgcolor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                borderRadius: 2,
                border: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                fontFamily: 'inherit !important',
                fontSize: '14px !important',
                '& .MuiDataGrid-main': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-root': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: isDarkTheme ? '#23263a !important' : '#f7fafc !important',
                  color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                  borderBottom: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                  fontWeight: '600 !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: isDarkTheme ? '#23263a !important' : '#f7fafc !important',
                  color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                  borderRight: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                  fontWeight: '600 !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                  fontWeight: '600 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: isDarkTheme ? '#2d3748 !important' : '#e2e8f0 !important',
                },
                '& .MuiDataGrid-row': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  borderBottom: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: isDarkTheme ? '#2d3748 !important' : '#f7fafc !important',
                },
                '& .MuiDataGrid-row.Mui-selected': {
                  backgroundColor: isDarkTheme ? '#2d3748 !important' : '#e6f3ff !important',
                },
                '& .MuiDataGrid-row.Mui-selected:hover': {
                  backgroundColor: isDarkTheme ? '#2d3748 !important' : '#e6f3ff !important',
                },
                '& .MuiDataGrid-cell': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  borderRight: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none !important',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none !important',
                },
                '& .MuiTablePagination-root': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  borderTop: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiTablePagination-toolbar': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiTablePagination-selectLabel': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiTablePagination-select': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiTablePagination-input': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiTablePagination-actions': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiIconButton-root': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                },
                '& .MuiIconButton-root:hover': {
                  backgroundColor: isDarkTheme ? '#2d3748 !important' : '#f7fafc !important',
                },
                '& .MuiSvgIcon-root': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                },
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  borderTop: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-selectedRowCount': {
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                },
                '& .MuiDataGrid-virtualScrollerContent': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                },
                '& .MuiDataGrid-virtualScrollerRenderZone': {
                  backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                },
                // Mobile responsive styles
                '@media (max-width: 767.98px)': {
                  fontSize: '11px !important',
                  width: '100% !important',
                  height: '100% !important',
                  '& .MuiDataGrid-columnHeader': {
                    fontSize: '9px !important',
                    padding: '1px 2px !important',
                    minHeight: '28px !important',
                    fontWeight: '600 !important',
                  },
                  '& .MuiDataGrid-cell': {
                    fontSize: '9px !important',
                    padding: '1px 2px !important',
                    minHeight: '28px !important',
                  },
                  '& .MuiDataGrid-main': {
                    overflowX: 'auto !important',
                    width: '100% !important',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    minWidth: '450px !important',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    minWidth: '450px !important',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    minWidth: '450px !important',
                    fontSize: '9px !important',
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '28px !important',
                  },
                  '& .MuiButton-root': {
                    minWidth: 'auto !important',
                    padding: '1px 2px !important',
                    fontSize: '8px !important',
                    minHeight: '20px !important',
                  },
                  '& .MuiDataGrid-root': {
                    width: '100% !important',
                    height: '100% !important',
                  },
                },
              }}
            />
          </div>
        )}
      </CardBody>
    </Card>
        </div>
      </div>
    </>
  );
};

export default ViewSupplierTransaction;
