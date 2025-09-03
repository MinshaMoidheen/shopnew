// ** React Imports
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import SupplierList from "../../views/suppliers/SupplierList";
import AddSupplier from "../../views/suppliers/addSupplier/AddSupplier";
import ViewSupplierTransaction from "../../views/suppliers/viewTransaction/ViewSupplierTransaction";
import SalesList from "../../views/sales/SalesList";
import AddSales from "../../views/sales/addSales/AddSales";
import ViewStock from "../../views/products/ViewStock";

const Dashboard = lazy(() => import("../../views/dashboard/ecommerce"));
const Centers = lazy(() => import("../../views/centers"));
const Products = lazy(() => import("../../views/products"));
const AddProduct = lazy(() => import("../../views/products/addProduct"));
const EditProduct = lazy(() => import("../../views/products/editProduct"));
const NewStocks = lazy(() => import("../../views/newStocks"));
const AddNewStock = lazy(() => import("../../views/newStocks/addNewStock"));
const EditNewStock = lazy(() => import("../../views/newStocks/editNewStock"));
const Bills = lazy(() => import("../../views/bills"));
const POS = lazy(() => import("../../views/pos"));
const Transactions = lazy(() => import("../../views/transactions"));
const Import = lazy(() => import("../../views/import"));

const AddBill = lazy(() => import("../../views/bills/addBills"));
const ViewBills = lazy(() => import("../../views/bills/viewBills"));

const Logs = lazy(() => import("../../views/logs"));
const Expenses = lazy(() => import("../../views/expenses"));
const AddExpense = lazy(() => import("../../views/expenses/addExpense"));

const ReportPage = lazy(() => import("../../views/reports"));

const AddPOS = lazy(() => import("../../views/pos/addPOS"));
const ViewPOS = lazy(() => import("../../views/pos/viewPOS"));

const Shops = lazy(() => import("../../views/shops"));
const AddShop = lazy(() => import("../../views/shops/addShop"));
const EditShop = lazy(() => import("../../views/shops/editShop"));
const ViewShop = lazy(() => import("../../views/shops/viewShop"));
const ViewUsersPage = lazy(() => import("../../views/centers/ViewUsersPage"));

const AppRoutes = [
  {
    element: <Dashboard />,
    path: "/apps/dashboard",
    meta: {
      appLayout: false,
      className: "dashboard-application",
    },
  },

  {
    element: <Centers />,
    path: "/apps/centers",
    meta: {
      appLayout: true,
      className: "centers-application",
    },
  },
  {
    element: <Products />,
    path: "/apps/products",
  },
  {
    element: <AddProduct />,
    path: "/apps/products/add",
  },
  {
    element: <EditProduct />,
    path: "/apps/products/edit/:id",
  },
  {
    element: <NewStocks />,
    path: "/apps/new-stocks",
  },
  {
    element: <AddNewStock />,
    path: "/apps/new-stocks/add",
  },
  {
    element: <EditNewStock />,
    path: "/apps/new-stocks/edit/:id",
  },
  {
    element: <Bills />,
    path: "/apps/bills",
  },
  {
    element: <POS />,
    path: "/apps/pos",
  },
  {
    element: <Transactions />,
    path: "/apps/transactions",
  },
  {
    element: <Import />,
    path: "/apps/import",
  },
  {
    element: <ViewBills />,
    path: "/apps/bills/view/:id",
  },
  {
    element: <AddBill />,
    path: "/apps/bills/add",
  },
  {
    element: <Logs />,
    path: "/apps/logs",
  },
  {
    element: <Expenses />,
    path: "/apps/expenses",
  },
  
  {
    element: <AddExpense />,
    path: "/apps/expenses/add",
  },
   {
    element: <SupplierList />,
    path: "/apps/suppliers",
  },
  {
    element: <AddSupplier />,
    path: "/apps/suppliers/add",
  },

  {
  path: "/apps/suppliers/view/:id",
  element: <ViewSupplierTransaction />
},
{
    element: <SalesList />,
    path: "/apps/sales",
  },
  {
    element: <AddSales />,
    path: "/apps/sales/add",
  },
  {
    element: <ViewStock />,
    path: "/apps/products/view-stock",
  },
  {
    element: <ReportPage />,
    path: "/apps/reports",
  },
  {
    element: <AddPOS />,
    path: "/apps/pos/add",
  },
  {
    element: <ViewPOS />,
    path: "/apps/pos/view/:id",
  },
  {
    element: <Shops />,
    path: "/apps/shops",
  },
  {
    element: <AddShop />,
    path: "/apps/shops/add",
  },
  {
    element: <EditShop />,
    path: "/apps/shops/edit/:id",
  },
  {
    element: <ViewShop />,
    path: "/apps/shops/view/:id",
  },
  {
    element: <ViewUsersPage />,
    path: "/apps/centers/:centerId/users",
  },
];

export default AppRoutes;
