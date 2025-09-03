import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import { useCreateUserMutation } from "../../slices/authenslice";
import toast from "react-hot-toast";

const AddUserModal = ({ open, handleModal, centerId, refetch }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [createUser, { isLoading }] = useCreateUserMutation();

  const onSubmit = async (data) => {
    try {
      const response = await createUser({
        ...data,
        center: centerId,
        loginId: data.email,
      }).unwrap();
      toast.success("User created successfully");
      handleModal();
      reset();
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create user");
    }
  };

  return (
    <Modal isOpen={open} toggle={handleModal} className="modal-dialog-centered modal-lg">
      <ModalHeader toggle={handleModal}>Add New User</ModalHeader>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="userName">User Name</Label>
                <Controller
                  name="userName"
                  control={control}
                  rules={{ required: "User name is required" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="userName"
                      placeholder="Enter user name"
                      invalid={errors.userName}
                    />
                  )}
                />
                {errors.userName && (
                  <span className="text-danger">{errors.userName.message}</span>
                )}
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      id="email"
                      placeholder="Enter email"
                      invalid={errors.email}
                    />
                  )}
                />
                {errors.email && (
                  <span className="text-danger">{errors.email.message}</span>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="phone">Phone</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="phone"
                      placeholder="Enter phone number"
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="password">Password</Label>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: "Password is required" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      id="password"
                      placeholder="Enter password"
                      invalid={errors.password}
                    />
                  )}
                />
                {errors.password && (
                  <span className="text-danger">{errors.password.message}</span>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="select"
                      id="role"
                      invalid={errors.role}
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </Input>
                  )}
                />
                {errors.role && (
                  <span className="text-danger">{errors.role.message}</span>
                )}
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="accessTo">Access Level</Label>
                <Controller
                  name="accessTo"
                  control={control}
                  defaultValue="center"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="select"
                      id="accessTo"
                    >
                      <option value="all">All</option>
                      <option value="own">Own</option>
                      <option value="center">Center</option>
                    </Input>
                  )}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="4">
              <FormGroup check>
                <Controller
                  name="isActive"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="checkbox"
                      id="isActive"
                      checked={field.value}
                    />
                  )}
                />
                <Label check for="isActive">Active</Label>
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup check>
                <Controller
                  name="isEmailVerified"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="checkbox"
                      id="isEmailVerified"
                      checked={field.value}
                    />
                  )}
                />
                <Label check for="isEmailVerified">Email Verified</Label>
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup check>
                <Controller
                  name="isPhoneVerified"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="checkbox"
                      id="isPhoneVerified"
                      checked={field.value}
                    />
                  )}
                />
                <Label check for="isPhoneVerified">Phone Verified</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" type="submit">
            Add User
          </Button>
          <Button color="secondary" onClick={handleModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default AddUserModal; 