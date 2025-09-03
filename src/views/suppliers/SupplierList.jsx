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
      width: 80,
      renderCell: (params) => {
        const index = suppliers.findIndex(supplier => supplier._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "supplierName",
      headerName: "Supplier Name",
      width: 200,
      sortable: true,
    },
    {
      field: "location",
      headerName: "Location",
      width: 200,
      sortable: true,
    },
    {
      field: "vatNumber",
      headerName: "VAT Number",
      width: 170,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 350,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/apps/suppliers/view/${params.row._id}`);
            }}
            style={{ marginRight: '4px' }}
          >
            <Eye size={12} className="me-1" />
            View
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
            style={{ marginRight: '4px' }}
          >
            <Edit size={12} className="me-1" />
            Edit
          </Button>
          <Button
            color="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row._id);
            }}
          >
            <Trash size={12} className="me-1" />
            Delete
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
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Suppliers List</CardTitle>
        {/* <div className="text-end">
          <div><strong>Total Due Amount:</strong> ₹{totals.dueAmount}</div>
          <div><strong>Total Paid Amount:</strong> ₹{totals.paidAmount}</div>
        </div> */}
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button
              color="primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={15} className="me-1" />
              {showAddForm ? "Cancel Add" : "Add New Supplier"}
            </Button>
            {editingSupplier && (
              <>
                <Button
                  color="success"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                </Button>
                <Button color="secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </Button>
              </>
            )}
          </div>
          <div className="d-flex gap-2" style={{ width: '400px' }}>
            <div>
              <Label for="supplierSearch">Supplier Search:</Label>
              <Input
                id="supplierSearch"
                type="text"
                placeholder="Search by supplier name or vat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label for="invoiceSearch">Invoice Search:</Label>
              <Input
                id="invoiceSearch"
                type="text"
                className=""
                placeholder="Search by invoice value..."
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {showAddForm && (
          <Form onSubmit={handleAddSupplier} className="mb-3">
            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label">Supplier Name</label>
                <Input
                  value={newSupplier.supplierName}
                  onChange={(e) => handleInputChange("supplierName", e)}
                  placeholder="Enter Supplier Name"
                  required
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">Location</label>
                <Input
                  value={newSupplier.location}
                  onChange={(e) => handleInputChange("location", e)}
                  placeholder="Enter Location"
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">VAT Number</label>
                <Input
                  value={newSupplier.vatNumber}
                  onChange={(e) => handleInputChange("vatNumber", e)}
                  placeholder="Enter VAT Number"
                />
              </div>
            </div>
            <Button
              color="success"
              type="submit"
              disabled={isSubmitting}
              className="me-2"
            >
              {isSubmitting ? <Spinner size="sm" /> : "Save Supplier"}
            </Button>
            {/* <Button
              outline
              color="secondary"
              type="button"
              onClick={handleReset}
              className="mt-2"
            >
              Reset
            </Button> */}
          </Form>
        )}

        {editingSupplier && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Edit Supplier</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleUpdate}>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label">Supplier Name</label>
                    <Input
                      value={editingSupplier.supplierName}
                      onChange={(e) => handleEditInputChange("supplierName", e)}
                      placeholder="Enter Supplier Name"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label">Location</label>
                    <Input
                      value={editingSupplier.location}
                      onChange={(e) => handleEditInputChange("location", e)}
                      placeholder="Enter Location"
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label">VAT Number</label>
                    <Input
                      value={editingSupplier.vatNumber}
                      onChange={(e) => handleEditInputChange("vatNumber", e)}
                      placeholder="Enter VAT Number"
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <Button
                    color="success"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                  </Button>
                  <Button
                    color="secondary"
                    type="button"
                    onClick={handleCancelEdit}
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
          <div style={{ height: 400, width: '100%', marginBottom: "40px" }}>
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
              }}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default SupplierList;
