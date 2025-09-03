import React, { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Form,
  Spinner,
  Table,
  Badge,
} from "reactstrap"
import toast from "react-hot-toast"
import {
  useCreateProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useSearchProductsQuery,
} from "../../slices/productApiSlice"
import ReactPaginate from "react-paginate"
import { useNavigate } from "react-router-dom"
import { useGetAllStocksQuery } from "../../slices/stockApiSlice"
import { DataGrid } from '@mui/x-data-grid';
import { Plus, Eye, Edit, Trash } from "react-feather";

import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import "animate.css/animate.css"
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss"
import CreatableSelect from "react-select/creatable"
import "@styles/react/libs/react-select/_react-select.scss"
import saudiRiyal from '../../assets/images/pages/riyaal.png'

const defaultProduct = () => ({
  name: "",
  barcode: "",
  category: "",
  brand: "",
  tax: "",
  unit: "",
  isTaxIncluded: false,
})

const MySwal = withReactContent(Swal)

const ProductTable = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState(defaultProduct())
  const [editingProduct, setEditingProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [currentTheme, setCurrentTheme] = useState('light')
  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
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

  // Fetch products from backend with pagination
  const { data, isLoading, refetch } = useGetProductsQuery({
    page: currentPage,
    limit: itemsPerPage,
  })

  // Search products query
  const {
    data: searchData,
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useSearchProductsQuery(
    {
      name: searchTerm,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: !searchTerm || searchTerm.trim() === '',
    }
  )

  console.log("products", data)
  console.log("searchData", searchData)

  // Use search results if search term exists, otherwise use regular products
  const products = searchTerm.trim() !== '' ? (searchData?.products || []) : (data?.products || [])
  const totalCount = searchTerm.trim() !== '' ? (searchData?.total || 0) : (data?.total || 0)
  const isLoadingData = searchTerm.trim() !== '' ? searchLoading : isLoading

  // Get all products for calculating totals (not paginated)
  const { data: allProductsData, isLoading: allProductsLoading, refetch: refetchAllProducts } = useGetProductsQuery({
    page: 1,
    limit: 10000, // Get all products
  }, {
    skip: searchTerm.trim() !== '', // Skip if searching
  })

  // Get all search results for calculating totals when searching
  const { data: allSearchData, isLoading: allSearchLoading, refetch: refetchAllSearch } = useSearchProductsQuery(
    {
      name: searchTerm,
      page: 1,
      limit: 10000, // Get all search results
    },
    {
      skip: !searchTerm || searchTerm.trim() === '',
    }
  )

  // Calculate totals from all products (not just current page)
  const allProducts = searchTerm.trim() !== '' ? (allSearchData?.products || []) : (allProductsData?.products || [])
  const isTotalsLoading = searchTerm.trim() !== '' ? allSearchLoading : allProductsLoading

  const totalQuantity = allProducts.reduce(
    (sum, product) => sum + (product.stockSummary?.totalQuantity || 0),
    0
  )

  const totalRemaining = allProducts.reduce(
    (sum, product) => sum + (product.stockSummary?.totalRemaining || 0),
    0
  )

  const totalPurchase = allProducts.reduce(
    (sum, product) =>
      sum +
      ((product.stockSummary?.totalPurchaseAmount || 0)),0
  )

  console.log(allProducts, "123")


  // Use products directly (search is handled by backend)
  const filteredProducts = products

  // Add stock query
  const { data: stocksData, isLoading: isLoadingStocks } = useGetAllStocksQuery(
    {
      page: 1,
      limit: 1000, // Fetch all stocks for the product
    }
  )

  const handleInputChange = (field, e) => {
    if (field === "category") {
      const value = e?.value || e?.target?.value || ""
      setNewProduct((prev) => ({ ...prev, [field]: value }))
    } else {
      const value =
        field === "isTaxIncluded" ? e.target.checked : e.target.value
      setNewProduct((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleEditInputChange = (field, e) => {
    if (field === "category") {
      const value = e?.value || e?.target?.value || ""
      setEditingProduct((prev) => ({ ...prev, [field]: value }))
    } else {
      const value =
        field === "isTaxIncluded" ? e.target.checked : e.target.value
      setEditingProduct((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleEdit = () => {
    if (!selectedRow) {
      toast.error("Please select a product to edit")
      return
    }
    const product = products.find((p) => p._id === selectedRow)
    setEditingProduct(product)
  }

  const handleDelete = async () => {
    if (!selectedRow) {
      toast.error("Please select a product to delete")
      return
    }
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
          await deleteProduct(selectedRow).unwrap()
          refetch()
          // Refetch totals data
          if (searchTerm.trim() !== '') {
            refetchAllSearch()
          } else {
            refetchAllProducts()
          }
          toast.success("Your file has been deleted")
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete data.")
        }
      }
    })
  }

  const { data: categoriesData = [] } = useGetCategoriesQuery()

  const categories = categoriesData.categories || []
  console.log(categories)

  const handleCancelEdit = () => {
    setEditingProduct(null)
  }

  const handleRowClick = (rowId) => {
    setSelectedRow(rowId === selectedRow ? null : rowId)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const productToUpdate = {
        ...editingProduct,
        category: editingProduct.category
          ? editingProduct.category?.toUpperCase()
          : categorySearch?.toUpperCase() || "",
      }

      await updateProduct({
        productId: editingProduct._id,
        data: productToUpdate,
      }).unwrap()

      console.log("updateproduct", productToUpdate)
      toast.success("Product updated successfully!")
      setEditingProduct(null)
      setSelectedRow(null)
      refetch()
      // Refetch totals data
      if (searchTerm.trim() !== '') {
        refetchAllSearch()
      } else {
        refetchAllProducts()
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update product")
    }
    setIsSubmitting(false)
  }

  // Refetch data when search term changes
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      refetchAllSearch()
    } else {
      refetchAllProducts()
    }
  }, [searchTerm, refetchAllSearch, refetchAllProducts])

  // Initial data fetch
  useEffect(() => {
    refetch()
    if (searchTerm.trim() !== '') {
      refetchAllSearch()
    } else {
      refetchAllProducts()
    }
  }, [refetch, refetchAllSearch, refetchAllProducts])
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const productToSubmit = {
        name: newProduct.name,
        barcode: newProduct.barcode,
        category: newProduct.category
          ? newProduct.category?.toUpperCase()
          : categorySearch?.toUpperCase() || "",
        brand: newProduct.brand,
        tax: newProduct.tax,
        unit: newProduct.unit,
        isTaxIncluded: newProduct.isTaxIncluded || false,
      }
      await createProduct([productToSubmit]).unwrap()

      refetch()
      // Refetch totals data
      if (searchTerm.trim() !== '') {
        refetchAllSearch()
      } else {
        refetchAllProducts()
      }
      toast.success("Product added successfully!")
      setNewProduct(defaultProduct())
      setShowAddForm(false)
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add product")
    }
    setIsSubmitting(false)
  }

  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1)
  }

  // Function to refresh all data including totals
  const handleRefreshAll = () => {
    refetch()
    if (searchTerm.trim() !== '') {
      refetchAllSearch()
    } else {
      refetchAllProducts()
    }
  }

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

  const handleAddStock = (productId) => {
    navigate(`/apps/new-stocks/add?productId=${productId}`)
  }

  const handleViewStock = (productId, e) => {
    e.stopPropagation()
    navigate(`/apps/products/view-stock?productId=${productId}`)
  }

  const handleRowDoubleClick = (rowId) => {
    navigate(`/apps/products/view-stock?productId=${rowId}`)
  }

  const handleEditClick = (product) => {
    setEditingProduct(product)
    setSelectedRow(product._id)
  }

  const handleDeleteClick = async (productId) => {
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
          await deleteProduct(productId).unwrap()
          refetch()
          // Refetch totals data
          if (searchTerm.trim() !== '') {
            refetchAllSearch()
          } else {
            refetchAllProducts()
          }
          toast.success("Product deleted successfully!")
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete product.")
        }
      }
    })
  }

  // DataGrid columns definition
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      renderCell: (params) => {
        const index = filteredProducts.findIndex(product => product._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "name",
      headerName: "Product Name",
      width: 250,
      sortable: true,
    },
    {
      field: "category",
      headerName: "Category",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        <span>{(params.row.category || '').toUpperCase()}</span>
      ),
    },
    {
      field: "brand",
      headerName: "Brand",
      width: 180,
      sortable: true,
    },
    {
      field: "unit",
      headerName: "Unit",
      width: 120,
      sortable: true,
    },
    {
      field: "totalRemaining",
      headerName: "Total Remaining",
      width: 150,
      renderCell: (params) => (
        <Badge color="info" pill>
          {params.row.stockSummary?.totalRemaining || 0}
        </Badge>
      ),
    },
    {
      field: "totalPurchase",
      headerName: "Total Purchase",
      width: 150,
      renderCell: (params) => (
        <div className="d-flex align-items-center">
          <img src={saudiRiyal} alt="SAR" style={{ width: '16px', marginRight: '4px' }} />
          <span>{(params.row.stockSummary?.totalPurchaseAmount || 0).toFixed(2)}</span>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 420,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddStock(params.row._id);
            }}
            style={{ marginRight: '4px' }}
          >
            <Plus size={12} className="me-1" />
            Add Stock
          </Button>
          <Button
            color="info"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewStock(params.row._id, e);
            }}
            style={{ marginRight: '4px' }}
          >
            <Eye size={12} className="me-1" />
            View
          </Button>

          <Button
            color="secondary"
            size="sm"
           onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
            style={{ marginRight: '4px' }}
          >
            <Edit
            size={15}
            style={{ cursor: "pointer", marginRight: '8px' }}
          />
            Edit
          </Button>
          <Button
            color="danger"
            size="sm"
          onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row._id);
            }}
            style={{ marginRight: '4px' }}
          >
            <Trash
            size={15}
            style={{ cursor: "pointer" }}
            
          
          />
            Delete
          </Button>

          
          
        </div>
      ),
    },
  ];

  // Prepare data for MUI DataGrid
  const gridData = filteredProducts.map((product, index) => ({
    id: product._id || index,
    ...product
  }));

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Products List</CardTitle>
        <div className="text-end">

          <div>
            <strong>Total Quantity : </strong>
            {isTotalsLoading ? (
              <Spinner size="sm" className="ms-1" />
            ) : (
              totalQuantity.toLocaleString()
            )}
          </div>
          <div>
            <strong>Total Remaining Quantity : </strong>
            {isTotalsLoading ? (
              <Spinner size="sm" className="ms-1" />
            ) : (
              totalRemaining.toLocaleString()
            )}
          </div>
          <div>
            <strong>Total Purchase:</strong>
            {isTotalsLoading ? (
              <Spinner size="sm" className="ms-1" />
            ) : (
              <>
                <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
                <span>{totalPurchase.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button
              color="primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel Add" : "Add New Product"}
            </Button>

            {/* {!editingProduct && !showAddForm && (
              <>
                <Button
                  color="secondary"
                  onClick={handleEdit}
                  disabled={!selectedRow}
                >
                  Edit Selected
                </Button>
                <Button
                  color="danger"
                  onClick={handleDelete}
                  disabled={!selectedRow}
                >
                  Delete Selected
                </Button>
              </>
            )} */}
            {editingProduct && (
              <>
                <Button
                  color="success"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                </Button>
                <Button color="secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </Button>
              </>
            )}
          </div>
          <div style={{ width: "300px" }}>
            <div className="position-relative">
              <Input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm.trim() !== '' && searchLoading && (
                <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            {searchTerm.trim() !== '' && searchData && (
              <small className="text-muted">
                {searchData.message}
              </small>
            )}
          </div>
        </div>

        {showAddForm && (
          <Form onSubmit={handleSubmit} className="mb-3">
            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label">Product Name</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => handleInputChange("name", e)}
                  placeholder="Name"
                  required
                />
              </div>
              <div className="col-md-2 mb-2">
                <label className="form-label">Unit</label>
                <Input
                  type="select"
                  value={newProduct.unit}
                  onChange={(e) => handleInputChange("unit", e)}
                  required
                >
                  <option value="">Select</option>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="ltr">ltr</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="kees">kees</option>
                  <option value="packet">packet</option>
                  <option value="shadha">shadha</option>
                  <option value="box">box</option>
                </Input>
              </div>
              <div className="col-md-2 mb-2">
                <label className="form-label">Brand</label>
                <Input
                  value={newProduct.brand}
                  onChange={(e) => handleInputChange("brand", e)}
                  placeholder="Brand"
                  required
                />
              </div>

              {/* <div className="col-md-1 mb-2">
                <label className="form-label">Tax</label>
                <Input
                  value={newProduct.tax}
                  onChange={(e) => handleInputChange("tax", e)}
                  placeholder="Tax"
                  required
                />
              </div> */}



              <div className="col-md-3 mb-2">
                <label className="form-label">Category</label>
                <CreatableSelect
                  options={categories.map((category) => ({
                    label: category,
                    value: category,
                  }))}
                  className="react-select"
                  classNamePrefix="select"
                  value={
                    newProduct.category
                      ? {
                        label: newProduct.category,
                        value: newProduct.category,
                      }
                      : null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("category", selectedOption)
                  }
                  onInputChange={(inputValue) => setCategorySearch(inputValue)}
                  placeholder="Select/Type Category"
                  isClearable
                  required
                />
              </div>
              {/* <div className="col-md-1 mb-2 d-flex align-items-end">
                <div className="form-check">
                  <Input
                    type="checkbox"
                    id="taxIncluded"
                    checked={newProduct.isTaxIncluded}
                    onChange={(e) => handleInputChange("isTaxIncluded", e)}
                  />
                  <label className="form-check-label" htmlFor="taxIncluded">
                    Tax
                  </label>
                </div>
              </div> */}

            </div>
            <Button
              color="success"
              type="submit"
              disabled={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? <Spinner size="sm" /> : "Save Product"}
            </Button>
          </Form>
        )}

        {editingProduct && (
          <Form onSubmit={handleUpdate} className="mb-3">
            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label">Product Name</label>
                      <Input
                  value={editingProduct.name}
                        onChange={(e) => handleEditInputChange("name", e)}
                  placeholder="Name"
                  required
                />
              </div>
              <div className="col-md-2 mb-2">
                <label className="form-label">Unit</label>
                <Input
                  type="select"
                  value={editingProduct.unit}
                  onChange={(e) => handleEditInputChange("unit", e)}
                  required
                >
                  <option value="">Select</option>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="ltr">ltr</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="kees">kees</option>
                  <option value="packet">packet</option>
                  <option value="shadha">shadha</option>
                  <option value="box">box</option>
                </Input>
              </div>
              <div className="col-md-2 mb-2">
                <label className="form-label">Brand</label>
                <Input
                  value={editingProduct.brand}
                  onChange={(e) => handleEditInputChange("brand", e)}
                  placeholder="Brand"
                  required
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">Category</label>
                        <CreatableSelect
                          options={categories.map((category) => ({
                            label: category,
                            value: category,
                          }))}
                  className="react-select"
                          classNamePrefix="select"
                          value={
                            editingProduct.category
                              ? {
                                label: editingProduct.category,
                                value: editingProduct.category,
                              }
                              : null
                          }
                          onChange={(selectedOption) =>
                            handleEditInputChange("category", selectedOption)
                          }
                  onInputChange={(inputValue) => setCategorySearch(inputValue)}
                  placeholder="Select/Type Category"
                          isClearable
                          required
                />
              </div>
            </div>
            <Button
              color="success"
              type="submit"
              disabled={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? <Spinner size="sm" /> : "Update Product"}
            </Button>
          </Form>
        )}

        {isLoadingData ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
            <Spinner color="primary" />
            <span className="ms-2">Loading...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">
              {searchTerm.trim() !== '' ? `No products found matching "${searchTerm}"` : 'No products found'}
            </p>
          </div>
        ) : (
          <div style={{ height: 400, width: '100%', marginBottom: "40px" }}>
            <DataGrid
              key={currentTheme} // Force re-render when theme changes
              rows={gridData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              autoHeight={false}
              getRowId={(row) => row.id}
              onRowDoubleClick={(params) => handleRowDoubleClick(params.id)}
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
            )}

        {totalCount > itemsPerPage && (
          <div className="d-flex justify-content-end mt-1">
            <CustomPagination />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ProductTable
