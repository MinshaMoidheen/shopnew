// ** Icons Import
import { Box, Package, ShoppingBag, DollarSign, FileText, FilePlus, File ,User, Truck, ShoppingCart, CreditCard, Home, Activity, Upload } from 'react-feather'
import { LineChart } from 'recharts';

// Define navigation items
const navigationItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Home size={20} />,
    navLink: '/apps/dashboard'
  },
  {
    id: 'centers',
    title: 'Centers',
    icon: <ShoppingBag size={20} />,
    navLink: '/apps/centers'
  },
  {
    id: 'products',
    title: 'Products',
    icon: <Box size={20} />,
     navLink: '/apps/products'
    
  },
  {
        id: 'shops',
        title: 'Shops',
        icon: <ShoppingCart size={20} />,
        navLink: '/apps/shops'
      },
   {
       id: 'suppliers',
       title: 'Suppliers',
       icon: <User size={20} />,
       navLink: '/apps/suppliers'
     },
     
  // {
  //   id: 'new-stocks',
  //   title: 'New Stocks',
  //   icon: <Truck size={20} />,
  //   navLink: '/apps/new-stocks'
  // },
  {
    id: 'bills',
    title: 'Bills',
    icon: <FileText size={20} />,
    navLink: '/apps/bills'
  },
  // {
  //   id: 'pos',
  //   title: 'POS',
  //   icon: <ShoppingCart size={20} />,
  //   navLink: '/apps/pos'
  // },
  // {
  //      id: 'sales',
  //      title: 'Sales/Expenses',
  //      icon: <CreditCard size={20} />,
  //      navLink: '/apps/sales'
  //    },
  {
    id: 'sales/expenses',
    title: 'Sales & Expense',
    icon: <DollarSign size={20} />,
    navLink: '/apps/expenses'
  },
  {
    id: 'transactions',
    title: 'Miscellaneous',
    icon: <Activity size={20} />,
    navLink: '/apps/transactions'
  },
  {
    id: 'import',
    title: 'Import',
    icon: <Upload size={20} />,
    navLink: '/apps/import'
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <File size={20} />,
    navLink: '/apps/reports'
  },
  {
    id: 'logs',
    title: 'Logs',
    icon: <FilePlus size={20} />,
    navLink: '/apps/logs'
  }
];

// Define routes to hide for staff users
const staffHiddenRoutes = ['centers', 'products', 'new-stocks', 'expenses', 'logs', 'pos'];

// Function to get user role
const getUserRole = () => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      return parsedData.role || '';
    } catch (error) {
      console.error('Error parsing userData:', error);
      return '';
    }
  }
  return '';
};

// Function to get filtered navigation items
const getFilteredItems = () => {
  const userRole = getUserRole();
  
  // If no role is found, return all items
  if (!userRole) {
    return navigationItems;
  }

  // For staff users, only show dashboard and bills
  if (userRole === 'staff') {
    return navigationItems.filter(item => 
      item.id === 'dashboard' || item.id === 'bills' || item.id === 'pos'
    );
  }

  // For other roles (admin), show all items
  return navigationItems;
};

// Create a custom event for navigation updates
const NAVIGATION_UPDATE_EVENT = 'navigationUpdate';

// Create a proxy to handle navigation updates
const navigationProxy = {
  items: getFilteredItems(),
  update() {
    this.items = getFilteredItems();
    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent(NAVIGATION_UPDATE_EVENT, {
      detail: { items: this.items }
    }));
  }
};

// Listen for storage changes
window.addEventListener('storage', (e) => {
  if (e.key === 'userData') {
    navigationProxy.update();
  }
});

// Listen for custom navigation updates
window.addEventListener('localStorageChange', () => {
  navigationProxy.update();
});

// Add a function to force update navigation
const forceUpdateNavigation = () => {
  navigationProxy.update();
};

// Make the force update function available globally
window.forceUpdateNavigation = forceUpdateNavigation;

// Create a function to update navigation items
const updateNavigationItems = () => {
  const items = getFilteredItems();
  navigationProxy.items = items;
  window.dispatchEvent(new CustomEvent(NAVIGATION_UPDATE_EVENT, {
    detail: { items }
  }));
};

// Make the update function available globally
window.updateNavigationItems = updateNavigationItems;

// Export the proxy's items
export default navigationProxy.items;
