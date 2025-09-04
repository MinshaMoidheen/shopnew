// ** React Imports
import { useContext, useEffect, useState } from 'react'

// ** Reactstrap Imports
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Table, Badge } from 'reactstrap'
import saudiRiyal from '../../../assets/images/pages/riyaal.png';

// ** Context
import { ThemeColors } from '@src/utility/context/ThemeColors'

// ** Styles
import '@styles/react/libs/charts/apex-charts.scss'
import '@styles/base/pages/dashboard-ecommerce.scss'

// ** Third Party Components
import ReactApexcharts from 'react-apexcharts'

// ** API
import { useGetAllStocksQuery } from '../../../slices/stockApiSlice'
import { useDashboardQuery } from '../../../slices/dashboardApiSlice'
import { useGetAllExpensesQuery, useGetExpensesQuery, useGetLastTransactionQuery } from '../../../slices/expenseApislice'
import { Home, ShoppingBag, Tag, TrendingDown } from 'react-feather'
import { useGetSupplierTotalsQuery } from '../../../slices/supplierSLice';
import { useGetAllBillsQuery } from '../../../slices/billApislice';

const Dashboard = () => {
  // ** Context
  const { colors } = useContext(ThemeColors)

  // ** Mobile and Theme Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767)
  const [currentTheme, setCurrentTheme] = useState('light')

  // Get theme from localStorage
  const getThemeFromStorage = () => {
    const skin = localStorage.getItem('skin');
    if (skin?.toLowerCase()?.includes('dark')) {
      return 'dark';
    }
    return 'light';
  };

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getThemeFromStorage());
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for theme changes (in case localStorage is updated in same tab)
    const interval = setInterval(() => {
      const newTheme = getThemeFromStorage();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentTheme]);

  // Helper function for theme comparison - more robust
  const isDarkTheme = currentTheme?.toLowerCase()?.trim() === "dark" || 
                      currentTheme?.toLowerCase()?.includes("dark");

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ** API Hooks
  const { data: stocksData = [], refetch } = useGetAllStocksQuery({
    page: 1,
    limit: 0
  })

  const { data: supplierTransactionData = [],refetch:supplierTransactionDataRefetch } = useGetSupplierTotalsQuery({
    page: 1,
    limit: 0
  })

  console.log("supplierTransactionData",supplierTransactionData)

  const { data: billsData = [], } = useGetAllBillsQuery({
    page: 1,
    limit: 0
  })

  const { data: expensesData = [], } = useGetAllExpensesQuery({
    page: 1,
    limit: 0
  })
