import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardBody, Button, Form, Row, Col, Input, Spinner, Label } from "reactstrap";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCreateSaleMutation } from "../../../slices/salesSlice";
import { useGetCentersQuery } from "../../../slices/centersSlice";

const AddSales = () => {
   const navigate = useNavigate();
  const [createSale, { isLoading }] = useCreateSaleMutation();
  const { data: centersData, isLoading: centersLoading, error: centersError } = useGetCentersQuery({ page: 1, limit: 1000 });
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      inHand: 0,
      inBank: 0,
      expense: 0,
      dateOfEntry: "",
      center: ""
    }
  });

  const onSubmit = async (data) => {
    try {
      await createSale({
        inHand: Number(data.inHand),
        inBank: Number(data.inBank),
        expense: Number(data.expense),
        date: data.dateOfEntry,
        center: data.center
      }).unwrap();
      toast.success("Sale added successfully!");
      reset();
      navigate("/apps/sales");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add sale");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Add New Sale</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md="4" className="mb-1">
              <Label>In Hand</Label>
              <Controller
                name="inHand"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min="0" required />
                )}
              />
            </Col>
            <Col md="4" className="mb-1">
              <Label>In Bank</Label>
              <Controller
                name="inBank"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min="0" required />
                )}
              />
            </Col>
            <Col md="4" className="mb-1">
              <Label>Expense</Label>
              <Controller
                name="expense"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min="0" required />
                )}
              />
            </Col>
            <Col md="4" className="mb-1">
              <Label>Date of Entry</Label>
              <Controller
                name="dateOfEntry"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="date" required />
                )}
              />
            </Col>
            <Col md="4" className="mb-1">
              <Label>Center</Label>
              <Controller
                name="center"
                control={control}
                rules={{ required: "Center is required" }}
                render={({ field }) => (
                  <Input {...field} type="select" required invalid={!!errors.center}>
                    <option value="">Select Center</option>
                    {centersLoading ? (
                      <option>Loading centers...</option>
                    ) : centersError ? (
                      <option>Error loading centers</option>
                    ) : (
                      centersData?.data?.map(center => (
                        <option key={center._id} value={center._id}>{center.centerName}</option>
                      ))
                    )}
                  </Input>
                )}
              />
              {errors.center && <small className="text-danger">{errors.center.message}</small>}
            </Col>
          </Row>
          <div className="d-flex justify-content-end mt-2">
            <Button color="primary" type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : "Submit"}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};


export default AddSales
