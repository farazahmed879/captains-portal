import React, { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Modal, Input, Alert, Button } from '../ui';
import { ROLE_LIST, UserRoleType } from '../RoleSelectDropdown';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (userData: {
    name: string;
    phone?: string;
    email?: string;
    password: string;
    role: UserRoleType;
  }) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  isPending,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRoleType>('captain');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter user name.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setFormError('Please provide either phone number or email.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      password,
      role,
    });
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('password123');
    setRole('captain');
    setFormError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New User Account"
      subtitle="Invite a new Team Captain, Normal Player, or Administrator"
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} className="admin-add-user-form">
        {formError && (
          <Alert variant="danger" icon={<AlertCircle size={15} />} style={{ marginBottom: '14px' }}>
            {formError}
          </Alert>
        )}

        <Input
          label="Full Name"
          placeholder="e.g. Babar Azam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Phone Number"
            placeholder="0300-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="captain@club.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Assigned Role - Interactive Visual Selection Cards */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
            Assign Role Permission *
          </label>
          <div className="modal-role-picker-grid">
            {ROLE_LIST.map((r) => {
              const RoleIcon = r.icon;
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  className={`modal-role-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setRole(r.value as any)}
                >
                  <div className="modal-role-card-header">
                    <div
                      className="modal-role-card-icon-box"
                      style={{
                        backgroundColor: r.bgColor,
                        color: r.color,
                        borderColor: r.borderColor,
                      }}
                    >
                      <RoleIcon size={13} strokeWidth={2.5} />
                    </div>
                    <div className="modal-role-card-check-pill">
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="modal-role-card-title">{r.label}</div>
                  <div className="modal-role-card-desc">{r.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Initial Password"
          placeholder="password123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="Default temporary password for first login."
        />

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isPending}>
            {isPending ? 'Creating User...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
