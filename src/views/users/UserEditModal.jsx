import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CButton,
} from '@coreui/react'
import { axios_get, axios_post, axios_put } from '../../api/axiosInstance'
import Select from 'react-select'
import './UserEditModal.scss'

function UserEditModal({ user, onClose, onSuccess }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const isEdit = Boolean(user || id)
  const loggedInRoleId = Number(localStorage.getItem('roleId')) || 0
  const parentId = localStorage.getItem('userId') || ''
  const isSuperAdmin = loggedInRoleId === 1

  const getRoleFromPath = () => {
    const path = location.pathname.toLowerCase()

    if (path.includes('super')) return 1
    if (path.includes('admin') && !path.includes('subadmin')) return 2
    if (path.includes('subadmin') || path.includes('sub-admin')) return 3
    if (path.includes('master')) return 4
    if (path.includes('client')) return 5

    return 5
  }

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirmPassword: '',
    roleId: getRoleFromPath(),
    isActive: true,

    credit: 0,
    booked: 0,
    netBooked: 0,
    sharing: 0,

    autoSqPercent: 0,
    useMargin: 0,

    masterId: '',
    adminId: '',
    subAdminId: '',
    superAdminId: '',

    sqOffTime: '',
    limitPercent: '',
    profitLimit: '',
    standingLimit: '',
    minRate: '',
    totalMcxLot: '',

    commissionShow: true,
    alert: false,
    watch: false,
    freshLimit: true,
    optionsSell: false,
    onlySq: true,
    autoSq: true,
    trade: true,
    ledgerView: false,
    blockSymbol: false,

    exchanges: {
      nseFuture: true,
      nseOptions: true,
      mcxFuture: true,
      mcxOptions: false,
      comex: true,
      crypto: true,
      forex: false,
      sgx: true,
      usStock: false,
      others: true,
      dgcx: true,
    },

    allowedScripts: [],
  })

  const [scriptSearch, setScriptSearch] = useState('')
  const [parentScripts, setParentScripts] = useState([])
  const [selectedScripts, setSelectedScripts] = useState([])

  // --------------------------------------------------
  // Load user
  // --------------------------------------------------

  useEffect(() => {
    if (user?.id) {
      fetchUser(user.id)
      return
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        ...user,
        password: '',
        confirmPassword: '',
        roleId: user.roleId || prev.roleId,
        isActive: user.isActive ?? true,
        exchanges: user.exchanges || prev.exchanges,
      }))

      setSelectedScripts(user.allowedScripts || [])
      return
    }

    if (id) {
      fetchUser(id)
    }
  }, [user, id])

  const fetchUser = async (userId) => {
    try {
      setLoading(true)

      const response = await axios_get(`/Users/${userId}`)

      if (response?.success) {
        const data = response.data

        setFormData((prev) => ({
          ...prev,
          ...data,
          password: '',
          confirmPassword: '',
          roleId: data.roleId || prev.roleId,
          isActive: data.isActive ?? true,
        }))

        setSelectedScripts(data.allowedScripts || [])
      } else {
        toast.error(response?.message || 'Failed to load user')
      }
    } catch (error) {
      console.error(error)

      toast.error(error?.response?.data?.message || error?.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // Input change
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleExchangeChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      exchanges: {
        ...prev.exchanges,
        [name]: !prev.exchanges[name],
      },
    }))
  }

  // --------------------------------------------------
  // Scripts
  // --------------------------------------------------

  // Fetch parent scripts for non-SuperAdmins
  useEffect(() => {
    if (!isSuperAdmin && parentId) {
      const fetchParentScripts = async () => {
        try {
          const response = await axios_get(`/Users/${parentId}/scripts`)
          if (response?.success) {
            setParentScripts(response.data || [])
            if (!user?.allowedScripts && !id && !user?.id) {
              setSelectedScripts(response.data || [])
            }
          }
        } catch (error) {
          console.error('SCRIPT ERROR:', error)
        }
      }
      fetchParentScripts()
    }
  }, [isSuperAdmin, parentId, user, id])

  // Debounced global search for SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      if (scriptSearch.length < 2) {
        setParentScripts([])
        return
      }
      const timeoutId = setTimeout(async () => {
        try {
          const response = await axios_get(`/Instruments/search?query=${scriptSearch}&limit=200`)
          // Instruments/search returns array directly, not wrapped in success
          const symbols = (Array.isArray(response) ? response : response?.data || []).map(
            (item) => item.symbol || item.Symbol || item.name || JSON.stringify(item)
          )
          setParentScripts(symbols)
        } catch (error) {
          console.error('SEARCH ERROR:', error)
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [scriptSearch, isSuperAdmin])

  const getScriptName = (item) => {
    if (typeof item === 'string') return item
    return item.symbol || item.name || item.scriptName || ''
  }

  const allAvailableScripts = Array.from(new Set([...parentScripts.map(getScriptName), ...selectedScripts]))

  const getRoleName = (roleId) => {
    switch (Number(roleId)) {
      case 1:
        return 'Super Admin'

      case 2:
        return 'Admin'

      case 3:
        return 'Sub Admin'

      case 4:
        return 'Master'

      case 5:
        return 'Client'

      default:
        return 'Client'
    }
  }

  // --------------------------------------------------
  // Save
  // --------------------------------------------------

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error('Username is required')
      return
    }

    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!isEdit && !formData.password.trim()) {
      toast.error('Password is required')
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      const payload = {
        id: formData.id || undefined,

        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        username: formData.username.trim(),

        // Role
        roleId: Number(formData.roleId),
        role: getRoleName(Number(formData.roleId)),

        isActive: formData.isActive,

        credit: Number(formData.credit || 0),
        booked: Number(formData.booked || 0),
        netBooked: Number(formData.netBooked || 0),
        sharing: Number(formData.sharing || 0),

        autoSqPercent: Number(formData.autoSqPercent || 0),
        useMargin: Number(formData.useMargin || 0),

        superAdminId: formData.superAdminId || null,
        adminId: formData.adminId || null,
        subAdminId: formData.subAdminId || null,
        masterId: formData.masterId || null,

        sqOffTime: formData.sqOffTime,
        limitPercent: formData.limitPercent,
        profitLimit: formData.profitLimit,
        standingLimit: formData.standingLimit,
        minRate: formData.minRate,
        totalMcxLot: formData.totalMcxLot,

        commissionShow: formData.commissionShow,
        alert: formData.alert,
        watch: formData.watch,
        freshLimit: formData.freshLimit,
        optionsSell: formData.optionsSell,
        onlySq: formData.onlySq,
        autoSq: formData.autoSq,
        trade: formData.trade,
        ledgerView: formData.ledgerView,
        blockSymbol: formData.blockSymbol,

        exchanges: formData.exchanges,

        allowedScripts: selectedScripts,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      let response

      if (isEdit) {
        response = await axios_put(`/Users/${formData.id || id}`, payload)
      } else {
        response = await axios_post('/Users', payload)
      }

      console.log('SAVE USER RESPONSE:', response)

      if (response?.success) {
        toast.success(
          response.message || (isEdit ? 'User updated successfully' : 'User created successfully'),
        )

        if (onSuccess) {
          onSuccess()
        } else {
          navigate(-1)
        }
      } else {
        toast.error(response?.message || 'Operation failed')
      }
    } catch (error) {
      console.error('SAVE USER ERROR:', error)

      toast.error(error?.response?.data?.message || error?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // Close
  // --------------------------------------------------

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="user-edit-page">
      <CCard className="user-edit-card">
        <CCardHeader>
          <div className="edit-header">
            <div>
              <h4>{isEdit ? 'EDIT USER' : 'CREATE USER'}</h4>

              <span>
                {isEdit
                  ? 'Update user information and trading settings'
                  : 'Create new trading user'}
              </span>
            </div>

            {/* <CButton color="secondary" onClick={handleClose}>
              CLOSE
            </CButton> */}
          </div>
        </CCardHeader>

        <CCardBody>
          {/* -------------------------------- */}
          {/* BASIC INFORMATION */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>Basic Information</h5>

            <CRow>
              <CCol md={4}>
                <CFormLabel>Username</CFormLabel>

                <CFormInput
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  disabled={isEdit}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Full Name</CFormLabel>

                <CFormInput
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Email</CFormLabel>

                <CFormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Mobile</CFormLabel>

                <CFormInput
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile"
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Password</CFormLabel>

                <CFormInput
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEdit ? 'Leave blank to keep password' : 'Enter password'}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Confirm Password</CFormLabel>

                <CFormInput
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Role</CFormLabel>

                <CFormSelect name="roleId" value={formData.roleId} onChange={handleChange}>
                  <option value="1">Super Admin</option>
                  <option value="2">Admin</option>
                  <option value="3">Sub Admin</option>
                  <option value="4">Master</option>
                  <option value="5">Client</option>
                </CFormSelect>
              </CCol>

              <CCol md={4}>
                <CFormLabel>Status</CFormLabel>

                <CFormSelect
                  name="isActive"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">ACTIVE</option>
                  <option value="false">DEACTIVE</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </section>

          {/* -------------------------------- */}
          {/* PARENT USERS */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>Parent / Hierarchy</h5>

            <CRow>
              <CCol md={3}>
                <CFormLabel>Super Admin ID</CFormLabel>

                <CFormInput
                  name="superAdminId"
                  value={formData.superAdminId}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Admin ID</CFormLabel>

                <CFormInput name="adminId" value={formData.adminId} onChange={handleChange} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Sub Admin ID</CFormLabel>

                <CFormInput name="subAdminId" value={formData.subAdminId} onChange={handleChange} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Master ID</CFormLabel>

                <CFormInput name="masterId" value={formData.masterId} onChange={handleChange} />
              </CCol>
            </CRow>
          </section>

          {/* -------------------------------- */}
          {/* BALANCE */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>Balance & Limits</h5>

            <CRow>
              <CCol md={3}>
                <CFormLabel>Credit</CFormLabel>

                <CFormInput
                  type="number"
                  name="credit"
                  value={formData.credit}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Booked</CFormLabel>

                <CFormInput
                  type="number"
                  name="booked"
                  value={formData.booked}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Net Booked</CFormLabel>

                <CFormInput
                  type="number"
                  name="netBooked"
                  value={formData.netBooked}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Sharing</CFormLabel>

                <CFormInput
                  type="number"
                  name="sharing"
                  value={formData.sharing}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Auto SQ %</CFormLabel>

                <CFormInput
                  type="number"
                  name="autoSqPercent"
                  value={formData.autoSqPercent}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Use Margin</CFormLabel>

                <CFormInput
                  type="number"
                  name="useMargin"
                  value={formData.useMargin}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>
          </section>

          {/* -------------------------------- */}
          {/* SETTINGS */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>Trading Settings</h5>

            <CRow>
              <CCol md={4}>
                <CFormLabel>SQ-OFF TIME</CFormLabel>

                <CFormInput name="sqOffTime" value={formData.sqOffTime} onChange={handleChange} />
              </CCol>

              <CCol md={4}>
                <CFormLabel>LIMIT %</CFormLabel>

                <CFormInput
                  name="limitPercent"
                  value={formData.limitPercent}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>PROFIT LIMIT</CFormLabel>

                <CFormInput
                  name="profitLimit"
                  value={formData.profitLimit}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>STANDING LIMIT</CFormLabel>

                <CFormInput
                  name="standingLimit"
                  value={formData.standingLimit}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>MIN RATE</CFormLabel>

                <CFormInput name="minRate" value={formData.minRate} onChange={handleChange} />
              </CCol>

              <CCol md={4}>
                <CFormLabel>TOTAL MCX LOT</CFormLabel>

                <CFormInput
                  name="totalMcxLot"
                  value={formData.totalMcxLot}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>
          </section>

          {/* -------------------------------- */}
          {/* USER PERMISSIONS */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>User Permissions</h5>

            <div className="permission-grid">
              {[
                ['commissionShow', 'COMMISSION SHOW'],
                ['alert', 'ALERT'],
                ['watch', 'WATCH'],
                ['freshLimit', 'FRESH LIMIT'],
                ['optionsSell', 'OPTIONS SELL'],
                ['onlySq', 'ONLY SQ'],
                ['autoSq', 'AUTO SQ'],
                ['trade', 'TRADE'],
                ['ledgerView', 'LEDGER VIEW'],
                ['blockSymbol', 'BLOCK SYMBOL'],
              ].map(([name, label]) => (
                <label className="permission-item" key={name}>
                  <input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={handleChange}
                  />

                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* -------------------------------- */}
          {/* EXCHANGES */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>User Exchanges</h5>

            <div className="exchange-grid">
              {Object.entries(formData.exchanges).map(([key, value]) => (
                <button
                  type="button"
                  key={key}
                  className={value ? 'exchange-btn active' : 'exchange-btn'}
                  onClick={() => handleExchangeChange(key)}
                >
                  {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* -------------------------------- */}
          {/* SCRIPTS */}
          {/* -------------------------------- */}

          <section className="form-section">
            <h5>Allowed Scripts ({selectedScripts.length})</h5>

            <Select
              isMulti
              options={allAvailableScripts.map(script => ({ value: script, label: script }))}
              value={selectedScripts.map(script => ({ value: script, label: script }))}
              onChange={(selectedOptions) => {
                setSelectedScripts(selectedOptions ? selectedOptions.map(opt => opt.value) : [])
              }}
              onInputChange={(newValue) => setScriptSearch(newValue)}
              placeholder="Search and select scripts..."
              noOptionsMessage={() => "No scripts found."}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1b1b29',
                  borderColor: '#2a2a3c',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#3a3a52',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#1b1b29',
                  zIndex: 9999,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#2a2a3c' : '#1b1b29',
                  color: '#fff',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#3a3a52',
                  }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#321fdb',
                  borderRadius: '4px',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#fff',
                  fontWeight: 'bold',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#fff',
                  cursor: 'pointer',
                  ':hover': {
                    backgroundColor: '#20139b',
                    color: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                }),
                input: (base) => ({
                  ...base,
                  color: '#fff',
                }),
              }}
            />
          </section>

          {/* -------------------------------- */}
          {/* SAVE */}
          {/* -------------------------------- */}

          <div className="form-actions">
            <CButton color="secondary" onClick={handleClose} disabled={loading}>
              CANCEL
            </CButton>

            <CButton color="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'PLEASE WAIT...' : isEdit ? 'UPDATE USER' : 'CREATE USER'}
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default UserEditModal
