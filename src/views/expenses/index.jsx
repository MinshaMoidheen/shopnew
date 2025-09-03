import React from 'react'
import ExpensesTable from './ExpensesTable'

// ** Styles
import '@styles/react/libs/tables/react-dataTable-component.scss'

const index = () => {
  return (
    <div className='container'>
       <ExpensesTable />
    </div>
  )
}

export default index
