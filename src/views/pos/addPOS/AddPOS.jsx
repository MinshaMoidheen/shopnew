import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useRef, useState, useEffect } from "react";
import { Plus } from "react-feather";
import Select from 'react-select/async';
import '@styles/react/libs/react-select/_react-select.scss'
import debounce from 'lodash/debounce';

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
import { useGetProductsQuery } from "../../../slices/productApiSlice";
import { useCreatePOSMutation } from "../../../slices/posAiSlice";

const MySwal = withReactContent(Swal);

const AddPOS = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([{ id: 1 }]);
  const [barcode, setBarcode] = useState('');
  const [timer, setTimer] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypeaheadOpen, setIsTypeaheadOpen] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false);
  const[createPOS]=useCreatePOSMutation()
  
    const { data: productsData, refetch: refetchProducts } = useGetProductsQuery({
    page: searchPage,
    limit: 10000,
    ...(searchQuery && { keyword: searchQuery }),
    ...(barcode && { barcode: barcode })
  });

  const transformProductsToOptions = (products = []) => {
    return products.map(product => ({
      value: product._id,
      label: product.name,
      product
    }));
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const result = await refetchProducts();
        if (result.data?.products) {
          const options = transformProductsToOptions(result.data.products);
          setProductOptions(options);
          setInitialOptionsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading initial products:', error);
      }
    };

    if (!initialOptionsLoaded) {
      loadInitialData();
    }
  }, []);

  const loadProductOptions = async (inputValue) => {
    try {
      if (!inputValue) {
        if (!initialOptionsLoaded || productOptions.length === 0) {
          const result = await refetchProducts();
          const options = transformProductsToOptions(result.data?.products || []);
          setProductOptions(options);
          setInitialOptionsLoaded(true);
          return options;
        }
        return productOptions;
      }

      setSearchQuery(inputValue);
      setSearchPage(1);
      const result = await refetchProducts();
      const options = transformProductsToOptions(result.data?.products || []);
      setProductOptions(options);
      return options;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const loadMoreOptions = async () => {
    if (productsData?.pages > searchPage) {
      try {
        setSearchPage(prev => prev + 1);
        const result = await refetchProducts();
        if (result.data?.products) {
          const newOptions = transformProductsToOptions(result.data.products);
          setProductOptions(prev => [...prev, ...newOptions]);
        }
      } catch (error) {
        console.error('Error loading more products:', error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key.length === 1) {
        setBarcode(prev => prev + e.key);
      }

      if (e.key === 'Enter') {
        if (barcode.length >= 6) {
          handleScannedBarcode(barcode);
        }
        setBarcode('');
        return;
      }

      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => {
        setBarcode('');
      }, 100);
      setTimer(newTimer);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timer) clearTimeout(timer);
    };
  }, [barcode, timer]);

  const handleScannedBarcode = async (scannedBarcode) => {
    try {
      setBarcode(scannedBarcode);
      const result = await refetchProducts();
      
      if (result.data?.products?.length > 0) {
        const product = result.data.products[0];
        const itemExists = items.find(item => 
          watch(`items.${items.indexOf(item)}.productId`) === product._id
        );

        if (itemExists) {
          const itemIndex = items.indexOf(itemExists);
          const currentQty = watch(`items.${itemIndex}.quantity`) || 1;
          setValue(`items.${itemIndex}.quantity`, currentQty + 1);
          
          const price = watch(`items.${itemIndex}.sellingPrice`);
          const tax = watch(`items.${itemIndex}.taxPercentage`);
          const discountPercentage = watch(`items.${itemIndex}.discountPercentage`) || 0;
          const itemSubtotal = (currentQty + 1) * price;
          const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
          const newTotal = itemSubtotal - itemDiscountAmount;
          setValue(`items.${itemIndex}.total`, newTotal);
          calculateTotalAmount();
          toast.success('Product quantity incremented');
        } else {
          const newItem = { id: items.length + 1 };
          setItems(prev => [...prev, newItem]);
          const newIndex = items.length;
          
          setValue(`items.${newIndex}.productId`, product._id);
          setValue(`items.${newIndex}.quantity`, 1);
          setValue(`items.${newIndex}.unit`, product.unit || 'pcs');
          setValue(`items.${newIndex}.sellingPrice`, product.price);
          setValue(`items.${newIndex}.taxPercentage`, product.tax || 0);
          setValue(`items.${newIndex}.discountPercentage`, 0);
          setValue(`items.${newIndex}.total`, product.price);
          calculateTotalAmount();
          toast.success('Product added to bill');
        }
      } else {
        toast.error('Product not found');
      }
      setBarcode('');
    } catch (error) {
      toast.error('Error fetching product');
      setBarcode('');
    }
  };

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      items: [{
        productId: "",
        quantity: "",
        sellingPrice: "",
        discountPercentage: 0,
        taxPercentage: 0,
        total: 0,
      }],
    },
  });

  // Calculate total amount including tax and discount
  const calculateTotalAmount = () => {
    let subtotal = 0;

    watchItems.forEach((item) => {
      if (item.quantity && item.sellingPrice) {
        const quantity = parseFloat(item.quantity);
        const price = parseFloat(item.sellingPrice);
        const discountPercentage = parseFloat(item.discountPercentage) || 0;
        
        // Calculate item total with individual discount
        const itemSubtotal = quantity * price;
        const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
        const itemTotal = itemSubtotal - itemDiscountAmount;
        
        subtotal += itemTotal;
      }
    });

    setValue("subtotal", subtotal);
  };

  // Watch for changes in items
  const watchItems = watch("items");

  // Recalculate totals when items change
  useEffect(() => {
    calculateTotalAmount();
  }, [watchItems]);

  const onSubmit = async (formData) => {
    try {
      const saleToSubmit = {
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          sellingPrice: parseFloat(item.sellingPrice),
          discountPercentage: parseFloat(item.discountPercentage) || 0,
          taxPercentage: parseFloat(item.taxPercentage) || 0,
          total: parseFloat(item.total),
        })),
        // subtotal: parseFloat(formData.subtotal),
      };

      console.log("Sale Data:", saleToSubmit);

     
      await createPOS(saleToSubmit).unwrap();
      
      toast.success("Sale created successfully");
      handleReset();
      setItems([{ id: 1 }]);
      navigate("/apps/pos");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create sale");
    }
  };

  const handleReset = () => {
    reset({
      items: [{
        productId: "",
        quantity: "",
        sellingPrice: "",
        discountPercentage: 0,
        taxPercentage: 0,
        total: 0,
      }],
    });
    setItems([{ id: 1 }]);
  };

  const addItemField = () => {
    setItems([...items, { id: items.length + 1 }]);
  };

  const removeItemField = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Handle product selection to auto-fill price
  const handleProductSelect = (selectedOption, index) => {
    if (selectedOption?.product) {
      const product = selectedOption.product;
      const itemExists = items.find((item, idx) => 
        idx !== index && watch(`items.${idx}.productId`) === product._id
      );

      if (itemExists) {
        const itemIndex = items.indexOf(itemExists);
        const currentQty = watch(`items.${itemIndex}.quantity`) || 1;
        setValue(`items.${itemIndex}.quantity`, currentQty + 1);
        
        const price = watch(`items.${itemIndex}.sellingPrice`);
        const discountPercentage = watch(`items.${itemIndex}.discountPercentage`) || 0;
        const itemSubtotal = (currentQty + 1) * price;
        const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
        const newTotal = itemSubtotal - itemDiscountAmount;
        setValue(`items.${itemIndex}.total`, newTotal);
        calculateTotalAmount();

        removeItemField(items[index].id);
        toast.success('Product quantity incremented');
      } else {
        setValue(`items.${index}.productId`, product._id);
        setValue(`items.${index}.quantity`, 1);
        setValue(`items.${index}.unit`, product.unit || 'pcs');
        setValue(`items.${index}.sellingPrice`, product.sellingPrice);
        setValue(`items.${index}.taxPercentage`, product.tax || 0);
        setValue(`items.${index}.discountPercentage`, 0);
        setValue(`items.${index}.total`, product.sellingPrice);
        calculateTotalAmount();
        toast.success('Product added to sale');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle tag="h4">Add Products</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {items?.map((item, index) => (
            <div key={item.id} className="border rounded p-2 mb-2">
              <div className="d-flex justify-content-between mb-1">
                <h6>Item {index + 1}</h6>
                {items.length > 1 && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => removeItemField(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Row>
                <Col lg="3" md="4" className="mb-1">
                  <Label className="form-label" for={`productId-${item.id}`}>
                    Product:
                  </Label>
                  <Controller
                    name={`items.${index}.productId`}
                    control={control}
                    rules={{ required: "Product is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id={`productId-${item.id}`}
                        defaultOptions={productOptions}
                        loadOptions={loadProductOptions}
                        value={productOptions.find(option => option.value === field.value) || null}
                        onChange={(option) => {
                          field.onChange(option ? option.value : '');
                          handleProductSelect(option, index);
                        }}
                        onMenuScrollToBottom={loadMoreOptions}
                        isClearable
                        className={errors?.items?.[index]?.productId ? 'is-invalid' : ''}
                        classNamePrefix="select"
                        isSearchable
                        noOptionsMessage={() => "No products found"}
                        placeholder="--Select--"
                      />
                    )}
                  />
                  {errors?.items?.[index]?.productId && (
                    <small className="text-danger">
                      {errors.items[index].productId.message}
                    </small>
                  )}
                </Col>

                <Col lg="1" md="2" className="mb-1">
                  <Label className="form-label" for={`quantity-${item.id}`}>
                    Qty:
                  </Label>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    rules={{
                      required: "Quantity is required",
                      min: { value: 1, message: "Quantity must be at least 1" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        invalid={!!errors?.items?.[index]?.quantity}
                        // placeholder="qty"
                        onChange={(e) => {
                          field.onChange(e);
                          const quantity = parseFloat(e.target.value) || 0;
                          const price = watch(`items.${index}.sellingPrice`) || 0;
                          const discountPercentage = watch(`items.${index}.discountPercentage`) || 0;
                          const itemSubtotal = quantity * price;
                          const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
                          const newTotal = itemSubtotal - itemDiscountAmount;
                          setValue(`items.${index}.total`, newTotal);
                          calculateTotalAmount();
                        }}
                      />
                    )}
                  />
                  {errors?.items?.[index]?.quantity && (
                    <small className="text-danger">
                      {errors.items[index].quantity.message}
                    </small>
                  )}
                </Col>

                <Col lg="2" md="2" className="mb-1">
                  <Label className="form-label" for={`unit-${item.id}`}>
                    Unit:
                  </Label>
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    rules={{ required: "Unit is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`unit-${item.id}`}
                        invalid={!!errors?.items?.[index]?.unit}
                        placeholder="Unit"
                        disabled
                      />
                    )}
                  />
                </Col>

                <Col lg="2" md="3" className="mb-1">
                  <Label className="form-label" for={`sellingPrice-${item.id}`}>
                    Price:
                  </Label>
                  <Controller
                    name={`items.${index}.sellingPrice`}
                    control={control}
                    rules={{
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`sellingPrice-${item.id}`}
                        type="number"
                        step="0.01"
                        invalid={!!errors?.items?.[index]?.sellingPrice}
                        placeholder="Price"
                        onChange={(e) => {
                          field.onChange(e);
                          const price = parseFloat(e.target.value) || 0;
                          const quantity = watch(`items.${index}.quantity`) || 0;
                          const discountPercentage = watch(`items.${index}.discountPercentage`) || 0;
                          const itemSubtotal = quantity * price;
                          const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
                          const newTotal = itemSubtotal - itemDiscountAmount;
                          setValue(`items.${index}.total`, newTotal);
                          calculateTotalAmount();
                        }}
                      />
                    )}
                  />
                </Col>

                <Col lg="1" md="2" className="mb-1">
                  <Label className="form-label" for={`taxPercentage-${item.id}`}>
                    Tax %:
                  </Label>
                  <Controller
                    name={`items.${index}.taxPercentage`}
                    control={control}
                    rules={{
                      required: "Tax Percentage is required",
                      min: { value: 0, message: "Tax must be positive" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`taxPercentage-${item.id}`}
                        type="number"
                        step="0.01"
                        invalid={!!errors?.items?.[index]?.taxPercentage}
                        placeholder="Tax %"
                        disabled
                        onChange={(e) => {
                          field.onChange(e);
                          calculateTotalAmount();
                        }}
                      />
                    )}
                  />
                </Col>
                <Col lg="1" md="2" className="mb-1">
                  <Label className="form-label" for={`discountPercentage-${item.id}`}>
                    Disc %:
                  </Label>
                  <Controller
                    name={`items.${index}.discountPercentage`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`discountPercentage-${item.id}`}
                        type="number"
                        step="0.01"
                        invalid={!!errors?.items?.[index]?.discountPercentage}
                        placeholder="Disc %"
                        onChange={(e) => {
                          field.onChange(e);
                          const discountPercentage = parseFloat(e.target.value) || 0;
                          const quantity = watch(`items.${index}.quantity`) || 0;
                          const price = watch(`items.${index}.sellingPrice`) || 0;
                          const itemSubtotal = quantity * price;
                          const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
                          const newTotal = itemSubtotal - itemDiscountAmount;
                          setValue(`items.${index}.total`, newTotal);
                          calculateTotalAmount();
                        }}
                      />
                    )}
                  />
                </Col>
                <Col lg="2" md="3" className="mb-1">
                  <Label className="form-label" for={`total-${item.id}`}>
                    Total:
                  </Label>
                  <Controller
                    name={`items.${index}.total`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`total-${item.id}`}
                        type="number"
                        step="0.01"
                        disabled
                      />
                    )}
                  />
                </Col>
              </Row>
            </div>
          ))}

          <Button
            type="button"
            color="secondary"
            className="mb-2"
            onClick={addItemField}
          >
            Add Another Item
          </Button>

          {/* Submit and Reset Buttons */}
          <div className="d-flex justify-content-end mt-2">
            <Button
              className="me-1"
              color="primary"
              type="submit"
            >
              Add Products
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

export default AddPOS; 