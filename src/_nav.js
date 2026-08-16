import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPeople } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const roleId = localStorage.getItem('roleId')

const isSuperAdmin = roleId === "1"
const isAdmin = roleId === "2"
const isSubAdmin = roleId === "3"
const isMaster = roleId === "4"
console.log('testest', roleId, isSuperAdmin, isAdmin, isSubAdmin, isMaster)

const _nav = [
  // =========================
  // DASHBOARD
  // =========================
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  {
    component: CNavTitle,
    name: 'User Management',
  },

  // =========================
  // SUPER ADMIN
  // Only Super Admin
  // =========================
  ...(isSuperAdmin
    ? [
        {
          component: CNavItem,
          name: 'Super Admin',
          to: '/dashboard/super',
          icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        },
      ]
    : []),

  // =========================
  // ADMIN
  // Only Super Admin
  // =========================
  ...(isSuperAdmin
    ? [
        {
          component: CNavItem,
          name: 'Admin',
          to: '/dashboard/admin',
          icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        },
      ]
    : []),

  // =========================
  // SUB ADMIN
  // Super Admin + Admin
  // =========================
  ...(isSuperAdmin || isAdmin
    ? [
        {
          component: CNavItem,
          name: 'Sub Admin',
          to: '/dashboard/sub-admin',
          icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        },
      ]
    : []),

  // =========================
  // MASTER
  // Super Admin + Admin + SubAdmin
  // =========================
  ...(isSuperAdmin || isAdmin || isSubAdmin
    ? [
        {
          component: CNavItem,
          name: 'Master',
          to: '/dashboard/master',
          icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        },
      ]
    : []),

  // =========================
  // CLIENT
  // Super Admin + Admin + SubAdmin + Master
  // =========================
  ...(isSuperAdmin || isAdmin || isSubAdmin || isMaster
    ? [
        {
          component: CNavItem,
          name: 'Client',
          to: '/dashboard/client',
          icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        },
      ]
    : []),
]

export default _nav
