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
} from "reactstrap";
import { ArrowLeft, Users, Mail, Phone, Plus, Edit, Trash } from "react-feather";
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
      width: 80,
      renderCell: (params) => {
        const index = usersData.findIndex(user => user._id === params.row._id);
        return index + 1;
      },
    },
    {
      field: "userName",
      headerName: "Name",
      width: 250,
      sortable: true,
    },
    {
      field: "email",
      headerName: "Email",
      width: 280,
      sortable: true,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      sortable: true,
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
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
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          <Edit
            size={15}
            style={{ cursor: "pointer" }}
            onClick={() => handleEditUser(params.row)}
            className="ms-1"
            title="Edit User"
          />
          <Trash
            size={15}
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
                marginLeft:"440px"
                
              }}
            >
              <Plus size={16} className="me-1" />
              Add User
            </Button>
          </div>
        </CardHeader>

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
            <div>
              <div style={{ height: 400, width: '100%', marginBottom: "40px" }}>
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
                  }}
                />
              </div>
            </div>
          )}
                 </div>
       </Card>
       
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
     </div>
   );
 };
 
 export default ViewUsersPage;
