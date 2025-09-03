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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";

import { useUpdateCenterMutation } from "../../slices/centersSlice";

const EditCenterModal = ({ open, handleModal, selectedCenter, refetch }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      centerName: selectedCenter?.centerName || "",
      centerCode: selectedCenter?.centerCode || "",
    },
  });

  console.log("selectedCenter", selectedCenter)

  const [updateCenter, { isLoading }] = useUpdateCenterMutation()

  const onSubmit = async (formData) => {
    try {
      const response = await updateCenter({
        centerId: selectedCenter._id,
        data: formData
      }).unwrap();
      
      toast.success('Center updated successfully');
      handleModal();
      refetch();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.data?.message || 'Failed to update center');
    }
  };

  return (
    <Modal isOpen={open} toggle={handleModal} className="modal-dialog-centered">
      <ModalHeader toggle={handleModal}>Edit Center</ModalHeader>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <FormGroup>
            <Label for="centerName">Center Name</Label>
            <Controller
              name="centerName"
              control={control}
              rules={{ required: "Center name is required" }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="centerName"
                  placeholder="Enter center name"
                  invalid={errors.centerName}
                />
              )}
            />
            {errors.centerName && (
              <span className="text-danger">{errors.centerName.message}</span>
            )}
          </FormGroup>

          <FormGroup>
            <Label for="centerCode">Center Code</Label>
            <Controller
              name="centerCode"
              control={control}
              rules={{ 
                required: "Center code is required",
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: "Center code must be uppercase letters and numbers only"
                }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="centerCode"
                  placeholder="Enter center code"
                  invalid={errors.centerCode}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
            {errors.centerCode && (
              <span className="text-danger">{errors.centerCode.message}</span>
            )}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" type="submit">
            Update Center
          </Button>
          <Button color="secondary" onClick={handleModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default EditCenterModal; 