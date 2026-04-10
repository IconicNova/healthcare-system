'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ServicesConfiguration() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    baseRate: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/settings/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    try {
      const response = await fetch('/api/settings/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'Service created', 'Service has been added successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '', duration: '', baseRate: '' });
        fetchServices();
      } else {
        showToast('error', 'Error', 'Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      showToast('error', 'Error', 'Failed to create service');
    }
  };

  const handleUpdateService = async (serviceId) => {
    try {
      const response = await fetch(`/api/settings/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'Service updated', 'Service has been updated successfully');
        setEditingService(null);
        setFormData({ name: '', description: '', duration: '', baseRate: '' });
        fetchServices();
      } else {
        showToast('error', 'Error', 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      showToast('error', 'Error', 'Failed to update service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;

    try {
      const response = await fetch(`/api/settings/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('success', 'Service deactivated', 'Service has been deactivated');
        fetchServices();
      } else {
        showToast('error', 'Error', 'Failed to deactivate service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('error', 'Error', 'Failed to deactivate service');
    }
  };

  const openEditModal = (service) => {
    setEditingService(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration || '',
      baseRate: service.baseRate.toString(),
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Services Configuration</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Service
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Description</th>
              <th>Duration (min)</th>
              <th>Rate ($/hr)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td><strong>{service.name}</strong></td>
                <td>{service.description || '-'}</td>
                <td>{service.duration || '-'}</td>
                <td>${service.baseRate.toFixed(2)}</td>
                <td>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={service.status}
                      onChange={async () => {
                        await fetch(`/api/settings/services/${service.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: service.name,
                            description: service.description,
                            duration: service.duration,
                            baseRate: service.baseRate,
                            status: !service.status,
                          }),
                        });
                        fetchServices();
                      }}
                    />
                    {service.status ? 'Active' : 'Inactive'}
                  </label>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEditModal(service)}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteService(service.id)}
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Service Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Service"
      >
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 60"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Base Rate ($/hour) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.baseRate}
              onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAddService}>
            Add Service
          </button>
        </div>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Edit Service"
      >
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Base Rate ($/hour) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.baseRate}
              onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setEditingService(null)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => handleUpdateService(editingService)}>
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
