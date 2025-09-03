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

  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 180,
      renderCell: (params) => {
        const index = centers.findIndex(center => center._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "centerName",
      headerName: "Center Name",
      width: 250,
      sortable: true,
    },
    {
      field: "centerCode",
      headerName: "Center Code",
      width: 250,
      sortable: true,
    },
    
    {
      field: "actions",
      headerName: "Actions",
      width: 330,
      sortable: false,
              renderCell: (params) => (
          <div className="d-flex mt-1">
            <Eye
              size={15}
              style={{ cursor: "pointer" }}
              onClick={() => handleViewUsersClick(params.row)}
              className="ms-1"
              title="View Users"
            />
            <Users size={15}
            style={{ cursor: "pointer" }} 
            onClick={() => handleAddUserClick(params.row)}
            className="ms-1"
            title="Add User"/>
            <Trash 
            style={{ cursor: "pointer" }}
            onClick={() => handleDeleteClick(params.row._id)}
            size={15}
            className="ms-1"
            title="Delete" />
          <Edit
            style={{ cursor: "pointer" }}
              onClick={() => handleEditClick(params.row)}
            size={15}
              className="ms-1"
              title="Edit"
          />
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
      <div
        className="container"
        style={{ height: "calc(100vh - 100px)", overflow: "auto" }}
      >
        <Card 
          className="w-100" 
          style={{
            backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
            border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
            color: isDarkTheme ? '#ffffff' : '#000000'
          }}
        >
          <Row className="justify-content-end mx-0">
            <Col
              className="d-flex align-items-center justify-content-end mt-1"
              md="6"
              sm="12"
            >
              <div className="position-relative">
              <Input
                className="dataTable-filter mb-50"
                type="text"
                id="search-input"
                  placeholder="Search centers by name or code..."
                value={searchValue}
                  onChange={handleSearch}
                  style={{ 
                    width: "250px",
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
                className="ms-2 mb-50 d-flex align-items-center"
                color="primary"
                onClick={handleModal}
                style={{ minWidth: "150px" }}
              >
                <Plus size={15} className="me-1" />
                <span>Add Center</span>
              </Button>
            </Col>
          </Row>
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
        </Card>
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
