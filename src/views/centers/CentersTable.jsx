import React, { Fragment, useState, forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import {
  MoreVertical,
  Edit,
  Trash,
  Plus,
  Users,
  Eye,
  Menu,
  Search,
  User,
} from "react-feather";
import {
  useGetCentersQuery,
  useDeleteCenterMutation,
} from "../../slices/centersSlice";
import { 
   
  useUpdateUserMutation,
  useDeleteUserMutation, 
  useGetUsersByCenterQuery
} from "../../slices/authenslice";
import AddNewModal from "./AddNewModal";
import EditModal from "./EditCenterModal";
import AddUserModal from "./AddUserModal";
import {
  Row,
  Col,
  Card,
  Input,
  Label,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
  Table,
  Spinner,
  CardHeader,
  CardTitle,
  CardBody,
} from "reactstrap";
import toast from "react-hot-toast";
import EditUserModal from "./EditUserModal";
import { DataGrid } from '@mui/x-data-grid';


const MySwal = withReactContent(Swal);

const CentersTable = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get theme from localStorage
  const getThemeFromStorage = () => {
    const skin = localStorage.getItem('skin');
    // console.log("skin", skin)
    // console.log("skin type:", typeof skin)
    // console.log("skin length:", skin?.length)
    // console.log("skin trimmed:", skin?.trim())
    // console.log("skin === 'dark':", skin === 'dark')
    // console.log("skin?.trim() === 'dark':", skin?.trim() === 'dark')
    // console.log("skin includes 'dark':", skin?.toLowerCase()?.includes('dark'))
    
    // More robust theme detection
    if (skin?.toLowerCase()?.includes('dark')) {
      return 'dark';
    }
    return 'light';
  };
  
  const [currentTheme, setCurrentTheme] = useState(getThemeFromStorage());

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

  // console.log("currentTheme", currentTheme)
  // console.log("currentTheme type:", typeof currentTheme)
  // console.log("currentTheme length:", currentTheme?.length)
  // console.log("currentTheme charCodes:", currentTheme?.split('').map(c => c.charCodeAt(0)))
  // console.log("currentTheme === 'dark':", currentTheme === 'dark')
  // console.log("currentTheme?.trim() === 'dark':", currentTheme?.trim() === 'dark')
  // console.log("currentTheme includes 'dark':", currentTheme?.includes('dark'))
  // console.log("currentTheme toLowerCase:", currentTheme?.toLowerCase())
  // console.log("currentTheme toLowerCase trim:", currentTheme?.toLowerCase()?.trim())
  // console.log("Theme check:", currentTheme?.toLowerCase()?.trim() === "dark" ? "DARK THEME DETECTED" : "LIGHT THEME DETECTED")

  // Helper function for theme comparison - more robust
  const isDarkTheme = currentTheme?.toLowerCase()?.trim() === "dark" || 
                      currentTheme?.toLowerCase()?.includes("dark");

  const {
    data: centersData = [],
    isLoading,
    refetch,
  } = useGetCentersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const centers = centersData.data || [];
  const totalCount = centersData.total || 0;
  const totalPages = centersData.totalPages || 0;

  const [deleteCenter] = useDeleteCenterMutation();

  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);

  const [selectedCenter, setSelectedCenter] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  const handleModal = () => setModal(!modal);
  const handleEditModal = () => setEditModal(!editModal);
  const handleAddUserModal = () => setAddUserModal(!addUserModal);


  const handleEditClick = (row) => {
    setSelectedCenter(row);
    setEditModal(true);
  };

  const handleAddUserClick = (row) => {
    setSelectedCenter(row);
    setAddUserModal(true);
  };

  const handleViewUsersClick = (row) => {
    navigate(`/apps/centers/${row._id}/users`);
  };


  const handleDeleteClick = async (id) => {

    console.log("user id")
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
          await deleteCenter(id).unwrap();
          refetch();
          toast.success("Your file has been deleted");
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete data.");
        }
      }
    });
    refetch();
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: isMobile ? 50 : 60,
      minWidth: isMobile ? 50 : 60,
      renderCell: (params) => {
        const index = centers.findIndex(center => center._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "centerName",
      headerName: "Center Name",
      width: isMobile ? 120 : 200,
      minWidth: isMobile ? 100 : 150,
      flex: 1,
      sortable: true,
    },
    {
      field: "centerCode",
      headerName: "Center Code",
      width: isMobile ? 100 : 150,
      minWidth: isMobile ? 80 : 120,
      sortable: true,
    },
    
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 150 : 200,
      minWidth: isMobile ? 150 : 180,
      sortable: false,
              renderCell: (params) => (
          <div className="d-flex flex-column flex-md-row gap-1 mt-1">
            <Button
              color="info"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewUsersClick(params.row);
              }}
              className="btn-sm"
              style={{ 
                fontSize: isMobile ? '8px' : '10px', 
                padding: isMobile ? '1px 2px' : '2px 4px',
                minWidth: isMobile ? '20px' : 'auto'
              }}
            >
              <Eye size={isMobile ? 10 : 15} />
            </Button>
            <Button
              color="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAddUserClick(params.row);
              }}
              className="btn-sm"
              style={{ 
                fontSize: isMobile ? '8px' : '10px', 
                padding: isMobile ? '1px 2px' : '2px 4px',
                minWidth: isMobile ? '20px' : 'auto'
              }}
            >
              <Users size={isMobile ? 10 : 15} />
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
              <Trash size={isMobile ? 10 : 15} />
            </Button>
            <Button
              color="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(params.row);
              }}
              className="btn-sm"
              style={{ 
                fontSize: isMobile ? '8px' : '10px', 
                padding: isMobile ? '1px 2px' : '2px 4px',
                minWidth: isMobile ? '20px' : 'auto'
              }}
            >
              <Edit size={isMobile ? 10 : 15} />
            </Button>
        </div>
      ),
    },
  ];

  // Prepare data for MUI DataGrid
  const data = (searchValue.length ? filteredData : centers).map((center, index) => ({
    id: center._id || index,
    ...center
  }));

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsSearching(true);

    // Simulate search delay for better UX
    setTimeout(() => {
      if (value.trim() === '') {
        setFilteredData([]);
      } else {
    const updatedData = centers.filter((item) =>
      Object.values(item).some((field) =>
            field.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredData(updatedData);
      }
      setIsSearching(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="primary" />
      </div>
    );
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
            .centers-application {
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
                      placeholder="Search centers by name or code..."
                value={searchValue}
                      onChange={handleSearch}
                      style={{ 
                        minWidth: "250px",
                        backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                      }}
                    />
                    {isSearching && (
                      <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                        <Spinner size="sm" />
                      </div>
                    )}
                    {searchValue.trim() !== '' && !isSearching && (
                      <small 
                        className="position-absolute" 
                        style={{ 
                          bottom: '-20px', 
                          left: '0',
                          color: isDarkTheme ? '#a0aec0' : '#6b7280'
                        }}
                      >
                        {filteredData.length} center(s) found
                      </small>
                    )}
                  </div>

              <Button
                className="d-flex align-items-center justify-content-center w-100 w-md-auto mobile-add-button"
                color="primary"
                onClick={handleModal}
                style={{ 
                  minWidth: isMobile ? "80px" : "150px",
                  maxWidth: isMobile ? "100px" : "auto"
                }}
              >
                <Plus size={15} />
                {!isMobile && <span className="ms-1">Add Center</span>}
              </Button>

            </Col>
          </Row>
            </div>
            <div className="table-responsive mobile-table-container" style={{ height: 400, width: '100%', marginBottom: "40px" }}>
              <DataGrid
                key={currentTheme} // Force re-render when theme changes
                rows={data}
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
          </CardBody>
        </Card>
        </div>
      </div>
      <AddNewModal open={modal} handleModal={handleModal} refetch={refetch} />
      {editModal && selectedCenter && (
        <EditModal
          open={editModal}
          handleModal={handleEditModal}
          selectedCenter={selectedCenter}
          refetch={refetch}
        />
      )}
      {addUserModal && selectedCenter && (
        <AddUserModal
          open={addUserModal}
          handleModal={handleAddUserModal}
          centerId={selectedCenter._id}
          refetch={refetch}
        />
      )}

    </Fragment>
  );
};

export default CentersTable;
