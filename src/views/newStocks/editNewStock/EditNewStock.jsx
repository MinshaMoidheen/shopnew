import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {useEffect } from "react";

// ** Reactstrap Imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Label,
  Input,
  Form,
  Spinner,
  Row,
  Col,
} from "reactstrap";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetStockByIdQuery,
  useUpdateStockMutation,
} from "../../../slices/stockApiSlice";
import { useGetProductsQuery } from "../../../slices/productApiSlice";

const MySwal = withReactContent(Swal);

const EditNewStock = () => {
  
  const { id } = useParams();
  const navigate = useNavigate();


  const { data: stock, isLoading, refetch } = useGetStockByIdQuery(id);
  const [updateStock, { isLoading: isUpdating }] = useUpdateStockMutation();
  const { data: productsData } = useGetProductsQuery({
    page: 1,
    limit: 0,
  });
  const products = productsData?.products;

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productId: "",
      quantity: "",
      purchasePrice: "",
      batchNumber: "",
      purchaseDate: "",
      expiryDate: "",
      supplierName: "",
    },
  });

  // Update form when product data is loaded
  useEffect(() => {
    if (stock) {
      // Format the date properly
      const expiryDate = stock.expiryDate
        ? new Date(stock.expiryDate).toISOString().split("T")[0]
        : "";

      const purchaseDate = stock.purchaseDate
        ? new Date(stock.purchaseDate).toISOString().split("T")[0]
        : "";

      reset({
        productId: stock.productId._id,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        batchNumber: stock.batchNumber,
        purchaseDate: purchaseDate,
        expiryDate: expiryDate,
        supplierName: stock.supplierName,
      });
    }
  }, [stock, reset]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const onSubmit = async (formData) => {
    try {
      // Transform the data into the format expected by the backend
      const stockToSubmit = {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        purchaseDate: formData.purchaseDate,
        supplierName: formData.supplierName,
      };

      console.log("Updating stock:", stockToSubmit);

      const response = await updateStock({
        stockId: stock._id,
        data: stockToSubmit,
      }).unwrap();
      toast.success("Stock updated successfully");
      navigate("/apps/new-stocks");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update stock");
    }
  };

  const handleBack = () => {
    navigate("/apps/new-stocks");
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
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Edit Product</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`productId`}>
                Product Name:
              </Label>
              <Controller
                name={`productId`}
                control={control}
                rules={{ required: "Select Product" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`productId`}
                    invalid={!!errors?.productId}
                    type="select"
                  >
                    <option value="">Select Product</option>
                    {products?.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </Input>
                )}
              />
              {errors?.productId && (
                <small className="text-danger">
                  {errors.productId.message}
                </small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`quantity`}>
                Quantity:
              </Label>
              <Controller
                name={`quantity`}
                control={control}
                rules={{
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`quantity`}
                    invalid={!!errors?.quantity}
                    placeholder="Enter Quantity"
                    type="number"
                    min="1"
                  />
                )}
              />
              {errors?.quantity && (
                <small className="text-danger">{errors.quantity.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`purchasePrice`}>
                Purchase Price:
              </Label>
              <Controller
                name={`purchasePrice`}
                control={control}
                rules={{ required: "Purchase Price is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`purchasePrice`}
                    invalid={!!errors?.purchasePrice}
                    type="number"
                    placeholder="Enter Purchase Price"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                )}
              />
              {errors?.purchasePrice && (
                <small className="text-danger">
                  {errors.purchasePrice.message}
                </small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`batchNumber`}>
                Batch Number:
              </Label>
              <Controller
                name={`batchNumber`}
                control={control}
                rules={{ required: "Batch Number is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`batchNumber`}
                    invalid={!!errors?.batchNumber}
                    placeholder="Enter Batch Number"
                  />
                )}
              />
              {errors?.batchNumber && (
                <small className="text-danger">
                  {errors.batchNumber.message}
                </small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`purchaseDate`}>
                Purchase Date:
              </Label>
              <Controller
                name={`purchaseDate`}
                control={control}
                rules={{ required: "Purchase Date is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`purchaseDate`}
                    invalid={!!errors?.purchaseDate}
                    type="date"
                    placeholder="Enter Purchase Date"
                  />
                )}
              />
              {errors?.purchaseDate && (
                <small className="text-danger">
                  {errors.purchaseDate.message}
                </small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`expiryDate`}>
                Expiry Date:
              </Label>
              <Controller
                name={`expiryDate`}
                control={control}
                rules={{ 
                  required: "Expiry Date is required",
                  validate: value => {
                    const purchaseDate = watch(`purchaseDate`);
                    if (!purchaseDate) return "Please select purchase date first";
                    return new Date(value) > new Date(purchaseDate) || "Expiry date must be after purchase date";
                  }
                 }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`expiryDate`}
                    invalid={!!errors?.expiryDate}
                    type="date"
                    placeholder="Enter Expiry Date"
                  />
                )}
              />
              {errors?.expiryDate && (
                <small className="text-danger">
                  {errors.expiryDate.message}
                </small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for={`supplierName`}>
                Supplier Name:
              </Label>
              <Controller
                name={`supplierName`}
                control={control}
                rules={{
                  required: "Supplier Name is required",
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`supplierName`}
                    invalid={!!errors?.supplierName}
                    placeholder="Enter Supplier Name"
                  />
                )}
              />
              {errors?.supplierName && (
                <small className="text-danger">
                  {errors.supplierName.message}
                </small>
              )}
            </Col>
          </Row>

          {/* Submit and Reset Buttons */}
          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? <Spinner size="sm" /> : "Update"}
            </Button>
            <Button
              outline
              color="secondary"
              type="button"
              onClick={handleBack}
            >
              Back
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default EditNewStock;
