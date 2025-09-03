import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Table,
  Spinner,
  Button,
  Row,
  Col,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Badge,
} from "reactstrap"
import { useGetStockByProductIdQuery, useUpdateStockMutation, useDeleteStockMutation } from "../../slices/stockApiSlice"
import { useGetProductByIdQuery } from "../../slices/productApiSlice"
import ReactPaginate from "react-paginate"
import toast from "react-hot-toast"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Trash, Save, X } from "react-feather";

const MySwal = withReactContent(Swal)

const ViewStock = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedMonth, setSelectedMonth] = useState("")
  const [editingStock, setEditingStock] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

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

  // Get productId from URL query parameters
  const queryParams = new URLSearchParams(location.search)
  const productId = queryParams.get("productId")

  console.log("productId", productId)

  // Fetch product details using productId
  const {
    data: product,
    isLoading: productLoading,
    error: productError
  } = useGetProductByIdQuery(productId, {
    skip: !productId,
  })

  console.log("product", product?.name)

  // Fetch stocks for the specific product
  const {
    data: stocksData,
    isLoading,
    refetch,
    error,
  } = useGetStockByProductIdQuery(productId, {
    skip: !productId,
  })

  // Mutations
  const [updateStock] = useUpdateStockMutation()
  const [deleteStock] = useDeleteStockMutation()

  console.log("stock", stocksData)

  // Handle the data structure properly
  const stocks = stocksData?.data || stocksData || []
  const totalCount = stocksData?.total || stocks.length || 0

  // Filter stocks based on month
  const filteredStocks = stocks.filter((stock) => {
    if (!stock.purchaseDate) return false

    const stockDate = new Date(stock.purchaseDate)
    const stockMonth = stockDate.getMonth() + 1 // JavaScript months are 0-based
    const stockYear = stockDate.getFullYear()

    // If no month is selected, show all stocks
    if (!selectedMonth) return true

    // Parse the selected month value (format: "YYYY-MM")
    const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number)

    // Compare year and month
    return stockYear === selectedYear && stockMonth === selectedMonthNum
  })

  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1)
  }

  const handleAddStock = () => {
    navigate(`/apps/new-stocks/add?productId=${productId}`)
  }

  const handleAddAnotherStock = () => {
    navigate(`/apps/new-stocks/add?productId=${productId}&duplicate=true`)
  }

  const handleViewProductList = () => {
    navigate(`/apps/products`)
  }

  // Function to handle refetch after adding stock
  const handleRefetch = () => {
    if (productId) {
      refetch()
    }
  }

  // Auto-refetch when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      refetch()
    }
  }, [productId, refetch])

  // Handle double click to edit
  const handleRowDoubleClick = (stock) => {
    setEditingStock(stock)
    setEditFormData({
      quantity: stock.quantity || 0,
      remainingQuantity: stock.remainingQuantity || 0,
      originalAmount: stock.originalAmount || 0,
      purchaseDate: stock.purchaseDate ? new Date(stock.purchaseDate).toISOString().split('T')[0] : '',
      taxRate: stock.taxRate || 15,
    })
  }

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle edit submission
  const handleEditSubmit = async () => {
    setIsSubmitting(true)
    try {
      const stockToUpdate = {
        ...editFormData,
        quantity: parseInt(editFormData.quantity),
        remainingQuantity: parseInt(editFormData.remainingQuantity),
        originalAmount: parseFloat(editFormData.originalAmount),
        taxRate: parseFloat(editFormData.taxRate),
      }

      await updateStock({
        stockId: editingStock._id,
        data: stockToUpdate,
      }).unwrap()

      toast.success("Stock updated successfully!")
      setEditingStock(null)
      setEditFormData({})
      refetch()
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update stock")
    }
    setIsSubmitting(false)
  }

  // Handle edit cancellation
  const handleEditCancel = () => {
    setEditingStock(null)
    setEditFormData({})
  }

  // Handle delete stock
  const handleDeleteStock = async (stock) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline-danger ms-1'
      },
      buttonsStyling: false
    })

    if (result.isConfirmed) {
      try {
        await deleteStock(stock._id).unwrap()
        toast.success("Stock deleted successfully!")
        refetch()
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete stock")
      }
    }
  }

  // Generate month options for the current year
  const getMonthOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()

    // Add months for current year
    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'long' })
      const value = `${currentYear}-${month.toString().padStart(2, '0')}`
      options.push({ value, label: monthName })
    }

    return options
  }

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      renderCell: (params) => {
        const index = filteredStocks.findIndex(stock => stock._id === params.row._id);
        return index + 1;
      },
    },
    {
      field: "remainingQuantity",
      headerName: "Remaining",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Badge color="info" pill>
          {params.row.remainingQuantity || 0}
        </Badge>
      ),
    },
    {
      field: "originalAmount",
      headerName: "Original Amount",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>${(params.row.originalAmount || 0).toFixed(2)}</span>
      ),
    },
    {
      field: "taxRate",
      headerName: "Tax (%)",
      width: 100,
      sortable: true,
      renderCell: (params) => (
        <span>{(params.row.taxRate || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Badge color="primary" pill>
          {params.row.quantity || 0}
        </Badge>
      ),
    },
    {
      field: "totalAmount",
      headerName: "Total Amount",
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const totalAmount = ((params.row.originalAmount || 0) * (params.row.quantity || 0)) + 
                           ((params.row.originalAmount || 0) * (params.row.quantity || 0) * (params.row.taxRate || 0) / 100);
        return <span className="fw-bold">${totalAmount.toFixed(2)}</span>;
      },
    },
    {
      field: "purchaseDate",
      headerName: "Purchase Date",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <span>
          {params.row.purchaseDate ? new Date(params.row.purchaseDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          {/* <Button
            color="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowDoubleClick(params.row);
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
              handleDeleteStock(params.row);
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
  const gridData = filteredStocks.map((stock, index) => ({
    id: stock._id || index,
    ...stock
  }));

  if (isLoading || productLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
      </div>
    )
  }

  if (error || productError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <h4>Error loading data</h4>
          <p>{error?.data?.message || productError?.data?.message || "Something went wrong"}</p>
          <Button color="primary" onClick={handleRefetch}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">
          Stock Details - {product?.name}
        </CardTitle>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            color="secondary"
            size="sm"
            onClick={handleViewProductList}
          >
            Back to product list
          </Button>
          <Button
            color="success"
            size="sm"
            onClick={handleAddAnotherStock}
          >
            Add Another Stock
          </Button>
        </div>
      </CardHeader>
      <CardBody>


        <br />

        <Row className="mb-2">
          <Col md="4">
            <Input
              type="select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
          </Col>
          <Col md="4" className="text-end">
          </Col>
          <Col md="4" className="text-end">
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              {(() => {
                const totalQuantity = filteredStocks.reduce((sum, s) => sum + (s.quantity || 0), 0)
                const totalRemaining = filteredStocks.reduce((sum, s) => sum + (s.remainingQuantity || 0), 0)
                const totalPurchaseAmount = filteredStocks.reduce((sum, s) => sum + (s.purchaseAmount || 0), 0)
                const avgPricePerUnit = totalQuantity > 0 ? totalPurchaseAmount / totalQuantity : 0
                const totalRemainingPurchaseAmount = totalRemaining * avgPricePerUnit
                const avgTaxRate = filteredStocks.length > 0 ? (filteredStocks.reduce((sum, s) => sum + (s.taxRate || 0), 0) / filteredStocks.length) : 0
                const totalWithTax = totalRemainingPurchaseAmount + (totalRemainingPurchaseAmount * avgTaxRate / 100)

                // Use stockSummary from product data if available
                const stockSummaryTotalRemainingPurchaseAmount = product?.stockSummary?.totalRemainingPurchaseAmount || 0

                return (
                  <>
                    <small className="text-muted">Qty: <span className="fw-bold">{totalQuantity}</span></small>
                    <small className="text-muted">Rem: <span className="fw-bold">{totalRemaining}</span></small>
                    <small className="text-muted">Pur: <span className="fw-bold">${stockSummaryTotalRemainingPurchaseAmount.toFixed(2)}</span></small>
                    <small className="text-muted">Tax: <span className="fw-bold">{avgTaxRate.toFixed(1)}%</span></small>
                    <small className="text-muted">Total: <span className="fw-bold text-primary">${totalPurchaseAmount.toFixed(2)}</span></small>
                  </>
                )
              })()}
            </div>
          </Col>
        </Row>

        {editingStock && (
          <Card className="mb-3" style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa', border: isDarkTheme ? '1px solid #4a5568' : '1px solid #dee2e6' }}>
            <CardHeader>
              <CardTitle tag="h5" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Edit Stock Record
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }}>
                <Row>
                  <Col md="3" className="mb-2">
                    <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Remaining Quantity</Label>
                      <Input
                        type="number"
                        value={editFormData.remainingQuantity || 0}
                        onChange={(e) => handleEditFormChange('remainingQuantity', e.target.value)}
                        min="0"
                      style={{ 
                        backgroundColor: isDarkTheme ? '#4a5568' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #6b7280' : '1px solid #ced4da'
                      }}
                    />
                  </Col>
                  <Col md="3" className="mb-2">
                    <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Original Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.originalAmount || 0}
                        onChange={(e) => handleEditFormChange('originalAmount', e.target.value)}
                        min="0"
                      style={{ 
                        backgroundColor: isDarkTheme ? '#4a5568' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #6b7280' : '1px solid #ced4da'
                      }}
                    />
                  </Col>
                  <Col md="2" className="mb-2">
                    <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.taxRate || 0}
                        onChange={(e) => handleEditFormChange('taxRate', e.target.value)}
                        min="0"
                        max="100"
                      style={{ 
                        backgroundColor: isDarkTheme ? '#4a5568' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #6b7280' : '1px solid #ced4da'
                      }}
                    />
                  </Col>
                  <Col md="2" className="mb-2">
                    <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Quantity</Label>
                      <Input
                        type="number"
                        value={editFormData.quantity || 0}
                        onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                        min="0"
                      style={{ 
                        backgroundColor: isDarkTheme ? '#4a5568' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #6b7280' : '1px solid #ced4da'
                      }}
                    />
                  </Col>
                  <Col md="2" className="mb-2">
                    <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Purchase Date</Label>
                      <Input
                        type="date"
                        value={editFormData.purchaseDate || ''}
                        onChange={(e) => handleEditFormChange('purchaseDate', e.target.value)}
                      style={{ 
                        backgroundColor: isDarkTheme ? '#4a5568' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #6b7280' : '1px solid #ced4da'
                      }}
                    />
                  </Col>
                </Row>
                <div className="d-flex gap-2 mt-2">
                        <Button
                          color="success"
                    type="submit"
                    disabled={isSubmitting}
                          size="sm"
                        >
                    {isSubmitting ? <Spinner size="sm" /> : <Save size={12} className="me-1" />}
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          color="secondary"
                          onClick={handleEditCancel}
                          disabled={isSubmitting}
                    size="sm"
                        >
                    <X size={12} className="me-1" />
                          Cancel
                        </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
            <Spinner color="primary" />
            <span className="ms-2">Loading...</span>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No stock records found</p>
                      </div>
                    ) : (
          <div style={{ height: 400, width: '100%', marginBottom: "40px" }}>
            <DataGrid
              key={currentTheme} // Force re-render when theme changes
              rows={gridData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              autoHeight={false}
              getRowId={(row) => row.id}
              onRowDoubleClick={(params) => handleRowDoubleClick(params.row)}
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

        {filteredStocks.length > itemsPerPage && (
          <div className="d-flex justify-content-end mt-1">
            <ReactPaginate
              previousLabel=""
              nextLabel=""
              forcePage={currentPage - 1}
              onPageChange={handlePagination}
              pageCount={Math.ceil(filteredStocks.length / itemsPerPage)}
              breakLabel="..."
              pageRangeDisplayed={2}
              marginPagesDisplayed={2}
              activeClassName="active"
              pageClassName="page-item"
              breakClassName="page-item"
              nextLinkClassName="page-link"
              pageLinkClassName="page-link"
              breakLinkClassName="page-link"
              previousLinkClassName="page-link"
              nextClassName="page-item next-item"
              previousClassName="page-item prev-item"
              containerClassName="pagination react-paginate separated-pagination pagination-sm justify-content-end pe-1"
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ViewStock 