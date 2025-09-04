import { useForm, Controller, useWatch } from "react-hook-form"
import toast from "react-hot-toast"
import { useState, useEffect } from "react"
import Select from 'react-select/async'
import '@styles/react/libs/react-select/_react-select.scss'
import CreatableSelect from 'react-select/creatable'

// ** Reactstrap Imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Label,
  Input,
  Form,
  Spinner,
  Row,
  Col,
} from "reactstrap"
import withReactContent from "sweetalert2-react-content"
import Swal from "sweetalert2"
import "animate.css/animate.css"
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss"
import { useLocation, useNavigate } from "react-router-dom"
import { useCreateStockMutation } from "../../../slices/stockApiSlice"
import { useGetProductsQuery } from "../../../slices/productApiSlice"
import { useGetAllSuppliersQuery } from "../../../slices/supplierSLice"

const MySwal = withReactContent(Swal)

const AddNewStock = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const productQuery = queryParams.get("productId")
  const isDuplicate = queryParams.get("duplicate") === "true"
  const [stocks, setStocks] = useState([{ id: 1 }])
  const [createStock, { isLoading }] = useCreateStockMutation()
  const [barcode, setBarcode] = useState('')
  const [timer, setTimer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTypeaheadOpen, setIsTypeaheadOpen] = useState(false)
  const [productOptions, setProductOptions] = useState([])
  const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)

  // Get theme from localStorage
  const getThemeFromStorage = () => {
    const skin = localStorage.getItem('skin');
    if (skin?.toLowerCase()?.includes('dark')) {
      return 'dark';
    }
    return 'light';
  };
  
  const [currentTheme, setCurrentTheme] = useState(getThemeFromStorage());

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getThemeFromStorage());
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for theme changes (in case localStorage is updated in same tab)
    const interval = setInterval(() => {
      const newTheme = getThemeFromStorage();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentTheme]);

  // Helper function for theme comparison - more robust
  const isDarkTheme = currentTheme?.toLowerCase()?.trim() === "dark" || 
                      currentTheme?.toLowerCase()?.includes("dark");

  const { data: productsData, refetch: refetchProducts } = useGetProductsQuery({
    limit: 1000,
    ...(searchQuery && { keyword: searchQuery }),
    ...(barcode && { barcode: barcode })
  })

  const { data: suppliersData, isLoading: suppliersLoading } = useGetAllSuppliersQuery({
    page: 1,
    limit: 1000
  })

  const transformProductsToOptions = (products = []) => {
    return products.map(product => ({
      value: product._id,
      label: product.name,
      product
    }))
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const result = await refetchProducts()
        if (result.data?.products) {
          const options = transformProductsToOptions(result.data.products)
          setProductOptions(options)
          setInitialOptionsLoaded(true)
        }
      } catch (error) {
        console.error('Error loading initial products:', error)
      }
    }

    if (!initialOptionsLoaded) {
      loadInitialData()
    }
  }, [])

  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData.data || [])
    }
  }, [suppliersData])

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadProductOptions = async (inputValue) => {
    try {
      if (!inputValue) {
        if (!initialOptionsLoaded || productOptions.length === 0) {
          const result = await refetchProducts()
          const options = transformProductsToOptions(result.data?.products || [])
          setProductOptions(options)
          setInitialOptionsLoaded(true)
          return options
        }
        return productOptions
      }

      setSearchQuery(inputValue)
      const result = await refetchProducts()
      const options = transformProductsToOptions(result.data?.products || [])
      setProductOptions(options)
      return options
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      stocks: [
        {
          productId: productQuery || "",
          quantity: 1,
          warehouse: "QAHWA",
          purchaseAmount: "",
          paidAmount: "",
          purchaseDate: "",
          tax: "",
        },
      ],
    },
  })


  const watchedFields = useWatch({ control, name: `stocks` })

  // Handle duplicate stock creation - must be after useForm initialization
  useEffect(() => {
    if (isDuplicate && productQuery) {
      // Ensure product options are loaded before setting the value
      const initializeDuplicateStock = async () => {
        if (!initialOptionsLoaded || productOptions.length === 0) {
          await loadInitialData()
        }

        // Pre-fill the form with default values for duplicate stock
        setValue('stocks.0.productId', productQuery)
        setValue('stocks.0.quantity', 1)
        setValue('stocks.0.warehouse', "QAHWA")
        setValue('stocks.0.purchaseAmount', "")
        setValue('stocks.0.paidAmount', "")
        setValue('stocks.0.purchaseDate', new Date().toISOString().split('T')[0])
        setValue('stocks.0.tax', 15)
      }

      initializeDuplicateStock()
    }
  }, [isDuplicate, productQuery, setValue, initialOptionsLoaded, productOptions.length])

  // Pre-fill new stock entries with the same product when in duplicate mode
  const addStockField = async () => {
    const newStock = { id: stocks.length + 1 }
    setStocks([...stocks, newStock])

    // Get current form values to add the new stock to the form
    const currentStocks = watch('stocks') || []
    const newStockData = {
      productId: "",
      quantity: 1,
      warehouse: "QAHWA",
      purchaseAmount: "",
      paidAmount: "",
      purchaseDate: "",
      tax: "",
    }

    // If in duplicate mode, pre-fill the new stock with the same product
    if (isDuplicate && productQuery) {
      newStockData.productId = productQuery
      newStockData.purchaseDate = new Date().toISOString().split('T')[0]
      newStockData.tax = 15
    }

    // Add the new stock to the form
    setValue('stocks', [...currentStocks, newStockData])

    // If in duplicate mode, ensure product options are loaded
    if (isDuplicate && productQuery) {
      if (!initialOptionsLoaded || productOptions.length === 0) {
        await loadInitialData()
      }
    }
  }


  // Handle barcode scanner input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If the target is an input field, don't process as barcode
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      // If the key is a single character, append it
      if (e.key.length === 1) {
        setBarcode(prev => prev + e.key)
      }

      // When Enter is pressed, finalize the barcode
      if (e.key === 'Enter') {
        if (barcode.length >= 6) {
          handleScannedBarcode(barcode)
        }
        setBarcode('')
        return
      }

      // Reset if typing is too slow
      if (timer) clearTimeout(timer)
      const newTimer = setTimeout(() => {
        setBarcode('')
      }, 100)
      setTimer(newTimer)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timer) clearTimeout(timer)
    }
  }, [barcode, timer])

  const handleScannedBarcode = async (scannedBarcode) => {
    try {
      setBarcode(scannedBarcode)
      const result = await refetchProducts()

      if (result.data?.products?.length > 0) {
        const product = result.data.products[0]

        // Always add a new stock entry for scanned products
        const newStock = { id: stocks.length + 1 }
        setStocks(prev => [...prev, newStock])

        // Get current form values and add new stock
        const currentStocks = watch('stocks') || []
        const newStockData = {
          productId: product._id,
          quantity: 1,
          warehouse: "QAHWA",
          purchaseAmount: "",
          paidAmount: "",
          purchaseDate: "",
          tax: "",
        }

        // Add the new stock to the form
        setValue('stocks', [...currentStocks, newStockData])

        toast.success('Product added to stock')
      } else {
        toast.error('Product not found')
      }
      setBarcode('')
    } catch (error) {
      toast.error('Error fetching product')
      setBarcode('')
    }
  }

  // Handle product selection to auto-fill unit and price
  const handleProductSelect = (selectedOption, index) => {
    if (selectedOption?.product) {
      const product = selectedOption.product

      // Always allow setting the product for the current stock
      setValue(`stocks.${index}.productId`, product._id)
      setValue(`stocks.${index}.quantity`, 1)
      setValue(`stocks.${index}.warehouse`, "QAHWA")
      setValue(`stocks.${index}.purchaseAmount`, "")
      setValue(`stocks.${index}.paidAmount`, "")
      setValue(`stocks.${index}.purchaseDate`, "")

      toast.success('Product added to stock')
    }
  }

  const handleSupplierCreate = (inputValue) => {
    // Navigate to AddSupplier with supplierName pre-filled
    navigate(`/apps/suppliers/add?supplierName=${encodeURIComponent(inputValue)}`)
  }

  const onSubmit = async (formData) => {
    try {
      // Process all stock entries, not just the first one
      const stocksToSubmit = formData.stocks.map(stock => ({
        productId: stock.productId,
        quantity: parseInt(stock.quantity),
        warehouse: stock.warehouse,
        purchaseAmount: parseFloat(stock.purchaseAmount),
        paidAmount: parseFloat(stock.paidAmount),
        purchaseDate: stock.purchaseDate,
        expiryDate: stock.expiryDate,
        supplier: stock.supplierName,
        tax: parseFloat(stock.tax || 0),
      }))

      console.log('Submitting stocks:', stocksToSubmit)

      // Submit each stock individually since backend doesn't support bulk creation
      const promises = stocksToSubmit.map(stockData => createStock(stockData).unwrap())
      await Promise.all(promises)

      toast.success(`${stocksToSubmit.length} stock(s) added successfully`)
      handleReset()
      setStocks([{ id: 1 }])
      navigate(`/apps/products/view-stock?productId=${productQuery}`)
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add stock(s)")
    }
  }

  const handleReset = () => {
    reset({
      stocks: [
        {
          productId: "",
          quantity: 1,
          warehouse: "QAHWA",
          purchaseAmount: "",
          paidAmount: "",
          purchaseDate: "",
          tax: "",
        },
      ],
    })
    setStocks([{ id: 1 }])
  }

  // This function is now handled above with the enhanced logic

  const removeStockField = (id) => {
    const stockIndex = stocks.findIndex(stock => stock.id === id)
    if (stockIndex !== -1) {
      // Remove from stocks state
      setStocks(stocks.filter((stock) => stock.id !== id))

      // Remove from form
      const currentStocks = watch('stocks') || []
      const updatedStocks = currentStocks.filter((_, index) => index !== stockIndex)
      setValue('stocks', updatedStocks)
    }
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
            .add-stock-application {
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
            .mobile-stock-item {
              margin-bottom: 1rem !important;
              padding: 0.75rem !important;
              border-radius: 8px !important;
            }
            .mobile-stock-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              margin-bottom: 0.75rem !important;
            }
            .mobile-stock-title {
              font-size: 16px !important;
              font-weight: 600 !important;
              margin: 0 !important;
            }
            .mobile-remove-container {
              margin-bottom: 0.5rem !important;
              padding: 0 !important;
            }
            .mobile-remove-btn {
              font-size: 12px !important;
              padding: 0.25rem 0.5rem !important;
              width: 200px;
              margin: 0 !important;
            }
            .mobile-form-label {
              font-size: 14px !important;
              font-weight: 500 !important;
              margin-bottom: 0.25rem !important;
            }
            .mobile-form-control {
              font-size: 16px !important;
              padding: 0.5rem !important;
              margin-bottom: 0.75rem !important;
              border-radius: 8px !important;
              border: 1px solid #e2e8f0 !important;
            }
            .mobile-form-control:focus {
              border-color: #007bff !important;
              box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
            }
            .mobile-select {
              font-size: 16px !important;
              margin-bottom: 0.75rem !important;
            }
            .mobile-add-btn {
              width: 100% !important;
              margin-bottom: 1rem !important;
              font-size: 16px !important;
              padding: 0.75rem !important;
            }
            .mobile-submit-buttons {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.5rem !important;
              margin-top: 1rem !important;
            }
            .mobile-submit-btn, .mobile-reset-btn {
              width: 100% !important;
              font-size: 16px !important;
              padding: 0.75rem !important;
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
            .col, .col-12, .col-md-6, .col-lg-4 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
              margin-bottom: 0.5rem !important;
              width: 100% !important;
              flex: 0 0 100% !important;
              max-width: 100% !important;
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
          top: isMobile ? '100px' : undefined,
          left: isMobile ? '0' : undefined,
          right: isMobile ? '0' : undefined,
          bottom: isMobile ? '0' : undefined,
          zIndex: isMobile ? '1000' : undefined
        }}
      >
        <div 
          style={{
            width: isMobile ? '90vw' : '100%',
            height: isMobile ? 'calc(100vh - 60px)' : 'auto',
            margin: isMobile ? '0' : '0',
            padding: isMobile ? '0' : '0',
            position: isMobile ? 'absolute' : undefined,
            top: isMobile ? '40px' : undefined,
            left: isMobile ? '10px' : undefined,
            right: isMobile ? '10px' : undefined,
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
                className={isMobile ? 'mobile-stock-title' : ''}
                style={{ color: isDarkTheme ? '#ffffff' : '#000000' ,marginTop:isMobile? "20px":""}}
              >
                Add New Stock
              </CardTitle>
      </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
        <Form onSubmit={handleSubmit(onSubmit)}>
          {stocks.map((stock, index) => (
            <div 
              key={stock.id} 
              className={`border rounded p-2 mb-2 ${isMobile ? 'mobile-stock-item' : ''}`}
              style={{
                backgroundColor: isDarkTheme ? '#23263a' : '#f8f9fa',
                border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
              <div className={`d-flex justify-content-between mb-1 ${isMobile ? 'mobile-stock-header' : ''}`}>
                <h6 className={isMobile ? 'mobile-stock-title' : ''} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                  Stock {index + 1}
                </h6>
              </div>
              {stocks.length > 1 && (
                <div className={`d-flex ${isMobile ? 'justify-content-center' : 'justify-content-end'} mb-2 ${isMobile ? 'mobile-remove-container' : ''}`}>
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeStockField(stock.id)}
                    className={isMobile ? 'mobile-remove-btn' : ''}
                    style={{ 
                      fontSize: isMobile ? '12px' : '14px',
                      padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem'
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <Row>
                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`productId-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Product Name:
                  </Label>
                  <Controller
                    name={`stocks.${index}.productId`}
                    control={control}
                    rules={{ required: "Select Product" }}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        id={`productId-${stock.id}`}
                        defaultOptions={productOptions}
                        loadOptions={loadProductOptions}
                        value={productOptions.find(option => option.value === value) || null}
                        onChange={option => {
                          onChange(option ? option.value : '')
                          handleProductSelect(option, index)
                        }}
                        isClearable
                        className={`${errors?.stocks?.[index]?.productId ? 'is-invalid' : ''} ${isMobile ? 'mobile-select' : ''}`}
                        classNamePrefix="select"
                        isSearchable
                        noOptionsMessage={() => "No products found"}
                        placeholder="Select products"
                        cacheOptions
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                            borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '16px' : '14px',
                            minHeight: isMobile ? '48px' : '38px',
                            width:isMobile ?"300px" :"auto"
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                            color: isDarkTheme ? '#ffffff' : '#000000'
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused 
                              ? (isDarkTheme ? '#4a5568' : '#f7fafc') 
                              : (isDarkTheme ? '#2d3748' : '#ffffff'),
                            color: isDarkTheme ? '#ffffff' : '#000000'
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: isDarkTheme ? '#ffffff' : '#000000'
                          }),
                          input: (base) => ({
                            ...base,
                            color: isDarkTheme ? '#ffffff' : '#000000'
                          })
                        }}
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.productId && (
                    <small className="text-danger">
                      {errors.stocks[index].productId.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`quantity-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Quantity:
                  </Label>
                  <Controller
                    name={`stocks.${index}.quantity`}
                    control={control}
                    rules={{
                      required: "Quantity is required",
                      min: { value: 1, message: "Quantity must be at least 1" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`quantity-${stock.id}`}
                        invalid={!!errors?.stocks?.[index]?.quantity}
                        placeholder="Enter Quantity"
                        type="number"
                        min="1"
                        className={isMobile ? 'mobile-form-control' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '48px' : '38px'
                        }}
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.quantity && (
                    <small className="text-danger">
                      {errors.stocks[index].quantity.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`warehouse-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Warehouse:
                  </Label>
                  <Controller
                    name={`stocks.${index}.warehouse`}
                    control={control}
                    rules={{ required: "Warehouse is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="select"
                        id={`warehouse-${stock.id}`}
                        invalid={!!errors?.stocks?.[index]?.warehouse}
                        className={isMobile ? 'mobile-form-control' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '48px' : '38px'
                        }}
                      >
                        <option value="QAHWA" style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff', color: isDarkTheme ? '#ffffff' : '#000000' }}>QAHWA</option>
                        <option value="ATTARA" style={{ backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff', color: isDarkTheme ? '#ffffff' : '#000000' }}>ATTARA</option>
                      </Input>
                    )}
                  />
                  {errors?.stocks?.[index]?.warehouse && (
                    <small className="text-danger">
                      {errors.stocks[index].warehouse.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`purchaseAmount-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Purchase Amount:
                  </Label>
                  <Controller
                    name={`stocks.${index}.purchaseAmount`}
                    control={control}
                    rules={{ required: "Purchase Amount is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`purchaseAmount-${stock.id}`}
                        invalid={!!errors?.stocks?.[index]?.purchaseAmount}
                        type="number"
                        step="0.01"
                        placeholder="Enter Purchase Amount"
                        className={isMobile ? 'mobile-form-control' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '48px' : '38px'
                        }}
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.purchaseAmount && (
                    <small className="text-danger">
                      {errors.stocks[index].purchaseAmount.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`tax-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Tax:
                  </Label>
                  <Controller
                    name={`stocks.${index}.tax`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`tax-${stock.id}`}
                        type="number"
                        step="0.01"
                        placeholder="Enter Tax Percentage"
                        min="0"
                        className={isMobile ? 'mobile-form-control' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '48px' : '38px'
                        }}
                      />
                    )}
                  />
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`paidAmount-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Total Amount:
                  </Label>
                  <Input
                    id={`paidAmount-${stock.id}`}
                    type="number"
                    step="0.01"
                    value={(() => {
                      const quantity = watchedFields?.[index]?.quantity || 0
                      const purchaseAmount = watchedFields?.[index]?.purchaseAmount || 0
                      const taxPercentage = watchedFields?.[index]?.tax || 0

                      const subtotal = quantity * purchaseAmount
                      const taxAmount = (subtotal * taxPercentage / 100)

                      return subtotal + taxAmount
                    })()}
                    disabled
                    className={isMobile ? 'mobile-form-control' : ''}
                    style={{
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      fontSize: isMobile ? '16px' : '14px',
                      minHeight: isMobile ? '48px' : '38px'
                    }}
                  />
                </Col>

                <Col lg="4" md="6" xs="12" className="mb-1">
                  <Label 
                    className={`form-label ${isMobile ? 'mobile-form-label' : ''}`} 
                    for={`purchaseDate-${stock.id}`}
                    style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                  >
                    Purchase Date:
                  </Label>
                  <Controller
                    name={`stocks.${index}.purchaseDate`}
                    control={control}
                    rules={{ required: "Purchase Date is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`purchaseDate-${stock.id}`}
                        invalid={!!errors?.stocks?.[index]?.purchaseDate}
                        type="date"
                        placeholder="Enter Purchase Date"
                        className={isMobile ? 'mobile-form-control' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '48px' : '38px'
                        }}
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.purchaseDate && (
                    <small className="text-danger">
                      {errors.stocks[index].purchaseDate.message}
                    </small>
                  )}
                </Col>

                {/* <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`expiryDate-${stock.id}`}>
                    Expiry Date:
                  </Label>
                  <Controller
                    name={`stocks.${index}.expiryDate`}
                    control={control}
                    rules={{ 
                      required: "Expiry Date is required",
                      validate: value => {
                        const purchaseDate = watch(`stocks.${index}.purchaseDate`);
                        if (!purchaseDate) return "Please select purchase date first";
                        return new Date(value) > new Date(purchaseDate) || "Expiry date must be after purchase date";
                      }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`expiryDate-${stock.id}`}
                        invalid={!!errors?.stocks?.[index]?.expiryDate}
                        type="date"
                        placeholder="Enter Expiry Date"
                        min={watch(`stocks.${index}.purchaseDate`) || undefined}
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.expiryDate && (
                    <small className="text-danger">
                      {errors.stocks[index].expiryDate.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`supplierName-${stock.id}`}>
                    Supplier Name:
                  </Label>
                  <Controller
                    name={`stocks.${index}.supplierName`}
                    control={control}
                    rules={{ required: "Supplier Name is required" }}
                    render={({ field }) => (
                      <CreatableSelect
                        {...field}
                        id={`supplierName-${stock.id}`}
                        options={suppliers.map(supplier => ({
                          value: supplier._id,
                          label: supplier.supplierName
                        }))}
                        className={`react-select ${errors?.stocks?.[index]?.supplierName ? 'is-invalid' : ''}`}
                        classNamePrefix="select"
                        value={suppliers.find(s => s._id === field.value) ? { value: field.value, label: suppliers.find(s => s._id === field.value).supplierName } : field.value ? { value: field.value, label: field.value } : null}
                        onChange={option => field.onChange(option ? option.value : '')}
                        onCreateOption={handleSupplierCreate}
                        placeholder="Select or create a supplier..."
                        noOptionsMessage={() => suppliersLoading ? "Loading suppliers..." : "No suppliers available"}
                        formatCreateLabel={inputValue => (
                          <div style={{ color: "red" }}>Create "{inputValue}"</div>
                        )}
                        isLoading={suppliersLoading}
                        isClearable
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.supplierName && (
                    <small className="text-danger">
                      {errors.stocks[index].supplierName.message}
                    </small>
                  )}
                </Col> */}
              </Row>
            </div>
          ))}

          <Button
            type="button"
            color="secondary"
            className={`mb-2 ${isMobile ? 'mobile-add-btn' : ''}`}
            onClick={addStockField}
            style={{
              width: isMobile ? '100%' : 'auto',
              fontSize: isMobile ? '16px' : '14px',
              padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
            }}
          >
            Add Another Stock
          </Button>

          <div className={`d-flex ${isMobile ? 'mobile-submit-buttons' : 'justify-content-end'} mt-2`}>
            <Button
              className={isMobile ? 'mobile-submit-btn' : 'me-1'}
              color="primary"
              type="submit"
              disabled={isLoading}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
              }}
            >
              {isLoading ? <Spinner size="sm" /> : "Submit"}
            </Button>
            <Button
              outline
              color="secondary"
              type="reset"
              onClick={handleReset}
              className={isMobile ? 'mobile-reset-btn' : ''}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '16px' : '14px',
                padding: isMobile ? '0.75rem' : '0.375rem 0.75rem'
              }}
            >
              Reset
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
        </div>
      </div>
    </>
  )
}

export default AddNewStock
