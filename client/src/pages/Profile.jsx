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
  const [nameError, setNameError] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addressFieldErrors, setAddressFieldErrors] = useState({});

  function loadAddresses() {
    setLoadingAddresses(true);
    fetchAddresses().then(setAddresses).finally(() => setLoadingAddresses(false));
  }

  useEffect(() => {
    if (!isAdmin) loadAddresses();
  }, [isAdmin]);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    if (name.trim() === user?.name?.trim()) {
      setNameError("No changes to save.");
      return;
    }
    setSavingName(true);
    setNameError(null);
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
    const nextErrors = {};
    if (!passwordForm.currentPassword) nextErrors.currentPassword = "Current password is required.";
    if (!passwordForm.newPassword) nextErrors.newPassword = "New password is required.";
    else if (passwordForm.newPassword.length < 8) nextErrors.newPassword = "Password must be at least 8 characters.";
    if (Object.keys(nextErrors).length > 0) {
      setPasswordFieldErrors(nextErrors);
      return;
    }
    setSavingPassword(true);
    setPasswordFieldErrors({});
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
    setAddressFieldErrors({});
    setAddressError(null);
    setShowAddForm(true);
  }

  function handleAddressFormChange(e) {
    const { name: field, value, type, checked } = e.target;
    setAddressForm({ ...addressForm, [field]: type === "checkbox" ? checked : value });
    if (addressFieldErrors[field]) {
      setAddressFieldErrors({ ...addressFieldErrors, [field]: "" });
    }
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    const requiredFields = ["fullName", "phone", "line1", "city", "province", "postalCode", "country"];
    const nextErrors = Object.fromEntries(
      requiredFields.filter((field) => !addressForm[field].trim()).map((field) => [field, "This field is required."])
    );
    if (Object.keys(nextErrors).length > 0) {
      setAddressFieldErrors(nextErrors);
      return;
    }
    setAddressFieldErrors({});
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
              <input value={name} onChange={(e) => { setName(e.target.value); setNameError(null); }} aria-invalid={Boolean(nameError)} />
              {nameError && <span className="profile__field-error">{nameError}</span>}
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
                onChange={(e) => { setPasswordForm({ ...passwordForm, currentPassword: e.target.value }); setPasswordFieldErrors({ ...passwordFieldErrors, currentPassword: "" }); }}
                aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
              />
              {passwordFieldErrors.currentPassword && <span className="profile__field-error">{passwordFieldErrors.currentPassword}</span>}
            </label>
            <label>
              New password
              <input
                type="password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => { setPasswordForm({ ...passwordForm, newPassword: e.target.value }); setPasswordFieldErrors({ ...passwordFieldErrors, newPassword: "" }); }}
                aria-invalid={Boolean(passwordFieldErrors.newPassword)}
              />
              {passwordFieldErrors.newPassword && <span className="profile__field-error">{passwordFieldErrors.newPassword}</span>}
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
                  {[["fullName", "Full name"], ["phone", "Phone"], ["line1", "Address line 1"], ["line2", "Address line 2 (optional)"]].map(([field, placeholder]) => (
                    <div className="profile__field" key={field}>
                      <input name={field} placeholder={placeholder} value={addressForm[field]} onChange={handleAddressFormChange} aria-invalid={Boolean(addressFieldErrors[field])} />
                      {addressFieldErrors[field] && <span className="profile__field-error">{addressFieldErrors[field]}</span>}
                    </div>
                  ))}
                  <div className="profile__form-row">
                    {[["city", "City"], ["province", "Province/State"]].map(([field, placeholder]) => (
                      <div className="profile__field" key={field}>
                        <input name={field} placeholder={placeholder} value={addressForm[field]} onChange={handleAddressFormChange} aria-invalid={Boolean(addressFieldErrors[field])} />
                        {addressFieldErrors[field] && <span className="profile__field-error">{addressFieldErrors[field]}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="profile__form-row">
                    {[["postalCode", "Postal code"], ["country", "Country"]].map(([field, placeholder]) => (
                      <div className="profile__field" key={field}>
                        <input name={field} placeholder={placeholder} value={addressForm[field]} onChange={handleAddressFormChange} aria-invalid={Boolean(addressFieldErrors[field])} />
                        {addressFieldErrors[field] && <span className="profile__field-error">{addressFieldErrors[field]}</span>}
                      </div>
                    ))}
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