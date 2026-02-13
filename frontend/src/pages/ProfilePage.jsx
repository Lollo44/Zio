import React, { useState, useEffect } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import { LogOut, User, Scale, Ruler, Target, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProfilePage = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setForm(data);
        }
      } catch (err) { /* ignore */ }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: form.nome || '',
          eta: form.eta || 72,
          peso: form.peso || 75,
          altezza: form.altezza || 170,
          livello: form.livello || 'Principiante',
          obiettivo: form.obiettivo || 'Mantenersi in forma',
          giorni_disponibili: form.giorni_disponibili || [],
        }),
      });
      if (res.ok) {
        setProfile(await res.json());
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) { /* ignore */ }
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="profile-page">
      {/* Header with mascot */}
      <div className="px-6 pt-8 pb-4 flex flex-col items-center">
        <WaltTheGoat state="idle" size={100} />
        <h1 className="text-2xl font-extrabold font-heading text-text-primary mt-4">
          {profile?.nome || profile?.name || 'Profilo'}
        </h1>
        <p className="text-text-secondary">{profile?.email}</p>
      </div>

      {/* Profile Info */}
      <div className="px-6 space-y-3">
        {!editing ? (
          <>
            <div className="bg-surface border border-border rounded-3xl p-5 space-y-4">
              <ProfileRow icon={User} label="Nome" value={profile?.nome || profile?.name || '-'} />
              <ProfileRow icon={Calendar} label="Età" value={profile?.eta ? `${profile.eta} anni` : '-'} />
              <ProfileRow icon={Scale} label="Peso" value={profile?.peso ? `${profile.peso} kg` : '-'} />
              <ProfileRow icon={Ruler} label="Altezza" value={profile?.altezza ? `${profile.altezza} cm` : '-'} />
              <ProfileRow icon={Target} label="Livello" value={profile?.livello || '-'} />
              <ProfileRow icon={Target} label="Obiettivo" value={profile?.obiettivo || '-'} />
            </div>

            {profile?.giorni_disponibili?.length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <p className="text-text-secondary text-sm mb-2">Giorni di allenamento</p>
                <div className="flex flex-wrap gap-2">
                  {profile.giorni_disponibili.map((g) => (
                    <span key={g} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <BigButton onClick={() => setEditing(true)} variant="outline" data-testid="edit-profile-btn">
              Modifica profilo
            </BigButton>
          </>
        ) : (
          <div className="bg-surface border border-border rounded-3xl p-5 space-y-4">
            <div>
              <label className="text-text-secondary text-sm mb-1 block">Nome</label>
              <input
                type="text"
                value={form.nome || ''}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                data-testid="edit-name"
                className="w-full h-12 bg-surface-highlight border border-border rounded-2xl px-4 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-text-secondary text-xs block mb-1">Età</label>
                <input
                  type="number"
                  value={form.eta || ''}
                  onChange={(e) => setForm({ ...form, eta: parseInt(e.target.value) || 0 })}
                  className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs block mb-1">Peso</label>
                <input
                  type="number"
                  value={form.peso || ''}
                  onChange={(e) => setForm({ ...form, peso: parseFloat(e.target.value) || 0 })}
                  className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs block mb-1">Altezza</label>
                <input
                  type="number"
                  value={form.altezza || ''}
                  onChange={(e) => setForm({ ...form, altezza: parseFloat(e.target.value) || 0 })}
                  className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <BigButton onClick={handleSave} variant="secondary" data-testid="save-profile-btn">
                Salva
              </BigButton>
              <BigButton onClick={() => setEditing(false)} variant="outline" data-testid="cancel-edit-btn">
                Annulla
              </BigButton>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="pt-4">
          <BigButton onClick={handleLogout} variant="danger" data-testid="logout-btn">
            <LogOut size={20} /> Esci
          </BigButton>
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <Icon size={18} className="text-text-secondary" />
    <div className="flex-1">
      <p className="text-text-secondary text-xs">{label}</p>
      <p className="text-text-primary font-medium">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
