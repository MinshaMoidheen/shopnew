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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)

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
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => params.row.index + 1,
    },
    {
      field: "customerName",
      headerName: "Customer / Staff",
      width: isMobile ? 120 : 200,
      minWidth: isMobile ? 100 : 150,
      flex: 1,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span style={{ fontSize: isMobile ? '10px' : '14px' }}>
          {params.row.date ? new Date(params.row.date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold" style={{ fontSize: isMobile ? '10px' : '14px' }}>
          ${params.row.totalAmount || 0}
        </span>
      ),
    },
    {
      field: "centerName",
      headerName: "Center",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span style={{ fontSize: isMobile ? '10px' : '14px' }}>
          {params.row.centerId?.centerName || 'N/A'}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 150 : 250,
      minWidth: isMobile ? 130 : 200,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex flex-column flex-md-row gap-1 mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewBill(params.row._id);
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

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            .bills-application {
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
              z-index: 1 !important;
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
              z-index: 1 !important;
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
              className={isMobile ? 'mobile-card-header' : ''}
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
                Bills List
              </CardTitle>
      </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
        <Row className="mx-0 mt-1 mb-2">
          <Col md="3" sm="12" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
            <Label for="startDate" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Date</Label>
            <Flatpickr
              className={`form-control ${isMobile ? 'mobile-search-input' : ''}`}
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
              style={{
                backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000',
                border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                fontSize: isMobile ? '16px' : '14px'
              }}
            />
          </Col>

          <Col md="3" sm="12" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
            <Label for="center" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Center</Label>
            <Input
              type="select"
              id="center"
              value={centerState}
              onChange={(e) => setCenter(e.target.value)}
              required
              className={isMobile ? 'mobile-search-input' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000',
                border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                fontSize: isMobile ? '16px' : '14px'
              }}
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

          <Col md="3" sm="12" className={`mb-1 d-flex align-items-end ${isMobile ? 'col-12' : ''}`}>
            <div className="d-flex w-100 gap-2">
            <Button
              color="primary"
                className={`${isMobile ? 'mobile-add-button' : ''}`}
                style={{
                  fontSize: isMobile ? '14px' : '14px',
                  padding: isMobile ? '0.5rem' : '0.375rem 0.75rem',
                  flex: '1',
                  minHeight: '38px'
                }}
            // onClick={handleSearch}
            // disabled={!startDate || !centerState}
            >
              Search
            </Button>
            <Button
              color="secondary"
                className={`${isMobile ? 'mobile-add-button' : ''}`}
                style={{
                  fontSize: isMobile ? '14px' : '14px',
                  padding: isMobile ? '0.5rem' : '0.375rem 0.75rem',
                  flex: '1',
                  minHeight: '38px'
                }}
            //  onClick={handleClearFilters}
            >
              Clear
            </Button>
            </div>
          </Col>
        </Row>

        <div className={`d-flex ${isMobile ? 'flex-row' : 'justify-content-between'} align-items-center mb-2 gap-2`}>
          <div className={`d-flex ${isMobile ? 'flex-row gap-2' : 'gap-2'}`} style={{ width: isMobile ? 'auto' : 'auto' }}>
            <Button 
              color="primary" 
              onClick={() => navigate("/apps/bills/add")}
              className={isMobile ? 'mobile-add-button' : ''}
              style={{
                minWidth: isMobile ? "80px" : "auto",
                maxWidth: isMobile ? "120px" : "auto",
                fontSize: isMobile ? '12px' : '14px',
                flex: isMobile ? '0 0 auto' : 'none'
              }}
            >
              <Plus size={isMobile ? 12 : 15} className="me-1" />
              {isMobile ? "Add" : "Add New Bill"}
            </Button>
            {editingBill && (
            <Button
                color="secondary"
                onClick={handleCancelEdit}
                className={isMobile ? 'mobile-add-button' : ''}
                style={{
                  minWidth: isMobile ? "80px" : "auto",
                  maxWidth: isMobile ? "100px" : "auto",
                  fontSize: isMobile ? '12px' : '14px',
                  flex: isMobile ? '0 0 auto' : 'none'
                }}
              >
                Cancel
            </Button>
            )}
          </div>
          <div className={isMobile ? 'flex-grow-1' : ''} style={{ width: isMobile ? 'auto' : '300px', flex: isMobile ? '1' : 'none' }}>
            <Input
              type="text"
              placeholder="Search bills by customer name..."
              value={billSearchTerm}
              onChange={(e) => setBillSearchTerm(e.target.value)}
              className={isMobile ? 'mobile-search-input' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000',
                border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                fontSize: isMobile ? '14px' : '14px',
                width: isMobile ? '100%' : '100%'
              }}
            />
          </div>
        </div>

        {gridData.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted" style={{ color: isDarkTheme ? '#a0aec0' : '#6b7280' }}>No bills found</p>
          </div>
        ) : (
          <div className={isMobile ? 'mobile-table-container' : ''} style={{ height: 400, width: '100%', marginBottom: "40px" }}>
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

        {editingBill && (
          <Card 
            className="mb-3" 
            style={{
              backgroundColor: isDarkTheme ? '#23263a' : '#ffffff',
              border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
              color: isDarkTheme ? '#ffffff' : '#000000'
            }}
          >
            <CardHeader style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa' }}>
              <CardTitle tag="h5" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Edit Bill</CardTitle>
            </CardHeader>
            <CardBody style={{ backgroundColor: isDarkTheme ? '#23263a' : '#ffffff' }}>
              <Form>
                <div className="row">
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Customer Name</Label>
                    <Input
                      type="text"
                      value={editingBill.customerName || ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, customerName: e.target.value }))}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Date</Label>
                    <Input
                      type="date"
                      value={editingBill.date ? new Date(editingBill.date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Total Amount</Label>
                    <Input
                      type="number"
                      value={editingBill.totalAmount || ''}
                      onChange={(e) => setEditingBill(prev => ({ ...prev, totalAmount: e.target.value }))}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                  </div>
                  <div className={`col-md-3 ${isMobile ? 'col-12' : ''} mb-2`}>
                    <Label style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Center</Label>
                    <Input
                      type="select"
                      value={editingBill.centerId?._id || ''}
                      onChange={(e) => {
                        const selectedCenter = centersData?.data?.find(center => center._id === e.target.value);
                        setEditingBill(prev => ({ ...prev, centerId: selectedCenter }));
                      }}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
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
                <div className={`d-flex ${isMobile ? 'flex-column' : 'gap-2'} mt-3`}>
                      <Button
                    color="success"
                    type="button"
                    onClick={() => {
                      // Here you would implement the update logic
                      toast.success("Bill updated successfully");
                      setEditingBill(null);
                    }}
                    className={isMobile ? 'w-100 mb-2' : ''}
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      fontSize: isMobile ? '16px' : '14px',
                      padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
                    }}
                  >
                    Save Changes
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
      </CardBody>
    </Card>
        </div>
      </div>
    </>
  )
}

export default BillTable
