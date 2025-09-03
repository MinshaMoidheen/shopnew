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
    <div id='dashboard-ecommerce'>
      {/* Financial Overview */}
      <Row className='match-height'>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <h6 className='fw-bolder mb-75'>Total Sales</h6>
                  <h3 className='fw-bolder mb-0'>
                                <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />

                    {expenseTotals.totalSales.toLocaleString()}</h3>
                </div>
                <div className='avatar bg-light-primary p-50'>
                  <span className='avatar-content'>
                    <ShoppingBag size={20} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <h6 className='fw-bolder mb-75'>In Bank1</h6>
                  <h3 className='fw-bolder mb-0'>
                    <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
                    {
                      (lastTransactionData?.data?.totalBank1Amount || 0).toLocaleString()
                    }
                  </h3>
                </div>
                <div className='avatar bg-light-success p-50'>
                  <span className='avatar-content'>
                     <Home size={20} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
         <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <h6 className='fw-bolder mb-75'>In Bank2</h6>
                  <h3 className='fw-bolder mb-0'>
                    <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
                    {
                      (lastTransactionData?.data?.totalBank2Amount || 0).toLocaleString()
                    }
                  </h3>
                </div>
                <div className='avatar bg-light-success p-50'>
                  <span className='avatar-content'>
                     <Home size={20} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <h6 className='fw-bolder mb-75'>In Hand</h6>
                  <h3 className='fw-bolder mb-0'>                                <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
{expenseTotals.totalCashInHand.toLocaleString()}</h3>
                </div>
                <div className='avatar bg-light-warning p-50'>
                  <span className='avatar-content'>
                    <Tag size={20} />
                  </span>
                </div>
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
        <Col lg='6' sm='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Suppliers Overview</CardTitle>
            </CardHeader>
            <CardBody>
              <div className='d-flex justify-content-between mb-2'>
                <div>
                  <h6 className='fw-bolder'>Total Due</h6>
                  <h3 className='fw-bolder text-danger'>
                                                    <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />

                    {supplierTransactionData?.totals?.totalDueAmount - supplierTransactionData?.totals?.totalPaidAmount || 0}</h3>
                </div>
                <div>
                  <h6 className='fw-bolder'>Total Paid</h6>
                  <h3 className='fw-bolder text-success'>                                <img src={saudiRiyal} alt="SAR" style={{ width: '20px', verticalAlign: 'middle' }} />
{supplierTransactionData?.totals?.totalPaidAmount || 0}</h3>
                </div>
              </div>
              <hr/>
              <div className='mt-2'>
                <h6 className='fw-bolder'>Total Bills</h6>
                <h3 className='fw-bolder'>{calculateTotalBills(billsData).toLocaleString()}</h3>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='6' sm='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Low Stock Products</CardTitle>
            </CardHeader>
            <CardBody>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStocks.map((stock, index) => (
                    <tr key={index}>
                      <td>{stock.productId?.name || 'Unknown'}</td>
                      <td>{stock.quantity}</td>
                      <td>
                        <Badge color='warning'>Low Stock</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Logs */}
      <Row className='match-height mt-2'>
        <Col xs='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Recent Activity Logs</CardTitle>
            </CardHeader>
            <CardBody>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Module</th>
                    <th>User</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, index) => (
                    <tr key={index}>
                      <td>
                        <Badge color={log.action === 'created' ? 'success' : 'primary'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td>{log.module}</td>
                      <td>{log.user?.email || 'Unknown'}</td>
                      <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard 