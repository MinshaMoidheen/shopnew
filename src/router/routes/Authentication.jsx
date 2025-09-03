// ** React Imports
import { lazy } from 'react'

const Login = lazy(() => import('../../views/pages/authentication/Login'))


const Register = lazy(() => import('../../views/pages/authentication/Register'))
const RegisterBasic = lazy(() => import('../../views/pages/authentication/RegisterBasic'))
const RegisterCover = lazy(() => import('../../views/pages/authentication/RegisterCover'))
const RegisterMultiSteps = lazy(() => import('../../views/pages/authentication/register-multi-steps'))


const ResetPasswordBasic = lazy(() => import('../../views/pages/authentication/ResetPasswordBasic'))
const ResetPasswordCover = lazy(() => import('../../views/pages/authentication/ResetPasswordCover'))

const VerifyEmailBasic = lazy(() => import('../../views/pages/authentication/VerifyEmailBasic'))
const VerifyEmailCover = lazy(() => import('../../views/pages/authentication/VerifyEmailCover'))

const TwoStepsBasic = lazy(() => import('../../views/pages/authentication/TwoStepsBasic'))
const TwoStepsCover = lazy(() => import('../../views/pages/authentication/TwoStepsCover'))

const AuthenticationRoutes = [
  {
    path: '/login',
    element: <Login />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/register',
    element: <Register />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/pages/register-basic',
    element: <RegisterBasic />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/register-cover',
    element: <RegisterCover />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/register-multi-steps',
    element: <RegisterMultiSteps />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/reset-password-basic',
    element: <ResetPasswordBasic />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/reset-password-cover',
    element: <ResetPasswordCover />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/verify-email-basic',
    element: <VerifyEmailBasic />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/verify-email-cover',
    element: <VerifyEmailCover />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/two-steps-basic',
    element: <TwoStepsBasic />,
    meta: {
      layout: 'blank'
    }
  },
  {
    path: '/pages/two-steps-cover',
    element: <TwoStepsCover />,
    meta: {
      layout: 'blank'
    }
  }
]

export default AuthenticationRoutes
