import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "@styles/react/libs/flatpickr/flatpickr.scss";

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

import { useAddExpenseMutation } from "../../../slices/expenseApislice";

const AddExpense = () => {
  const navigate = useNavigate();
  const [addExpense, { isLoading }] = useAddExpenseMutation();

  // ** Hooks
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date(),
      description: "",
      amount: "",
      type: "expense",
      cashInHand: "",
    },
  });

  const onSubmit = async (formData) => {
    try {
      await addExpense({
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        cashInHand: parseFloat(formData.cashInHand),
      }).unwrap();
      
      toast.success("Entry added successfully");
      navigate("/apps/expenses");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add entry");
    }
  };

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Add New Entry</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md="6" className="mb-1">
              <Label className="form-label" for="date">
                Date:
              </Label>
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <Flatpickr
                    {...field}
                    className="form-control"
                    options={{
                      dateFormat: "d-m-Y",
                      allowInput: true,
                    }}
                    placeholder="Select Date"
                  />
                )}
              />
              {errors.date && (
                <small className="text-danger">{errors.date.message}</small>
              )}
            </Col>

            <Col md="6" className="mb-1">
              <Label className="form-label" for="type">
                Type:
              </Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="select"
                    id="type"
                    invalid={!!errors.type}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </Input>
                )}
              />
              {errors.type && (
                <small className="text-danger">{errors.type.message}</small>
              )}
            </Col>

            <Col lg="6" className="mb-1">
              <Label className="form-label" for="description">
                Description:
              </Label>
              <Controller
                name="description"
                control={control}
                rules={{ required: "Description is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="textarea"
                    id="description"
                    placeholder="Enter description"
                    invalid={!!errors.description}
                  />
                )}
              />
              {errors.description && (
                <small className="text-danger">{errors.description.message}</small>
              )}
            </Col>

            <Col lg="6" className="mb-1">
              <Label className="form-label" for="amount">
                Amount:
              </Label>
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    id="amount"
                    placeholder="Enter amount"
                    invalid={!!errors.amount}
                  />
                )}
              />
              {errors.amount && (
                <small className="text-danger">{errors.amount.message}</small>
              )}
            </Col>

            <Col lg="6" className="mb-1">
              <Label className="form-label" for="cashInHand">
                Cash in Hand:
              </Label>
              <Controller
                name="cashInHand"
                control={control}
                rules={{
                  required: "Cash in Hand is required",
                  min: { value: 0, message: "Cash in Hand must be positive" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    id="cashInHand"
                    placeholder="Enter cash in hand"
                    invalid={!!errors.cashInHand}
                  />
                )}
              />
              {errors.cashInHand && (
                <small className="text-danger">{errors.cashInHand.message}</small>
              )}
            </Col>
          </Row>

          {/* Submit and Reset Buttons */}
          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : "Add Entry"}
            </Button>
            <Button
              outline
              color="secondary"
              type="button"
              onClick={() => navigate("/apps/expenses")}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default AddExpense; 