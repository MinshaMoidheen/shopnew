import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useRef, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useCreateProductMutation } from "../../../slices/productApiSlice";

const MySwal = withReactContent(Swal);

const AddProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([{ id: 1 }]);
  const [createProduct, { isLoading }] = useCreateProductMutation();

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      products: [{
        name: "",
        barcode: "",
        category: "",
        brand: "",
        unit: "",
        isTaxIncluded: false,
      }]
    },
  });

  const onSubmit = async (formData) => {
    try {
      const productsToSubmit = formData.products.map(product => ({
        name: product.name,
        barcode: product.barcode,
        category: product.category.toUpperCase(),
        brand: product.brand,
        unit: product.unit,
        isTaxIncluded: product.isTaxIncluded || false
      }));

      console.log("Submitting products:", productsToSubmit);

      const response = await createProduct(productsToSubmit).unwrap();
      toast.success("Products added successfully");
      handleReset();
      setProducts([{ id: 1 }]);
      navigate("/apps/products");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add products");
    }
  };

  const handleReset = () => {
    reset({
      products: [{
        name: "",
        barcode: "",
        category: "",
        brand: "",
        unit: "",
        isTaxIncluded: false,
      }]
    });
  };

  const addProductField = () => {
    setProducts([...products, { id: products.length + 1 }]);
  };

  const removeProductField = (id) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Add New Product</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {products.map((product, index) => (
            <div key={product.id} className="border rounded p-2 mb-2">
              <div className="d-flex justify-content-between mb-1">
                <h6>Product {index + 1}</h6>
                {products.length > 1 && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeProductField(product.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Row>
                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`name-${product.id}`}>
                    Product Name:
                  </Label>
                  <Controller
                    name={`products.${index}.name`}
                    control={control}
                    rules={{ required: "Product Name is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`name-${product.id}`}
                        invalid={!!errors?.products?.[index]?.name}
                        placeholder="Enter Product Name"
                      />
                    )}
                  />
                  {errors?.products?.[index]?.name && (
                    <small className="text-danger">
                      {errors.products[index].name.message}
                    </small>
                  )}
                </Col>

                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`barcode-${product.id}`}>
                    Barcode:
                  </Label>
                  <Controller
                    name={`products.${index}.barcode`}
                    control={control}
                    rules={{
                      required: "Barcode is required",
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`barcode-${product.id}`}
                        invalid={!!errors?.products?.[index]?.barcode}
                        placeholder="Enter Barcode"
                      />
                    )}
                  />
                  {errors?.products?.[index]?.barcode && (
                    <small className="text-danger">
                      {errors.products[index].barcode.message}
                    </small>
                  )}
                </Col>

                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`category-${product.id}`}>
                    Category:
                  </Label>
                  <Controller
                    name={`products.${index}.category`}
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`category-${product.id}`}
                        invalid={!!errors?.products?.[index]?.category}
                        placeholder="Enter Category"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    )}
                  />
                  {errors?.products?.[index]?.category && (
                    <small className="text-danger">
                      {errors.products[index].category.message}
                    </small>
                  )}
                </Col>

                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`brand-${product.id}`}>
                    Brand:
                  </Label>
                  <Controller
                    name={`products.${index}.brand`}
                    control={control}
                    rules={{ required: "Brand is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`brand-${product.id}`}
                        invalid={!!errors?.products?.[index]?.brand}
                        placeholder="Enter Brand"
                      />
                    )}
                  />
                  {errors?.products?.[index]?.brand && (
                    <small className="text-danger">
                      {errors.products[index].brand.message}
                    </small>
                  )}
                </Col>

                <Col lg="3" md="6" className="mb-1">
                  <Label className="form-label" for={`unit-${product.id}`}>
                    Unit:
                  </Label>
                  <Controller
                    name={`products.${index}.unit`}
                    control={control}
                    rules={{ required: "Unit is required" }}
                    render={({ field }) => (
                      <Input {...field} id={`unit-${product.id}`} 
                      invalid={!!errors?.products?.[index]?.unit}
                      type="select">
                        <option value="">Select Unit</option>
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="ltr">ltr</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </Input>
                    )}
                  />
                  {errors?.products?.[index]?.unit && (
                    <small className="text-danger">
                      {errors.products[index].unit.message}
                    </small>
                  )}
                </Col>

                <Col lg="3" md="6" className="mb-1">
                  <div className="d-flex flex-column justify-content-end h-100">
                    <div className="d-flex align-items-center">
                      <Label className="form-label mb-0 me-2" for={`isTaxIncluded-${product.id}`}>
                        Is Tax Included:
                      </Label>
                      <Controller
                        name={`products.${index}.isTaxIncluded`}
                        control={control}
                        render={({ field }) => (
                          <div className="form-check form-check-primary mt-0">
                            <Input
                              {...field}
                              id={`isTaxIncluded-${product.id}`}
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="form-check-input"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ))}
          <Button
            type="button"
            color="secondary"
            className="mb-2"
            onClick={addProductField}
          >
            Add Another Product
          </Button>

          {/* Submit and Reset Buttons */}
          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : "Submit"}
            </Button>
            <Button
              outline
              color="secondary"
              type="reset"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default AddProduct;
