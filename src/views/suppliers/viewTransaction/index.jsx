import React from 'react'

// ** Styles
import '@styles/react/libs/tables/react-dataTable-component.scss'
import SupplierList from './SupplierList'
import ViewSupplierTransaction from './ViewSupplierTransaction'

const index = () => {
  return (
    <div className='container'>
       <ViewSupplierTransaction />
    </div>
  )
}

export default index
