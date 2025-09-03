import React, { Fragment, useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import {
  Edit,
  Trash,
  Plus,
} from "react-feather";

import {
  Row,
  Col,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Input,
  Label,
  Button,
  Spinner,
  Badge,
  Form
} from "reactstrap";
import { DataGrid } from '@mui/x-data-grid';
import toast from "react-hot-toast";

import { useGetExpensesQuery, useAddExpenseMutation, useDeleteExpenseMutation, useUpdateExpenseMutation, useAddInitialCashInHandMutation, useGetLastTransactionQuery } from "../../slices/expenseApislice";
import { useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "@styles/react/libs/flatpickr/flatpickr.scss";
import { useGetCentersQuery } from "../../slices/centersSlice";

const MySwal = withReactContent(Swal);

const defaultExpense = () => ({
  description: "",
  date: "",
  expenseType: "expense",
  amount: "",
  mode: "cash",
  center: "",
  bank: ""
});

const defaultInitialCash = () => ({
  date: "",
  cashInHand: "",
  cashInBank: "",
  center: ""
});

const ExpensesTable = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState(defaultExpense());
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [currentTheme, setCurrentTheme] = useState('light');

  // Filter states
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [centerState, setCenter] = useState("");
  const [searchParams, setSearchParams] = useState({
    date: "",
    center: "",
    page: currentPage,
    limit: itemsPerPage
  });

  const [searchValue, setSearchValue] = useState("");

  const [addInitialCashInHand] = useAddInitialCashInHandMutation();
  const [showInitialCashForm, setShowInitialCashForm] = useState(false);
  const [initialCash, setInitialCash] = useState(defaultInitialCash());

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

  // Get centers data with proper error handling
  const { data: centersData, isLoading: centersLoading, error: centersError } = useGetCentersQuery({
    page: searchPage,
    limit: 10000,
  });

  // Get expenses data with proper query parameters
  const {
    data: expensesData,
    isLoading,
    refetch,
  } = useGetExpensesQuery({
    date: searchParams.date,
    center: searchParams.center
  }, {
    skip: !searchParams.date || !searchParams.center // Skip query if either date or center is missing
  });

  // Get last transaction data for bank totals
  const {
    data: lastTransactionData,
    isLoading: lastTransactionLoading,
    error: lastTransactionError,
    refetch: refetchLastTransaction
  } = useGetLastTransactionQuery();

  // Auto-search when both date and center are selected
  useEffect(() => {
    if (startDate && centerState) {
      const formattedDate = formatDateSafe(startDate);
      setSearchParams({
        date: formattedDate,
        center: centerState
      });
    }
  }, [startDate, centerState]);

  console.log("searchData",startDate,centerState)
  console.log("lastTransactionData", lastTransactionData)

  // Filter expenses based on search term and flatten transactions
  const filteredExpenses = expensesData?.data?.map(transaction => ({
    ...transaction,
    date: transaction.date || expensesData.date,
    cashInHand: expensesData.totals?.cashInHand,
    cashInBank: expensesData.totals?.cashInBank,
    initialCashInHand: expensesData.initialCashInHand,
    initialCashInBank: expensesData.initialCashInBank
  })) || [];

  const [addExpense] = useAddExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const expenses = expensesData || [];

  console.log("transaction",expensesData)
  console.log("filteredExpenses", filteredExpenses)
  console.log("Sample transaction date:", filteredExpenses[0]?.date)
  console.log("startDate:", startDate, "centerState:", centerState, "searchParams:", searchParams)

  const handleClearFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setCenter("");
    setSearchParams({
      date: "",
      center: ""
    });
  };

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    setNewExpense(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear bank field when mode is changed to cash
      if (field === 'mode' && value === 'cash') {
        updated.bank = '';
      }
      
      return updated;
    });
  };

  const handleEditInputChange = (field, e) => {
    const value = e.target.value;
    setEditingExpense(prev => {
      if (!prev) return null;
      
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Clear bank field when mode is changed to cash
      if (field === 'mode' && value === 'cash') {
        updated.bank = '';
      }
      
      return updated;
    });
  };

  const handleRowClick = (rowId) => {
    if (editingExpense) return; // Don't allow selection while editing
    console.log('Row clicked:', rowId, 'Type:', typeof rowId, 'Current selected:', selectedRow);
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleInputClick = (e) => {
    // Stop propagation to prevent row click when clicking on inputs
    e.stopPropagation();
  };

  const handleEditClick = (transaction) => {
    setEditingExpense({
      _id: transaction._id,
      description: transaction.description,
      date: transaction.date || expensesData.date,
      expenseType: transaction.expenseType || transaction.type || 'expense',
      mode: transaction.mode,
      amount: transaction.amount,
      bank: transaction.bank || ""
    });
  };

  const handleDeleteClick = async (transactionId) => {
    try {
      const result = await MySwal.fire({
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
      });

      if (result.value) {
        await deleteExpense(transactionId).unwrap();
        toast.success("Transaction deleted successfully");
        refetch();
        refetchLastTransaction();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete transaction");
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleInitialCashSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Format the date safely to avoid timezone issues
      const formattedDate = formatDateSafe(initialCash.date);
      
      // Create the initial cash data with proper formatting
      const initialCashData = {
        date: formattedDate,
        cashInHand: Number(initialCash.cashInHand),
        cashInBank: Number(initialCash.cashInBank),
        center: initialCash.center
      };

      await addInitialCashInHand(initialCashData).unwrap();
      toast.success("Initial cash added successfully");
      setInitialCash(defaultInitialCash());
      setShowInitialCashForm(false);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleTypeChange = (e) => {
  //   const selectedType = e.target.value;
  //   const selectedMode = newExpense.mode;
    
  //   // Get the current cash values
  //   const currentCashInHand = expensesData?.cashInHand || 0;
  //   const currentCashInBank = expensesData?.cashInBank || 0;
    
  //   // Calculate amount based on type and mode
  //   let calculatedAmount = 0;
  //   if (selectedMode === 'cash') {
  //     calculatedAmount = currentCashInHand;
  //   } else if (selectedMode === 'bank') {
  //     calculatedAmount = currentCashInBank;
  //   }
    
  //   setNewExpense(prev => ({
  //     ...prev,
  //     type: selectedType,
  //     amount: calculatedAmount
  //   }));
  // };

  // const handleModeChange = (e) => {
  //   const selectedMode = e.target.value;
  //   const currentType = newExpense.type;
    
  //   // Get the current cash values
  //   const currentCashInHand = expensesData?.cashInHand || 0;
  //   const currentCashInBank = expensesData?.cashInBank || 0;
    
  //   // Calculate amount based on type and new mode
  //   let calculatedAmount = 0;
  //   if (selectedMode === 'cash') {
  //     calculatedAmount = currentCashInHand;
  //   } else if (selectedMode === 'bank') {
  //     calculatedAmount = currentCashInBank;
  //   }
    
  //   setNewExpense(prev => ({
  //     ...prev,
  //     mode: selectedMode,
  //     amount: calculatedAmount
  //   }));
  // };

  // const calculateTotalAmount = (expenseAmount) => {
  //   const expenseNum = Number(expenseAmount) || 0;
  //   // Find the last transaction's amount if any
  //   const lastTransaction = expensesData?.transactions?.length
  //     ? expensesData.transactions[expensesData.transactions.length - 1]
  //     : null;

  //   if (lastTransaction) {
  //     // Running total: previous amount + new expense
  //     return Number(lastTransaction.amount || 0) + expenseNum;
  //   } else {
  //     // First transaction: cash in hand + cash in bank + expense
  //     const currentCashInHand = Number(expensesData?.cashInHand || 0);
  //     const currentCashInBank = Number(expensesData?.cashInBank || 0);
  //     return currentCashInHand + currentCashInBank + expenseNum;
  //   }
  // };

  // const handleExpenseAmountChange = (e) => {
  //   const expenseAmount = e.target.value;
  //   const totalAmount = calculateTotalAmount(expenseAmount);
  //   setNewExpense(prev => ({
  //     ...prev,
  //     expenseAmount,
  //     amount: totalAmount
  //   }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Format the date safely to avoid timezone issues
      const formattedDate = formatDateSafe(newExpense.date);
      
      // Create the expense object with proper formatting
      const expenseData = {
        date: formattedDate,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        expenseType: newExpense.expenseType,
        mode: newExpense.mode.toLowerCase(), // Ensure mode is lowercase
        center: centerState, // Add the selected center
        ...(newExpense.mode === 'bank' && { bank: newExpense.bank }) // Only include bank if mode is bank
      };

      console.log("expenseData",expenseData)

      // Validate mode
      if (!['cash', 'bank'].includes(expenseData.mode)) {
        toast.error('Invalid mode. Use either "cash" or "bank".');
        return;
      }

      // Validate amount
      if (expenseData.amount <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }

      // Validate center
      if (!expenseData.center) {
        toast.error('Please select a center');
        return;
      }

      // Validate bank only if mode is bank
      if (expenseData.mode === 'bank' && !expenseData.bank) {
        toast.error('Please select a bank');
        return;
      }

      await addExpense(expenseData).unwrap();
      toast.success("Transaction added successfully");
      setNewExpense(defaultExpense());
      setShowAddForm(false);
      refetch();
      refetchLastTransaction();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;
    
    // Validate required fields
    if (!editingExpense.description || !editingExpense.amount || !editingExpense.expenseType || !editingExpense.mode) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate amount
    if (Number(editingExpense.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // Validate mode
    if (!['cash', 'bank'].includes(editingExpense.mode)) {
      toast.error('Invalid mode. Use either "cash" or "bank".');
      return;
    }

    // Validate expenseType
    if (!['income', 'expense'].includes(editingExpense.expenseType)) {
      toast.error('Invalid type. Use either "income" or "expense".');
      return;
    }

    // Validate bank only if mode is bank
    if (editingExpense.mode === 'bank' && !editingExpense.bank) {
      toast.error('Please select a bank');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use the editingExpense._id as the transaction ID
      if (!editingExpense._id) {
        toast.error("Transaction ID not found");
        return;
      }

      const updateData = {
        id: editingExpense._id,
        description: editingExpense.description,
        amount: Number(editingExpense.amount),
        expenseType: editingExpense.expenseType,
        mode: editingExpense.mode,
        ...(editingExpense.mode === 'bank' && { bank: editingExpense.bank }) // Only include bank if mode is bank
      };

      await updateExpense(updateData).unwrap();
      toast.success("Transaction updated successfully");
      setEditingExpense(null);
      setSelectedRow(null);
      refetch();
      refetchLastTransaction();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date to YYYY-MM-DD string
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
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

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      renderCell: (params) => params.row.index + 1,
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>
          {params.row.date ? new Date(params.row.date).toLocaleDateString("en-GB") : 
           expensesData?.date ? new Date(expensesData.date).toLocaleDateString("en-GB") : 
           "N/A"}
        </span>
      ),
    },
    {
      field: "expenseType",
      headerName: "Type",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Badge 
          color={params.row.expenseType === 'income' ? 'success' : 'danger'}
          className="text-white"
        >
          {params.row.expenseType || params.row.type}
        </Badge>
      ),
    },
    {
      field: "mode",
      headerName: "Mode",
      width: 100,
      sortable: true,
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold">${params.row.amount || 0}</span>
      ),
    },
    {
      field: "bank",
      headerName: "Bank",
      width: 100,
      sortable: true,
      renderCell: (params) => (
        <span>{params.row.bank || 'N/A'}</span>
      ),
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
  const gridData = filteredExpenses.map((transaction, index) => ({
    id: transaction._id || index,
    index: index,
    ...transaction
  }));

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
        <CardTitle tag="h4">Transactions List</CardTitle>
      </CardHeader>
      <CardBody>
        {/* Bank Totals Display */}
        <Row className="mx-0 mt-1 mb-3">
          <Col md="12">
            <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
              <div className="d-flex gap-4">
                <div>
                  <small className="text-muted">Total in Bank1:</small>
                  <span className="ms-1 fw-bold">
                   
{                      (lastTransactionData?.data?.totalBank1Amount || 0).toLocaleString()
}                  
                  </span>
                </div>
                <div>
                  <small className="text-muted">Total in Bank2:</small>
                  <span className="ms-1 fw-bold">
                    {
                      (lastTransactionData?.data?.totalBank2Amount || 0).toLocaleString()
                    }
                  </span>
                </div>
              
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mx-0 mt-1 mb-2">
          <Col md="3" sm="12" className="mb-1">
            <Label for="startDate">Date</Label>
            <Flatpickr
              className="form-control"
              id="startDate"
              value={startDate}
              onChange={(date) => setStartDate(date[0])}
              options={{ 
                dateFormat: "Y-m-d",
                allowInput: true,
                defaultDate: startDate
              }}
              placeholder="Select Date"
              required
            />
          </Col>
          
          <Col md="3" sm="12" className="mb-1">
            <Label for="center">Center</Label>
            <Input
              type="select"
              id="center"
              value={centerState}
              onChange={(e) => setCenter(e.target.value)}
              required
            >
              <option value="">Select Center</option>
              {centersLoading ? (
                <option>Loading centers...</option>
              ) : centersError ? (
                <option>Error loading centers</option>
              ) : centersData?.data?.map(center => (
                <option key={center._id} value={center._id}>
                  {center.centerName}
                </option>
              ))}
            </Input>
          </Col>

          <Col md="3" sm="12" className="mb-1 d-flex align-items-end">
            <Button color="secondary" className="w-100" onClick={handleClearFilters}>
              Clear
            </Button>
          </Col>
          <Col md="3" sm="12" className="mb-1 d-flex align-items-end">
            {startDate && centerState && (
              <div className="text-muted small">
                {isLoading ? (
                  <span><Spinner size="sm" /> Loading transactions...</span>
                ) : (
                  <span></span>
                )}
              </div>
            )}
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
              <Button 
                color="primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
              <Plus size={15} className="me-1" />
                {showAddForm ? 'Cancel Add' : 'Add New Transaction'}
              </Button>
            {editingExpense && (
                <Button 
                  color="secondary"
                onClick={handleCancelEdit}
              >
                  Cancel Edit
                </Button>
            )}
          </div>
        </div>

        {/* {showInitialCashForm && (
          <Form className="mb-3" onSubmit={handleInitialCashSubmit}>
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Center</th>
                  <th>Initial Cash In Hand</th>
                  <th>Initial Cash In Bank</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <Flatpickr
                      className="form-control"
                      value={initialCash.date}
                      onChange={date => setInitialCash(prev => ({ ...prev, date: date[0] }))}
                      options={{ dateFormat: "d-m-Y" }}
                      placeholder="Select Date"
                      required
                    />
                  </td>
                  <td>
                    <Input
                      type="select"
                      value={initialCash.center}
                      onChange={e => setInitialCash(prev => ({ ...prev, center: e.target.value }))}
                      required
                    >
                      <option value="">Select Center</option>
                      {centersLoading ? (
                        <option>Loading centers...</option>
                      ) : centersError ? (
                        <option>Error loading centers</option>
                      ) : centersData?.data?.map(center => (
                        <option key={center._id} value={center._id}>
                          {center.centerName}
                        </option>
                      ))}
                    </Input>
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={initialCash.cashInHand}
                      onChange={e => setInitialCash(prev => ({ ...prev, cashInHand: e.target.value }))}
                      placeholder="Initial Cash In Hand"
                      required
                      min="0"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={initialCash.cashInBank}
                      onChange={e => setInitialCash(prev => ({ ...prev, cashInBank: e.target.value }))}
                      placeholder="Initial Cash In Bank"
                      required
                      min="0"
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
            <Button color="success" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : "Save Initial Cash"}
            </Button>
          </Form>
        )} */}

        {showAddForm && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Add New Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Description</Label>
                      <Input
                        value={newExpense.description}
                        onChange={e => handleInputChange("description", e)}
                        placeholder="Description"
                        required
                      />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Date</Label>
                      <Flatpickr
                        className="form-control"
                        value={newExpense.date}
                        onChange={date => handleInputChange("date", { target: { value: date[0] } })}
                        options={{ dateFormat: "Y-m-d" }}
                        placeholder="Select Date"
                        required
                      />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Type</Label>
                      <Input
                        type="select"
                        value={newExpense.expenseType}
                        onChange={e => handleInputChange("expenseType", e)}
                        required
                         style={{
    backgroundColor: newExpense.expenseType === 'income' ? 'lightgreen' :
                     newExpense.expenseType === 'expense' ? '#f8d7da' : 'white'
  }}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </Input>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Mode</Label>
                      <Input
                        type="select"
                        value={newExpense.mode}
                        onChange={e => handleInputChange("mode", e)}
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                      </Input>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Amount</Label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={e => handleInputChange("amount", e)}
                        placeholder="Amount"
                        required
                        min="0"
                      />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Center</Label>
                      <Input
                        type="select"
                        value={centerState}
                        onChange={(e) => setCenter(e.target.value)}
                        required
                      >
                        <option value="">Select Center</option>
                        {centersLoading ? (
                          <option>Loading centers...</option>
                        ) : centersError ? (
                          <option>Error loading centers</option>
                        ) : centersData?.data?.map(center => (
                          <option key={center._id} value={center._id}>
                            {center.centerName}
                          </option>
                        ))}
                      </Input>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Bank</Label>
                      <Input
                        type="select"
                        value={newExpense.bank}
                        onChange={e => handleInputChange("bank", e)}
                        required={newExpense.mode === 'bank'}
                        disabled={newExpense.mode === 'cash'}
                        style={{
                          backgroundColor: newExpense.mode === 'cash' ? '#f8f9fa' : 'white',
                          cursor: newExpense.mode === 'cash' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">Select Bank</option>
                        <option value="BANK1">Bank1</option>
                        <option value="BANK2">Bank2</option>
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

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-4">
            <div>
              <small className="text-muted">Cash in Hand:</small>
              <span className="ms-1 fw-bold">{expensesData?.totals?.cashInHand?.toLocaleString()}</span>
            </div>
            <div>
              <small className="text-muted">Cash in Bank:</small>
              <span className="ms-1 fw-bold">{expensesData?.totals?.cashInBank?.toLocaleString()}</span>
            </div>
            <div>
              <small className="text-muted">Total Sales:</small>
              <span className="ms-1 fw-bold">{expensesData?.totals?.totalSales?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {!searchParams.date || !searchParams.center ? (
          <div className="text-center py-5">
            <p className="text-muted">Please select date and center to search</p>
          </div>
        ) : gridData.length === 0 ? (
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

        {editingExpense && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Edit Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSaveEdit}>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Description</Label>
                    <Input 
                      type="text"
                      value={editingExpense.description || ''}
                      onChange={(e) => setEditingExpense(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Date</Label>
                      <Flatpickr
                        className="form-control"
                        value={editingExpense.date}
                      onChange={date => setEditingExpense(prev => ({ ...prev, date: date[0] }))}
                        options={{ dateFormat: "Y-m-d" }}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Type</Label>
                      <Input 
                        type="select"
                        value={editingExpense.expenseType}
                      onChange={(e) => setEditingExpense(prev => ({ ...prev, expenseType: e.target.value }))}
                        style={{
                          backgroundColor: editingExpense.expenseType === 'income' ? 'lightgreen' :
                                         editingExpense.expenseType === 'expense' ? '#f8d7da' : 'white'
                        }}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </Input>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Mode</Label>
                    <Input 
                      type="select"
                      value={editingExpense.mode}
                      onChange={(e) => setEditingExpense(prev => ({ ...prev, mode: e.target.value }))}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </Input>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Amount</Label>
                    <Input 
                      type="number"
                      value={editingExpense.amount || ''}
                      onChange={(e) => setEditingExpense(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Bank</Label>
                    <Input 
                      type="select"
                      value={editingExpense.bank || ''}
                      onChange={(e) => setEditingExpense(prev => ({ ...prev, bank: e.target.value }))}
                      disabled={editingExpense.mode === 'cash'}
                      style={{
                        backgroundColor: editingExpense.mode === 'cash' ? '#f8f9fa' : 'white',
                        cursor: editingExpense.mode === 'cash' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">Select Bank</option>
                      <option value="BANK1">Bank1</option>
                      <option value="BANK2">Bank2</option>
                    </Input>
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
      </CardBody>
    </Card>
  );
};

export default ExpensesTable;

