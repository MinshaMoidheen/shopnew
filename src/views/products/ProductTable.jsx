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
import { Plus, Eye, Edit, Trash, Menu, Search, User } from "react-feather";

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
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
      width: isMobile ? 50 : 80,
      minWidth: isMobile ? 50 : 80,
      renderCell: (params) => {
        const index = filteredProducts.findIndex(product => product._id === params.row._id);
        return (currentPage - 1) * itemsPerPage + index + 1;
      },
    },
    {
      field: "name",
      headerName: "Product Name",
      width: isMobile ? 120 : 250,
      minWidth: isMobile ? 100 : 200,
      flex: 1,
      sortable: true,
    },
    {
      field: "category",
      headerName: "Category",
      width: isMobile ? 100 : 180,
      minWidth: isMobile ? 80 : 150,
      sortable: true,
      renderCell: (params) => (
        <span>{(params.row.category || '').toUpperCase()}</span>
      ),
    },
    {
      field: "brand",
      headerName: "Brand",
      width: isMobile ? 100 : 180,
      minWidth: isMobile ? 80 : 150,
      sortable: true,
    },
    {
      field: "unit",
      headerName: "Unit",
      width: isMobile ? 80 : 120,
      minWidth: isMobile ? 60 : 100,
      sortable: true,
    },
    {
      field: "totalRemaining",
      headerName: "Total Remaining",
      width: isMobile ? 100 : 150,
      minWidth: isMobile ? 80 : 120,
      renderCell: (params) => (
        <Badge color="info" pill>
          {params.row.stockSummary?.totalRemaining || 0}
        </Badge>
      ),
    },
    {
      field: "totalPurchase",
      headerName: "Total Purchase",
      width: isMobile ? 100 : 150,
      minWidth: isMobile ? 80 : 120,
      renderCell: (params) => (
        <div className="d-flex align-items-center">
          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '12px' : '16px', marginRight: '4px' }} />
          <span style={{ fontSize: isMobile ? '10px' : '14px' }}>{(params.row.stockSummary?.totalPurchaseAmount || 0).toFixed(2)}</span>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isMobile ? 200 : 420,
      minWidth: isMobile ? 180 : 350,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex flex-column flex-md-row gap-1 mt-1">
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddStock(params.row._id);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Plus size={isMobile ? 10 : 15} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "Add Stock"}
          </Button>
          <Button
            color="info"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewStock(params.row._id, e);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Eye size={isMobile ? 10 : 15} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "View"}
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Edit size={isMobile ? 10 : 15} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "Edit"}
          </Button>
          <Button
            color="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row._id);
            }}
            className={isMobile ? 'd-flex align-items-center justify-content-center' : ''}
            style={{ 
              fontSize: isMobile ? '8px' : '10px', 
              padding: isMobile ? '1px 2px' : '2px 4px',
              minWidth: isMobile ? '20px' : 'auto',
              marginRight: '4px',
              display: isMobile ? 'flex' : 'inline-block',
              alignItems: isMobile ? 'center' : 'auto',
              justifyContent: isMobile ? 'center' : 'auto'
            }}
          >
            <Trash size={isMobile ? 10 : 15} className={!isMobile ? "me-1" : ""} />
            {!isMobile && "Delete"}
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
            .products-application {
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
            {isMobile ? (
              <CardHeader className="mobile-card-header d-flex justify-content-end me-2">
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
      <strong>Total Purchase: </strong>
      {isTotalsLoading ? (
        <Spinner size="sm" className="ms-1" />
      ) : (
        <>
          <img
            src={saudiRiyal}
            alt="SAR"
            style={{ width: "20px", verticalAlign: "middle" }}
          />
          <span>{totalPurchase.toFixed(2)}</span>
        </>
      )}
    </div>
  </div>
</CardHeader>

            ) : (
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
            )}
            <CardBody className="mobile-card-body">
              <div className="mobile-search-section">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-2">
                  <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                    <Button
                      color="primary"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="mobile-add-button"
                      style={{ 
                        minWidth: isMobile ? "120px" : "150px",
                        maxWidth: isMobile ? "140px" : "auto"
                      }}
                    >
                      {showAddForm ? "Cancel Add" : isMobile?"Add":"Add New Product"}
                    </Button>

                    {editingProduct && (
                      <>
                        <Button
                          color="success"
                          onClick={handleUpdate}
                          disabled={isSubmitting}
                          className="mobile-add-button"
                          style={{ 
                            minWidth: isMobile ? "100px" : "120px",
                            maxWidth: isMobile ? "120px" : "auto"
                          }}
                        >
                          {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
                        </Button>
                        <Button 
                          color="secondary" 
                          onClick={handleCancelEdit}
                          className="mobile-add-button"
                          style={{ 
                            minWidth: isMobile ? "80px" : "100px",
                            maxWidth: isMobile ? "100px" : "auto"
                          }}
                        >
                          Cancel Edit
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div style={{ width: isMobile ? "100%" : "300px" }}>
                    <div className="position-relative">
                      <Input
                        type="text"
                        placeholder="Search products by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mobile-search-input"
                        style={{ 
                          backgroundColor: isDarkTheme ? '#2d3748' : '#ffffff',
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          border: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                        }}
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
          <div className="mobile-table-container" style={{ height: 400, width: '100%', marginBottom: "40px" }}>
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
                    minWidth: '600px !important',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    minWidth: '600px !important',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    minWidth: '600px !important',
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

              {totalCount > itemsPerPage && (
                <div className="d-flex justify-content-end mt-1">
                  <CustomPagination />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default ProductTable
