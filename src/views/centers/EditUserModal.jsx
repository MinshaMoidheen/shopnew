import React, { useState, useEffect } from "react";
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
} from "reactstrap";

const EditUserModal = ({ open, handleModal, selectedUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phone: "",
    password: ""
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        userName: selectedUser.userName || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        password: ""
      });
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {
      userId: selectedUser._id,
      userName: formData.userName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    };
    onUpdate(updateData);
  };

  return (
    <Modal isOpen={open} toggle={handleModal} className="modal-dialog-centered">
      <ModalHeader toggle={handleModal}>Edit User</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <FormGroup>
            <Label for="userName">User Name</Label>
            <Input
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleModal}>
            Cancel
          </Button>
          <Button color="primary" type="submit">
            Update
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default EditUserModal; 