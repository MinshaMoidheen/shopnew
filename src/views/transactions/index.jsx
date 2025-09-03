import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Input,
  Label,
  Button,
  Spinner,
  Badge,
  Form,
  Row,
  Col
} from "reactstrap";
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Trash, Plus } from 'react-feather';
import toast from "react-hot-toast";
import Flatpickr from "react-flatpickr";
import "@styles/react/libs/flatpickr/flatpickr.scss";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import { 
  useGetAllTransactionsQuery, 
  useCreateTransactionMutation, 
  useUpdateTransactionMutation, 
  useDeleteTransactionMutation 
} from "../../slices/transactionApislice";
import { useGetLastTransactionQuery } from "../../slices/expenseApislice";

const MySwal = withReactContent(Swal);

const defaultTransaction = () => ({
  description: "",
  date: "",
  amount: "",
  transactionType: "",
  bank: ""
});

const TransactionPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState(defaultTransaction());
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTheme, setCurrentTheme] = useState('light');
  const itemsPerPage = 10;

  // API hooks
  const { data: transactionsData, isLoading, refetch } = useGetAllTransactionsQuery({
    page: currentPage,
    limit: itemsPerPage
  });

  // Get last transaction data to invalidate cache
  const { refetch: refetchLastTransaction } = useGetLastTransactionQuery();

  console.log("transactionsData",transactionsData)

  const [createTransaction] = useCreateTransactionMutation();
  const [updateTransaction] = useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();

  const transactions = transactionsData?.data || [];

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

  // DataGrid columns
  const columns = [
    { 
      field: "id", 
      headerName: "S.No", 
      width: 80, 
      renderCell: (params) => params.row.index + 1 
    },
    { 
      field: "description", 
      headerName: "Description", 
      width: 250, 
      sortable: true 
    },
    { 
      field: "date", 
      headerName: "Date", 
      width: 150, 
      sortable: true, 
      renderCell: (params) => (
        <span>{params.row.date ? new Date(params.row.date).toLocaleDateString("en-GB") : "N/A"}</span>
      )
    },
    { 
      field: "amount", 
      headerName: "Amount", 
      width: 120, 
      sortable: true, 
      renderCell: (params) => (
        <span className="fw-bold">${params.row.amount || 0}</span>
      )
    },
    { 
      field: "transactionType", 
      headerName: "Type", 
      width: 120, 
      sortable: true, 
      renderCell: (params) => (
        <Badge color={params.row.transactionType === 'income' ? 'success' : 'danger'} className="text-white">
          {params.row.transactionType === 'income' ? 'Income' : 'Expense'}
        </Badge>
      )
    },
    { 
      field: "bank", 
      headerName: "Bank", 
      width: 100, 
      sortable: true, 
      renderCell: (params) => (
        <Badge color="info" className="text-white">
          {params.row.bank}
        </Badge>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
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
            <Edit size={12} className="me-1" />Edit
          </Button>
          <Button 
            color="danger" 
            size="sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleDeleteClick(params.row._id); 
            }}
          >
            <Trash size={12} className="me-1" />Delete
          </Button>
        </div>
      ),
    },
  ];

  // Prepare data for DataGrid
  const gridData = transactions.map((transaction, index) => ({
    id: transaction._id || index,
    index: index,
    ...transaction
  }));

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    setNewTransaction(prev => ({ ...prev, [field]: value }));
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

  const handleEditClick = (transaction) => {
    setEditingTransaction({
      _id: transaction._id,
      description: transaction.description,
      date: transaction.date,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      bank: transaction.bank
    });
  };

  const handleDeleteClick = async (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) {
      toast.error("Transaction not found");
      return;
    }

    // Show confirmation dialog
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the transaction "${transaction.description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-outline-secondary ms-1'
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      try {
        await deleteTransaction(transactionId).unwrap();
        toast.success("Transaction deleted successfully");
        refetch();
        refetchLastTransaction();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete transaction");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!newTransaction.description || !newTransaction.amount || !newTransaction.transactionType || !newTransaction.bank) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate amount
      if (Number(newTransaction.amount) <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }

      

      // Format the date safely
      const formattedDate = formatDateSafe(newTransaction.date);

      const transactionData = {
        description: newTransaction.description,
        date: formattedDate,
        amount: Number(newTransaction.amount),
        transactionType: newTransaction.transactionType,
        bank: newTransaction.bank
      };


      console.log("submitData",transactionData)

      await createTransaction(transactionData).unwrap();
      toast.success("Transaction added successfully");
      setNewTransaction(defaultTransaction());
      setShowAddForm(false);
      refetch();
      refetchLastTransaction();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    // Validate required fields
    if (!editingTransaction.description || !editingTransaction.amount || !editingTransaction.transactionType || !editingTransaction.bank) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate amount
    if (Number(editingTransaction.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // Validate bank
    if (!editingTransaction.bank) {
      toast.error('Please select a bank');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!editingTransaction._id) {
        toast.error("Transaction ID not found");
        return;
      }

      const updateData = {
        id: editingTransaction._id,
        description: editingTransaction.description,
        date: formatDateSafe(editingTransaction.date),
        amount: Number(editingTransaction.amount),
        transactionType: editingTransaction.transactionType,
        bank: editingTransaction.bank
      };

      await updateTransaction(updateData).unwrap();
      toast.success("Transaction updated successfully");
      setEditingTransaction(null);
      refetch();
      refetchLastTransaction();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe date formatting that preserves the selected date without timezone issues
  const formatDateSafe = (date) => {
    if (!date) return "";
    
    // If date is already a string in YYYY-MM-DD format, return it as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // If it's a Date object, format it properly
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // For other cases, try to create a Date and format it
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Miscellaneous</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button 
              color="primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={12} className="me-1" />
              {showAddForm ? 'Cancel Add' : 'Add New Transaction'}
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Add New Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <Label>Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={e => handleInputChange("description", e)}
                      placeholder="Description"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <Label>Date</Label>
                    <Flatpickr
                      className="form-control"
                      value={newTransaction.date}
                      onChange={date => handleInputChange("date", { target: { value: date[0] } })}
                      options={{ dateFormat: "Y-m-d" }}
                      placeholder="Select Date"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newTransaction.amount}
                      onChange={e => handleInputChange("amount", e)}
                      placeholder="Amount"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <Label>Transaction Type</Label>
                    <Input
                      type="select"
                      value={newTransaction.transactionType}
                      onChange={e => handleInputChange("transactionType", e)}
                      required
                    >
                      <option value="">--Select--</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </Input>
                  </div>
                  <div className="col-md-6 mb-2">
                    <Label>Bank</Label>
                    <Input
                      type="select"
                      value={newTransaction.bank}
                      onChange={e => handleInputChange("bank", e)}
                      required
                    >
                      <option value="">--Select--</option>
                      <option value="BANK1">BANK1</option>
                      <option value="BANK2">BANK2</option>
                    </Input>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <Button color="success" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="sm" /> : "Save Transaction"}
                  </Button>
                  <Button 
                    color="secondary" 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {editingTransaction && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Edit Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSaveEdit}>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <Label>Description</Label>
                    <Input
                      value={editingTransaction.description}
                      onChange={e => handleEditInputChange("description", e)}
                      placeholder="Description"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <Label>Date</Label>
                    <Flatpickr
                      className="form-control"
                      value={editingTransaction.date}
                      onChange={date => handleEditInputChange("date", { target: { value: date[0] } })}
                      options={{ dateFormat: "Y-m-d" }}
                      placeholder="Select Date"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={e => handleEditInputChange("amount", e)}
                      placeholder="Amount"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <Label>Transaction Type</Label>
                    <Input
                      type="select"
                      value={editingTransaction.transactionType}
                      onChange={e => handleEditInputChange("transactionType", e)}
                      required
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </Input>
                  </div>
                  <div className="col-md-6 mb-2">
                    <Label>Bank</Label>
                    <Input
                      type="select"
                      value={editingTransaction.bank}
                      onChange={e => handleEditInputChange("bank", e)}
                      required
                    >
                      <option value="BANK1">BANK1</option>
                      <option value="BANK2">BANK2</option>
                    </Input>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <Button color="success" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                  </Button>
                  <Button 
                    color="secondary" 
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        <div style={{ height: 400, width: '100%' }}>
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
      </CardBody>
    </Card>
  );
};

export default TransactionPage; 