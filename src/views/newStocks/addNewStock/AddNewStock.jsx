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
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Add New Stock</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {stocks.map((stock, index) => (
            <div key={stock.id} className="border rounded p-2 mb-2">
              <div className="d-flex justify-content-between mb-1">
                <h6>Stock {index + 1}</h6>
                {stocks.length > 1 && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeStockField(stock.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Row>
                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`productId-${stock.id}`}>
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
                        className={errors?.stocks?.[index]?.productId ? 'is-invalid' : ''}
                        classNamePrefix="select"
                        isSearchable
                        noOptionsMessage={() => "No products found"}
                        placeholder="Select products"
                        cacheOptions
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.productId && (
                    <small className="text-danger">
                      {errors.stocks[index].productId.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`quantity-${stock.id}`}>
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
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.quantity && (
                    <small className="text-danger">
                      {errors.stocks[index].quantity.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`warehouse-${stock.id}`}>
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
                      >
                        <option value="QAHWA">QAHWA</option>
                        <option value="ATTARA">ATTARA</option>
                      </Input>
                    )}
                  />
                  {errors?.stocks?.[index]?.warehouse && (
                    <small className="text-danger">
                      {errors.stocks[index].warehouse.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`purchaseAmount-${stock.id}`}>
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
                      />
                    )}
                  />
                  {errors?.stocks?.[index]?.purchaseAmount && (
                    <small className="text-danger">
                      {errors.stocks[index].purchaseAmount.message}
                    </small>
                  )}
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`tax-${stock.id}`}>
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
                      />
                    )}
                  />
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`paidAmount-${stock.id}`}>
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
                  />
                </Col>

                <Col lg="4" md="6" className="mb-1">
                  <Label className="form-label" for={`purchaseDate-${stock.id}`}>
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
            className="mb-2"
            onClick={addStockField}
          >
            Add Another Stock
          </Button>

          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : "Submit"}
            </Button>
            <Button
              outline
              color="secondary"
              type="reset"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default AddNewStock
