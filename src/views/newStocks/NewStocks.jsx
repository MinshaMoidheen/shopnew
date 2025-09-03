import React, { Fragment, useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import ReactPaginate from "react-paginate";
import { MoreVertical, Edit, Trash } from "react-feather";

import {
  Card,
  Input,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardHeader,
  CardTitle,
  CardBody,
  Table,
  Spinner,
  Row,
  Col,
  Label,
} from "reactstrap";
import toast from "react-hot-toast";

import {
  useGetAllStocksQuery,
  useDeleteStockMutation,
  useUpdateStockMutation,
} from "../../slices/stockApiSlice";
import { useGetProductsQuery } from "../../slices/productApiSlice";
import { useGetAllSuppliersQuery } from "../../slices/supplierSLice";

import { useNavigate } from "react-router-dom";

import Flatpickr from "react-flatpickr";
import "@styles/react/libs/flatpickr/flatpickr.scss";

const MySwal = withReactContent(Swal);

const NewStocks = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [editingStock, setEditingStock] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [supplierNameState, setSupplierNameState] = useState("");
   const [barcode, setBarcode] = useState('');
    const [timer, setTimer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

  const [updateStock] = useUpdateStockMutation();
  const [deleteStock] = useDeleteStockMutation();

   const { data: productsData, refetch: refetchProducts } = useGetProductsQuery({
    limit: 1000,
    ...(searchQuery && { keyword: searchQuery }),
    ...(barcode && { barcode: barcode })
  });

  console.log("products",productsData)
  const products = productsData?.products || [];

  const {
    data: stocksData = [],
    isLoading,
    refetch,
  } = useGetAllStocksQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const stocks = stocksData.data;
  const totalCount = stocksData.total;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const filteredStocks = stocks?.filter(
    (stock) =>
      stock.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.remainingQuantity
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      stock.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("stocks", filteredStocks);


  const { data: suppliersData = [] } = useGetAllSuppliersQuery({
    page: 1,
    limit: 0,
  });
  const suppliers = suppliersData?.data || [];

  console.log("suppliers", suppliers);

  const handleEditInputChange = (field, e) => {
    if (field === "expiryDate") {
      const purchaseDate = new Date(editingStock.purchaseDate);
      const selectedExpiryDate = new Date(e.target.value);

      if (selectedExpiryDate < purchaseDate) {
        toast.error("Expiry date cannot be before purchase date");
        return;
      }
    }

    setEditingStock((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleEdit = () => {
    if (!selectedRow) {
      toast.error("Please select a stock to edit");
      return;
    }
    const stock = stocks.find((s) => s._id === selectedRow);
    setEditingStock(stock);
    console.log("eeeeestock", stock);
  };

  const handleDeleteClick = async (id) => {
    if (!selectedRow) {
      toast.error("Please select a stock to delete");
      return;
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
          await deleteStock(selectedRow).unwrap();
          refetch();
          toast.success("Your file has been deleted");
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete data.");
        }
      }
    });
    refetch();
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
  };

  const handleRowClick = (rowId) => {
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log("editingStock", editingStock);
      const stockToUpdate = {
        ...editingStock,
        productId: editingStock.productId,
        supplier: editingStock.supplier,
      };
      await updateStock({
        stockId: editingStock._id,
        data: stockToUpdate,
      }).unwrap();
      toast.success("Stock updated successfully!");
      setEditingStock(null);
      setSelectedRow(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update stock");
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

 

  const handleAddStock = () => {
    navigate("/apps/new-stocks/add");
  };

  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1);
  };

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=""
      nextLabel=""
      forcePage={currentPage - 1}
      onPageChange={handlePagination}
      pageCount={
        searchTerm.length
          ? Math.ceil(filteredStocks.length / itemsPerPage)
          : Math.ceil(totalCount / itemsPerPage) || 1
      }
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
  );

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

  console.log("stock edit", editingStock);
  console.log("selected stock", selectedRow);
  return (
    <Fragment>
      <Card className="w-100">
        <CardHeader>
          <CardTitle tag="h4">Stocks List</CardTitle>
        </CardHeader>
        <CardBody>
          <Row className="mx-0 mt-1 mb-2">
            <Col md="3" sm="12" className="mb-1">
              <Label for="startDate">Date</Label>
              <Flatpickr
                className="form-control"
                id="startDate"
                value={startDate}
                onChange={(date) => setStartDate(date[0])}
                options={{
                  dateFormat: "Y-m-d",
                  allowInput: true,
                  defaultDate: new Date(),
                }}
                placeholder="Select Date"
                required
              />
            </Col>

            <Col md="3" sm="12" className="mb-1">
              <Label for="supplierName">SupplierName</Label>
              <Input
                type="text"
                id="supplierName"
                value={supplierNameState}
                onChange={(e) => setSupplierNameState(e.target.value)}
                required
              ></Input>
            </Col>
            <Col md="3" sm="12" className="mb-1 d-flex align-items-end">
              <Button
                color="primary"
                className="w-100 me-1"
                // onClick={handleSearch}
                // disabled={!startDate || !centerState}
              >
                Search
              </Button>
              <Button
                color="secondary"
                className="w-100"
                //  onClick={handleClearFilters}
              >
                Clear
              </Button>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex gap-2">
              <Button color="primary" onClick={handleAddStock}>
                Add New Stock
              </Button>
              {!editingStock && (
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
                    onClick={handleDeleteClick}
                    disabled={!selectedRow}
                  >
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
            <div style={{ width: "300px" }}>
              <Input
                type="text"
                placeholder="Search stocks by product name, batch number or supplier name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table bordered responsive hover style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "220px", minWidth: "220px" }}>
                  Product Name
                </th>
                <th style={{ width: "150px" }}>Remaining</th>
                <th style={{ width: "150px" }}>Purchase Amount</th>
                <th style={{ width: "150px" }}>Paid Amount</th>
                <th style={{ width: "150px" }}>Due Amount</th>
                <th style={{ width: "130px" }}>Quantity</th>
                <th style={{ width: "150px" }}>Total Amount</th>
                <th style={{ width: "180px" }}>Purchase Date</th>
                {/* <th style={{ width: "180px" }}>Expiry Date</th>
                <th style={{ width: "200px", minWidth: "200px" }}>
                  Supplier Name
                </th> */}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    <Spinner size="sm" color="primary" /> Loading...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    No stocks found
                  </td>
                </tr>
              ) : (
                filteredStocks.map((row, idx) => (
                  <tr
                    key={row._id || idx}
                    onClick={() => !editingStock && handleRowClick(row._id)}
                    className={selectedRow === row._id ? "table-primary" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ width: "220px", minWidth: "220px" }}>
                      <Input
                        type="select"
                        value={
                          editingStock?._id === row._id
                            ? editingStock.productId._id
                            : row?.productId?._id
                        }
                        onChange={(e) => handleEditInputChange("productId", e)}
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      >
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </Input>
                    </td>
                    <td style={{ width: "150px" }}>
                      <Input
                        value={
                          editingStock?._id === row._id
                            ? editingStock.remainingQuantity
                            : row.remainingQuantity
                        }
                        onChange={(e) =>
                          handleEditInputChange("remainingQuantity", e)
                        }
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "150px" }}>
                      <Input
                        value={
                          editingStock?._id === row._id
                            ? editingStock.purchaseAmount
                            : row.purchaseAmount
                        }
                        onChange={(e) =>
                          handleEditInputChange("purchaseAmount", e)
                        }
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "150px" }}>
                      <Input
                        value={
                          editingStock?._id === row._id
                            ? editingStock.paidAmount
                            : row.paidAmount
                        }
                        onChange={(e) => handleEditInputChange("paidAmount", e)}
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "150px" }}>
                      <Input
                        value={
                          editingStock?._id === row._id
                            ? editingStock.dueAmount
                            : row.dueAmount
                        }
                        onChange={(e) => handleEditInputChange("dueAmount", e)}
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "130px" }}>
                      <Input
                        value={
                          editingStock?._id === row._id
                            ? editingStock.quantity
                            : row.quantity
                        }
                        onChange={(e) => handleEditInputChange("quantity", e)}
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "130px" }}>
                      {editingStock?._id === row._id ? (
                        <Input
                          value={editingStock.purchaseAmount * editingStock.quantity}
                          disabled
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <Input
                          value={row.purchaseAmount * row.quantity}
                          disabled
                          style={{ width: "100%" }}
                        />
                      )}
                    </td>
                    <td style={{ width: "180px" }}>
                      <Input
                        type="date"
                        value={
                          editingStock?._id === row._id
                            ? formatDateForInput(editingStock.purchaseDate)
                            : formatDateForInput(row.purchaseDate)
                        }
                        onChange={(e) =>
                          handleEditInputChange("purchaseDate", e)
                        }
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      />
                    </td>
                    {/* <td style={{ width: "180px" }}>
                      <Input
                        type="date"
                        value={
                          editingStock?._id === row._id
                            ? formatDateForInput(editingStock.expiryDate)
                            : formatDateForInput(row.expiryDate)
                        }
                        onChange={(e) => handleEditInputChange("expiryDate", e)}
                        disabled={editingStock?._id !== row._id}
                        min={
                          editingStock?._id === row._id
                            ? formatDateForInput(editingStock.purchaseDate)
                            : formatDateForInput(row.purchaseDate)
                        }
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ width: "200px", minWidth: "200px" }}>
                      <Input
                        type="select"
                        value={
                          editingStock?._id === row._id
                            ? editingStock.supplier?._id
                            : row?.supplier?._id
                        }
                        onChange={(e) =>
                          handleEditInputChange("supplier", e)
                        }
                        disabled={editingStock?._id !== row._id}
                        style={{ width: "100%" }}
                      >
                        {suppliers?.map((supplier) => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.supplierName}
                          </option>
                        ))}
                      </Input>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {totalCount && (
            <div className="d-flex justify-content-end mt-1">
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
                containerClassName="pagination react-paginate separated-pagination pagination-sm justify-content-end pe-1"
              />
            </div>
          )}

          {editingStock && (
            <div className="d-flex gap-2 mt-2">
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
            </div>
          )}
        </CardBody>
      </Card>
    </Fragment>
  );
};

export default NewStocks;
