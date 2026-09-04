import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAddresses, createAddress } from "../api/checkout";
import { updateProfile, changePassword, updateAddress, deleteAddress, setDefaultAddress } from "../api/profile";
import Button from "../components/Button";
import "./Profile.css";

const emptyAddressForm = {
  label: "", fullName: "", phone: "", line1: "", line2: "",
  city: "", province: "", postalCode: "", country: "", isDefault: false,
};

function Profile() {
  const { user, login } = useAuth();
  const [tab, setTab] = useState("account");
  const isAdmin = user?.role === "admin";

  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressError, setAddressError] = useState(null);

  function loadAddresses() {
    setLoadingAddresses(true);
    fetchAddresses().then(setAddresses).finally(() => setLoadingAddresses(false));
  }

  useEffect(() => {
    if (!isAdmin) loadAddresses();
  }, [isAdmin]);

  async function handleSaveName(e) {
    e.preventDefault();
    setSavingName(true);
    setNameMessage(null);
    try {
      const updated = await updateProfile(name);
      login(updated, localStorage.getItem("token"));
      setNameMessage("Saved.");
    } catch (err) {
      setNameMessage(err.response?.data?.message || "Failed to save.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Password updated.");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function startEdit(addr) {
    setEditingId(addr.id);
    setAddressForm({ ...addr, line2: addr.line2 || "" });
    setShowAddForm(false);
  }

  function startAdd() {
    setEditingId(null);
    setAddressForm(emptyAddressForm);
    setShowAddForm(true);
  }

  function handleAddressFormChange(e) {
    const { name: field, value, type, checked } = e.target;
    setAddressForm({ ...addressForm, [field]: type === "checkbox" ? checked : value });
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    setAddressError(null);
    try {
      if (editingId) {
        await updateAddress(editingId, addressForm);
      } else {
        await createAddress(addressForm);
      }
      setEditingId(null);
      setShowAddForm(false);
      setAddressForm(emptyAddressForm);
      loadAddresses();
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to save address.");
    }
  }

  async function handleDeleteAddress(id) {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      loadAddresses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete address.");
    }
  }

  async function handleSetDefault(id) {
    await setDefaultAddress(id);
    loadAddresses();
  }

  return (
    <div className="profile">
      <h2>Your account</h2>

      {!isAdmin && (
        <div className="profile__tabs">
          <button className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}>Account</button>
          <button className={tab === "addresses" ? "active" : ""} onClick={() => setTab("addresses")}>Addresses</button>
        </div>
      )}

      {tab === "account" && (
        <div className="profile__section">
          <form className="profile__form" onSubmit={handleSaveName}>
            <h3>Profile info</h3>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input value={user?.email || ""} disabled />
            </label>
            {nameMessage && <p className="profile__message">{nameMessage}</p>}
            <div className="profile__form-footer">
              <Button type="submit" variant="primary" disabled={savingName}>
                {savingName ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>

          <form className="profile__form" onSubmit={handleChangePassword}>
            <h3>Change password</h3>
            <label>
              Current password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </label>
            {passwordError && <p className="profile__error">{passwordError}</p>}
            {passwordMessage && <p className="profile__message">{passwordMessage}</p>}
            <div className="profile__form-footer">
              <Button type="submit" variant="primary" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Change password"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {tab === "addresses" && !isAdmin && (
        <div className="profile__section">
          {loadingAddresses ? (
            <p className="profile__status">Loading addresses...</p>
          ) : (
            <>
              <div className="profile__address-list">
                {addresses.map((addr) => (
                  <div className="profile__address-card" key={addr.id}>
                    {addr.isDefault && <span className="profile__default-badge">Default</span>}
                    <strong>{addr.fullName}</strong>
                    <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p>{addr.city}, {addr.province} {addr.postalCode}</p>
                    <p>{addr.country} — {addr.phone}</p>
                    <div className="profile__address-actions">
                      {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id)}>Set default</button>}
                      <button onClick={() => startEdit(addr)}>Edit</button>
                      <button onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {!showAddForm && !editingId && (
                <button className="profile__add-link" onClick={startAdd}>+ Add a new address</button>
              )}

              {(showAddForm || editingId) && (
                <form className="profile__form" onSubmit={handleAddressSubmit}>
                  <h3>{editingId ? "Edit address" : "New address"}</h3>
                  <input name="fullName" placeholder="Full name" value={addressForm.fullName} onChange={handleAddressFormChange} required />
                  <input name="phone" placeholder="Phone" value={addressForm.phone} onChange={handleAddressFormChange} required />
                  <input name="line1" placeholder="Address line 1" value={addressForm.line1} onChange={handleAddressFormChange} required />
                  <input name="line2" placeholder="Address line 2 (optional)" value={addressForm.line2} onChange={handleAddressFormChange} />
                  <div className="profile__form-row">
                    <input name="city" placeholder="City" value={addressForm.city} onChange={handleAddressFormChange} required />
                    <input name="province" placeholder="Province/State" value={addressForm.province} onChange={handleAddressFormChange} required />
                  </div>
                  <div className="profile__form-row">
                    <input name="postalCode" placeholder="Postal code" value={addressForm.postalCode} onChange={handleAddressFormChange} required />
                    <input name="country" placeholder="Country" value={addressForm.country} onChange={handleAddressFormChange} required />
                  </div>
                  <label className="profile__checkbox">
                    <input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressFormChange} />
                    Set as default address
                  </label>
                  {addressError && <p className="profile__error">{addressError}</p>}
                  <div className="profile__form-actions">
                    <Button type="submit" variant="primary">{editingId ? "Save changes" : "Add address"}</Button>
                    <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setEditingId(null); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;