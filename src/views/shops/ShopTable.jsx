import React, { Fragment, useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Spinner,
  Row,
  Col,
  Badge,
} from "reactstrap"
import toast from "react-hot-toast"
import {
  useGetAllShopsQuery,
  useDeleteShopMutation,
  useSearchShopsQuery,
} from "../../slices/shopApiSlice"
import ReactPaginate from "react-paginate"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import "animate.css/animate.css"
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss"
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit,
  Trash,
  Plus,
  Eye,
} from "react-feather"

const MySwal = withReactContent(Swal)

const ShopTable = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTheme, setCurrentTheme] = useState('light')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [deleteShop] = useDeleteShopMutation()
  const navigate = useNavigate()

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

  // Fetch shops from backend with pagination
  const { data: shopsData, isLoading, refetch } = useGetAllShopsQuery({
    page: currentPage,
    limit: itemsPerPage,
  })

  // Search shops query
  const {
    data: searchData,
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useSearchShopsQuery(
    {
      name: searchTerm,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: !searchTerm || searchTerm.trim() === '',
    }
  )

  // Dummy data for testing
  const dummyShops = [
    {
      _id: "1",
      name: "Tech Store Central",
      location: "Downtown Mall, Floor 2",
      products: [
        { id: 1, name: "Laptop" },
        { id: 2, name: "Mouse" },
        { id: 3, name: "Keyboard" }
      ],
      totalPrice: 2500.50
    },
    {
      _id: "2", 
      name: "Fashion Boutique",
      location: "Shopping Center, Unit 15",
      products: [
        { id: 4, name: "Dress" },
        { id: 5, name: "Shoes" }
      ],
      totalPrice: 850.75
    },
    {
      _id: "3",
      name: "Electronics Hub",
      location: "Tech Plaza, Shop 8",
      products: [
        { id: 6, name: "Phone" },
        { id: 7, name: "Tablet" },
        { id: 8, name: "Charger" },
        { id: 9, name: "Headphones" }
      ],
      totalPrice: 3200.00
    },
    {
      _id: "4",
      name: "Sports World",
      location: "Sports Complex, Ground Floor",
      products: [
        { id: 10, name: "Running Shoes" },
        { id: 11, name: "Tennis Racket" },
        { id: 12, name: "Gym Bag" }
      ],
      totalPrice: 450.25
    },
    {
      _id: "5",
      name: "Book Paradise",
      location: "Library District, Building A",
      products: [
        { id: 13, name: "Novel" },
        { id: 14, name: "Textbook" },
        { id: 15, name: "Magazine" },
        { id: 16, name: "Comic" },
        { id: 17, name: "Dictionary" }
      ],
      totalPrice: 125.80
    },
    {
      _id: "6",
      name: "Home Decor Plus",
      location: "Furniture Mall, Level 3",
      products: [
        { id: 18, name: "Lamp" },
        { id: 19, name: "Vase" }
      ],
      totalPrice: 180.90
    },
    {
      _id: "7",
      name: "Gourmet Kitchen",
      location: "Food Court, Stall 12",
      products: [
        { id: 20, name: "Cookware Set" },
        { id: 21, name: "Knife Set" },
        { id: 22, name: "Cutting Board" },
        { id: 23, name: "Spice Rack" }
      ],
      totalPrice: 320.45
    },
    {
      _id: "8",
      name: "Beauty Corner",
      location: "Beauty Center, Shop 5",
      products: [
        { id: 24, name: "Skincare Kit" },
        { id: 25, name: "Makeup Set" }
      ],
      totalPrice: 95.60
    }
  ];

  // Use dummy data if no real data is available, otherwise use search results or regular shops
  const shops = searchTerm.trim() !== '' 
    ? (searchData?.shops || []) 
    : (shopsData?.shops?.length > 0 ? shopsData.shops : dummyShops);
  const totalCount = searchTerm.trim() !== '' 
    ? (searchData?.total || 0) 
    : (shopsData?.total || dummyShops.length);
  const isLoadingData = searchTerm.trim() !== '' ? searchLoading : isLoading

  const handleDeleteClick = async (id) => {
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
          refetch()
          toast.success("Shop deleted successfully!")
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete shop.")
        }
      }
    })
  }

  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1)
  }

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => {
        const index = shops.findIndex(shop => shop._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "name",
      headerName: "Shop Name",
      width: isMobile ? 120 : 250,
      minWidth: isMobile ? 100 : 200,
      flex: 1,
      sortable: true,
    },
    {
      field: "location",
      headerName: "Location",
      width: isMobile ? 100 : 250,
      minWidth: isMobile ? 80 : 200,
      sortable: true,
    },
    {
      field: "productsCount",
      headerName: isMobile ? "Products" : "Products Count",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: false,
      renderCell: (params) => (
        <Badge color="info" pill>
          {params.row.products ? params.row.products.length : 0}
        </Badge>
      ),
    },
    {
      field: "totalPrice",
      headerName: isMobile ? "Price" : "Total Price",
      width: isMobile ? 80 : 150,
      minWidth: isMobile ? 70 : 120,
      sortable: true,
      renderCell: (params) => (
        <span className="fw-bold">
          ${params.row.totalPrice ? params.row.totalPrice.toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 150 : 300,
      minWidth: isMobile ? 150 : 250,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex flex-column flex-md-row gap-1 mt-1">
          {/* <Button
            color="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/apps/shops/edit/${params.row._id}`);
            }}
            className="btn-sm"
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto'
            }}
          >
            <Edit size={isMobile ? 10 : 12} />
            {!isMobile && <span className="ms-1">Edit</span>}
          </Button> */}
          <Button
            color="info"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/apps/shops/view/${params.row._id}`);
            }}
            className="btn-sm"
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto'
            }}
          >
            <Eye size={isMobile ? 10 : 12} />
            {!isMobile && <span className="ms-1">View</span>}
          </Button>
          <Button
            color="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row._id);
            }}
            className="btn-sm"
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto'
            }}
          >
            <Trash size={isMobile ? 10 : 12} />
            {!isMobile && <span className="ms-1">Delete</span>}
          </Button>
        </div>
      ),
    },
  ];

  // Prepare data for MUI DataGrid
  const gridData = shops.map((shop, index) => ({
    id: shop._id || index,
    ...shop
  }));

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=""
      nextLabel=""
      forcePage={currentPage - 1}
      onPageChange={handlePagination}
      pageCount={Math.ceil(totalCount / itemsPerPage)}
      breakLabel="..."
      pageRangeDisplayed={2}
      marginPagesDisplayed={2}
      activeClassName="active"
      pageClassName="page-item"
      breakClassName="page-item"
      nextLinkClassName="page-link"
      pageLinkClassName="page-link"
      breakLinkClassName="page-link"
      previousLinkClassName="page-link"
      nextClassName="page-item next-item"
      previousClassName="page-item prev-item"
      containerClassName="pagination react-paginate separated-pagination pagination-sm justify-content-end pe-1 mt-1"
    />
  )

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="primary" />
      </div>
    )
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
            .shops-application {
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
            .mobile-search-section {
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .mobile-search-input {
              width: 100% !important;
              margin-bottom: 0.5rem !important;
              font-size: 16px !important;
            }
            .mobile-add-button {
              width: auto !important;
              min-width: 80px !important;
              max-width: 100px !important;
              font-size: 14px !important;
              padding: 0.5rem !important;
            }
            .mobile-table-container {
              height: calc(100vh - 340px) !important;
              overflow: auto !important;
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
            <CardBody className="mobile-card-body">
              <div className="mobile-search-section">
                <Row className="justify-content-center justify-content-md-end mx-0">
                  <Col
                    className="d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-end gap-2"
              md="6"
                    xs="12"
            >
                    <div className="position-relative w-100 w-md-auto">
              <Input
                        className="dataTable-filter w-100 mobile-search-input"
                type="text"
                id="search-input"
                placeholder="Search shops by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                          minWidth: "250px",
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                        }}
                      />
                    </div>

              <Button
                      className="d-flex align-items-center justify-content-center w-100 w-md-auto mobile-add-button"
                color="primary"
                onClick={() => navigate("/apps/shops/add")}
                      style={{ 
                        minWidth: isMobile ? "80px" : "150px",
                        maxWidth: isMobile ? "100px" : "auto"
                      }}
              >
                      <Plus size={15} />
                      {!isMobile && <span className="ms-1">Add Shop</span>}
              </Button>
            </Col>
          </Row>
              </div>
          {isLoadingData ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
              <Spinner color="primary" />
              <span className="ms-2">Loading...</span>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {searchTerm.trim() !== '' ? `No shops found matching "${searchTerm}"` : 'No shops found'}
              </p>
            </div>
          ) : (
                <div className="table-responsive mobile-table-container" style={{ height: 400, width: '100%', marginBottom: "40px" }}>
              <DataGrid
                key={currentTheme} // Force re-render when theme changes
                rows={gridData}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
                autoHeight={false}
                getRowId={(row) => row.id}
                sx={{
                  bgcolor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  borderRadius: 2,
                  border: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                  fontFamily: 'inherit !important',
                  fontSize: '14px !important',
                  '& .MuiDataGrid-main': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-root': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: isDarkTheme ? '#23263a !important' : '#f7fafc !important',
                    color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                    borderBottom: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                    fontWeight: '600 !important',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: isDarkTheme ? '#23263a !important' : '#f7fafc !important',
                    color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                    borderRight: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                    fontWeight: '600 !important',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                    fontWeight: '600 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    color: isDarkTheme ? '#ffffff !important' : '#2d3748 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-columnSeparator': {
                    color: isDarkTheme ? '#2d3748 !important' : '#e2e8f0 !important',
                  },
                  '& .MuiDataGrid-row': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    borderBottom: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: isDarkTheme ? '#2d3748 !important' : '#f7fafc !important',
                  },
                  '& .MuiDataGrid-row.Mui-selected': {
                    backgroundColor: isDarkTheme ? '#2d3748 !important' : '#e6f3ff !important',
                  },
                  '& .MuiDataGrid-row.Mui-selected:hover': {
                    backgroundColor: isDarkTheme ? '#2d3748 !important' : '#e6f3ff !important',
                  },
                  '& .MuiDataGrid-cell': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    borderRight: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none !important',
                  },
                  '& .MuiDataGrid-cell:focus-within': {
                    outline: 'none !important',
                  },
                  '& .MuiTablePagination-root': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    borderTop: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiTablePagination-toolbar': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiTablePagination-selectLabel': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiTablePagination-select': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiTablePagination-input': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiTablePagination-actions': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiIconButton-root': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  },
                  '& .MuiIconButton-root:hover': {
                    backgroundColor: isDarkTheme ? '#2d3748 !important' : '#f7fafc !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                    borderTop: isDarkTheme ? '1px solid #2d3748 !important' : '1px solid #e2e8f0 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-selectedRowCount': {
                    color: isDarkTheme ? '#ffffff !important' : '#000000 !important',
                    fontFamily: 'inherit !important',
                    fontSize: '14px !important',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  },
                  '& .MuiDataGrid-virtualScrollerRenderZone': {
                    backgroundColor: isDarkTheme ? '#181c2e !important' : '#ffffff !important',
                  },
                      // Mobile responsive styles
                      '@media (max-width: 767.98px)': {
                        fontSize: '11px !important',
                        width: '100% !important',
                        height: '100% !important',
                        '& .MuiDataGrid-columnHeader': {
                          fontSize: '9px !important',
                          padding: '1px 2px !important',
                          minHeight: '28px !important',
                          fontWeight: '600 !important',
                        },
                        '& .MuiDataGrid-cell': {
                          fontSize: '9px !important',
                          padding: '1px 2px !important',
                          minHeight: '28px !important',
                        },
                        '& .MuiDataGrid-main': {
                          overflowX: 'auto !important',
                          width: '100% !important',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                          minWidth: '450px !important',
                        },
                        '& .MuiDataGrid-virtualScroller': {
                          minWidth: '450px !important',
                        },
                        '& .MuiDataGrid-footerContainer': {
                          minWidth: '450px !important',
                          fontSize: '9px !important',
                        },
                        '& .MuiDataGrid-row': {
                          minHeight: '28px !important',
                        },
                        '& .MuiButton-root': {
                          minWidth: 'auto !important',
                          padding: '1px 2px !important',
                          fontSize: '8px !important',
                          minHeight: '20px !important',
                        },
                        '& .MuiDataGrid-root': {
                          width: '100% !important',
                          height: '100% !important',
                        },
                      },
                }}
              />
            </div>
          )}
            </CardBody>
        </Card>
        </div>
      </div>
    </Fragment>
  )
}

export default ShopTable
