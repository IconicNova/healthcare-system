'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';
import Modal from '@/components/ui/Modal';
import { Plus, Edit } from 'lucide-react';

const roles = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF', 'CLIENT'];

const permissionsMatrix = [
  { permission: 'View Dashboard', admin: '✅', manager: '✅', supervisor: '✅', staff: '✅' },
  { permission: 'Manage Clients', admin: '✅', manager: '✅', supervisor: '✅', staff: 'View Only' },
  { permission: 'Manage Staff', admin: '✅', manager: '✅', supervisor: 'View Only', staff: 'Own Profile' },
  { permission: 'Scheduling', admin: '✅', manager: '✅', supervisor: '✅', staff: 'View Own' },
  { permission: 'Care Delivery', admin: '✅', manager: '✅', supervisor: '✅', staff: '✅' },
  { permission: 'Billing', admin: '✅', manager: '✅', supervisor: 'View Only', staff: '❌' },
  { permission: 'Payroll', admin: '✅', manager: '✅', supervisor: '❌', staff: 'Own Only' },
  { permission: 'Reports', admin: '✅', manager: '✅', supervisor: '✅', staff: '❌' },
  { permission: 'Settings', admin: '✅', manager: '❌', supervisor: '❌', staff: '❌' },
];

export default function UsersAndRoles() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STAFF',
    branchId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/settings/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'User created', 'User has been added successfully');
        setShowAddModal(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'STAFF', branchId: '' });
        fetchUsers();
      } else {
        showToast('error', 'Error', 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('error', 'Error', 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId) => {
    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'User updated', 'User has been updated successfully');
        setEditingUser(null);
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'STAFF', branchId: '' });
        fetchUsers();
      } else {
        showToast('error', 'Error', 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Error', 'Failed to update user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const user = users.find(u => u.id === userId);
      await fetch(`/api/settings/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: !currentStatus,
          branchId: user.branchId,
        }),
      });
      fetchUsers();
      showToast('success', 'Status updated', 'User status has been updated');
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('error', 'Error', 'Failed to update user status');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      branchId: user.branchId || '',
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Users & Roles</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge badge-info">{user.role}</span>
                </td>
                <td>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={user.status}
                      onChange={() => handleToggleStatus(user.id, user.status)}
                    />
                    {user.status ? 'Active' : 'Inactive'}
                  </label>
                </td>
                <td>{user.branch?.name || '-'}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEditModal(user)}
                  >
                    <Edit size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Role Permissions
        </h3>
        <div className="table-container">
          <table className="table permissions-matrix">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Admin</th>
                <th>Manager</th>
                <th>Supervisor</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((row, index) => (
                <tr key={index}>
                  <td>{row.permission}</td>
                  <td className="permissions-check">{row.admin}</td>
                  <td className={row.manager === '❌' ? 'permissions-cross' : 'permissions-check'}>{row.manager}</td>
                  <td className={row.supervisor === '❌' ? 'permissions-cross' : row.supervisor === 'View Only' ? 'permissions-limited' : 'permissions-check'}>
                    {row.supervisor === 'View Only' ? 'View' : row.supervisor}
                  </td>
                  <td className={row.staff === '❌' ? 'permissions-cross' : 'permissions-limited'}>
                    {row.staff === 'View Only' ? 'View' : row.staff === 'Own Profile' ? 'Own' : row.staff === 'View Own' ? 'View' : row.staff === 'Own Only' ? 'Own' : row.staff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
      >
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              className="input"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              className="input"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              className="select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Branch</label>
            <select
              className="select"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            >
              <option value="">No Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAddUser}>
            Add User
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              className="input"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              className="input"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              disabled
            />
            <p className="settings-form-help">Email cannot be changed</p>
          </div>
          <div className="form-group">
            <label className="form-label">New Password (leave blank to keep current)</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              className="select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => handleUpdateUser(editingUser)}>
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
