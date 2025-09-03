import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Spinner,
  Table,
  Row,
  Col,
  Form,
} from "reactstrap";
import toast from "react-hot-toast";
import ReactPaginate from "react-paginate";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Edit, Trash, Plus } from "react-feather";
import {
  useDeleteSaleMutation,
  useGetAllSalesQuery,
  useUpdateSaleMutation,
} from "../../slices/salesSlice";
import { useGetCentersQuery } from "../../slices/centersSlice";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";

const MySwal = withReactContent(Swal);

const SalesList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteSale] = useDeleteSaleMutation();
  const [updateSale] = useUpdateSaleMutation();

  const { data, isLoading, refetch } = useGetAllSalesQuery({
    page: currentPage,
    limit: itemsPerPage,
    ...(searchTerm && { keyword: searchTerm }),
  });

  const { data: centersData, isLoading: centersLoading } = useGetCentersQuery({
    page: 1,
    limit: 1000,
  });

  const sales = data?.data || [];
  const totalCount = data?.total || 0;

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleRowClick = (rowId) => {
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleAddSale = () => {
    navigate("/apps/sales/add");
  };

  const handleEdit = () => {
    if (!selectedRow) {
      toast.error("Please select a sale to edit");
      return;
    }
    const sale = sales.find((s) => s._id === selectedRow);
    setEditingSale(sale);
  };

  const handleDelete = async () => {
    if (!selectedRow) {
      toast.error("Please select a sale to delete");
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
          await deleteSale(selectedRow).unwrap();
          toast.success("Sale deleted successfully!");
          setSelectedRow(null);
          refetch();
        } catch (error) {
          toast.error(error?.data?.message || "Failed to delete sale");
        }
      }
    });
    refetch();
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
  };

  const handleEditInputChange = (field, e) => {
    const value = e.target.value;
    setEditingSale((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const saleToUpdate = {
        ...editingSale,
        inHand: Number(editingSale.inHand),
        inBank: Number(editingSale.inBank),
        expense: Number(editingSale.expense),
        date: editingSale.dateOfEntry,
      };

      await updateSale({
        salesId: editingSale._id,
        data: saleToUpdate,
      }).unwrap();

      toast.success("Sale updated successfully!");
      setEditingSale(null);
      setSelectedRow(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update sale");
    }
    setIsSubmitting(false);
  };


  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1);
  };

  const filteredSales = sales.filter((sale) => {
    const centerName =
      centersData?.data?.find((center) => center._id === sale.center)
        ?.centerName || "";
    return (
      (centerName &&
        centerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.dateOfEntry &&
        new Date(sale.dateOfEntry)
          .toISOString()
          .split("T")[0]
          .includes(searchTerm))
    );
  });

  const pageCount = searchTerm.length
    ? Math.ceil(filteredSales.length / itemsPerPage)
    : Math.ceil(totalCount / itemsPerPage) || 1;

  const paginatedSales = searchTerm.length
    ? filteredSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : sales;

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=""
      nextLabel=""
      forcePage={currentPage - 1}
      onPageChange={handlePagination}
      pageCount={pageCount}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Sales List</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex gap-2">
            <Button color="primary" onClick={handleAddSale}>
              <Plus size={15} /> Add New Sale
            </Button>
            {!editingSale && (
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
            )}
          </div>
          <div style={{ width: "300px" }}>
            <Input
              type="text"
              placeholder="Search sales by center or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table bordered responsive hover>
          <thead>
            <tr>
              {/* <th>SI No</th> */}
              <th>In Hand</th>
              <th>In Bank</th>
              <th>Expense</th>
              <th>Total Sales</th>
              <th>Date of Entry</th>
              <th>Center</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center">
                  <Spinner size="sm" color="primary" /> Loading...
                </td>
              </tr>
            ) : paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No sales found
                </td>
              </tr>
            ) : (
              paginatedSales.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  onClick={() => !editingSale && handleRowClick(row._id)}
                  className={selectedRow === row._id ? "table-primary" : ""}
                  style={{ cursor: "pointer" }}
                >
                  {/* <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td> */}
                  <td>
                    <Input
                      value={
                        editingSale?._id === row._id
                          ? editingSale.inHand
                          : row.inHand
                      }
                      onChange={(e) => handleEditInputChange("inHand", e)}
                      disabled={editingSale?._id !== row._id}
                      type="number"
                    />
                  </td>
                  <td>
                    <Input
                      value={
                        editingSale?._id === row._id
                          ? editingSale.inBank
                          : row.inBank
                      }
                      onChange={(e) => handleEditInputChange("inBank", e)}
                      disabled={editingSale?._id !== row._id}
                      type="number"
                    />
                  </td>
                  <td>
                    <Input
                      value={
                        editingSale?._id === row._id
                          ? editingSale.expense
                          : row.expense
                      }
                      onChange={(e) => handleEditInputChange("expense", e)}
                      disabled={editingSale?._id !== row._id}
                      type="number"
                    />
                  </td>
                  <td>{row.totalSales}</td>
                  <td>
                    <Input
                      type="date"
                      value={
                        editingSale?._id === row._id
                          ? new Date(editingSale.dateOfEntry)
                              .toISOString()
                              .split("T")[0]
                          : new Date(row.dateOfEntry)
                              .toISOString()
                              .split("T")[0]
                      }
                      onChange={(e) => handleEditInputChange("dateOfEntry", e)}
                      disabled={editingSale?._id !== row._id}
                    />
                  </td>
                  <td>
                    <Input
                      type="select"
                      value={
                        editingSale?._id === row._id
                          ? editingSale.center
                          : row.center
                      }
                      onChange={(e) => handleEditInputChange("center", e)}
                      disabled={editingSale?._id !== row._id}
                    >
                      {centersLoading ? (
                        <option>Loading centers...</option>
                      ) : (
                        centersData?.data?.map((center) => (
                          <option key={center._id} value={center._id}>
                            {center.centerName}
                          </option>
                        ))
                      )}
                    </Input>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {pageCount > 0 && (
          <div className="d-flex justify-content-end mt-1">
            <CustomPagination />
          </div>
        )}

        {editingSale && (
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
  );
};

export default SalesList;
