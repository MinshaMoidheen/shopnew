import React from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Row,
  Col,
  Spinner,
  Badge,
} from "reactstrap"
import { useNavigate, useParams } from "react-router-dom"
import { useGetShopByIdQuery } from "../../../slices/shopApiSlice"
import { ArrowLeft, Edit, Trash } from "react-feather"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { useDeleteShopMutation } from "../../../slices/shopApiSlice"
import toast from "react-hot-toast"

const MySwal = withReactContent(Swal)

const ViewShop = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: shopData, isLoading } = useGetShopByIdQuery(id)
  const [deleteShop] = useDeleteShopMutation()
  
  const shop = shopData // Access data directly, not from shopData.shop

  // Check if this is a dummy data ID (numeric string)
  const isDummyData = id && /^\d+$/.test(id)

  const handleDeleteClick = async () => {
    MySwal.fire({
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteShop(id).unwrap()
          toast.success("Shop deleted successfully!")
          navigate("/apps/shops")
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete shop.")
        }
      }
    })
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
      </div>
    )
  }

  if (!shop && !isLoading) {
    return (
      <div className="container">
        <Card>
          <CardBody>
            <div className="text-center py-5">
              <h4>Shop not found</h4>
              <p className="text-muted">
                {isDummyData 
                  ? "This is dummy data for demonstration purposes. Please add real shops to test the view functionality." 
                  : "The shop you're looking for doesn't exist."
                }
              </p>
              <Button color="primary" onClick={() => navigate("/apps/shops")}>
                Back to Shops
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <CardTitle tag="h4">Shop Details</CardTitle>
            <div className="d-flex gap-2">
              <Button
                color="secondary"
                size="sm"
                onClick={() => navigate("/apps/shops")}
              >
                <ArrowLeft size={15} className="me-1" />
                Back
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => navigate(`/apps/shops/edit/${id}`)}
              >
                <Edit size={15} className="me-1" />
                Edit
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteClick}
              >
                <Trash size={15} className="me-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md="6">
              <div className="mb-3">
                <h6 className="text-muted">Shop Name</h6>
                <p className="fw-bold">{shop.name}</p>
              </div>
            </Col>
            <Col md="6">
              <div className="mb-3">
                <h6 className="text-muted">Location</h6>
                <p className="fw-bold">{shop.location}</p>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md="6">
              <div className="mb-3">
                <h6 className="text-muted">Total Price</h6>
                <p className="fw-bold text-success">${shop.totalPrice ? shop.totalPrice.toFixed(2) : '0.00'}</p>
              </div>
            </Col>
            <Col md="6">
              <div className="mb-3">
                <h6 className="text-muted">Products Count</h6>
                <Badge color="info" pill>
                  {shop.products ? shop.products.length : 0} products
                </Badge>
              </div>
            </Col>
          </Row>

          {shop.products && shop.products.length > 0 && (
            <Row>
              <Col md="12">
                <div className="mb-3">
                  <h6 className="text-muted">Products</h6>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shop.products.map((product, index) => (
                          <tr key={product._id || product.id || index}>
                            <td>{product.name}</td>
                            <td>${product.price ? product.price.toFixed(2) : '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default ViewShop
