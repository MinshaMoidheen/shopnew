import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Label,
  Input,
  Row,
  Col,
  Spinner,
  Table
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCentersQuery } from "../../../slices/centersSlice";
import toast from "react-hot-toast";

const ViewPOS = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchPage] = useState(1);

  // Mock data - replace with actual API call when available
  const [posData, setPosData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: centersData } = useGetCentersQuery({
    page: searchPage,
    limit: 100000,
  });

  const getCenterName = (centerId) => {
    const center = centersData?.data?.find(c => c._id === centerId);
    return center ? center.centerName : centerId;
  };

  useEffect(() => {
    // Mock data loading - replace with actual API call
    const loadPOSData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API response
        const mockData = {
          _id: id,
          items: [
            {
              productId: { name: "Product 1", code: "P001" },
              quantity: 2,
              unit: "pcs",
              sellingPrice: 500,
              discountPercentage: 2,
              taxPercentage: 15,
              total: 980
            },
            {
              productId: { name: "Product 2", code: "P002" },
              quantity: 1,
              unit: "pcs",
              sellingPrice: 200,
              discountPercentage: 0,
              taxPercentage: 15,
              total: 230
            }
          ]
        };
        
        setPosData(mockData);
      } catch (err) {
        setError(err);
        toast.error("Failed to load POS details");
      } finally {
        setIsLoading(false);
      }
    };

    loadPOSData();
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load POS details");
      navigate("/apps/pos");
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner color="primary" />
      </div>
    );
  }

  if (!posData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-danger">POS not found</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">POS Details</CardTitle>
        <Button color="secondary" onClick={() => navigate("/apps/pos")}>
          Back to POS
        </Button>
      </CardHeader>
      <CardBody>
      

        <Table bordered responsive className="mt-2">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Selling Price</th>
              <th>Discount %</th>
              <th>Tax %</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {posData?.items?.map((item, index) => (
              <tr key={index}>
                <td>{item.productId?.name || ''}</td>
                <td>{item.quantity || 0}</td>
                <td>{item.unit || ''}</td>
                <td>${item.sellingPrice || 0}</td>
                <td>{item.discountPercentage || 0}%</td>
                <td>{item.taxPercentage || 0}%</td>
                <td>${item.total || 0}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default ViewPOS; 