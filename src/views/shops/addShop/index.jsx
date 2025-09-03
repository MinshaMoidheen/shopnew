import React, { useState } from "react"
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
import { useNavigate } from "react-router-dom"
import { useCreateShopMutation } from "../../../slices/shopApiSlice"
import { useGetProductsQuery } from "../../../slices/productApiSlice"
import toast from "react-hot-toast"
import CreatableSelect from "react-select/creatable"
import "@styles/react/libs/react-select/_react-select.scss"

const AddShop = () => {
  const navigate = useNavigate()
  const [createShop, { isLoading }] = useCreateShopMutation()
  const { data: productsData } = useGetProductsQuery({ page: 1, limit: 1000 })
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    products: [],
    totalPrice: 0,
  })

  const products = productsData?.products || []

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProductChange = (selectedOptions) => {
    const selectedProducts = selectedOptions || []
    const totalPrice = selectedProducts.reduce((sum, product) => {
      return sum + (product.price || 0)
    }, 0)
    
    setFormData(prev => ({
      ...prev,
      products: selectedProducts,
      totalPrice: totalPrice
    }))
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
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Add New Shop</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md="6">
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
              <Col md="6">
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

            <Row>
              <Col md="12">
                <FormGroup>
                  <Label for="products">Products</Label>
                  <CreatableSelect
                    isMulti
                    options={products.map(product => ({
                      value: product._id,
                      label: `${product.name} - $${product.price || 0}`,
                      price: product.price || 0,
                      name: product.name
                    }))}
                    value={formData.products}
                    onChange={handleProductChange}
                    placeholder="Select products for this shop"
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="totalPrice">Total Price</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => handleInputChange("totalPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    readOnly
                  />
                </FormGroup>
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-3">
              <Button
                color="primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : "Save Shop"}
              </Button>
              <Button
                color="secondary"
                type="button"
                onClick={handleCancel}
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
