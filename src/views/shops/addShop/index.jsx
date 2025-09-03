import React, { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Form,
  FormGroup,
  Label,
  Row,
  Col,
  Spinner,
} from "reactstrap"
import { DataGrid } from '@mui/x-data-grid'
import { useNavigate } from "react-router-dom"
import { useCreateShopMutation } from "../../../slices/shopApiSlice"
import { useGetProductsQuery } from "../../../slices/productApiSlice"
import { Plus, Trash } from "react-feather"
import toast from "react-hot-toast"
import "@styles/react/libs/react-select/_react-select.scss"

const AddShop = () => {
  const navigate = useNavigate()
  const [createShop, { isLoading }] = useCreateShopMutation()
  const { data: productsData } = useGetProductsQuery({ page: 1, limit: 1000 })
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    products: []
  })

  const [showAddProductForm, setShowAddProductForm] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [newProduct, setNewProduct] = useState({
    productId: "",
    unitPrice: 0,
    totalPrice: 0,
    taxRate: 0,
    taxAmount: 0,
    priceWithoutTax: 0,
    priceWithTax: 0
  })

  const products = productsData?.products || []

  // Theme detection
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

  // DataGrid columns - responsive widths
  const columns = [
    { 
      field: "id", 
      headerName: "S.No", 
      width: 60, 
      minWidth: 60,
      renderCell: (params) => params.row.index + 1 
    },
    { 
      field: "productName", 
      headerName: "Product", 
      width: 150, 
      minWidth: 120,
      flex: 1,
      sortable: true 
    },
    { 
      field: "unitPrice", 
      headerName: "Unit Price", 
      width: 100, 
      minWidth: 80,
      sortable: true, 
      renderCell: (params) => (
        <span className="fw-bold">${params.row.unitPrice.toFixed(2)}</span>
      )
    },
    { 
      field: "totalPrice", 
      headerName: "Total", 
      width: 100, 
      minWidth: 80,
      sortable: true, 
      renderCell: (params) => (
        <span className="fw-bold">${params.row.totalPrice.toFixed(2)}</span>
      )
    },
    { 
      field: "taxRate", 
      headerName: "Tax %", 
      width: 80, 
      minWidth: 60,
      sortable: true, 
      renderCell: (params) => (
        <span>{params.row.taxRate}%</span>
      )
    },
    { 
      field: "taxAmount", 
      headerName: "Tax Amt", 
      width: 100, 
      minWidth: 80,
      sortable: true, 
      renderCell: (params) => (
        <span className="fw-bold">${params.row.taxAmount.toFixed(2)}</span>
      )
    },
    { 
      field: "priceWithTax", 
      headerName: "Final Price", 
      width: 120, 
      minWidth: 100,
      sortable: true, 
      renderCell: (params) => (
        <span className="fw-bold text-success">${params.row.priceWithTax.toFixed(2)}</span>
      )
    },
    {
      field: "actions",
      headerName: "Action",
      width: 80,
      minWidth: 60,
      sortable: false,
      renderCell: (params) => (
        <Button
          color="danger"
          size="sm"
          onClick={(e) => { 
            e.stopPropagation(); 
            handleRemoveProduct(params.row.index); 
          }}
        >
          <Trash size={12} />
        </Button>
      ),
    },
  ];

  // Prepare data for DataGrid
  const gridData = formData.products.map((product, index) => ({
    id: product.productId || index,
    index: index,
    ...product
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProductInputChange = (field, value) => {
    setNewProduct(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate when unit price changes
      if (field === 'unitPrice') {
        const totalPrice = updated.unitPrice
        updated.totalPrice = totalPrice
        updated.priceWithoutTax = totalPrice
        
        // Recalculate tax if tax rate exists
        if (updated.taxRate > 0) {
          updated.taxAmount = (totalPrice * updated.taxRate) / 100
          updated.priceWithTax = totalPrice + updated.taxAmount
        } else {
          updated.taxAmount = 0
          updated.priceWithTax = totalPrice
        }
      }
      
      // Auto-calculate when tax rate changes
      if (field === 'taxRate') {
        const taxAmount = (updated.totalPrice * value) / 100
        updated.taxAmount = taxAmount
        updated.priceWithTax = updated.totalPrice + taxAmount
      }
      
      return updated
    })
  }

  const handleAddProduct = () => {
    if (!newProduct.productId) {
      toast.error("Please select a product")
      return
    }
    
    if (newProduct.unitPrice <= 0) {
      toast.error("Please enter a valid unit price")
      return
    }

    const selectedProduct = products.find(p => p._id === newProduct.productId)
    const productToAdd = {
      ...newProduct,
      productName: selectedProduct?.name || '',
      productDetails: selectedProduct
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, productToAdd]
    }))

    // Reset form and hide it after adding product
    setNewProduct({
      productId: "",
      unitPrice: 0,
      totalPrice: 0,
      taxRate: 0,
      taxAmount: 0,
      priceWithoutTax: 0,
      priceWithTax: 0
    })
    setShowAddProductForm(false)
    toast.success("Product added successfully!")
  }

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
    toast.success("Product removed successfully!")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Please enter shop name")
      return
    }
    
    if (!formData.location.trim()) {
      toast.error("Please enter shop location")
      return
    }

    try {
      await createShop(formData).unwrap()
      toast.success("Shop created successfully!")
      navigate("/apps/shops")
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create shop")
    }
  }

  const handleCancel = () => {
    navigate("/apps/shops")
  }

  return (
    <div className="container-fluid px-2 px-md-3">
      <Card>
        <CardHeader>
          <CardTitle tag="h4" className="text-center text-md-start">Add New Shop</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="name">Shop Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter shop name"
                    required
                  />
                </FormGroup>
              </Col>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="location">Location *</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter shop location"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Products Section */}
            <Row>
              <Col xs="12">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                  <h5 className="mb-0">Products</h5>
                  <Button
                    color="success"
                    size="sm"
                    onClick={() => setShowAddProductForm(true)}
                    className="w-100 w-md-auto"
                  >
                    <Plus size={12} className="me-1" />
                    Add Product
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Add Product Form */}
            {showAddProductForm && (
              <Card className="mb-3">
                <CardHeader>
                  <CardTitle tag="h6">Add New Product</CardTitle>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col xs="12" md="6">
                      <FormGroup>
                        <Label>Select Product</Label>
                        <Input
                          type="select"
                          value={newProduct.productId}
                          onChange={(e) => {
                            const productId = e.target.value
                            const selectedProduct = products.find(p => p._id === productId)
                            handleProductInputChange('productId', productId)
                            if (selectedProduct) {
                              handleProductInputChange('unitPrice', selectedProduct.price || 0)
                            }
                          }}
                        >
                          <option value="">Select a product</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col xs="12" md="6">
                      <FormGroup>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          value={newProduct.unitPrice}
                          onChange={(e) => handleProductInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col xs="6" md="3">
                      <FormGroup>
                        <Label>Total Price</Label>
                        <Input
                          type="number"
                          value={newProduct.totalPrice}
                          readOnly
                          step="0.01"
                        />
                      </FormGroup>
                    </Col>
                    <Col xs="6" md="3">
                      <FormGroup>
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={newProduct.taxRate}
                          onChange={(e) => handleProductInputChange('taxRate', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                        />
                      </FormGroup>
                    </Col>
                    <Col xs="6" md="3">
                      <FormGroup>
                        <Label>Tax Amount</Label>
                        <Input
                          type="number"
                          value={newProduct.taxAmount}
                          readOnly
                          step="0.01"
                        />
                      </FormGroup>
                    </Col>
                    <Col xs="6" md="3">
                      <FormGroup>
                        <Label>Price With Tax</Label>
                        <Input
                          type="number"
                          value={newProduct.priceWithTax}
                          readOnly
                          step="0.01"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  
                  <div className="d-flex flex-column flex-md-row gap-2">
                    <Button color="primary" onClick={handleAddProduct} className="w-100 w-md-auto">
                      Add Product
                    </Button>
                    <Button color="secondary" onClick={() => setShowAddProductForm(false)} className="w-100 w-md-auto">
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}



            {/* Products List */}
            {formData.products.length > 0 && (
              <Row>
                <Col xs="12">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 gap-2">
                    <h6 className="mb-0">Added Products</h6>
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => setShowAddProductForm(true)}
                      className="w-100 w-md-auto"
                    >
                      <Plus size={12} className="me-1" />
                      Add Another Product
                    </Button>
                  </div>
                  <div style={{ height: 400, width: '100%', overflowX: 'auto' }}>
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
                </Col>
              </Row>
            )}

            {/* Summary Section */}
            {formData.products.length > 0 && (
              <Row>
                <Col xs="12">
                  <Card className="mt-3" style={{ backgroundColor: '#e3f2fd' }}>
                    <CardHeader>
                      <CardTitle tag="h6" className="text-center text-md-start">Shop Summary</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <Row>
                        <Col xs="12" md="4" className="mb-2 mb-md-0">
                          <div className="text-center text-md-start">
                            <strong>Total Products: </strong>{formData.products.length}
                          </div>
                        </Col>
                        <Col xs="12" md="4" className="mb-2 mb-md-0">
                          <div className="text-center text-md-start">
                            <strong>Total Price (Before Tax): </strong>
                            <br className="d-md-none" />
                            <span className="d-md-inline"> </span>
                            ${formData.products.reduce((sum, product) => sum + product.priceWithoutTax, 0).toFixed(2)}
                          </div>
                        </Col>
                        <Col xs="12" md="4">
                          <div className="text-center text-md-start">
                            <strong>Total Price (With Tax): </strong>
                            <br className="d-md-none" />
                            <span className="d-md-inline"> </span>
                            ${formData.products.reduce((sum, product) => sum + product.priceWithTax, 0).toFixed(2)}
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <div className="d-flex flex-column flex-md-row gap-2 mt-3">
              <Button
                color="primary"
                type="submit"
                disabled={isLoading}
                className="w-100 w-md-auto"
              >
                {isLoading ? <Spinner size="sm" /> : "Save Shop"}
              </Button>
              <Button
                color="secondary"
                type="button"
                onClick={handleCancel}
                className="w-100 w-md-auto"
              >
                Cancel
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default AddShop
