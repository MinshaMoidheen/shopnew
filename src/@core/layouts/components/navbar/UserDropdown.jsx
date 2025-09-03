// ** React Imports
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Utils
import { isUserLoggedIn } from '@utils'

// ** Store & Actions
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/authentication'

// ** Third Party Components
import { User, Mail, CheckSquare, MessageSquare, Settings, CreditCard, HelpCircle, Power, Box, Package, ShoppingCart } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap'

// ** Default Avatar Image
import defaultAvatar from '@src/assets/images/portrait/small/images.png'
import { useLogoutUserMutation } from '../../../../slices/authenslice'

// ** API

const UserDropdown = () => {
  // ** Store Vars
  const dispatch = useDispatch()

  // ** API Hooks
  const [logoutUser] = useLogoutUserMutation()

  // ** State
  const [userData, setUserData] = useState(null)

  //** ComponentDidMount
  useEffect(() => {
    if (isUserLoggedIn() !== null) {
      setUserData(JSON.parse(localStorage.getItem('userData')))
    }
  }, [])

  //** Vars
  const userAvatar = (userData && userData.avatar) || defaultAvatar

  // Handle logout
  const handleLogoutClick = async () => {
    try {
      await logoutUser().unwrap()
      dispatch(handleLogout())
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <UncontrolledDropdown tag='li' className='dropdown-user nav-item'>
      <DropdownToggle href='/' tag='a' className='nav-link dropdown-user-link' onClick={e => e.preventDefault()}>
        <div className='user-nav d-sm-flex d-none'>
          <span className='user-name fw-bold'>{(userData && userData['name']) || 'John Doe'}</span>
          <span className='user-status'>{(userData && userData.role) || 'Admin'}</span>
        </div>
        <Avatar img={userAvatar} imgHeight='40' imgWidth='40' status='online' />
      </DropdownToggle>
      <DropdownMenu end>
        {/* <DropdownItem tag={Link} to='/apps/items'>
          <Box size={14} className='me-75' />
          <span className='align-middle'>Items</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/apps/suppliers'>
          <User size={14} className='me-75' />
          <span className='align-middle'>Suppliers</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/apps/stocks'>
          <Package size={14} className='me-75' />
          <span className='align-middle'>Stocks</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/apps/selling'>
          <ShoppingCart size={14} className='me-75' />
          <span className='align-middle'>Selling</span>
        </DropdownItem>
        <DropdownItem divider /> */}
        <DropdownItem tag={Link} to='/login' onClick={handleLogoutClick}>
          <Power size={14} className='me-75' />
          <span className='align-middle'>Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default UserDropdown
