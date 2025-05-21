import React from 'react';
import './Profile.css';

const Profile = () => {
  return (
    <div className="profile-page-container">
      {/* Header */}
      <header className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account settings and preferences.</p>
      </header>

      {/* User Info */}
      <section className="user-info-section">
        <div className="user-avatar-container">
          {/* Placeholder for avatar image */}
          <div className="user-avatar-placeholder">DU</div> 
        </div>
        <div className="user-details">
          <h2>Demo User</h2>
          <p>akwomakkingguersho@gmail.com</p>
          <div className="user-language-tags">
            <span>Ghomala</span>
            <span>Ewondo</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="profile-tabs">
        <button className="tab-button active">Account</button>
        <button className="tab-button">Password</button>
        <button className="tab-button">Languages</button>
        <button className="tab-button">Notifications</button>
      </nav>

      {/* Tab Content - Account Information (default) */}
      <section className="tab-content account-info-content">
        <h3>Account Information</h3>
        <p>Update your account information and email address.</p>
        <form className="account-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" defaultValue="Demo User" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" defaultValue="akwomakkingguersho@gmail.com" />
          </div>
          <button type="submit" className="save-changes-btn">Save Changes</button>
        </form>
      </section>
    </div>
  );
};

export default Profile;