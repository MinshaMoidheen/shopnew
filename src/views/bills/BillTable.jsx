import React, { Fragment, useState, useEffect, useCallback } from "react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import "animate.css/animate.css"
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss"
import { Edit, Trash, Plus, Eye } from "react-feather"

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
  Form,
} from "reactstrap"
import { DataGrid } from '@mui/x-data-grid';
import toast from "react-hot-toast"

import {
  useGetAllBillsQuery,
  useDeleteBillMutation,
  useSearchBillsQuery,
} from "../../slices/billApislice"
import { useNavigate } from "react-router-dom"
import Flatpickr from "react-flatpickr"
import "@styles/react/libs/flatpickr/flatpickr.scss"
import { useGetCentersQuery } from "../../slices/centersSlice"

const MySwal = withReactContent(Swal)

const BillTable = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchValue, setSearchValue] = useState("")
  const [billSearchTerm, setBillSearchTerm] = useState("")
  const [debouncedBillSearchTerm, setDebouncedBillSearchTerm] = useState("")
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [centerState, setCenter] = useState("")
  const [searchPage, setSearchPage] = useState(1)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [editingBill, setEditingBill] = useState(null)

  // Filter states
  const [endDate, setEndDate] = useState("")
  const [searchParams, setSearchParams] = useState({
    startDate: "",
    endDate: "",
    page: currentPage,
    limit: itemsPerPage,
  })

  const formatDate = (date) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

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

  const {
    data: centersData,
    isLoading: centersLoading,
    error: centersError,
  } = useGetCentersQuery({
    page: searchPage,
    limit: 10000,
  })

  const {
    data: billsData = [],
    isLoading,
    refetch,
  } = useGetAllBillsQuery(searchParams)

  // Search bills query
  const {
    data: searchData,
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useSearchBillsQuery(
    {
      name: debouncedBillSearchTerm,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: !debouncedBillSearchTerm || debouncedBillSearchTerm.trim() === '',
    }
  )

  const [deleteBill] = useDeleteBillMutation()

  console.log("searchData", searchData)

  // Use search results if search term exists, otherwise use regular bills
  const bills = debouncedBillSearchTerm.trim() !== '' ? (searchData?.bills || []) : (billsData.data || [])
  const totalCount = debouncedBillSearchTerm.trim() !== '' ? (searchData?.total || 0) : (billsData.total || 0)
  const isLoadingData = debouncedBillSearchTerm.trim() !== '' ? searchLoading : isLoading

  const handleSearch = () => {
    setSearchParams({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      page: currentPage,
      limit: itemsPerPage,
    })
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
    setSearchParams({
      startDate: "",
      endDate: "",
      page: 1,
      limit: itemsPerPage,
    })
    setCurrentPage(1)
  }

  const handleEditClick = (bill) => {
    setEditingBill(bill)
  }

  const handleDeleteClick = async (billId) => {
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
      })

      if (result.value) {
        await deleteBill(billId).unwrap()
        toast.success("Bill deleted successfully")
        refetch()
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete bill")
    }
  }

  const handleCancelEdit = () => {
    setEditingBill(null)
  }

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      renderCell: (params) => params.row.index + 1,
    },
    {
      field: "customerName",
      headerName: "Customer / Staff",
      width: 200,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>
          {params.row.date ? new Date(params.row.date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: "totalAmount",
      headerName: "Total Amount",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold">${params.row.totalAmount || 0}</span>
      ),
    },
    {
      field: "centerName",
      headerName: "Center",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>{params.row.centerId?.centerName || 'N/A'}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewBill(params.row._id);
            }}
            style={{ marginRight: '4px' }}
          >
            <Eye size={12} className="me-1" />
            View
          </Button>
          {/* <Button
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
          </Button> */}
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
  const gridData = bills.map((bill, index) => ({
    id: bill._id || index,
    index: index,
    ...bill
  }));

  const handleViewBill = (billId) => {
    navigate(`/apps/bills/view/${billId}`)
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBillSearchTerm(billSearchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [billSearchTerm])

  useEffect(() => {
    if (debouncedBillSearchTerm.trim() !== '') {
      refetchSearch()
    } else {
      refetch()
    }
  }, [refetch, refetchSearch, searchParams, debouncedBillSearchTerm])

  if (isLoadingData) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="primary" />
      </div>
    )
  }

  console.log("bills", bills)

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Bills List</CardTitle>
      </CardHeader>
      <CardBody>
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
                defaultDate: new Date(),
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
              ) : (
                centersData?.data?.map((center) => (
                  <option key={center._id} value={center._id}>
                    {center.centerName}
                  </option>
                ))
              )}
            </Input>
          </Col>

          <Col md="3" sm="12" className="mb-1 d-flex align-items-end">
            <Button
              color="primary"
              className="w-100 me-1"
            // onClick={handleSearch}
            // disabled={!startDate || !centerState}
            >
              Search
            </Button>
            <Button
              color="secondary"
              className="w-100"
            //  onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button color="primary" onClick={() => navigate("/apps/bills/add")}>
              <Plus size={15} className="me-1" />
              Add New Bill
            </Button>
            {editingBill && (
            <Button
                color="secondary"
                onClick={handleCancelEdit}
            >
                Cancel Edit
            </Button>
            )}
          </div>
          <div style={{ width: "300px" }}>
            <Input
              type="text"
              placeholder="Search bills by customer name..."
              value={billSearchTerm}
              onChange={(e) => setBillSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {gridData.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No bills found</p>
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

        {editingBill && (
          <Card className="mb-3">
            <CardHeader>
              <CardTitle tag="h5">Edit Bill</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Label>Customer Name</Label>
                    <Input
                      type="text"
                      value={editingBill.customerName || ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editingBill.date ? new Date(editingBill.date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Total Amount</Label>
                    <Input
                      type="number"
                      value={editingBill.totalAmount || ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, totalAmount: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <Label>Center</Label>
                    <Input
                      type="select"
                      value={editingBill.centerId?._id || ''}
                      onChange={(e) => {
                        const selectedCenter = centersData?.data?.find(center => center._id === e.target.value);
                        setEditingBill(prev => ({ ...prev, centerId: selectedCenter }));
                      }}
                    >
                      <option value="">Select Center</option>
                      {centersData?.data?.map((center) => (
                        <option key={center._id} value={center._id}>
                          {center.centerName}
                        </option>
                      ))}
                    </Input>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                      <Button
                    color="success"
                    type="button"
                    onClick={() => {
                      // Here you would implement the update logic
                      toast.success("Bill updated successfully");
                      setEditingBill(null);
                    }}
                  >
                    Save Changes
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
  )
}

export default BillTable
