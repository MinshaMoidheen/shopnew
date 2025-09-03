import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Table,
  Badge,
  Spinner,
  Row,
  Col,
  CardBody,
} from "reactstrap";
import { ArrowLeft, Users, Mail, Phone, Plus, Edit, Trash, Menu, Search, User } from "react-feather";
import { useGetUsersByCenterQuery, useUpdateUserMutation, useDeleteUserMutation } from "../../slices/authenslice";
import { useGetCentersQuery } from "../../slices/centersSlice";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { DataGrid } from '@mui/x-data-grid';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import toast from "react-hot-toast";

const MySwal = withReactContent(Swal);

const ViewUsersPage = () => {
  const { centerId } = useParams();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState('light');
  const [addUserModal, setAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

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

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDarkTheme = currentTheme?.toLowerCase()?.trim() === "dark" || 
                      currentTheme?.toLowerCase()?.includes("dark");

  // Get center details
  const {
    data: centersData = [],
    isLoading: isLoadingCenters,
  } = useGetCentersQuery({
    page: 1,
    limit: 1000, // Get all centers to find the specific one
  });

  const centers = centersData.data || [];
  const selectedCenter = centers.find(center => center._id === centerId);

  // Get users for this center
  const {
    data: usersData = [],
    isLoading: isLoadingUsers,
    error,
    refetch: refetchUsers,
  } = useGetUsersByCenterQuery(
    { centerId }, 
    {
      skip: !centerId,
    }
  );

  const handleBackClick = () => {
    navigate('/apps/centers');
  };

  const handleAddUserClick = () => {
    setAddUserModal(true);
  };

  const handleAddUserModal = () => setAddUserModal(!addUserModal);
  const handleEditUserModal = () => setEditUserModal(!editUserModal);

  // User management mutations
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const result = await MySwal.fire({
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
      });

      if (result.isConfirmed) {
        const response = await deleteUser({ id: userId }).unwrap();
        if (response) {
          await refetchUsers();
          toast.success("User has been deleted successfully");
        }
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error(error?.data?.message || "Failed to delete user");
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const { userId, ...updateData } = userData;
      console.log("updateId", userId);
      console.log("updateData", updateData);

      const response = await updateUser({
        id: userId,
        body: {
          username: updateData.userName,
          email: updateData.email,
          phone: updateData.phone,
          newPassword: updateData.password
        }
      }).unwrap();

      if (response) {
        setEditUserModal(false);
        await refetchUsers();
        toast.success("User has been updated successfully");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error(error?.data?.message || "Failed to update user");
    }
  };

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => {
        const index = usersData.findIndex(user => user._id === params.row._id);
        return index + 1;
      },
    },
    {
      field: "userName",
      headerName: "Name",
      width: isMobile ? 120 : 250,
      minWidth: isMobile ? 100 : 200,
      flex: 1,
      sortable: true,
    },
    {
      field: "email",
      headerName: "Email",
      width: isMobile ? 150 : 280,
      minWidth: isMobile ? 120 : 200,
      sortable: true,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: isMobile ? 100 : 150,
      minWidth: isMobile ? 80 : 120,
      sortable: true,
    },
    {
      field: "role",
      headerName: "Role",
      width: isMobile ? 80 : 120,
      minWidth: isMobile ? 70 : 100,
      renderCell: (params) => (
        <Badge
          color={params.row.role === 'admin' ? 'danger' : params.row.role === 'manager' ? 'warning' : 'info'}
          pill
        >
          {params.row.role || 'user'}
        </Badge>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 100 : 150,
      minWidth: isMobile ? 100 : 120,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          <Edit
            size={isMobile ? 12 : 15}
            style={{ cursor: "pointer" }}
            onClick={() => handleEditUser(params.row)}
            className="ms-1"
            title="Edit User"
          />
          <Trash
            size={isMobile ? 12 : 15}
            style={{ cursor: "pointer" }}
            onClick={() => handleDeleteUser(params.row._id)}
            className="ms-1"
            title="Delete User"
          />
        </div>
      ),
    },
  ];

  // Prepare data for MUI DataGrid
  const data = usersData.map((user, index) => ({
    id: user._id || index,
    ...user
  }));

  if (isLoadingCenters || isLoadingUsers) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
        <span className="ms-2">Loading...</span>
      </div>
    );
  }

  if (!selectedCenter) {
    return (
      <div className="container">
        <Card
          style={{
            backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
            border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
            color: isDarkTheme ? '#ffffff' : '#000000'
          }}
        >
          <CardHeader
            style={{
              backgroundColor: isDarkTheme ? '#23263a' : '#f7fafc',
              color: isDarkTheme ? '#ffffff' : '#2d3748',
              borderBottom: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0'
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Button
                  color="secondary"
                  onClick={handleBackClick}
                  className="me-3"
                  style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#6c757d',
                    border: 'none',
                    color: '#ffffff'
                  }}
                >
                  <ArrowLeft size={16} className="me-1" />
                  Back
                </Button>
                <CardTitle tag="h4" className="mb-0">
                  Center Not Found
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <div className="p-4 text-center">
            <p>The requested center could not be found.</p>
          </div>
        </Card>
      </div>
    );
  }

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
            .users-application {
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
            .mobile-back-section {
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .mobile-back-button {
              width: auto !important;
              min-width: 60px !important;
              max-width: 80px !important;
              font-size: 12px !important;
              padding: 0.3rem !important;
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
            {isMobile ? (
              <CardHeader className="mobile-card-header">
                <div className="d-flex align-items-center justify-content-between w-100">
                <Button
                      color="secondary"
                      onClick={handleBackClick}
                      className="me-3"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#6c757d',
                        border: 'none',
                        color: '#ffffff',
                        width:"20px",
                        alignItems:"center"
                      }}
                    >
                      <ArrowLeft size={16} className="me-1" />
                      
                    </Button>
                  {/* Center: Title */}
                  <div className="flex-grow-1 text-center">
                    <h6 className="mb-0" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                      Users in {selectedCenter.centerName}
                    </h6>
                  </div>
                   <Button
                    color="primary"
                    onClick={handleAddUserClick}
                    style={{
                      backgroundColor: isDarkTheme ? '#4299e1' : '#007bff',
                      border: 'none',
                      color: '#ffffff',
                      width:"fit-content"
                    }}
                  >
                    <Plus size={16} className="me-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
            ) : (
              <CardHeader
                style={{
                  backgroundColor: isDarkTheme ? '#23263a' : '#f7fafc',
                  color: isDarkTheme ? '#ffffff' : '#2d3748',
                  borderBottom: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <Button
                      color="secondary"
                      onClick={handleBackClick}
                      className="me-3"
                      style={{
                        backgroundColor: isDarkTheme ? '#2d3748' : '#6c757d',
                        border: 'none',
                        color: '#ffffff'
                      }}
                    >
                      <ArrowLeft size={16} className="me-1" />
                      Back
                    </Button>
                    <div>
                      <CardTitle tag="h4" className="mb-0">
                        <Users size={24} className="me-2" />
                        Users in {selectedCenter.centerName}
                      </CardTitle>
                      <small style={{ color: isDarkTheme ? '#a0aec0' : '#6b7280' }}>
                        Center Code: {selectedCenter.centerCode}
                      </small>
                    </div>
                  </div>
                  <Button
                    color="primary"
                    onClick={handleAddUserClick}
                    style={{
                      backgroundColor: isDarkTheme ? '#4299e1' : '#007bff',
                      border: 'none',
                      color: '#ffffff',
                      marginLeft:"420px"
                    }}
                  >
                    <Plus size={16} className="me-1" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
            )}
            
            <CardBody className="mobile-card-body">
              <div className="mobile-back-section">
                <Row className="justify-content-center justify-content-md-start mx-0">
                  <Col
                    className="d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-start gap-2"
                    md="6"
                    xs="12"
                  >
                    
                  </Col>
                </Row>
              </div>
              
              <div>
                {error ? (
                  <div className="text-center py-5">
                    <p className="text-danger">Error loading users</p>
                  </div>
                ) : usersData.length === 0 ? (
                  <div className="text-center py-5">
                    <Users size={48} className="text-muted mb-3" />
                    <h5>No Users Found</h5>
                    <p className="text-muted">This center doesn't have any users yet.</p>
                    <Button
                      color="primary"
                      onClick={handleAddUserClick}
                      className="mt-3"
                      style={{
                        backgroundColor: isDarkTheme ? '#4299e1' : '#007bff',
                        border: 'none',
                        color: '#ffffff'
                      }}
                    >
                      <Plus size={16} className="me-1" />
                      Add First User
                    </Button>
                  </div>
                ) : (
                  <div className="mobile-table-container" style={{ height: 400, width: '100%', marginBottom: "40px" }}>
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
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Add User Modal */}
      {addUserModal && (
        <AddUserModal
          open={addUserModal}
          handleModal={handleAddUserModal}
          centerId={centerId}
          refetch={refetchUsers}
        />
      )}
      
      {/* Edit User Modal */}
      {editUserModal && selectedUser && (
        <EditUserModal
          open={editUserModal}
          handleModal={handleEditUserModal}
          selectedUser={selectedUser}
          onUpdate={handleUpdateUser}
        />
      )}
    </>
  );
 };
 
 export default ViewUsersPage;
