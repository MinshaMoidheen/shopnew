import {
  useState,
  Fragment,
} from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import "animate.css/animate.css"
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss"
import ReactPaginate from "react-paginate"
import { ChevronDown, Trash, Edit, Eye } from "react-feather"
import DataTable from "react-data-table-component"
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Input,
  Label,
  Row,
  Col,
  Button,
  Spinner,
} from "reactstrap"
import toast from "react-hot-toast"
import { useGetCentersQuery } from "../../slices/centersSlice"
import { useGenerateReportMutation } from "../../slices/reportApiSlice"
import { useGetProductsQuery } from "../../slices/productApiSlice"
import { useGetAllSuppliersQuery } from "../../slices/supplierSLice"
import { BASE_URL, REPORT_URL } from "../../constants"
const MySwal = withReactContent(Swal)



const ReportPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    module: "",
    format: "excel", // Default format
    center: "",
    product: "",
    supplier: ""
  })
  const [formErrors, setFormErrors] = useState({})

  const {
    data: centersData = [],
    isLoading: centersLoading,
    isError: centersError,
    refetch,
  } = useGetCentersQuery({
    page: 1,
    limit: 1000,
    forSelection: true,
  })
  const centers = centersData?.data || []


  const {
    data: productsData = [],

  } = useGetProductsQuery({
    page: 1,
    limit: 10000,
  })

  console.log("productsData", productsData)


  const {
    data: suppliersData = [],

  } = useGetAllSuppliersQuery({
    page: 1,
    limit: 0,
  })




  const [generateReport, { isLoading: reportLoading }] = useGenerateReportMutation()

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }))
  }

  const handleReset = () => {
    setFormData({
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
      module: "",
      format: "excel", // Reset to default format
      center: "",
      product: "",
      supplier: ""
    })
    setFormErrors({})
  }

  const handleGenerateReport = async () => {
    // Validate form
    const errors = {}
    if (!formData.module) {
      errors.module = "Report Type is required"
    }
    if (!formData.fromDate) {
      errors.fromDate = "From Date is required"
    }
    if (!formData.toDate) {
      errors.toDate = "To Date is required"
    }
    if (!formData.format) {
      errors.format = "Format is required"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }


    console.log("formData", formData)
    console.log("Making request to:", `${BASE_URL}${REPORT_URL}`)

    try {
      const response = await generateReport({
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        module: formData.module,
        format: formData.format,
        center: formData.center,
        product: formData.product,
        supplier: formData.supplier
      }).unwrap()

      if (response) {
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response]))
        const link = document.createElement('a')
        link.href = url
        const fileExtension = formData.format === 'pdf' ? 'pdf' : 'xlsx'
        link.setAttribute('download', `${formData.module}_${formData.fromDate.split('-').reverse().join('-')}_${formData.toDate.split('-').reverse().join('-')}.${fileExtension}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        toast.success("Report generated successfully!")
      }
    } catch (error) {
      console.error('Error generating report:', error)

      // Try to parse the error message from the response
      let errorMessage = "Failed to generate report"

      if (error?.data) {
        try {
          const errorData = JSON.parse(error.data)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If parsing fails, use the raw error data
          errorMessage = error.data || errorMessage
        }
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Reports</CardTitle>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md="4" className="mb-1">
              <Label>From Date:</Label>
              <Input
                placeholder="Enter From Date"
                name="fromDate"
                type="date"
                value={formData.fromDate}
                onChange={handleChange}
                className={formErrors.fromDate ? "is-invalid" : ""}
              />
              {formErrors.fromDate && (
                <small className="text-danger">{formErrors.fromDate}</small>
              )}
            </Col>

            <Col md="4" className="mb-1">
              <Label>To Date:</Label>
              <Input
                placeholder="Enter To Date"
                name="toDate"
                type="date"
                value={formData.toDate}
                onChange={handleChange}
                className={formErrors.toDate ? "is-invalid" : ""}
              />
              {formErrors.toDate && (
                <small className="text-danger">{formErrors.toDate}</small>
              )}
            </Col>

            <Col md="4" className="mb-1">
              <Label>Module:</Label>
              <Input

                name="module"
                type="select"
                value={formData.module}
                onChange={handleChange}
                className={formErrors.module ? "is-invalid" : ""}
              >
                <option value="">Select Module</option>
                <option value="bill">Bills</option>
                <option value="stock">Stock</option>
                <option value="daily-expense">Sales & Expense</option>
                <option value="supplier">Suppliers</option>
                <option value="supplier-transactions">Supplier Transactions</option>
                <option value="productstock">Product Stock</option>
                
              </Input>
              {formErrors.module && (
                <small className="text-danger">{formErrors.module}</small>
              )}
            </Col>

            <Col md="3" sm="12" className="mb-1">
              <Label for="center">Center</Label>
              <Input
                type="select"
                id="center"
                name="center"
                value={formData.center}
                onChange={handleChange}
                required
                disabled={formData.module !== "bill" && formData.module !== "daily-expense" && formData.module !== "productstock"}
              >
                <option value="">Select Center</option>
                {centersLoading ? (
                  <option>Loading centers...</option>
                ) : centersError ? (
                  <option>No centers available or access denied</option>
                ) : centers && centers.length > 0 ? (
                  centers.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.centerName}
                    </option>
                  ))
                ) : (
                  <option>No centers found</option>
                )}
              </Input>
            </Col>

            <Col md="3" sm="12" className="mb-1">
              <Label for="product">Product</Label>
              <Input
                type="select"
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
                required
                disabled={formData.module !== "stock"  && formData.module !== "productstock"}
              >
                <option value="">Select Product</option>
                {(
                  productsData?.products?.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))
                )}
              </Input>
            </Col>

            <Col md="3" sm="12" className="mb-1">
              <Label for="supplier">Suppliers</Label>
              <Input
                type="select"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                disabled={formData.module !== "supplier-transactions"}

              >
                <option value="">Select supplier</option>
                {(
                  suppliersData?.data?.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierName}
                    </option>
                  ))
                )}
              </Input>
            </Col>

            <Col md="6" sm="12" className="mb-1">
              <Label>Format:</Label>
              <div className="d-flex gap-4">
                <div className="form-check">
                  <Input
                    type="radio"
                    name="format"
                    id="format-excel"
                    value="excel"
                    checked={formData.format === "excel"}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <Label className="form-check-label" for="format-excel">
                    Excel (.xlsx)
                  </Label>
                </div>
                <div className="form-check">
                  <Input
                    type="radio"
                    name="format"
                    id="format-pdf"
                    value="pdf"
                    checked={formData.format === "pdf"}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <Label className="form-check-label" for="format-pdf">
                    PDF (.pdf)
                  </Label>
                </div>
              </div>
              {formErrors.format && (
                <small className="text-danger">{formErrors.format}</small>
              )}
            </Col>

            <Col lg="12" className="mt-2">
              <Button
                color="primary"
                onClick={handleGenerateReport}
                className="me-1"
                disabled={reportLoading}
              >
                {reportLoading ? (
                  <>
                    <Spinner size="sm" className="me-1" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
              <Button color="secondary" onClick={handleReset}>
                Reset
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default ReportPage
