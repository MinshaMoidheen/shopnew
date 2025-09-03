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
      width: 80,
      renderCell: (params) => params.row.index + 1,
    },
    {
      field: "amount",
      headerName: "Paid/Due Amount",
      width: 250,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold">${params.row.amount || 0}</span>
      ),
    },
    {
      field: "paymentDate",
      headerName: "Payment Date",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>
          {params.row.paymentDate ? new Date(params.row.paymentDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: "modeOfPayment",
      headerName: "Mode of Payment",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Badge color="info" className="text-white">
          {params.row.modeOfPayment}
        </Badge>
      ),
    },
    {
      field: "invoice",
      headerName: "Invoice",
      width: 150,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
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
              handleDeleteClick(params.row.index);
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
  const gridData = supplier.transactions ? supplier.transactions.map((txn, index) => ({
    id: txn._id || index,
    index: index,
    ...txn
  })) : [];

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Transactions for {supplier.supplierName}</CardTitle>
        <Button color="secondary" onClick={() => navigate("/apps/suppliers")}>
          Back to Suppliers
        </Button>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button
              color="info"
              onClick={() => setShowTransactionForm(!showTransactionForm)}
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
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                </Button>
                <Button color="secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-around align-items-center my-2">
          <div
            className="mb-2"
            style={{
              background: "#ffe5e5",
              color: "#b30000",
              borderRadius: 4,
              padding: "4px 16px",
              display: "inline-block",
              minWidth: 120,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            Remaining Amount: {data?.totalRemainingAmount}
          </div>
          <div
            className="mb-2"
            style={{
              background: "#e5ffe5",
              color: "#00b300",
              borderRadius: 4,
              padding: "4px 16px",
              display: "inline-block",
              minWidth: 120,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            Due Amount: {data?.totalDueAmount}
          </div>
          <div
            className="mb-2"
            style={{
              background: "#ffe5e5",
              color: "#b30000",
              borderRadius: 4,
              padding: "4px 16px",
              display: "inline-block",
              minWidth: 120,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            Paid Amount: {data?.totalPaidAmount}
          </div>
        </div>

        {editingTransaction && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Edit Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSaveEdit}>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Paid/Due Amount</Label>
                    <Input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={editingTransaction.paymentDate}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, paymentDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Mode of Payment</Label>
                    <Input
                      type="select"
                      value={editingTransaction.modeOfPayment}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, modeOfPayment: e.target.value }))}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit</option>
                    </Input>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Invoice</Label>
                    <Input
                      type="text"
                      value={editingTransaction.invoice}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, invoice: e.target.value }))}
                    />
                  </div>
                </div>
                {/* <div className="d-flex gap-2 mt-3">
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
                </div> */}
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
              <div className="col-md-2 mb-1">
                <Label>Paid/Due Amount</Label>
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
                />
              </div>
              <div className="col-md-2 mb-1">
                <Label>Payment Date</Label>
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
                />
              </div>
              <div className="col-md-2 mb-1">
                <Label>Mode of Payment</Label>
                <Input
                  type="select"
                  value={transaction.modeOfPayment}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      modeOfPayment: e.target.value,
                    })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="credit">Credit</option>
                </Input>
              </div>
              <div className="col-md-2 mb-1">
                <Label>Invoice</Label>
                <Input
                  type="text"
                  value={transaction.invoice}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      invoice: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button
              color="success"
              type="submit"
              disabled={isTransactionLoading}
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

export default ViewSupplierTransaction;
