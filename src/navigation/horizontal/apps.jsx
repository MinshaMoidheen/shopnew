// ** Icons Import
import { Circle, ShoppingCart, User,Box, Layout, Package,Home, UserCheck,ShoppingBag } from 'react-feather'

export default [
  // {
  //   header: 'Pages'
  // },
  {
     id: 'dashbaord',
     title: 'Dashbaord',
     icon: <Home size={20} />,
     navLink: '/apps/dashboard'
   },
   {
     id: 'selling',
     title: 'Selling',
     icon: <ShoppingCart />,
     children: [
       {
         id: 'selling',
         title: 'Selling',
         icon: <Circle size={20} />,
         navLink: '/apps/selling'
       },
       {
         id: 'selling-details',
         title: 'SellingDetails',
         icon: <Circle size={20} />,
         navLink: '/apps/selling-details'
       },
     ]
   },
   {
     id: 'account',
     title: 'Account',
     icon: <UserCheck size={20} />,
     navLink: '/apps/accounts'
   },
   {
     id: 'products',
     title: 'Products',
     icon: <Box size={20} />,
     children: [
       {
         id: 'products-list',
         title: 'Products',
         icon: <Circle size={20} />,
         navLink: '/apps/products'
       },
       {
         id: 'shops',
         title: 'Shops',
         icon: <Circle size={20} />,
         navLink: '/apps/shops'
       }
     ]
   },
   {
     id: 'suppliers',
     title: 'Suppliers',
     icon: <User size={20} />,
     navLink: '/apps/suppliers'
   },
   {
     id: 'categories',
     title: 'Categories',
     icon: <Layout size={20} />,
     navLink: '/apps/categories'
   },
   {
     id: 'stocks',
     title: 'Stocks',
     icon: <Package />,
     children: [
       {
         id: 'stock',
         title: 'Stock',
         icon: <Circle size={20} />,
         navLink: '/apps/stocks'
       },
       {
         id: 'stock-details',
         title: 'StockDetails',
         icon: <Circle size={20} />,
         navLink: '/apps/stocks-details'
       },
     ]
   },
   {
     id: 'branches',
     title: 'Branches',
     icon: <ShoppingBag size={20} />,
     navLink: '/apps/branches'
   },
]
