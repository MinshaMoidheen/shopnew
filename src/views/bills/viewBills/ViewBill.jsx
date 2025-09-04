import React, { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Label,
  Input,
  Row,
  Col,
  Spinner,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup
} from "reactstrap"
import Select from 'react-select'
import '@styles/react/libs/react-select/_react-select.scss'
import { useParams, useNavigate } from "react-router-dom"
import { useGetBillByIdQuery, useUpdateBillMutation } from "../../../slices/billApislice"
import { useGetCentersQuery } from "../../../slices/centersSlice"
import { useGetProductsQuery } from "../../../slices/productApiSlice"
import toast from "react-hot-toast"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

const ViewBill = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchPage] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    date: "",
    offPercentage: 0,
    items: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [currentTheme, setCurrentTheme] = useState('light')

  const { data: billData, isLoading, error, refetch } = useGetBillByIdQuery(id)
  const [updateBill] = useUpdateBillMutation()

  console.log("billData", billData)

  const { data: centersData } = useGetCentersQuery({
    page: searchPage,
    limit: 100000,
  })

  const { data: productsData, isLoading: productsLoading, error: productsError } = useGetProductsQuery({
    page: 1,
    limit: 10000,
  })

  console.log("productsData", productsData)
  console.log("productsData?.products", productsData?.products)
  console.log("productsLoading", productsLoading)
  console.log("productsError", productsError)
  console.log("editFormData", editFormData)
  console.log("isEditing", isEditing)

  const getCenterName = (centerId) => {
    const center = centersData?.data?.find(c => c._id === centerId)
    return center ? center.centerName : centerId
  }

  const getProductName = (productId) => {
    const product = productsData?.products?.find(p => p._id === productId)
    return product ? product.name : productId
  }

  // Function to get product options sorted alphabetically
  const getProductOptions = () => {
    if (!productsData?.products) return []

    // Sort products alphabetically by name
    const sortedProducts = [...productsData.products].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )

    return sortedProducts.map(product => ({
      value: product._id,
      label: product.name,
      product: product
    }))
  }

  // Initialize edit form data when bill data is loaded
  useEffect(() => {
    if (billData && !isEditing) {
      setEditFormData({
        customerName: billData.customerName || "",
        date: billData.date ? new Date(billData.date).toISOString().split('T')[0] : "",
        offPercentage: billData.offPercentage || 0,
        items: billData.items?.map((item, index) => {
          // Handle different product data structures
          let productId = ""
          let productName = ""

          if (typeof item.productId === 'string') {
            productId = item.productId
            productName = item.productName || ""
          } else if (item.productId && typeof item.productId === 'object') {
            productId = item.productId._id || item.productId
            productName = item.productId.name || item.productName || ""
          }

          return {
            id: item.id || `existing-${index}-${Date.now()}`,
            productId: productId,
            productName: productName,
            quantity: item.quantity || 0,
            unit: item.unit || "",
            sellingPrice: item.sellingPrice || 0,
            vatPercentage: item.vatPercentage || 0,
            total: item.total || 0
          }
        }) || []
      })
    }
  }, [billData, isEditing])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load bill details")
      navigate("/apps/bills")
    }
  }, [error, navigate])

  // Monitor editFormData changes for debugging
  useEffect(() => {
    console.log("editFormData changed:", editFormData)
    console.log("Items count:", editFormData.items?.length)
  }, [editFormData])

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

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form data to original values
    if (billData) {
      setEditFormData({
        customerName: billData.customerName || "",
        date: billData.date ? new Date(billData.date).toISOString().split('T')[0] : "",
        offPercentage: billData.offPercentage || 0,
        items: billData.items?.map(item => {
          // Handle different product data structures
          let productId = ""
          let productName = ""

          if (typeof item.productId === 'string') {
            productId = item.productId
            productName = item.productName || ""
          } else if (item.productId && typeof item.productId === 'object') {
            productId = item.productId._id || item.productId
            productName = item.productId.name || item.productName || ""
          }

          return {
            id: item.id || `existing-${Date.now()}`, // Ensure unique ID for existing items
            productId: productId,
            productName: productName,
            quantity: item.quantity || 0,
            unit: item.unit || "",
            sellingPrice: item.sellingPrice || 0,
            vatPercentage: item.vatPercentage || 0,
            total: item.total || 0
          }
        }) || []
      })
    }
  }

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    console.log("handleItemChange called:", { index, field, value })
    console.log("Current editFormData:", editFormData)

    setEditFormData(prev => {
      const updatedItems = [...prev.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      }

      console.log("Updated item at index", index, ":", updatedItems[index])

      // Recalculate total for the item
      if (field === 'quantity' || field === 'sellingPrice') {
        const quantity = field === 'quantity' ? parseFloat(value) : updatedItems[index].quantity
        const sellingPrice = field === 'sellingPrice' ? parseFloat(value) : updatedItems[index].sellingPrice
        const vatPercentage = updatedItems[index].vatPercentage || 0

        let total = quantity * sellingPrice
        if (vatPercentage > 0) {
          total += (total * vatPercentage / 100)
        }

        updatedItems[index].total = Math.round(total)
      }

      const newState = {
        ...prev,
        items: updatedItems
      }

      console.log("New state:", newState)
      return newState
    })
  }

  const addItem = () => {
    const newItemId = Date.now() // Unique identifier
    console.log("Adding new item with ID:", newItemId)

    const newItem = {
      id: newItemId,
      productId: "",
      productName: "",
      quantity: 0,
      unit: "",
      sellingPrice: 0,
      vatPercentage: 0,
      total: 0
    }

    console.log("New item structure:", newItem)

    setEditFormData(prev => {
      const updatedItems = [...prev.items, newItem]
      console.log("Updated items array:", updatedItems)
      return {
        ...prev,
        items: updatedItems
      }
    })
  }

  const removeItem = (index) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Validate form data
      if (!editFormData.customerName.trim()) {
        toast.error("Customer name is required")
        return
      }

      if (!editFormData.date) {
        toast.error("Date is required")
        return
      }

      if (editFormData.items.length === 0) {
        toast.error("At least one item is required")
        return
      }

      // Validate items
      for (let i = 0; i < editFormData.items.length; i++) {
        const item = editFormData.items[i]
        if (!item.productId) {
          toast.error(`Product is required for item ${i + 1}`)
          return
        }
        if (!item.quantity || item.quantity <= 0) {
          toast.error(`Quantity must be greater than 0 for item ${i + 1}`)
          return
        }
        if (item.sellingPrice === undefined || item.sellingPrice === null || item.sellingPrice < 0) {
          toast.error(`Selling price must be 0 or greater for item ${i + 1}`)
          return
        }
      }

      const billToUpdate = {
        customerName: editFormData.customerName,
        date: editFormData.date,
        offPercentage: parseFloat(editFormData.offPercentage || 0),
        items: editFormData.items.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unit: item.unit,
          sellingPrice: parseFloat(item.sellingPrice),
          vatPercentage: parseFloat(item.vatPercentage || 0),
          total: parseFloat(item.total)
        }))
      }

      await updateBill({
        billId: id,
        data: billToUpdate
      }).unwrap()

      toast.success("Bill updated successfully!")
      setIsEditing(false)
      refetch()
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update bill")
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
      </div>
    )
  }

  if (!billData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-danger">Bill not found</div>
      </div>
    )
  }

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
            .viewbill-application {
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
            .mobile-form-input {
              width: 100% !important;
              margin-bottom: 0.5rem !important;
              font-size: 16px !important;
            }
            .mobile-button {
              width: 100% !important;
              font-size: 14px !important;
              padding: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }
            .mobile-table-container {
              overflow-x: auto !important;
              width: 100% !important;
            }
            .mobile-table {
              min-width: 600px !important;
              font-size: 12px !important;
            }
            .mobile-table th,
            .mobile-table td {
              padding: 0.5rem 0.25rem !important;
              font-size: 11px !important;
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
                Bill Details
              </CardTitle>
              <div className={`d-flex ${isMobile ? 'flex-column w-100 gap-2 mt-2' : 'gap-2'}`}>
          {!isEditing && (
                  <Button 
                    color="warning" 
                    onClick={handleEditClick}
                    className={isMobile ? 'mobile-button' : ''}
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      fontSize: isMobile ? '14px' : '14px',
                      padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
                    }}
                  >
              Edit Bill
            </Button>
          )}
                <Button 
                  color="secondary" 
                  onClick={() => navigate("/apps/bills")}
                  className={isMobile ? 'mobile-button' : ''}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    fontSize: isMobile ? '14px' : '14px',
                    padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
                  }}
                >
            Back to Bills
          </Button>
        </div>
      </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
        <Row className="mb-2">
          <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
            <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Customer Name:</Label>
            {isEditing ? (
              <Input
                value={editFormData.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                className={isMobile ? 'mobile-form-input' : ''}
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            ) : (
              <Input 
                value={billData?.customerName || ''} 
                disabled 
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            )}
          </Col>
          <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
            <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Date:</Label>
            {isEditing ? (
              <Input
                type="date"
                value={editFormData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className={isMobile ? 'mobile-form-input' : ''}
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            ) : (
              <Input 
                value={billData?.date ? new Date(billData.date).toLocaleDateString() : ''} 
                disabled 
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            )}
          </Col>
          <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
            <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Center:</Label>
            <Input 
              value={getCenterName(billData?.centerId?.centerName) || ''} 
              disabled 
              style={{
                backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000',
                border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                fontSize: isMobile ? '16px' : '14px'
              }}
            />
          </Col>
        </Row>

        <Row className="mb-2">
          <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
            <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Discount %:</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={editFormData.offPercentage}
                onChange={(e) => handleFormChange('offPercentage', e.target.value)}
                className={isMobile ? 'mobile-form-input' : ''}
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            ) : (
              <Input 
                value={billData?.offPercentage || 0} 
                disabled 
                style={{
                  backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  fontSize: isMobile ? '16px' : '14px'
                }}
              />
            )}
          </Col>
          <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
            <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Total Amount:</Label>
            <Input 
              value={billData?.totalAmount || 0} 
              disabled 
              style={{
                backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000',
                border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                fontSize: isMobile ? '16px' : '14px'
              }}
            />
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Bill Items</h5>
        </div>

        <div className={isMobile ? 'mobile-table-container' : ''}>
          <Table bordered responsive className={`mt-2 ${isMobile ? 'mobile-table' : ''}`} style={{
            backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
            color: isDarkTheme ? '#ffffff' : '#000000'
          }}>
          <thead style={{ backgroundColor: isDarkTheme ? '#23263a' : '#f7fafc' }}>
            <tr>
              <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>#</th>
              <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>Product</th>
              <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>Qty</th>
              <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>Unit</th>
              <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>Price</th>
              {isEditing && <th style={{ 
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontSize: isMobile ? '11px' : '14px',
                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
              }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(isEditing ? editFormData.items : billData?.items)?.map((item, index) => (
              <tr 
                key={isEditing ? `edit-${item.id || index}-${item.productId || 'new'}` : `view-${index}-${item.productId || 'item'}`}
                style={{ 
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}
              >
                <td style={{ 
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '11px' : '14px',
                  padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                }}>
                  {index + 1}
                </td>
                <td style={{ 
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '11px' : '14px',
                  padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                }}>
                  {isEditing ? (
                    productsLoading ? (
                      <Spinner size="sm" color="primary" />
                    ) : productsError ? (
                      <div className="text-danger">Error loading products</div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <Select
                          key={`product-select-${item.id || index}-${editFormData.items.length}`}
                          className="react-select"
                          classNamePrefix="select"
                          options={getProductOptions()}
                          value={item.productId ? {
                            value: item.productId,
                            label: item.productName || getProductName(item.productId),
                            product: productsData?.products?.find(p => p._id === item.productId)
                          } : null}
                          onChange={(selectedOption) => {
                            if (selectedOption) {
                              handleItemChange(index, 'productId', selectedOption.value)
                              handleItemChange(index, 'productName', selectedOption.label)

                              // Auto-fill unit and price if product is selected
                              if (selectedOption.product) {
                                handleItemChange(index, 'unit', selectedOption.product.unit || '')
                                handleItemChange(index, 'sellingPrice', selectedOption.product.price || 0)
                                handleItemChange(index, 'vatPercentage', selectedOption.product.tax || 0)
                              }
                            } else {
                              handleItemChange(index, 'productId', '')
                              handleItemChange(index, 'productName', '')
                              handleItemChange(index, 'unit', '')
                              handleItemChange(index, 'sellingPrice', 0)
                              handleItemChange(index, 'vatPercentage', 0)
                            }
                          }}
                          placeholder="Search and select product..."
                          isClearable
                          isSearchable
                          noOptionsMessage={() => "No products found"}
                          filterOption={(option, inputValue) => {
                            return option.label.toLowerCase().includes(inputValue.toLowerCase())
                          }}
                          menuPlacement="auto"
                          styles={{
                            menu: (provided) => ({
                              ...provided,
                              zIndex: 9999
                            })
                          }}
                        />
                      </div>
                    )
                  ) : (
                    item.productId?.name || item.productName || getProductName(item.productId) || ''
                  )}
                </td>
                <td style={{ 
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '11px' : '14px',
                  padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                }}>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    />
                  ) : (
                    item.quantity || 0
                  )}
                </td>
                <td style={{ 
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '11px' : '14px',
                  padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                }}>
                  {isEditing ? (
                    <Input
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    />
                  ) : (
                    item.unit || ''
                  )}
                </td>
                <td style={{ 
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '11px' : '14px',
                  padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                }}>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                      min="0"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    />
                  ) : (
                    item.sellingPrice || 0
                  )}
                </td>
                {isEditing && (
                  <td style={{ 
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    fontSize: isMobile ? '11px' : '14px',
                    padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                  }}>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                      style={{
                        fontSize: isMobile ? '10px' : '12px',
                        padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem'
                      }}
                    >
                      {isMobile ? 'Del' : 'Remove'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        </div>

        {isEditing && (
          <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-end'} gap-2 mt-3`}>
            <Button
              color="primary"
              size="sm"
              onClick={addItem}
              disabled={isSubmitting}
              className={isMobile ? 'mobile-button' : ''}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '14px' : '12px',
                padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
              }}
            >
              Add Item
            </Button>
            <Button
              color="secondary"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className={isMobile ? 'mobile-button' : ''}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '14px' : '12px',
                padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
              }}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={isMobile ? 'mobile-button' : ''}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '14px' : '12px',
                padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
              }}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
        </div>
      </div>
    </>
  )
}

export default ViewBill 