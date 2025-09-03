import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useState } from "react";

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
  Col
} from "reactstrap";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { useCreateSupplierMutation } from "../../../slices/supplierSLice";

const MySwal = withReactContent(Swal);

const AddSupplier = () => {
  const navigate = useNavigate();
   const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const supplierquery = queryParams.get("supplierName");

  const [createSupplier, { isLoading }] = useCreateSupplierMutation();

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      supplierName: supplierquery || "",
      location: "",
      vatNumber: "",
      dueAmount: 0,
      paidAmount: 0,
      modeOfPayment: "cash",
      paymentDate: ""
    }
  });

  const onSubmit = async (data) => {
    try {
      await createSupplier(data).unwrap();
      toast.success("Supplier added successfully");
      handleReset();
      navigate("/apps/suppliers");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add supplier");
    }
  };

  const handleReset = () => {
    reset({
      supplierName: "",
      location: "",
      vatNumber: "",
      dueAmount: 0,
      paidAmount: 0,
      modeOfPayment: "cash",
      paymentDate: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Add New Supplier</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md="6" className="mb-1">
              <Label className="form-label" for="supplierName">
                Supplier Name:
              </Label>
              <Controller
                name="supplierName"
                control={control}
                rules={{ required: "Supplier Name is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="supplierName"
                    invalid={!!errors.supplierName}
                    placeholder="Enter Supplier Name"
                  />
                )}
              />
              {errors.supplierName && (
                <small className="text-danger">
                  {errors.supplierName.message}
                </small>
              )}
            </Col>

            <Col md="6" className="mb-1">
              <Label className="form-label" for="location">
                Location:
              </Label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="location"
                    placeholder="Enter Location"
                  />
                )}
              />
            </Col>

            <Col md="6" className="mb-1">
              <Label className="form-label" for="vatNumber">
                VAT Number:
              </Label>
              <Controller
                name="vatNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="vatNumber"
                    placeholder="Enter VAT Number"
                  />
                )}
              />
            </Col>

            {/* <Col md="6" className="mb-1">
              <Label className="form-label" for="dueAmount">
                Due Amount:
              </Label>
              <Controller
                name="dueAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    id="dueAmount"
                    placeholder="Enter Due Amount"
                  />
                )}
              />
            </Col>

            <Col md="6" className="mb-1">
              <Label className="form-label" for="paidAmount">
                Paid Amount:
              </Label>
              <Controller
                name="paidAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    id="paidAmount"
                    placeholder="Enter Paid Amount"
                  />
                )}
              />
            </Col> */}

            {/* <Col md="6" className="mb-1">
              <Label className="form-label" for="modeOfPayment">
                Mode of Payment:
              </Label>
              <Controller
                name="modeOfPayment"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="select"
                    id="modeOfPayment"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </Input>
                )}
              />
            </Col>

            <Col md="6" className="mb-1">
              <Label className="form-label" for="paymentDate">
                Payment Date:
              </Label>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    id="paymentDate"
                    placeholder="Select Payment Date"
                  />
                )}
              />
            </Col> */}
          </Row>

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

export default AddSupplier;
