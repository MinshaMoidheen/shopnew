// ** React Imports
import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import jwt from 'jsonwebtoken'

import avatar11 from '../../../assets/images/portrait/small/avatar-s-11.jpg'

const data = {
  users: [
    {
      id: 1,
      fullName: 'John Doe',
      username: 'Admin',
      password: 'admin',
      avatar: avatar11,
      email: 'basilgg24@gmail.com',
      role: 'admin',
      ability: [
        {
          action: 'manage',
          subject: 'all'
        }
      ],
      extras: {
        eCommerceCartItemsCount: 5
      }
    },
    {
      id: 2,
      fullName: 'Suhaib',
      username: 'Suhaib',
      password: 'admin',
      avatar: avatar11,
      email: 'mhdsuhaib1411@gmail.com',
      role: 'admin',
      ability: [
        {
          action: 'manage',
          subject: 'all'
        }
      ],
      extras: {
        eCommerceCartItemsCount: 5
      }
    },
  ]
}


// ** Custom Hooks
import { useSkin } from '@hooks/useSkin'
import useJwt from '@src/auth/jwt/useJwt'

// ** Third Party Components
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { Facebook, Twitter, Mail, GitHub, HelpCircle, Coffee, X } from 'react-feather'

// ** Actions
import { handleLogin } from '../../../slices/authentication'
import { useLoginUserMutation, useVerifyOtpMutation } from '../../../slices/authenslice'

// ** Context
import { AbilityContext } from '@src/utility/context/Can'

// ** Custom Components
import Avatar from '@components/avatar'
import InputPasswordToggle from '@components/input-password-toggle'

const jwtConfig = {
  secret: 'dd5f3089-40c3-403d-af14-d0c228b05cb4',
  refreshTokenSecret: '7c4c1c50-3230-45bf-9eae-c9b2e401c767',
  expireTime: '10m',
  refreshTokenExpireTime: '10m'
}

// ** Utils
import { getHomeRouteForLoggedInUser } from '@utils'