console.log("expensesData",expensesData)
  

  useEffect(()=>{
    supplierTransactionDataRefetch()
  },[supplierTransactionDataRefetch])

  const today = new Date();
  const priorDate = new Date();
  priorDate.setDate(today.getDate() - 30);
  
  const { data: dashboardData = {}, refetch: dashboardRefetch } = useDashboardQuery({
    from: priorDate.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  });

  // Get last transaction data for bank totals
  const { 
    data: lastTransactionData, 
    isLoading: lastTransactionLoading, 
    error: lastTransactionError 
  } = useGetLastTransactionQuery();

  const { sales = {}, suppliers = {}, lowStocks = [], recentLogs = [], totalBills = 0 } = dashboardData;

  // Debug logging
  console.log('Dashboard - lastTransactionData:', lastTransactionData);
  console.log('Dashboard - lastTransactionLoading:', lastTransactionLoading);
  console.log('Dashboard - lastTransactionError:', lastTransactionError);

  // ** State
  const [lowStockProducts, setLowStockProducts] = useState([])

  useEffect(() => {
    if (stocksData?.data) {
      const lowStock = stocksData.data
        .filter(stock => stock.remainingQuantity < 10)
        .map(stock => ({
          name: stock.productId?.name || 'Unknown Product',
          quantity: stock.remainingQuantity
        }))
      setLowStockProducts(lowStock)
    }
  }, [stocksData])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Calculate totals from expense data
  const calculateExpenseTotals = () => {
    if (!expensesData || !expensesData.summary) {
      return {
        totalSales: 0,
        totalCashInHand: 0,
        totalExpenses: 0
      };
    }

    const { summary } = expensesData;
    
    return {
      totalSales: summary.totalIncome || 0,
      totalCashInHand: summary.totalCash || 0,
      totalExpenses: summary.totalExpense || 0
    };
  };

  const expenseTotals = calculateExpenseTotals();

  // ** Chart Options
  const options = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: lowStockProducts.map(product => product.name)
    },
    yaxis: {
      title: {
        text: 'Remaining Quantity'
      }
    },
    fill: {
      opacity: 1,
      colors: [colors.warning.main]
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + ' units'
        }
      }
    }
  }

  const series = [
    {
      name: 'Remaining Quantity',
      data: lowStockProducts.map(product => product.quantity)
    }
  ]

  // Function to calculate total bills amount
  const calculateTotalBills = (billsData) => {
    if (!billsData || !billsData.data || !Array.isArray(billsData.data)) {
      return 0;
    }
    
    return billsData.data.reduce((sum, bill) => {
      return sum + (Number(bill.totalAmount) || 0);
    }, 0);
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 767.98px) {
            .app-content, .content-area-wrapper, .container, .main-content, .content-wrapper {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              position: relative !important;
            }
            .dashboard-application {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            .mobile-container {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: calc(100vh - 60px) !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              position: fixed !important;
              top: 60px !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              box-sizing: border-box !important;
            }
            .mobile-card {
              width: 100% !important;
              max-width: 100% !important;
              margin-bottom: 1rem !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .mobile-card-header {
              padding: 1rem !important;
              text-align: center !important;
              border-bottom: 1px solid #e2e8f0 !important;
              background-color: #ffffff !important;
              border-radius: 8px 8px 0 0 !important;
            }
            .mobile-card-header h4 {
              font-size: 18px !important;
              font-weight: 600 !important;
              margin: 0 !important;
            }
            .mobile-card-body {
              padding: 1rem !important;
            }
            .mobile-stats-card {
              margin-bottom: 1rem !important;
              padding: 1rem !important;
              border-radius: 8px !important;
            }
            .mobile-stats-title {
              font-size: 14px !important;
              font-weight: 600 !important;
              margin-bottom: 0.5rem !important;
            }
            .mobile-stats-value {
              font-size: 20px !important;
              font-weight: 700 !important;
              margin-bottom: 0 !important;
            }
            .mobile-avatar {
              width: 40px !important;
              height: 40px !important;
              padding: 0.5rem !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .mobile-avatar .avatar-content {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              height: 100% !important;
            }
            .mobile-table {
              font-size: 12px !important;
            }
            .mobile-table th,
            .mobile-table td {
              padding: 0.5rem 0.25rem !important;
              font-size: 12px !important;
            }
            .btn {
              font-size: 14px !important;
            }
            .form-control {
              font-size: 16px !important;
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              overflow-x: hidden !important;
            }
            .container-fluid {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            .row {
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
            }
            .col, .col-12, .col-md-6, .col-xs-12 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
              box-sizing: border-box !important;
            }
            .row {
              margin-left: -0.25rem !important;
              margin-right: -0.25rem !important;
            }
            * {
              box-sizing: border-box !important;
            }
            div[class*="container"] {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
            div[class*="content"] {
              padding: 0 !important;
              margin: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
            }
          }
          @media (min-width: 768px) {
            .mobile-container {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .container-fluid {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
          }
        `}
      </style>
      <div
        className="container-fluid mobile-container"
        style={{ 
          height: isMobile ? "calc(100vh - 60px)" : "calc(100vh - 100px)", 
          overflow: "auto",
          padding: isMobile ? '0' : '0',
          margin: isMobile ? '0' : '0',
          width: isMobile ? '100vw' : '100%',
          maxWidth: isMobile ? '100vw' : '100%',
          position: isMobile ? 'fixed' : undefined,
          top: isMobile ? '60px' : undefined,
          left: isMobile ? '0' : undefined,
          right: isMobile ? '0' : undefined,
          bottom: isMobile ? '0' : undefined,
          zIndex: isMobile ? '1000' : undefined
        }}
      >
        <div 
          style={{
            width: isMobile ? '100%' : '100%',
            height: isMobile ? 'calc(100vh - 60px)' : 'auto',
            margin: isMobile ? '0' : '0',
            padding: isMobile ? '10px' : '0',
            position: isMobile ? 'relative' : undefined,
            top: isMobile ? '40px' : undefined,
            left: isMobile ? '0' : undefined,
            right: isMobile ? '0' : undefined,
            bottom: isMobile ? '0' : undefined,
            maxWidth: isMobile ? '100%' : '100%',
            boxSizing: 'border-box'
          }}
        >
          <div id='dashboard-ecommerce' style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}>
            {/* Financial Overview */}
            <Row className='match-height'>
              <Col lg='3' sm='6' xs='6' className={isMobile ? 'mb-2' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardBody className={isMobile ? 'mobile-stats-card' : ''}>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <h6 className={`fw-bolder mb-75 ${isMobile ? 'mobile-stats-title' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>Total Sales</h6>
                        <h3 className={`fw-bolder mb-0 ${isMobile ? 'mobile-stats-value' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '20px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {expenseTotals.totalSales.toLocaleString()}
                        </h3>
                      </div>
                      {!isMobile && <div className={`avatar bg-light-primary ${isMobile ? 'mobile-avatar' : 'p-50'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className='avatar-content' style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          <ShoppingBag size={isMobile ? 16 : 20} />
                        </span>
                      </div>}
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg='3' sm='6' xs='6' className={isMobile ? 'mb-2' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardBody className={isMobile ? 'mobile-stats-card' : ''}>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <h6 className={`fw-bolder mb-75 ${isMobile ? 'mobile-stats-title' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>In Bank1</h6>
                        <h3 className={`fw-bolder mb-0 ${isMobile ? 'mobile-stats-value' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '20px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {(lastTransactionData?.data?.totalBank1Amount || 0).toLocaleString()}
                        </h3>
                      </div>
                     {!isMobile && <div className={`avatar bg-light-success ${isMobile ? 'mobile-avatar' : 'p-50'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className='avatar-content' style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          <Home size={isMobile ? 16 : 20} />
                        </span>
                      </div>}
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg='3' sm='6' xs='6' className={isMobile ? 'mb-2' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardBody className={isMobile ? 'mobile-stats-card' : ''}>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <h6 className={`fw-bolder mb-75 ${isMobile ? 'mobile-stats-title' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>In Bank2</h6>
                        <h3 className={`fw-bolder mb-0 ${isMobile ? 'mobile-stats-value' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '20px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {(lastTransactionData?.data?.totalBank2Amount || 0).toLocaleString()}
                        </h3>
                      </div>
                     {!isMobile && <div className={`avatar bg-light-success ${isMobile ? 'mobile-avatar' : 'p-50'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className='avatar-content' style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          <Home size={isMobile ? 16 : 20} />
                        </span>
                      </div>}
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg='3' sm='6' xs='6' className={isMobile ? 'mb-2' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardBody className={isMobile ? 'mobile-stats-card' : ''}>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <h6 className={`fw-bolder mb-75 ${isMobile ? 'mobile-stats-title' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>In Hand</h6>
                        <h3 className={`fw-bolder mb-0 ${isMobile ? 'mobile-stats-value' : ''}`} style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '20px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {expenseTotals.totalCashInHand.toLocaleString()}
                        </h3>
                      </div>
                      {!isMobile &&<div className={`avatar bg-light-warning ${isMobile ? 'mobile-avatar' : 'p-50'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className='avatar-content' style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          <Tag size={isMobile ? 16 : 20} />
                        </span>
                      </div>}
                    </div>
                  </CardBody>
                </Card>
              </Col>
        {/* <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <h6 className='fw-bolder mb-75'>Expenses</h6>
                  <h3 className='fw-bolder mb-0'>                                <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
{expenseTotals.totalExpenses.toLocaleString()}</h3>
                </div>
                <div className='avatar bg-light-danger p-50'>
                  <span className='avatar-content'>
                    <TrendingDown size={20} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col> */}
      </Row>

            {/* Suppliers Overview */}
            <Row className='match-height mt-2'>
              <Col lg='6' sm='12' className={isMobile ? 'mb-3' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardHeader className={isMobile ? 'mobile-card-header' : ''} style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa',
                    borderBottom: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                  }}>
                    <CardTitle tag='h4' style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '18px' : '20px'
                    }}>Suppliers Overview</CardTitle>
                  </CardHeader>
                  <CardBody className={isMobile ? 'mobile-card-body' : ''}>
                    <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} mb-2`}>
                      <div className={isMobile ? 'mb-3' : ''}>
                        <h6 className='fw-bolder' style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>Total Due</h6>
                        <h3 className='fw-bolder text-danger' style={{ 
                          fontSize: isMobile ? '18px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {supplierTransactionData?.totals?.totalDueAmount - supplierTransactionData?.totals?.totalPaidAmount || 0}
                        </h3>
                      </div>
                      <div>
                        <h6 className='fw-bolder' style={{ 
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          fontSize: isMobile ? '14px' : '16px'
                        }}>Total Paid</h6>
                        <h3 className='fw-bolder text-success' style={{ 
                          fontSize: isMobile ? '18px' : '24px'
                        }}>
                          <img src={saudiRiyal} alt="SAR" style={{ width: isMobile ? '16px' : '20px', verticalAlign: 'middle' }} />
                          {supplierTransactionData?.totals?.totalPaidAmount || 0}
                        </h3>
                      </div>
                    </div>
                    <hr style={{ borderColor: isDarkTheme ? '#4a5568' : '#e2e8f0' }}/>
                    <div className='mt-2'>
                      <h6 className='fw-bolder' style={{ 
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        fontSize: isMobile ? '14px' : '16px'
                      }}>Total Bills</h6>
                      <h3 className='fw-bolder' style={{ 
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        fontSize: isMobile ? '18px' : '24px'
                      }}>{calculateTotalBills(billsData).toLocaleString()}</h3>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg='6' sm='12' className={isMobile ? 'mb-3' : ''}>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardHeader className={isMobile ? 'mobile-card-header' : ''} style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa',
                    borderBottom: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                  }}>
                    <CardTitle tag='h4' style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '18px' : '20px'
                    }}>Low Stock Products</CardTitle>
                  </CardHeader>
                  <CardBody className={isMobile ? 'mobile-card-body' : ''}>
                    <div className={isMobile ? 'mobile-table-container' : ''} style={{ 
                      overflowX: isMobile ? 'auto' : 'visible',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <Table responsive className={isMobile ? 'mobile-table' : ''}>
                        <thead>
                          <tr>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Product</th>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Quantity</th>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStocks.map((stock, index) => (
                            <tr key={index}>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>{stock.productId?.name || 'Unknown'}</td>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>{stock.quantity}</td>
                              <td>
                                <Badge color='warning' style={{ fontSize: isMobile ? '10px' : '12px' }}>Low Stock</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity Logs */}
            <Row className='match-height mt-2'>
              <Col xs='12'>
                <Card className={isMobile ? 'mobile-card' : ''} style={{
                  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
                  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
                  color: isDarkTheme ? '#ffffff' : '#000000'
                }}>
                  <CardHeader className={isMobile ? 'mobile-card-header' : ''} style={{
                    backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa',
                    borderBottom: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
                  }}>
                    <CardTitle tag='h4' style={{ 
                      color: isDarkTheme ? '#ffffff' : '#000000',
                      fontSize: isMobile ? '18px' : '20px'
                    }}>Recent Activity Logs</CardTitle>
                  </CardHeader>
                  <CardBody className={isMobile ? 'mobile-card-body' : ''}>
                    <div className={isMobile ? 'mobile-table-container' : ''} style={{ 
                      overflowX: isMobile ? 'auto' : 'visible',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <Table responsive className={isMobile ? 'mobile-table' : ''}>
                        <thead>
                          <tr>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Action</th>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Module</th>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>User</th>
                            <th style={{ 
                              color: isDarkTheme ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa'
                            }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentLogs.map((log, index) => (
                            <tr key={index}>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>
                                <Badge color={log.action === 'created' ? 'success' : 'primary'} style={{ fontSize: isMobile ? '10px' : '12px' }}>
                                  {log.action}
                                </Badge>
                              </td>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>{log.module}</td>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>{log.user?.email || 'Unknown'}</td>
                              <td style={{ 
                                color: isDarkTheme ? '#ffffff' : '#000000',
                                fontSize: isMobile ? '12px' : '14px'
                              }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard 