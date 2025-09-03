import React from 'react'
import { useDispatch } from 'react-redux'
import { LogOut, User } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap'
import { handleLogout } from '../../../slices/authentication'
import { useLogoutUserMutation } from '../../slices/authenslice'
import toast from 'react-hot-toast'

const UserDropdown = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [logoutUser, { isLoading }] = useLogoutUserMutation()  

  const onLogout = async () => {
    try {
      // Call logout API
      await logoutUser().unwrap()
      
      // Clear local storage
      localStorage.removeItem('userData')
      
      // Dispatch logout action to clear Redux state
      dispatch(handleLogout())
      
      // Show success message
      toast.success('Logged out successfully')
      
      // Navigate to login page
      navigate('/login', { replace: true })
    } catch (error) {
      // Handle error
      toast.error(error?.data?.message || 'Failed to logout')
      
      // Still clear local data and redirect even if API call fails
      localStorage.removeItem('userData')
      dispatch(handleLogout())
      navigate('/login', { replace: true })
    }
  }

  return (
    <UncontrolledDropdown tag='li' className='dropdown-user nav-item'>
      <DropdownToggle href='/' tag='a' className='nav-link dropdown-user-link' onClick={e => e.preventDefault()}>
        <div className='user-nav d-sm-flex d-none'>
          <span className='user-name fw-bold'>John Doe</span>
          <span className='user-status'>Admin</span>
        </div>
      </DropdownToggle>
      <DropdownMenu end>
        <DropdownItem tag='a' href='/profile'>
          <User size={14} className='me-75' />
          <span className='align-middle'>Profile</span>
        </DropdownItem>
        <DropdownItem divider />
        <DropdownItem tag='a' href='/' onClick={onLogout} disabled={isLoading}>
          <LogOut size={14} className='me-75' />
          <span className='align-middle'>{isLoading ? 'Logging out...' : 'Logout'}</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default UserDropdown 