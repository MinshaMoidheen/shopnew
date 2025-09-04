import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Form,
  Spinner,
  Label,
} from "reactstrap";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  useGetAllSuppliersQuery,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useCreateSupplierTransactionMutation,
  useCreateSupplierMutation,
  useSearchSuppliersQuery,
} from "../../slices/supplierSLice";
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Trash, Plus, Eye } from "react-feather";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";

const MySwal = withReactContent(Swal);


const SupplierList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transaction, setTransaction] = useState({
    paidAmount: "",
    paymentDate: "",
    modeOfPayment: "cash",
  });
  const [createSupplierTransaction, { isLoading: isTransactionLoading }] =
    useCreateSupplierTransactionMutation();

  // Add supplier form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: "",
    location: "",
    vatNumber: "",
    dueAmount: 0,
    paidAmount: 0,
    modeOfPayment: "cash",
    paymentDate: ""
  });
  const [createSupplier, { isLoading: isCreatingSupplier }] = useCreateSupplierMutation();

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

  const { data, isLoading, refetch } = useGetAllSuppliersQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    invoice: invoiceSearchTerm
  });

  // Search suppliers query
  const { 
    data: searchData, 
    isLoading: searchLoading, 
    refetch: refetchSearch 
  } = useSearchSuppliersQuery(
    {
      name: debouncedSearchTerm,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: !debouncedSearchTerm || debouncedSearchTerm.trim() === '',
    }
  );
  console.log("searchData", searchData);
  
  // Use search results if search term exists, otherwise use regular suppliers
  const suppliers = debouncedSearchTerm.trim() !== '' ? (searchData?.suppliers || []) : (data?.data || []);
  const totalCount = debouncedSearchTerm.trim() !== '' ? (searchData?.total || 0) : (data?.total || 0);
  const totals = debouncedSearchTerm.trim() !== '' ? (searchData?.totals || { paidAmount: 0, dueAmount: 0 }) : (data?.totals || { paidAmount: 0, dueAmount: 0 });
  const isLoadingData = debouncedSearchTerm.trim() !== '' ? searchLoading : isLoading;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.trim() !== '') {
      refetchSearch();
    } else {
      refetch();
    }
  }, [refetch, refetchSearch, debouncedSearchTerm, invoiceSearchTerm]);

  console.log("data", suppliers);

  const handleEditInputChange = (field, e) => {
    const value = e.target.value;
    setEditingSupplier((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setSelectedRow(supplier._id);
  };

  const handleDeleteClick = async (supplierId) => {
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
          await deleteSupplier(supplierId).unwrap();
          toast.success("Supplier deleted successfully!");
          refetch();
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete supplier.");
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingSupplier(null);
  };

  const handleRowClick = (rowId) => {
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleRowDoubleClick = (rowId) => {
    navigate(`/apps/suppliers/view/${rowId}`);
  };

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    setNewSupplier(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSupplier(newSupplier).unwrap();
      toast.success("Supplier added successfully");
      setNewSupplier({
        supplierName: "",
        location: "",
        vatNumber: "",
        dueAmount: 0,
        paidAmount: 0,
        modeOfPayment: "cash",
        paymentDate: ""
      });
      setShowAddForm(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNewSupplier({
      supplierName: "",
      location: "",
      vatNumber: "",
      dueAmount: 0,
      paidAmount: 0,
      modeOfPayment: "cash",
      paymentDate: ""
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSupplier({
        supplierId: editingSupplier._id,
        data: editingSupplier,
      }).unwrap();
      toast.success("Supplier updated successfully!");
      setEditingSupplier(null);
      setSelectedRow(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update supplier");
    }
    setIsSubmitting(false);
  };

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => {
        const index = suppliers.findIndex(supplier => supplier._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "supplierName",
      headerName: "Supplier Name",
      width: isMobile ? 120 : 200,
      minWidth: isMobile ? 100 : 150,
      flex: 1,
      sortable: true,
    },
    {
      field: "location",
      headerName: "Location",
      width: isMobile ? 100 : 200,
      minWidth: isMobile ? 80 : 150,
      sortable: true,
    },
    {
      field: "vatNumber",
      headerName: "VAT Number",
      width: isMobile ? 100 : 170,
      minWidth: isMobile ? 80 : 120,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 200 : 350,
      minWidth: isMobile ? 180 : 300,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex flex-column flex-md-row gap-1 mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/apps/suppliers/view/${params.row._id}`);
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
            <Eye size={isMobile ? 10 : 12} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "View"}
          </Button>
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
              handleDeleteClick(params.row._id);
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
  const gridData = suppliers.map((supplier, index) => ({
    id: supplier._id || index,
    ...supplier
  }));

  console.log("selectedRow", selectedRow);

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
            .suppliers-application {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            .mobile-container {
              padding: 0 !important;
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
            .mobile-search-section {
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .mobile-search-input {
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
            .mobile-table-container {
              height: calc(100vh - 340px) !important;
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
            top: isMobile ? '0' : undefined,
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
              className={`d-flex justify-content-between align-items-center ${isMobile ? 'mobile-card-header' : ''}`}
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
                Suppliers List
              </CardTitle>
            </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
        <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-center mb-2 gap-2`}>
          <div className={`d-flex ${isMobile ? 'flex-column w-100' : 'gap-2'}`}>
            <Button
              color="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              className={isMobile ? 'mobile-add-button w-100' : ''}
              style={{ 
                minWidth: isMobile ? "120px" : "auto",
                maxWidth: isMobile ? "100%" : "auto",
                fontSize: isMobile ? '14px' : '14px'
              }}
            >
              <Plus size={15} className="me-1" />
              {showAddForm ? "Cancel Add" : (isMobile ? "Add" : "Add New Supplier")}
            </Button>
            {/* {editingSupplier && (
              <>
                <Button
                  color="success"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className={isMobile ? 'mobile-add-button w-100' : ''}
                  style={{ 
                    minWidth: isMobile ? "100px" : "auto",
                    maxWidth: isMobile ? "100%" : "auto",
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                </Button>
                <Button 
                  color="secondary" 
                  onClick={handleCancelEdit}
                  className={isMobile ? 'mobile-add-button w-100' : ''}
                  style={{ 
                    minWidth: isMobile ? "80px" : "auto",
                    maxWidth: isMobile ? "100%" : "auto",
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                >
                  Cancel Edit
                </Button>
              </>
            )} */}
          </div>
          <div className={`d-flex ${isMobile ? 'flex-column w-100' : 'gap-2'}`} style={{ width: isMobile ? '100%' : '400px' }}>
            <div className={isMobile ? 'w-100 mb-2' : ''}>
              <Label for="supplierSearch" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Supplier Search:</Label>
              <Input
                id="supplierSearch"
                type="text"
                placeholder="Search by supplier name or vat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isMobile ? 'mobile-search-input' : ''}
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            </div>
            <div className={isMobile ? 'w-100' : ''}>
              <Label for="invoiceSearch" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Invoice Search:</Label>
              <Input
                id="invoiceSearch"
                type="text"
                className={isMobile ? 'mobile-search-input' : ''}
                placeholder="Search by invoice value..."
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            </div>
          </div>
        </div>

        {showAddForm && (
          <Form onSubmit={handleAddSupplier} className="mb-3">
            <div className="row">
              <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Supplier Name</label>
                <Input
                  value={newSupplier.supplierName}
                  onChange={(e) => handleInputChange("supplierName", e)}
                  placeholder="Enter Supplier Name"
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
                <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Location</label>
                <Input
                  value={newSupplier.location}
                  onChange={(e) => handleInputChange("location", e)}
                  placeholder="Enter Location"
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    fontSize: isMobile ? '16px' : '14px'
                  }}
                />
              </div>
              <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>VAT Number</label>
                <Input
                  value={newSupplier.vatNumber}
                  onChange={(e) => handleInputChange("vatNumber", e)}
                  placeholder="Enter VAT Number"
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
              disabled={isSubmitting}
              className={`me-2 ${isMobile ? 'w-100' : ''}`}
              style={{ 
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
              }}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Save Supplier"}
            </Button>
          </Form>
        )}

        {editingSupplier && (
          <Card 
            className="mb-3" 
            style={{
              backgroundColor: isDarkTheme ? '#23263a' : '#ffffff',
              border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
              color: isDarkTheme ? '#ffffff' : '#000000'
            }}
          >
            <CardHeader style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa' }}>
              <CardTitle tag="h5" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Edit Supplier</CardTitle>
            </CardHeader>
            <CardBody style={{ backgroundColor: isDarkTheme ? '#23263a' : '#ffffff' }}>
              <Form onSubmit={handleUpdate}>
                <div className="row">
                  <div className={`col-md-4 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Supplier Name</label>
                    <Input
                      value={editingSupplier.supplierName}
                      onChange={(e) => handleEditInputChange("supplierName", e)}
                      placeholder="Enter Supplier Name"
                      required
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-4 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Location</label>
                    <Input
                      value={editingSupplier.location}
                      onChange={(e) => handleEditInputChange("location", e)}
                      placeholder="Enter Location"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-4 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>VAT Number</label>
                    <Input
                      value={editingSupplier.vatNumber}
                      onChange={(e) => handleEditInputChange("vatNumber", e)}
                      placeholder="Enter VAT Number"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                </div>
                <div className={`d-flex ${isMobile ? 'flex-column' : 'gap-2'} mt-3`}>
                  <Button
                    color="success"
                    type="submit"
                    disabled={isSubmitting}
                    className={isMobile ? 'w-100 mb-2' : ''}
                    style={{ 
                      width: isMobile ? '100%' : 'auto',
                      fontSize: isMobile ? '16px' : '14px',
                      padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
                    }}
                  >
                    {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                  </Button>
                  <Button
                    color="secondary"
                    type="button"
                    onClick={handleCancelEdit}
                    className={isMobile ? 'w-100' : ''}
                    style={{ 
                      width: isMobile ? '100%' : 'auto',
                      fontSize: isMobile ? '16px' : '14px',
                      padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
                    }}
                  >
                    Cancel Edit
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {isLoadingData ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
            <Spinner color="primary" />
            <span className="ms-2">Loading...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No suppliers found</p>
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

export default SupplierList;
