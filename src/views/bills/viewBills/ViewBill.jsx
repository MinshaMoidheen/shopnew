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
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Bill Details</CardTitle>
        <div className="d-flex gap-2">
          {!isEditing && (
            <Button color="warning" onClick={handleEditClick}>
              Edit Bill
            </Button>
          )}
          <Button color="secondary" onClick={() => navigate("/apps/bills")}>
            Back to Bills
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <Row className="mb-2">
          <Col lg="4" md="6">
            <Label className="form-label">Customer Name:</Label>
            {isEditing ? (
              <Input
                value={editFormData.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
              />
            ) : (
              <Input value={billData?.customerName || ''} disabled />
            )}
          </Col>
          <Col lg="4" md="6">
            <Label className="form-label">Date:</Label>
            {isEditing ? (
              <Input
                type="date"
                value={editFormData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
              />
            ) : (
              <Input value={billData?.date ? new Date(billData.date).toLocaleDateString() : ''} disabled />
            )}
          </Col>
          <Col lg="4" md="6">
            <Label className="form-label">Center:</Label>
            <Input value={getCenterName(billData?.centerId?.centerName) || ''} disabled />
          </Col>
        </Row>

        <Row className="mb-2">
          <Col lg="4" md="6">
            <Label className="form-label">Discount %:</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={editFormData.offPercentage}
                onChange={(e) => handleFormChange('offPercentage', e.target.value)}
              />
            ) : (
              <Input value={billData?.offPercentage || 0} disabled />
            )}
          </Col>
          {/* <Col lg="4" md="6">
            <Label className="form-label">Total VAT:</Label>
            <Input value={billData?.totalVAT || 0} disabled />
          </Col> */}
          <Col lg="4" md="6">
            <Label className="form-label">Total Amount:</Label>
            <Input value={billData?.totalAmount || 0} disabled />
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5>Bill Items</h5>
        </div>

        <Table bordered responsive className="mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Selling Price</th>
              {/* <th>Total</th> */}
              {isEditing && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(isEditing ? editFormData.items : billData?.items)?.map((item, index) => (
              <tr key={isEditing ? `edit-${item.id || index}-${item.productId || 'new'}` : `view-${index}-${item.productId || 'item'}`}>
                <td>
                  {index + 1}
                </td>
                <td>
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
                <td>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                    />
                  ) : (
                    item.quantity || 0
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <Input
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    />
                  ) : (
                    item.unit || ''
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                      min="0"
                    />
                  ) : (
                    item.sellingPrice || 0
                  )}
                </td>
                {/* <td>{item.total || 0}</td> */}
                {isEditing && (
                  <td>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>

        {isEditing && (
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button
              color="primary"
              size="sm"
              onClick={addItem}
              disabled={isSubmitting}
            >
              Add Item
            </Button>
            <Button
              color="secondary"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ViewBill 