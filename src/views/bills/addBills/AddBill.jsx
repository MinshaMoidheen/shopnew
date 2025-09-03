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
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Create New Bill</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-2">
            <Col lg="3" md="6">
              <Label className="form-label" for="customerName">
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
                  />
                )}
              />
              {errors?.customerName && (
                <small className="text-danger">{errors.customerName.message}</small>
              )}
            </Col>
            <Col lg="2" md="6">
              <Label className="form-label" for="date">
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
                  />
                )}
              />
            </Col>
            <Col lg="3" md="6">
              <Label className="form-label" for="centerId">
                Center:
              </Label>
              <Input
                type="select"
                id="centerId"
                value={centerState}
                onChange={(e) => setCenter(e.target.value)}
                required
                invalid={!!errors?.centerState}
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
            <div key={item.id} className="border rounded p-2 mb-2">
              <div className="d-flex justify-content-between mb-1">
                <h6>Item {index + 1}</h6>
                {items.length > 1 && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeItemField(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Row>
                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`productId-${item.id}`}>
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

                <Col lg="2" md="6" className="mb-1">
  <Label className="form-label" for={`quantity-${item.id}`}>
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


                <Col lg="2" md="6" className="mb-1">
                  <Label className="form-label" for={`unit-${item.id}`}>
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
                      />
                    )}
                  />
                </Col>

                <Col lg="2" md="6" className="mb-1">
                  <Label className="form-label" for={`sellingPrice-${item.id}`}>
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
                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`total-${item.id}`}>
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
            className="mb-2"
            onClick={addItemField}
          >
            Add Another Item
          </Button>


          {/* Submit and Reset Buttons */}
          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : "Create Bill"}
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

export default AddBill