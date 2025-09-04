import { useForm, Controller } from "react-hook-form"
import toast from "react-hot-toast"
import { useRef, useState, useEffect } from "react"
import { Plus } from "react-feather"
import Select from 'react-select/async'
import '@styles/react/libs/react-select/_react-select.scss'
import debounce from 'lodash/debounce'

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
import { useNavigate } from "react-router-dom"
import { useCreateBillMutation } from "../../../slices/billApislice"
import { useGetProductsQuery } from "../../../slices/productApiSlice"
import { useGetCentersQuery } from "../../../slices/centersSlice"

const MySwal = withReactContent(Swal)

const AddBill = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([{ id: 1 }])
  const [createBill, { isLoading }] = useCreateBillMutation()
  const [barcode, setBarcode] = useState('')
  const [timer, setTimer] = useState(null)
  const [searchPage, setSearchPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTypeaheadOpen, setIsTypeaheadOpen] = useState(false)
  const [productOptions, setProductOptions] = useState([])
  const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false)
  const [centerState, setCenter] = useState("")
  // Add this state to track selected product names for each item
  const [selectedProductNames, setSelectedProductNames] = useState({})
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [currentTheme, setCurrentTheme] = useState('light')

  const { data: productsData, refetch: refetchProducts } = useGetProductsQuery({
    page: searchPage,
    limit: 10000,
    ...(searchQuery && { keyword: searchQuery }),
    ...(barcode && { barcode: barcode })
  })

  // Get centers data
  const { data: centersData, isLoading: centersLoading, error: centersError } = useGetCentersQuery({
    page: searchPage,
    limit: 100000,
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

  // Debounced search function for when user types
  const debouncedSearch = debounce(async (inputValue) => {
    if (!inputValue) return

    setSearchQuery(inputValue)
    setSearchPage(1)

    const result = await refetchProducts()
    const options = transformProductsToOptions(result.data?.products || [])
    setProductOptions(options)
  }, 300)

  // Immediate load function for dropdown click
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

      // If input has 1 or more characters, search immediately
      if (inputValue.length >= 1) {
        setSearchQuery(inputValue)
        setSearchPage(1)

        const result = await refetchProducts()
        const options = transformProductsToOptions(result.data?.products || [])
        setProductOptions(options)
        return options
      }

      // For empty input, return current options
      return productOptions
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  const loadMoreOptions = async () => {
    if (productsData?.pages > searchPage) {
      try {
        setSearchPage(prev => prev + 1)
        const result = await refetchProducts()
        if (result.data?.products) {
          const newOptions = transformProductsToOptions(result.data.products)
          setProductOptions(prev => [...prev, ...newOptions])
        }
      } catch (error) {
        console.error('Error loading more products:', error)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key.length === 1) {
        setBarcode(prev => prev + e.key)
      }

      if (e.key === 'Enter') {
        if (barcode.length >= 6) {
          handleScannedBarcode(barcode)
        }
        setBarcode('')
        return
      }

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
        const itemExists = items.find(item =>
          watch(`items.${items.indexOf(item)}.productId`) === product._id
        )

        if (itemExists) {
          const itemIndex = items.indexOf(itemExists)
          const currentQty = watch(`items.${itemIndex}.quantity`) || 1
          setValue(`items.${itemIndex}.quantity`, currentQty + 1)

          const price = watch(`items.${itemIndex}.sellingPrice`)
          const vat = watch(`items.${itemIndex}.vatPercentage`)
          const newTotal = (currentQty + 1) * price
          setValue(`items.${itemIndex}.total`, newTotal)
          calculateTotalAmount()
          toast.success('Product quantity incremented')
        } else {
          const newItem = { id: items.length + 1 }
          setItems(prev => [...prev, newItem])
          const newIndex = items.length

          setValue(`items.${newIndex}.productId`, product._id)
          setValue(`items.${newIndex}.quantity`, 1)
          setValue(`items.${newIndex}.unit`, product.unit)
          setValue(`items.${newIndex}.sellingPrice`, product.price)
          setValue(`items.${newIndex}.vatPercentage`, product.vatPercentage)
          setValue(`items.${newIndex}.total`, product.price)
          calculateTotalAmount()
          toast.success('Product added to bill')
        }
      } else {
        toast.error('Product not found')
      }
      setBarcode('')
    } catch (error) {
      toast.error('Error fetching product')
      setBarcode('')
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
      items: [{
        productId: "",
        quantity: "",
        unit: "",
        sellingPrice: "",
        vatPercentage: "",
        total: 0,
      }],
      totalAmount: 0,
      offPercentage: 0,
      totalVAT: 0,
      customerName: "",
      date: new Date().toISOString().split('T')[0],
      centerId: ""
    },
  })

  // Calculate total amount including VAT and discount
  const calculateTotalAmount = () => {
    let subtotal = 0
    let totalVAT = 0

    watchItems.forEach((item) => {
      if (item.quantity && item.sellingPrice) {
        const quantity = parseFloat(item.quantity)
        const price = parseFloat(item.sellingPrice)
        const vat = parseFloat(item.vatPercentage || 0)

        const itemTotal = quantity * price
        const itemVAT = (itemTotal * vat) / 100

        subtotal += itemTotal
        totalVAT += itemVAT
      }
    })

    // Apply discount
    const discount = parseFloat(watchOffPercentage || 0)
    const discountAmount = (subtotal * discount) / 100
    const finalAmount = subtotal - discountAmount

    // Adjust VAT after discount
    const vatAdjustment = (totalVAT * discount) / 100
    const finalVAT = totalVAT - vatAdjustment

    setValue("totalAmount", finalAmount)
    setValue("totalVAT", finalVAT)
  }

  // Watch for changes in items and discount
  const watchItems = watch("items")
  const watchOffPercentage = watch("offPercentage")

  // Recalculate totals when items or discount changes
  useEffect(() => {
    calculateTotalAmount()
  }, [watchItems, watchOffPercentage])

  const onSubmit = async (formData) => {
    try {
      const billToSubmit = {
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unit: item.unit,
          sellingPrice: parseFloat(item.sellingPrice),
          vatPercentage: parseFloat(item.vatPercentage),
          total: parseFloat(item.total),
        })),
        totalAmount: parseFloat(formData.totalAmount),
        offPercentage: parseFloat(formData.offPercentage || 0),
        totalVAT: parseFloat(formData.totalVAT),
        customerName: formData.customerName,
        date: formData.date,
        centerId: centerState
      }


      console.log("bill", billToSubmit)

      await createBill(billToSubmit).unwrap()
      toast.success("Bill created successfully")
      handleReset()
      setItems([{ id: 1 }])
      navigate("/apps/bills")
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create bill")
    }
  }

  const handleReset = () => {
    reset({
      items: [{
        productId: "",
        quantity: "",
        unit: "",
        sellingPrice: "",
        vatPercentage: "",
        total: 0,
      }],
      totalAmount: 0,
      offPercentage: 0,
      totalVAT: 0,
      customerName: "",
      date: new Date().toISOString().split('T')[0],
      centerId: ""
    })
    setCenter("")
  }

  const addItemField = () => {
    setItems([...items, { id: items.length + 1 }])
  }

  const removeItemField = (id) => {
    const itemIndex = items.findIndex(item => item.id === id)
    setItems(items.filter((item) => item.id !== id))

    // Clear the selected product name for this item
    setSelectedProductNames(prev => {
      const newState = { ...prev }
      delete newState[itemIndex]
      return newState
    })
  }

  // Handle product selection to auto-fill unit and price
  const handleProductSelect = (selectedOption, index) => {
    if (selectedOption?.product) {
      const product = selectedOption.product

      // Store the product name for this item
      setSelectedProductNames(prev => ({
        ...prev,
        [index]: selectedOption.label
      }))

      const itemExists = items.find((item, idx) =>
        idx !== index && watch(`items.${idx}.productId`) === product._id
      )

      if (itemExists) {
        const itemIndex = items.indexOf(itemExists)
        const currentQty = watch(`items.${itemIndex}.quantity`) || 1
        setValue(`items.${itemIndex}.quantity`, currentQty + 1)

        const price = watch(`items.${itemIndex}.sellingPrice`)
        const vat = watch(`items.${itemIndex}.vatPercentage`)
        const newTotal = (currentQty + 1) * price
        setValue(`items.${itemIndex}.total`, newTotal)
        calculateTotalAmount()

        removeItemField(items[index].id)
        toast.success('Product quantity incremented')
      } else {
        setValue(`items.${index}.productId`, product._id)
        setValue(`items.${index}.quantity`, 1)
        setValue(`items.${index}.unit`, product.unit)
        setValue(`items.${index}.sellingPrice`, product.price)
        setValue(`items.${index}.vatPercentage`, product.vatPercentage || 0)
        setValue(`items.${index}.total`, product.price)
        calculateTotalAmount()
        toast.success('Product added to bill')
      }
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
            .addbill-application {
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
              height: calc(100vh - 120px) !important;
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
            .mobile-item-card {
              padding: 0.75rem !important;
              margin-bottom: 0.75rem !important;
              border-radius: 8px !important;
            }
            .mobile-item-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              margin-bottom: 0.5rem !important;
            }
            .mobile-item-title {
              font-size: 14px !important;
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
              className={isMobile ? 'mobile-card-header' : 'd-flex justify-content-between align-items-center'}
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
                Create New Bill
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
          <Row className="mb-2">
            <Col lg="3" md="6" className={isMobile ? 'col-12' : ''}>
              <Label className="form-label" for="customerName" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Customer Name:
              </Label>
              <Controller
                name="customerName"
                control={control}
                rules={{ required: "Customer Name is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="customerName"
                    placeholder="Enter Customer Name"
                    invalid={!!errors?.customerName}
                    className={isMobile ? 'mobile-form-input' : ''}
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                )}
              />
              {errors?.customerName && (
                <small className="text-danger">{errors.customerName.message}</small>
              )}
            </Col>
            <Col lg="2" md="6" className={isMobile ? 'col-12' : ''}>
              <Label className="form-label" for="date" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Date:
              </Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    id="date"
                    invalid={!!errors?.date}
                    className={isMobile ? 'mobile-form-input' : ''}
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                )}
              />
            </Col>
            <Col lg="3" md="6" className={isMobile ? 'col-12' : ''}>
              <Label className="form-label" for="centerId" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Center:
              </Label>
              <Input
                type="select"
                id="centerId"
                value={centerState}
                onChange={(e) => setCenter(e.target.value)}
                required
                invalid={!!errors?.centerState}
                className={isMobile ? 'mobile-form-input' : ''}
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
                ) : centersData?.data?.map(center => (
                  <option key={center._id} value={center._id}>
                    {center.centerName}
                  </option>
                ))}
              </Input>
            </Col>

            <Col lg="2" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
              <Label className="form-label" for="offPercentage" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Discount %:
              </Label>
              <Controller
                name="offPercentage"
                control={control}
                rules={{
                  min: { value: 0, message: "Discount must be positive" },
                  max: { value: 100, message: "Discount cannot exceed 100%" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="offPercentage"
                    type="number"
                    step="0.01"
                    invalid={!!errors?.offPercentage}
                    placeholder="Enter Discount %"
                    className={isMobile ? 'mobile-form-input' : ''}
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                    onChange={(e) => {
                      field.onChange(e)
                      calculateTotalAmount()
                    }}
                  />
                )}
              />
              {errors?.offPercentage && (
                <small className="text-danger">{errors.offPercentage.message}</small>
              )}
            </Col>

            <Col lg="2" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
              <Label className="form-label" for="totalAmount" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                Total Amount:
              </Label>
              <Controller
                name="totalAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    disabled
                    className={isMobile ? 'mobile-form-input' : ''}
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                )}
              />
            </Col>
          </Row>
          {/* <Row className="mt-2">
            <Col lg="2" md="6" className="mb-1">
              <Label className="form-label" for="offPercentage">
                Discount %:
              </Label>
              <Controller
                name="offPercentage"
                control={control}
                rules={{
                  min: { value: 0, message: "Discount must be positive" },
                  max: { value: 100, message: "Discount cannot exceed 100%" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="offPercentage"
                    type="number"
                    step="0.01"
                    invalid={!!errors?.offPercentage}
                    placeholder="Enter Discount %"
                    onChange={(e) => {
                      field.onChange(e);
                      calculateTotalAmount();
                    }}
                  />
                )}
              />
              {errors?.offPercentage && (
                <small className="text-danger">{errors.offPercentage.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for="totalVAT">
                Total VAT:
              </Label>
              <Controller
                name="totalVAT"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="totalVAT"
                    type="number"
                    step="0.01"
                    disabled
                  />
                )}
              />
            </Col>

            <Col lg="2" md="6" className="mb-1">
              <Label className="form-label" for="totalAmount">
                Total Amount:
              </Label>
              <Controller
                name="totalAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    disabled
                  />
                )}
              />
            </Col>
          </Row> */}


          {items?.map((item, index) => (
            <div 
              key={item.id} 
              className={`border rounded p-2 mb-2 ${isMobile ? 'mobile-item-card' : ''}`}
              style={{
                backgroundColor: isDarkTheme ? '#23263a' : '#ffffff',
                border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
              <div className={`d-flex justify-content-between mb-1 ${isMobile ? 'mobile-item-header' : ''}`}>
                <h6 className={isMobile ? 'mobile-item-title' : ''} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                  Item {index + 1}
                </h6>
              </div>
              {items.length > 1 && (
                <div className={`d-flex ${isMobile ? 'justify-content-center' : 'justify-content-end'} mb-2 ${isMobile ? 'mobile-remove-container' : ''}`}>
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeItemField(item.id)}
                    className={isMobile ? 'mobile-remove-btn' : ''}
                    style={{
                      fontSize: isMobile ? '12px' : '12px',
                      padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
                      width: isMobile ? '200px' : 'auto'
                    }}
                  >
                    {isMobile ? 'Del' : 'Remove'}
                  </Button>
                </div>
              )}
              <Row>
                <Col lg="3" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
                  <Label className="form-label" for={`productId-${item.id}`} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                    Product:
                  </Label>
                  <Controller
                    name={`items.${index}.productId`}
                    control={control}
                    rules={{ required: "Product is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id={`productId-${item.id}`}
                        defaultOptions={productOptions}
                        loadOptions={loadProductOptions}
                        value={selectedProductNames[index] ?
                          { value: field.value, label: selectedProductNames[index] } :
                          productOptions.find(option => option.value === field.value) || null
                        }
                        onChange={(option) => {
                          field.onChange(option ? option.value : '')
                          handleProductSelect(option, index)
                        }}
                        onMenuScrollToBottom={loadMoreOptions}
                        isClearable
                        className={errors?.items?.[index]?.productId ? 'is-invalid' : ''}
                        classNamePrefix="select"
                        isSearchable
                        noOptionsMessage={() => "No products found"}
                        placeholder="Select product"
                      />
                    )}
                  />
                  {errors?.items?.[index]?.productId && (
                    <small className="text-danger">
                      {errors.items[index].productId.message}
                    </small>
                  )}
                </Col>

                <Col lg="2" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
                  <Label className="form-label" for={`quantity-${item.id}`} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                    Quantity:
                  </Label>
  <Controller
    name={`items.${index}.quantity`}
    control={control}
    rules={{
      required: "Quantity is required",
      min: { value: 0.1, message: "Quantity must be at least 0.1" },
      pattern: {
        value: /^\d+(\.\d{1,2})?$/, // optional: allows up to 2 decimal places
        message: "Enter a valid quantity"
      }
    }}
    render={({ field }) => (
                            <Input
                        {...field}
                        id={`quantity-${item.id}`}
                        type="number"
                        min="0.1"
                        step="0.1" // ✅ Enables decimal input in browser
                        invalid={!!errors?.items?.[index]?.quantity}
                        placeholder="Quantity"
                        className={isMobile ? 'mobile-form-input' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                          fontSize: isMobile ? '16px' : '14px'
                        }}
                        onChange={(e) => {
                          field.onChange(e)
                          const quantity = parseFloat(e.target.value) || 0
                          const price = parseFloat(watch(`items.${index}.sellingPrice`)) || 0
                          const newTotal = quantity * price
                          setValue(`items.${index}.total`, newTotal.toFixed(2)) // optional: round total to 2 decimals
                          calculateTotalAmount()
                        }}
                      />
    )}
  />
  {errors?.items?.[index]?.quantity && (
    <small className="text-danger">
      {errors.items[index].quantity.message}
    </small>
  )}
</Col>


                <Col lg="2" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
                  <Label className="form-label" for={`unit-${item.id}`} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                    Unit:
                  </Label>
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    rules={{ required: "Unit is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`unit-${item.id}`}
                        invalid={!!errors?.items?.[index]?.unit}
                        placeholder="Unit"
                        disabled
                        className={isMobile ? 'mobile-form-input' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                          fontSize: isMobile ? '16px' : '14px'
                        }}
                      />
                    )}
                  />
                </Col>

                <Col lg="2" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
                  <Label className="form-label" for={`sellingPrice-${item.id}`} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                    Selling Price:
                  </Label>
                  <Controller
                    name={`items.${index}.sellingPrice`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`sellingPrice-${item.id}`}
                        type="number"
                        step="0.01"
                        invalid={!!errors?.items?.[index]?.sellingPrice}
                        placeholder="Enter Price"
                        className={isMobile ? 'mobile-form-input' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                          fontSize: isMobile ? '16px' : '14px'
                        }}
                        onChange={(e) => {
                          field.onChange(e)
                          const price = parseFloat(e.target.value) || 0
                          const quantity = watch(`items.${index}.quantity`) || 0
                          const newTotal = quantity * price
                          setValue(`items.${index}.total`, newTotal)
                          calculateTotalAmount()
                        }}
                      />
                    )}
                  />
                </Col>

                {/* <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`vatPercentage-${item.id}`}>
                    VAT %:
                  </Label>
                  <Controller
                    name={`items.${index}.vatPercentage`}
                    control={control}
                    rules={{
                      required: "VAT Percentage is required",
                      min: { value: 0, message: "VAT must be positive" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`vatPercentage-${item.id}`}
                        type="number"
                        step="0.01"
                        invalid={!!errors?.items?.[index]?.vatPercentage}
                        placeholder="15"
                        disabled
                      />
                    )}
                  />
                </Col> */}
                <Col lg="3" md="6" className={`mb-1 ${isMobile ? 'col-12' : ''}`}>
                  <Label className="form-label" for={`total-${item.id}`} style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                    Total:
                  </Label>
                  <Controller
                    name={`items.${index}.total`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`total-${item.id}`}
                        type="number"
                        step="0.01"
                        disabled
                        className={isMobile ? 'mobile-form-input' : ''}
                        style={{
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                          fontSize: isMobile ? '16px' : '14px'
                        }}
                      />
                    )}
                  />
                </Col>
              </Row>
            </div>
          ))}

          <Button
            type="button"
            color="secondary"
            className={`mb-2 ${isMobile ? 'mobile-button' : ''}`}
            onClick={addItemField}
            style={{
              width: isMobile ? '100%' : 'auto',
              fontSize: isMobile ? '14px' : '14px',
              padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
            }}
          >
            <Plus size={isMobile ? 14 : 16} className="me-1" />
            Add Another Item
          </Button>

          {/* Submit and Reset Buttons */}
          <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-end'} mt-2`}>
            <Button
              className={isMobile ? 'mobile-button' : 'me-1'}
              color="primary"
              type="submit"
              disabled={isLoading}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '14px' : '14px',
                padding: isMobile ? '0.5rem' : '0.375rem 0.75rem',
                marginBottom: isMobile ? '0.5rem' : '0'
              }}
            >
              {isLoading ? <Spinner size="sm" /> : "Create Bill"}
            </Button>
            <Button
              outline
              color="secondary"
              type="reset"
              onClick={handleReset}
              className={isMobile ? 'mobile-button' : ''}
              style={{
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '14px' : '14px',
                padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
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

export default AddBill