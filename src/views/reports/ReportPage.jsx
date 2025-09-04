import {
  useState,
  Fragment,
  useEffect,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [currentTheme, setCurrentTheme] = useState('light')

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

  // Get theme from localStorage
  const getThemeFromStorage = () => {
    const skin = localStorage.getItem('skin');
    if (skin?.toLowerCase()?.includes('dark')) {
      return 'dark';
    }
    return 'light';
  };

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

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            .reports-application {
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
            .mobile-card-header .d-flex {
              min-height: 40px !important;
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
            .mobile-form-section {
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .mobile-form-input {
              width: 100% !important;
              margin-bottom: 0.5rem !important;
              font-size: 16px !important;
            }
            .mobile-button {
              width: auto !important;
              min-width: 80px !important;
              max-width: 100px !important;
              font-size: 14px !important;
              padding: 0.5rem !important;
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
            left: isMobile ? '20px' : undefined,
            right: isMobile ? '20px' : undefined,
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
              top: isMobile ? '100px' : undefined,
              left: isMobile ? '0' : undefined,
              right: isMobile ? '0' : undefined,
              bottom: isMobile ? '0' : undefined
            }}
          >
            <CardHeader 
              className={isMobile ? 'mobile-card-header' : ''}
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
                Reports
              </CardTitle>
        </CardHeader>
            <CardBody 
              className={isMobile ? 'mobile-card-body' : ''}
              style={{
                backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#000000'
              }}
            >
              <div className="mobile-form-section">
                <Row>
                  <Col md="4" sm="12" className="mb-1">
                    <Label style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>From Date:</Label>
                    <Input
                      placeholder="Enter From Date"
                      name="fromDate"
                      type="date"
                      value={formData.fromDate}
                      onChange={handleChange}
                      className={`${formErrors.fromDate ? "is-invalid" : ""} mobile-form-input`}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                    {formErrors.fromDate && (
                      <small className="text-danger" style={{ fontSize: isMobile ? '12px' : '14px' }}>{formErrors.fromDate}</small>
                    )}
                  </Col>

                  <Col md="4" sm="12" className="mb-1">
                    <Label style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>To Date:</Label>
                    <Input
                      placeholder="Enter To Date"
                      name="toDate"
                      type="date"
                      value={formData.toDate}
                      onChange={handleChange}
                      className={`${formErrors.toDate ? "is-invalid" : ""} mobile-form-input`}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
                    />
                    {formErrors.toDate && (
                      <small className="text-danger" style={{ fontSize: isMobile ? '12px' : '14px' }}>{formErrors.toDate}</small>
                    )}
                  </Col>

                  <Col md="4" sm="12" className="mb-1">
                    <Label style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>Module:</Label>
                    <Input
                      name="module"
                      type="select"
                      value={formData.module}
                      onChange={handleChange}
                      className={`${formErrors.module ? "is-invalid" : ""} mobile-form-input`}
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
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
                      <small className="text-danger" style={{ fontSize: isMobile ? '12px' : '14px' }}>{formErrors.module}</small>
                    )}
                  </Col>

                  <Col md="3" sm="12" className="mb-1">
                    <Label for="center" style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>Center</Label>
                    <Input
                      type="select"
                      id="center"
                      name="center"
                      value={formData.center}
                      onChange={handleChange}
                      required
                      disabled={formData.module !== "bill" && formData.module !== "daily-expense" && formData.module !== "productstock"}
                      className="mobile-form-input"
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
                    <Label for="product" style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>Product</Label>
                    <Input
                      type="select"
                      id="product"
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      required
                      disabled={formData.module !== "stock"  && formData.module !== "productstock"}
                      className="mobile-form-input"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
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
                    <Label for="supplier" style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>Suppliers</Label>
                    <Input
                      type="select"
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      required
                      disabled={formData.module !== "supplier-transactions"}
                      className="mobile-form-input"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px'
                      }}
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
                    <Label style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>Format:</Label>
                    <div className={`d-flex ${isMobile ? 'flex-column' : 'gap-4'}`}>
                      <div className="form-check">
                        <Input
                          type="radio"
                          name="format"
                          id="format-excel"
                          value="excel"
                          checked={formData.format === "excel"}
                          onChange={handleChange}
                          className="form-check-input"
                          style={{
                            accentColor: isDarkTheme ? '#4a5568' : '#007bff'
                          }}
                        />
                        <Label 
                          className="form-check-label" 
                          for="format-excel"
                          style={{ 
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '14px' : '16px'
                          }}
                        >
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
                          style={{
                            accentColor: isDarkTheme ? '#4a5568' : '#007bff'
                          }}
                        />
                        <Label 
                          className="form-check-label" 
                          for="format-pdf"
                          style={{ 
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '14px' : '16px'
                          }}
                        >
                          PDF (.pdf)
                        </Label>
                      </div>
                    </div>
                    {formErrors.format && (
                      <small className="text-danger" style={{ fontSize: isMobile ? '12px' : '14px' }}>{formErrors.format}</small>
                    )}
                  </Col>

                  <Col lg="12" className="mt-2">
                    <div className={`d-flex ${isMobile ? 'flex-row gap-2' : 'gap-2'}`}>
                      <Button
                        color="primary"
                        onClick={handleGenerateReport}
                        className={`${isMobile ? 'mobile-button' : 'me-1'}`}
                        disabled={reportLoading}
                        style={{
                          fontSize: isMobile ? '14px' : '14px',
                          padding: isMobile ? '0.5rem' : '0.375rem 0.75rem',
                          width: isMobile ? '50%' : 'auto',
                          flex: isMobile ? '1' : 'none'
                        }}
                      >
                        {reportLoading ? (
                          <>
                            <Spinner size="sm" className={isMobile ? '' : 'me-1'} />
                            {isMobile ? 'Generating...' : 'Generating...'}
                          </>
                        ) : (
                          isMobile ? 'Generate' : 'Generate Report'
                        )}
                      </Button>
                      <Button 
                        color="secondary" 
                        onClick={handleReset}
                        className={isMobile ? 'mobile-button' : ''}
                        style={{
                          fontSize: isMobile ? '14px' : '14px',
                          padding: isMobile ? '0.5rem' : '0.375rem 0.75rem',
                          width: isMobile ? '50%' : 'auto',
                          flex: isMobile ? '1' : 'none'
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Fragment>
  )
}

export default ReportPage