// ** Reactstrap Imports
import {
  Row,
  Col,
  Form,
  Input,
  Label,
  Alert,
  Button,
  CardText,
  CardTitle,
  FormFeedback,
  UncontrolledTooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'

// ** Illustrations Imports
import illustrationsLight from '@src/assets/images/pages/login-v2.svg'
import illustrationsDark from '@src/assets/images/pages/login-v2-dark.svg'

// ** Styles
import '@styles/react/pages/page-authentication.scss'

const ToastContent = ({ t, name, role }) => {
  return (
    <div className='d-flex'>
      <div className='me-1'>
        <Avatar size='sm' color='success' icon={<Coffee size={12} />} />
      </div>
      <div className='d-flex flex-column'>
        <div className='d-flex justify-content-between'>
          <h6>{name}</h6>
          <X size={12} className='cursor-pointer' onClick={() => toast.dismiss(t.id)} />
        </div>
        <span>You have successfully logged in as an {role} user to SM. Now you can start to explore. Enjoy!</span>
      </div>
    </div>
  )
}

const defaultValues = {
  password: '',
  loginEmail: ''
}

// Add function to trigger navigation update
const triggerNavigationUpdate = () => {
  // Update localStorage
  const currentData = localStorage.getItem('userData');
  if (currentData) {
    localStorage.setItem('userData', currentData);
  }
  // Force navigation update
  if (window.updateNavigationItems) {
    window.updateNavigationItems();
  }
  // Dispatch custom event
  window.dispatchEvent(new Event('localStorageChange'));
};

const Login = () => {
  // ** Hooks
  const { skin } = useSkin()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ability = useContext(AbilityContext)
  const [login, { isLoading: isLoggingIn }] = useLoginUserMutation()
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation()
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [userData, setUserData] = useState(null)

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const source = skin === 'dark' ? illustrationsDark : illustrationsLight

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const onSubmit = async (data) => {
    if (Object.values(data).every(field => field.length > 0)) {
      try {
        const response = await login({
          loginId: data.loginEmail,
          password: data.password
        }).unwrap();

        console.log("response", response)

        if (response.message) {
          // Admin user - OTP sent
          toast.success(response.message);
          setUserData({ 
            email: data.loginEmail,
            response: response
          });
          setShowOtpModal(true);
        } else {
          // Staff user - direct login
          const userData = {
            _id: response._id,
            name: response.name,
            email: response.email,
            phone: response.phone,
            role: response.role,
            accessToken: response.token,
            refreshToken: response.token,
            ability: [
              {
                action: 'manage',
                subject: 'all'
              }
            ]
          };
          
          // Save to localStorage and trigger update
          localStorage.setItem('userData', JSON.stringify(userData));
          window.updateNavigationItems();
          
          // Update Redux store
          dispatch(handleLogin(userData));
          
          // Update ability context
          ability.update(userData.ability);
          
          toast.success('Login successful!');
          navigate('/apps/dashboard', { replace: true });
        }
      } catch (err) {
        setError('loginEmail', {
          type: 'manual',
          message: err.data?.message || err.response?.data?.error || 'Login failed'
        });
      }
    } else {
      for (const key in data) {
        if (data[key].length === 0) {
          setError(key, {
            type: 'manual'
          });
        }
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    try {
      const response = await verifyOtp({
        loginId: userData.email,
        otpCode: otpString
      }).unwrap()

      if (response) {
        toast.success('OTP verified successfully!')
        
        // Create user data object from response
        const userDataToStore = {
          _id: response._id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          role: response.role,
          accessToken: response.token,
          refreshToken: response.token,
          ability: [
            {
              action: 'manage',
              subject: 'all'
            }
          ]
        }
        
        // Save to localStorage and trigger update
        localStorage.setItem('userData', JSON.stringify(userDataToStore));
        window.updateNavigationItems();
        
        // Dispatch login action to update Redux store
        dispatch(handleLogin(userDataToStore))
        
        // Update ability context
        ability.update(userDataToStore.ability)
        
        setShowOtpModal(false)
        // Navigate to dashboard with the correct layout
        navigate('/apps/dashboard', { replace: true })
      }
    } catch (error) {
      toast.error(error?.data?.message || 'OTP verification failed')
    }
  }

  return (
    <div className='auth-wrapper auth-cover'>
      <Row className='auth-inner m-0'>
        <Link className='brand-logo' to='/' onClick={e => e.preventDefault()}>
          <svg viewBox='0 0 139 95' version='1.1' height='28'>
            <defs>
              <linearGradient x1='100%' y1='10.5120544%' x2='50%' y2='89.4879456%' id='linearGradient-1'>
                <stop stopColor='#000000' offset='0%'></stop>
                <stop stopColor='#FFFFFF' offset='100%'></stop>
              </linearGradient>
              <linearGradient x1='64.0437835%' y1='46.3276743%' x2='37.373316%' y2='100%' id='linearGradient-2'>
                <stop stopColor='#EEEEEE' stopOpacity='0' offset='0%'></stop>
                <stop stopColor='#FFFFFF' offset='100%'></stop>
              </linearGradient>
            </defs>
            <g id='Page-1' stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
              <g id='Artboard' transform='translate(-400.000000, -178.000000)'>
                <g id='Group' transform='translate(400.000000, 178.000000)'>
                  <path
                    d='M-5.68434189e-14,2.84217094e-14 L39.1816085,2.84217094e-14 L69.3453773,32.2519224 L101.428699,2.84217094e-14 L138.784583,2.84217094e-14 L138.784199,29.8015838 C137.958931,37.3510206 135.784352,42.5567762 132.260463,45.4188507 C128.736573,48.2809251 112.33867,64.5239941 83.0667527,94.1480575 L56.2750821,94.1480575 L6.71554594,44.4188507 C2.46876683,39.9813776 0.345377275,35.1089553 0.345377275,29.8015838 C0.345377275,24.4942122 0.230251516,14.560351 -5.68434189e-14,2.84217094e-14 Z'
                    id='Path'
                    className='text-primary'
                    style={{ fill: 'currentColor' }}
                  ></path>
                  <path
                    d='M69.3453773,32.2519224 L101.428699,1.42108547e-14 L138.784583,1.42108547e-14 L138.784199,29.8015838 C137.958931,37.3510206 135.784352,42.5567762 132.260463,45.4188507 C128.736573,48.2809251 112.33867,64.5239941 83.0667527,94.1480575 L56.2750821,94.1480575 L32.8435758,70.5039241 L69.3453773,32.2519224 Z'
                    id='Path'
                    fill='url(#linearGradient-1)'
                    opacity='0.2'
                  ></path>
                  <polygon
                    id='Path-2'
                    fill='#000000'
                    opacity='0.049999997'
                    points='69.3922914 32.4202615 32.8435758 70.5039241 54.0490008 16.1851325'
                  ></polygon>
                  <polygon
                    id='Path-2'
                    fill='#000000'
                    opacity='0.099999994'
                    points='69.3922914 32.4202615 32.8435758 70.5039241 58.3683556 20.7402338'
                  ></polygon>
                  <polygon
                    id='Path-3'
                    fill='url(#linearGradient-2)'
                    opacity='0.099999994'
                    points='101.428699 0 83.0667527 94.1480575 130.378721 47.0740288'
                  ></polygon>
                </g>
              </g>
            </g>
          </svg>
          <h2 className='brand-text text-primary ms-1'>محامص بن حمد</h2>
        </Link>
        <Col className='d-none d-lg-flex align-items-center p-5' lg='8' sm='12'>
          <div className='w-100 d-lg-flex align-items-center justify-content-center px-5'>
            <img className='img-fluid' src={source} alt='Login Cover' />
          </div>
        </Col>
        <Col className='d-flex align-items-center auth-bg px-2 p-lg-5' lg='4' sm='12'>
          <Col className='px-xl-2 mx-auto' sm='8' md='6' lg='12'>
            <CardTitle tag='h2' className='fw-bold mb-1'>
محامص بن حمد
            </CardTitle>
            <CardText className='mb-2'>Please sign-in to your account and start the adventure</CardText>
            <Form className='auth-login-form mt-2' onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Label className='form-label' for='login-email'>
                  Email
                </Label>
                <Controller
                  id='loginEmail'
                  name='loginEmail'
                  control={control}
                  render={({ field }) => (
                    <Input
                      autoFocus
                      type='email'
                      placeholder='john@example.com'
                      invalid={errors.loginEmail && true}
                      {...field}
                    />
                  )}
                />
                {errors.loginEmail && <FormFeedback>{errors.loginEmail.message}</FormFeedback>}
              </div>
              <div className='mb-1'>
                <div className='d-flex justify-content-between'>
                  <Label className='form-label' for='login-password'>
                    Password
                  </Label>
                </div>
                <Controller
                  id='password'
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle className='input-group-merge' invalid={errors.password && true} {...field} />
                  )}
                />
              </div>
              <Button type='submit' color='primary' block disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in...' : 'Sign in'}
              </Button>
            </Form>
            <p className='text-center mt-2'>
              <span className='me-25'>New on our platform?</span>
              <Link to='/register'>
                <span>Create an account</span>
              </Link>
            </p>
          </Col>
        </Col>
      </Row>

      {/* OTP Verification Modal */}
      <Modal isOpen={showOtpModal} toggle={() => setShowOtpModal(false)}>
        <ModalHeader toggle={() => setShowOtpModal(false)}>Enter OTP</ModalHeader>
        <ModalBody>
          <Form>
            <Label>6-digit OTP</Label>
            <div className='d-flex justify-content-center gap-2 mb-4'>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-input-${index}`}
                  type='text'
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className='text-center'
                  style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}
                />
              ))}
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleVerifyOTP} disabled={isVerifyingOtp}>
            {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Login
