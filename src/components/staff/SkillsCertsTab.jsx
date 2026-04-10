'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const PROFICIENCY_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' },
];

const LEVEL_COLORS = {
  Beginner: '#94A3B8',
  Intermediate: '#3B82F6',
  Advanced: '#10B981',
  Expert: '#8B5CF6',
};

export default function SkillsCertsTab({ staffId }) {
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [showEditCert, setShowEditCert] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({ name: '', level: 'Intermediate' });
  const [certForm, setCertForm] = useState({ name: '', issuedBy: '', issueDate: '', expiryDate: '', number: '' });
  const [editForm, setEditForm] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, certsRes] = await Promise.all([
        fetch(`/api/staff/${staffId}/skills`),
        fetch(`/api/staff/${staffId}/certifications`),
      ]);

      if (skillsRes.ok) {
        setSkills(await skillsRes.json());
      }
      if (certsRes.ok) {
        setCertifications(await certsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  const handleAddSkill = async () => {
    if (!skillForm.name.trim()) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillForm),
      });

      if (response.ok) {
        const newSkill = await response.json();
        setSkills(prev => [newSkill, ...prev]);
        setSkillForm({ name: '', level: 'Intermediate' });
        setShowAddSkill(false);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  };

  const handleEditSkill = async () => {
    if (!editingSkill) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/skills/${editingSkill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedSkill = await response.json();
        setSkills(prev => prev.map(s => s.id === updatedSkill.id ? updatedSkill : s));
        setEditingSkill(null);
        setShowEditSkill(false);
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('Failed to update skill');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    if (!confirm('Remove this skill?')) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSkills(prev => prev.filter(s => s.id !== skillId));
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      alert('Failed to remove skill');
    }
  };

  const handleAddCertification = async () => {
    if (!certForm.name.trim() || !certForm.issuedBy.trim() || !certForm.issueDate) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certForm),
      });

      if (response.ok) {
        const newCert = await response.json();
        setCertifications(prev => [newCert, ...prev]);
        setCertForm({ name: '', issuedBy: '', issueDate: '', expiryDate: '', number: '' });
        setShowAddCert(false);
      }
    } catch (error) {
      console.error('Error adding certification:', error);
      alert('Failed to add certification');
    }
  };

  const handleEditCertification = async () => {
    if (!editingCert) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/certifications/${editingCert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedCert = await response.json();
        setCertifications(prev => prev.map(c => c.id === updatedCert.id ? updatedCert : c));
        setEditingCert(null);
        setShowEditCert(false);
      }
    } catch (error) {
      console.error('Error updating certification:', error);
      alert('Failed to update certification');
    }
  };

  const handleRemoveCertification = async (certId) => {
    if (!confirm('Remove this certification?')) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/certifications/${certId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCertifications(prev => prev.filter(c => c.id !== certId));
      }
    } catch (error) {
      console.error('Error removing certification:', error);
      alert('Failed to remove certification');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: 'success',
      EXPIRING_SOON: 'warning',
      EXPIRED: 'error',
    };
    return <span className={`badge badge-${variants[status] || 'gray'}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div>
      {/* Skills Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Skills</h3>
          <Button onClick={() => setShowAddSkill(true)} style={{ fontSize: '13px', padding: '8px 16px' }}>
            <Plus size={14} /> Add Skill
          </Button>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>
          ) : skills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
              No skills added yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {skills.map(skill => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-gray-50)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{skill.name}</span>
                  {skill.level && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: LEVEL_COLORS[skill.level] || '#94A3B8', color: 'white' }}>
                      {skill.level}
                    </span>
                  )}
                  <button onClick={() => { setEditingSkill(skill); setEditForm({ name: skill.name, level: skill.level }); setShowEditSkill(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleRemoveSkill(skill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Certifications</h3>
          <Button onClick={() => setShowAddCert(true)} style={{ fontSize: '13px', padding: '8px 16px' }}>
            <Plus size={14} /> Add Certification
          </Button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>
          ) : certifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
              No certifications added yet
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Certification</th>
                  <th>Issued By</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map(cert => (
                  <tr key={cert.id}>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>{cert.name}</td>
                    <td style={{ fontSize: '13px' }}>{cert.issuedBy}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td style={{ fontSize: '13px' }}>{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{getStatusBadge(cert.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingCert(cert); setEditForm(cert); setShowEditCert(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleRemoveCertification(cert.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Skill Modal */}
      <Modal isOpen={showAddSkill} onClose={() => setShowAddSkill(false)} title="Add Skill">
        <div style={{ display: 'grid', gap: '16px' }}>
          <Input label="Skill Name" value={skillForm.name} onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Medication Administration" />
          <Select label="Proficiency Level" value={skillForm.level} onChange={(e) => setSkillForm(prev => ({ ...prev, level: e.target.value }))} options={PROFICIENCY_LEVELS} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setShowAddSkill(false)}>Cancel</Button>
            <Button onClick={handleAddSkill}>Add Skill</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal isOpen={showEditSkill} onClose={() => { setShowEditSkill(false); setEditingSkill(null); }} title="Edit Skill">
        <div style={{ display: 'grid', gap: '16px' }}>
          <Input label="Skill Name" value={editForm.name || ''} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Medication Administration" />
          <Select label="Proficiency Level" value={editForm.level || 'Intermediate'} onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))} options={PROFICIENCY_LEVELS} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => { setShowEditSkill(false); setEditingSkill(null); }}>Cancel</Button>
            <Button onClick={handleEditSkill}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Certification Modal */}
      <Modal isOpen={showAddCert} onClose={() => setShowAddCert(false)} title="Add Certification" size="lg">
        <div style={{ display: 'grid', gap: '16px' }}>
          <Input label="Certification Name" value={certForm.name} onChange={(e) => setCertForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., CPR Certification" />
          <Input label="Certification Number" value={certForm.number} onChange={(e) => setCertForm(prev => ({ ...prev, number: e.target.value }))} placeholder="Optional" />
          <Input label="Issued By" value={certForm.issuedBy} onChange={(e) => setCertForm(prev => ({ ...prev, issuedBy: e.target.value }))} placeholder="e.g., American Red Cross" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Issue Date" type="date" value={certForm.issueDate} onChange={(e) => setCertForm(prev => ({ ...prev, issueDate: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={certForm.expiryDate} onChange={(e) => setCertForm(prev => ({ ...prev, expiryDate: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setShowAddCert(false)}>Cancel</Button>
            <Button onClick={handleAddCertification}>Add Certification</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Certification Modal */}
      <Modal isOpen={showEditCert} onClose={() => { setShowEditCert(false); setEditingCert(null); }} title="Edit Certification" size="lg">
        <div style={{ display: 'grid', gap: '16px' }}>
          <Input label="Certification Name" value={editForm.name || ''} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
          <Input label="Certification Number" value={editForm.number || ''} onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))} />
          <Input label="Issued By" value={editForm.issuedBy || ''} onChange={(e) => setEditForm(prev => ({ ...prev, issuedBy: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Issue Date" type="date" value={editForm.issueDate ? new Date(editForm.issueDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm(prev => ({ ...prev, issueDate: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={editForm.expiryDate ? new Date(editForm.expiryDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm(prev => ({ ...prev, expiryDate: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => { setShowEditCert(false); setEditingCert(null); }}>Cancel</Button>
            <Button onClick={handleEditCertification}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
