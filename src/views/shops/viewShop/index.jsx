import React, { useState, useEffect } from "react"
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
  Label,
  Input,
  Table,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [currentTheme, setCurrentTheme] = useState('light')
  
  const shop = shopData // Access data directly, not from shopData.shop

  // Check if this is a dummy data ID (numeric string)
  const isDummyData = id && /^\d+$/.test(id)

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

  // if (!shop && !isLoading) {
  //   return (
  //     <>
  //       <style>
  //         {`
  //           @media (max-width: 767.98px) {
  //             .app-content, .content-area-wrapper, .container, .main-content, .content-wrapper {
  //               padding: 0 !important;
  //               margin: 0 !important;
  //               width: 100vw !important;
  //               max-width: 100vw !important;
  //               position: relative !important;
  //             }
  //             .mobile-container {
  //               padding: 0 !important;
  //               margin: 0 !important;
  //               width: 100vw !important;
  //               height: calc(100vh - 60px) !important;
  //               overflow: auto !important;
  //               max-width: 100vw !important;
  //               position: fixed !important;
  //               top: 60px !important;
  //               left: 0 !important;
  //               right: 0 !important;
  //               bottom: 0 !important;
  //             }
  //             .mobile-card {
  //               width: 100vw !important;
  //               height: calc(100vh - 60px) !important;
  //               margin: 0 !important;
  //               border-radius: 0 !important;
  //               border: none !important;
  //               max-width: 100vw !important;
  //               position: absolute !important;
  //               top: 0 !important;
  //               left: 0 !important;
  //               right: 0 !important;
  //               bottom: 0 !important;
  //             }
  //             .mobile-card-body {
  //               padding: 1rem !important;
  //               height: calc(100vh - 60px) !important;
  //               overflow: auto !important;
  //               display: flex !important;
  //               align-items: center !important;
  //               justify-content: center !important;
  //             }
  //             .mobile-button {
  //               width: 100% !important;
  //               font-size: 14px !important;
  //               padding: 0.5rem !important;
  //               margin-bottom: 0.5rem !important;
  //             }
  //           }
  //         `}
  //       </style>
  //       <div
  //         className="container-fluid mobile-container"
  //         style={{ 
  //           height: isMobile ? "calc(100vh - 60px)" : "calc(100vh - 100px)", 
  //           overflow: "auto",
  //           padding: isMobile ? '0' : '0',
  //           margin: isMobile ? '0' : '0',
  //           width: isMobile ? '100vw' : '100%',
  //           maxWidth: isMobile ? '100vw' : '100%',
  //           position: isMobile ? 'fixed' : undefined,
  //           top: isMobile ? '60px' : undefined,
  //           left: isMobile ? '0' : undefined,
  //           right: isMobile ? '0' : undefined,
  //           bottom: isMobile ? '0' : undefined,
  //           zIndex: isMobile ? '1000' : undefined
  //         }}
  //       >
  //         <div 
  //           style={{
  //             width: isMobile ? '100vw' : '100%',
  //             height: isMobile ? 'calc(100vh - 60px)' : 'auto',
  //             margin: isMobile ? '0' : '0',
  //             padding: isMobile ? '0' : '0',
  //             position: isMobile ? 'absolute' : undefined,
  //             top: isMobile ? '50px' : undefined,
  //             left: isMobile ? '20px' : undefined,
  //             right: isMobile ? '20px' : undefined,
  //             bottom: isMobile ? '0' : undefined,
  //             maxWidth: isMobile ? '100vw' : '100%'
  //           }}
  //         >
  //           <Card 
  //             className="w-100 mobile-card" 
  //             style={{
  //               backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
  //               border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
  //               color: isDarkTheme ? '#ffffff' : '#000000',
  //               width: isMobile ? '100vw' : '100%',
  //               height: isMobile ? 'calc(100vh - 60px)' : 'auto',
  //               margin: isMobile ? '0' : '0',
  //               padding: isMobile ? '0' : '0',
  //               maxWidth: isMobile ? '100vw' : '100%',
  //               position: isMobile ? 'absolute' : undefined,
  //               top: isMobile ? '100px' : undefined,
  //               left: isMobile ? '0' : undefined,
  //               right: isMobile ? '0' : undefined,
  //               bottom: isMobile ? '0' : undefined
  //             }}
  //           >
  //             <CardBody 
  //               className={isMobile ? 'mobile-card-body' : ''}
  //               style={{
  //                 backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
  //                 color: isDarkTheme ? '#ffffff' : '#000000'
  //               }}
  //             >
  //               <div className="text-center py-5">
  //                 <h4 style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Shop not found</h4>
  //                 <p className="text-muted" style={{ color: isDarkTheme ? '#a0aec0' : '#6b7280' }}>
  //                   {isDummyData 
  //                     ? "This is dummy data for demonstration purposes. Please add real shops to test the view functionality." 
  //                     : "The shop you're looking for doesn't exist."
  //                   }
  //                 </p>
  //                 <Button 
  //                   color="primary" 
  //                   onClick={() => navigate("/apps/shops")}
  //                   className={isMobile ? 'mobile-button' : ''}
  //                   style={{
  //                     fontSize: isMobile ? '14px' : '12px',
  //                     padding: isMobile ? '0.5rem' : '0.375rem 0.75rem'
  //                   }}
  //                 >
  //                   Back to Shops
  //                 </Button>
  //               </div>
  //             </CardBody>
  //           </Card>
  //         </div>
  //       </div>
  //     </>
  //   )
  // }

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
            .viewshop-application {
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
            .mobile-button {
              width: 33.33% !important;
              font-size: 12px !important;
              padding: 0.4rem 0.2rem !important;
              margin-bottom: 0 !important;
              flex: 1 !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .mobile-table-container {
              overflow-x: auto !important;
              width: 100% !important;
            }
            .mobile-table {
              min-width: 300px !important;
              font-size: 14px !important;
            }
            .mobile-table th,
            .mobile-table td {
              padding: 0.5rem !important;
              font-size: 14px !important;
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
                Shop Details
              </CardTitle>
              <div className={`d-flex ${isMobile ? 'flex-row w-100 gap-1 mt-2' : 'gap-2'}`}>
                <Button
                  color="secondary"
                  size="sm"
                  onClick={() => navigate("/apps/shops")}
                  className={isMobile ? 'mobile-button' : ''}
                  style={{
                    width: isMobile ? '33.33%' : 'auto',
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '0.4rem 0.2rem' : '0.375rem 0.75rem'
                  }}
                >
                  <ArrowLeft size={isMobile ? 16 : 15} className={isMobile ? '' : 'me-1'} />
                  {!isMobile && 'Back to Shops'}
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => navigate(`/apps/shops/edit/${id}`)}
                  className={isMobile ? 'mobile-button' : ''}
                  style={{
                    width: isMobile ? '33.33%' : 'auto',
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '0.4rem 0.2rem' : '0.375rem 0.75rem'
                  }}
                >
                  <Edit size={isMobile ? 16 : 15} className={isMobile ? '' : 'me-1'} />
                  {!isMobile && 'Edit Shop'}
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  onClick={handleDeleteClick}
                  className={isMobile ? 'mobile-button' : ''}
                  style={{
                    width: isMobile ? '33.33%' : 'auto',
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '0.4rem 0.2rem' : '0.375rem 0.75rem'
                  }}
                >
                  <Trash size={isMobile ? 16 : 15} className={isMobile ? '' : 'me-1'} />
                  {!isMobile && 'Delete Shop'}
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
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Shop Name:</Label>
                  <Input 
                    value={shop?.name || ''} 
                    disabled 
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                </Col>
                <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Location:</Label>
                  <Input 
                    value={shop?.location || ''} 
                    disabled 
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                </Col>
                <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Products Count:</Label>
                  <Input 
                    value={shop?.products ? shop?.products?.length : 0} 
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
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Total Price:</Label>
                  <Input 
                    value={shop?.totalPrice ? `$${shop?.totalPrice.toFixed(2)}` : '$0.00'} 
                    disabled 
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#68d391' : '#10b981',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px',
                      fontWeight: 'bold'
                    }}
                  />
                </Col>
                <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Created Date:</Label>
                  <Input 
                    value={shop?.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'N/A'} 
                    disabled 
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  />
                </Col>
                <Col lg="4" md="6" className={isMobile ? 'col-12' : ''}>
                  <Label className="form-label" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Status:</Label>
                  <Input 
                    value="Active" 
                    disabled 
                    style={{
                      backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                      color: isDarkTheme ? '#68d391' : '#10b981',
                      border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      fontSize: isMobile ? '16px' : '14px',
                      fontWeight: 'bold'
                    }}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>Shop Products</h5>
              </div>

              {shop?.products && shop?.products?.length > 0 ? (
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
                        }}>Product Name</th>
                        <th style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '11px' : '14px',
                          padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                        }}>Unit Price</th>
                        <th style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '11px' : '14px',
                          padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                        }}>Total Price</th>
                        <th style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '11px' : '14px',
                          padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                        }}>Tax Rate</th>
                        <th style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '11px' : '14px',
                          padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                        }}>Final Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shop?.products?.map((product, index) => (
                        <tr 
                          key={product?._id || product?.id || index}
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
                            {product?.name || product?.productName || 'N/A'}
                          </td>
                          <td style={{ 
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '11px' : '14px',
                            padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                          }}>
                            ${product?.unitPrice ? product.unitPrice.toFixed(2) : product?.price ? product.price.toFixed(2) : '0.00'}
                          </td>
                          <td style={{ 
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '11px' : '14px',
                            padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                          }}>
                            ${product?.totalPrice ? product.totalPrice.toFixed(2) : product?.price ? product.price.toFixed(2) : '0.00'}
                          </td>
                          <td style={{ 
                            color: isDarkTheme ? '#ffffff' : '#000000',
                            fontSize: isMobile ? '11px' : '14px',
                            padding: isMobile ? '0.5rem 0.25rem' : '0.75rem'
                          }}>
                            {product?.taxRate ? `${product.taxRate}%` : '0%'}
                          </td>
                          <td style={{ 
                            color: isDarkTheme ? '#68d391' : '#10b981',
                            fontSize: isMobile ? '11px' : '14px',
                            padding: isMobile ? '0.5rem 0.25rem' : '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            ${product?.priceWithTax ? product.priceWithTax.toFixed(2) : product?.totalPrice ? product.totalPrice.toFixed(2) : product?.price ? product.price.toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted" style={{ color: isDarkTheme ? '#a0aec0' : '#6b7280' }}>
                    No products found in this shop.
                  </p>
                </div>
              )}
            </CardBody>
      </Card>
    </div>
      </div>
    </>
  )
}

export default ViewShop
