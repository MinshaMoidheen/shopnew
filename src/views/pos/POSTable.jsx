import React, { useState } from "react";
import { Eye } from "react-feather";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";

import {
  Row,
  Col,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Input,
  Label,
  Button,
  Spinner,
  Badge,
  Table,
} from "reactstrap";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";
import { useGetAllPOSQuery, useDeletePOSMutation } from "../../slices/posAiSlice";

const MySwal = withReactContent(Swal);

const POSTable = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  // Get POS data using RTK Query
  const { data: posDataResponse, isLoading, error, refetch } = useGetAllPOSQuery({
    page: 1,
    limit: 1000,
  });

  const [deletePOS] = useDeletePOSMutation();

  const posData = posDataResponse?.data || [];

  // Filter POS data based on search
  const filteredPOSData = posData.filter(pos =>
    pos.items?.[0]?.productId?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    pos.items?.[0]?.quantity?.toString().includes(searchValue) ||
    pos.items?.[0]?.sellingPrice?.toString().includes(searchValue)
  );

  const handleDelete = async () => {
    if (!selectedRow) {
      toast.error("Please select a POS to delete");
      return;
    }
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

      if (result.value) {
        await deletePOS(selectedRow).unwrap();
        toast.success("POS deleted successfully");
        setSelectedRow(null);
        refetch();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete POS");
    }
  };

  const handleRowClick = (rowId) => {
    setSelectedRow(rowId === selectedRow ? null : rowId);
  };

  const handleViewPOS = (posId) => {
    navigate(`/apps/pos/view/${posId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Point of Sale Records</CardTitle>
      </CardHeader>
      <CardBody>
        
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex gap-2">
                <Button color="primary" onClick={() => navigate("/apps/pos/add")}>
                  Add New POS
                </Button>
                <Button
                  color="danger"
                  onClick={handleDelete}
                  disabled={!selectedRow}
                >
                  Delete Selected
                </Button>
              </div>
              <div style={{ width: "300px" }}>
                <Input
                  type="text"
                  placeholder="Search POS..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>

            {/* POS Table */}
            <Table bordered responsive hover>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Selling Price</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Total Amount</th>
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredPOSData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No POS records found
                    </td>
                  </tr>
                ) : (
                  filteredPOSData.map((pos) => (
                    <tr
                      key={pos._id}
                      onClick={() => handleRowClick(pos._id)}
                      onDoubleClick={() => handleViewPOS(pos._id)}
                      className={selectedRow === pos._id ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{pos.items?.[0]?.productId?.name || pos.items?.[0]?.productId || 'N/A'}</td>
                      <td>{pos.items?.[0]?.quantity || 0}</td>
                      <td>${pos.items?.[0]?.sellingPrice || 0}</td>
                      <td>{pos.items?.[0]?.taxPercentage || 0}%</td>
                      <td>{pos.items?.[0]?.discountPercentage || 0}%</td>
                      <td>${pos.items?.[0]?.total || 0}</td>
                      {/* <td>
                        <div className="d-flex gap-1">
                          <Button
                            color="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPOS(pos._id);
                            }}
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </>
      </CardBody>
    </Card>
  );
};

export default POSTable; 