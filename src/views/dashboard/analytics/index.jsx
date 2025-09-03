// ** React Imports
import { useContext } from 'react'

// ** Utils
import { kFormatter } from '@utils'

// ** Context
import { ThemeColors } from '@src/utility/context/ThemeColors'

// ** Reactstrap Imports
import { Row } from 'reactstrap'

// ** Styles
import '@styles/react/libs/charts/apex-charts.scss'

const AnalyticsDashboard = () => {
  // ** Context
  const { colors } = useContext(ThemeColors)


  return (
    <div id='dashboard-analytics'>
      <Row className='match-height'>
        <h1>Hello</h1>
      </Row>
    </div>
  )
}

export default AnalyticsDashboard
