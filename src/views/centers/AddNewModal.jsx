import React, { useState } from "react";
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

import { useCreateCenterMutation } from "../../slices/centersSlice";
import toast from "react-hot-toast";

const AddNewModal = ({ open, handleModal, refetch }) => {
  const [createCenter, { isLoading }] = useCreateCenterMutation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      centerName: '',
      centerCode: ''
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await createCenter(data).unwrap()
      toast.success('Center created successfully')
      handleModal() // Close the modal
      reset() // Reset form
      refetch() // Refresh the centers table
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to create center')
    }
  }

  return (
    <Modal isOpen={open} toggle={handleModal} className='modal-dialog-centered'>
      <ModalHeader toggle={handleModal}>Add New Center</ModalHeader>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <div className='mb-1'>
            <Label className='form-label' for='centerName'>
              Center Name
            </Label>
            <Controller
              id='centerName'
              name='centerName'
              control={control}
              rules={{ required: 'Center name is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  type='text'
                  placeholder='Enter center name'
                  invalid={errors.centerName && true}
                />
              )}
            />
            {errors.centerName && <span className='text-danger'>{errors.centerName.message}</span>}
          </div>

          <div className='mb-1'>
            <Label className='form-label' for='centerCode'>
              Center Code
            </Label>
            <Controller
              id='centerCode'
              name='centerCode'
              control={control}
              rules={{ required: 'Center code is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  type='text'
                  placeholder='Enter center code'
                  invalid={errors.centerCode && true}
                />
              )}
            />
            {errors.centerCode && <span className='text-danger'>{errors.centerCode.message}</span>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={handleModal} outline>
            Cancel
          </Button>
          <Button color='primary' type='submit' disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Center'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default AddNewModal 