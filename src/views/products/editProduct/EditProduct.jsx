import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useRef, useState, useEffect } from "react";
import { Plus } from "react-feather";

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
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../../../slices/productApiSlice";

const MySwal = withReactContent(Swal);

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: product, isLoading, refetch } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      barcode: "",
      category: "",
      brand: "",
      unit: "",
      isTaxIncluded: false,
    },
  });

  // Update form when product data is loaded
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        barcode: product.barcode || "",
        category: product.category.toUpperCase() || "",
        brand: product.brand || "",
        unit: product.unit || "",
        isTaxIncluded: product.isTaxIncluded || false,
      });
    }
  }, [product, reset]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const onSubmit = async (formData) => {
    try {
      // Transform the data into the format expected by the backend
      const productToSubmit = {
        name: formData.name,
        barcode: formData.barcode,
        category: formData.category,
        brand: formData.brand,
        unit: formData.unit,
        isTaxIncluded: formData.isTaxIncluded || false,
      };

      console.log("Updating product:", productToSubmit);

      const response = await updateProduct({
        productId: product._id,
        data: productToSubmit,
      }).unwrap();
      toast.success("Product updated successfully");
      navigate("/apps/products");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update product");
    }
  };

  const handleBack = () => {
    navigate("/apps/products");
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
              <Label className="form-label" for="name">
                Product Name:
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Product Name is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    invalid={!!errors?.name}
                    placeholder="Enter Product Name"
                  />
                )}
              />
              {errors?.name && (
                <small className="text-danger">{errors.name.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for="barcode">
                Barcode:
              </Label>
              <Controller
                name="barcode"
                control={control}
                rules={{
                  required: "Barcode is required",
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="barcode"
                    invalid={!!errors?.barcode}
                    placeholder="Enter Barcode"
                  />
                )}
              />
              {errors?.barcode && (
                <small className="text-danger">{errors.barcode.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for="category">
                Category:
              </Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="category"
                    invalid={!!errors?.category}
                    type="text"
                    placeholder="Enter Category"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
              {errors?.category && (
                <small className="text-danger">{errors.category.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for="brand">
                Brand:
              </Label>
              <Controller
                name="brand"
                control={control}
                rules={{ required: "Brand is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="brand"
                    invalid={!!errors?.brand}
                    placeholder="Enter Brand"
                  />
                )}
              />
              {errors?.brand && (
                <small className="text-danger">{errors.brand.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1">
              <Label className="form-label" for="unit">
                Unit:
              </Label>
              <Controller
                name="unit"
                control={control}
                rules={{ required: "Unit is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="unit"
                    invalid={!!errors?.unit}
                    type="select"
                  >
                    <option value="">Select Unit</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="ltr">ltr</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </Input>
                )}
              />
              {errors?.unit && (
                <small className="text-danger">{errors.unit.message}</small>
              )}
            </Col>

            <Col lg="3" md="6" className="mb-1 d-flex align-items-end">
              <Label className="form-label me-1" for="isTaxIncluded">
                Is Tax Included:
              </Label>
              <Controller
                name="isTaxIncluded"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="isTaxIncluded"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
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

export default EditProduct;
