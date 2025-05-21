// import { useRouter } from "next/navigation"; // User needs to adapt this for react-router-dom if navigation is needed
import React, { useState, useEffect } from "react";
import './Profile.css'; // Keep existing CSS import

// Placeholder imports - User needs to ensure these components/hooks are available or implement/replace them
// Option 1: Assume they exist at these paths (e.g., if using Shadcn UI or similar)
// It's recommended to install and configure these if you intend to use them like in the example.
// For now, basic HTML elements or simple stand-ins could be used if these are not set up.
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
const Input = (props) => <input {...props} />;
const Label = ({ children, ...props }) => <label {...props}>{children}</label>;
const Card = ({ children, ...props }) => <div className="card" {...props}>{children}</div>;
const CardHeader = ({ children, ...props }) => <div className="card-header" {...props}>{children}</div>;
const CardTitle = ({ children, ...props }) => <h3 className="card-title" {...props}>{children}</h3>;
const CardDescription = ({ children, ...props }) => <p className="card-description" {...props}>{children}</p>;
const CardContent = ({ children, ...props }) => <div className="card-content" {...props}>{children}</div>;
const CardFooter = ({ children, ...props }) => <div className="card-footer" {...props}>{children}</div>;
const Tabs = ({ children, defaultValue, ...props }) => <div className="tabs" {...props}>{React.Children.map(children, child => React.cloneElement(child, { activeTab: defaultValue }))}</div>; // Simplified Tabs
const TabsList = ({ children, ...props }) => <div className="tabs-list" {...props}>{children}</div>;
const TabsTrigger = ({ children, value, ...props }) => <button className={`tab-trigger ${props.activeTab === value ? 'active' : ''}`} {...props}>{children}</button>; // Simplified TabsTrigger
const TabsContent = ({ children, value, ...props }) => props.activeTab === value ? <div className="tab-content" {...props}>{children}</div> : null; // Simplified TabsContent
const Avatar = ({ children, ...props }) => <div className="avatar" {...props}>{children}</div>;
const AvatarImage = ({ src, alt, ...props }) => <img src={src} alt={alt} className="avatar-image" {...props} />;
const AvatarFallback = ({ children, ...props }) => <div className="avatar-fallback" {...props}>{children}</div>;
const Badge = ({ children, ...props }) => <span className="badge" {...props}>{children}</span>;

// Placeholder implementation for useToast and useAuth if not available
const useToast = () => {
  return {
    toast: ({ title, description, variant }) => {
      console.log(`Toast: ${title} - ${description} (variant: ${variant || 'default'})`);
      alert(`${title}: ${description}`);
    }
  };
};

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const storedUser = localStorage.getItem("lingoroots_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
          setUser({ name: "Demo User", email: "demo@example.com", selectedLanguages: ["English", "Spanish"], avatarUrl: "" });
        }
      } else {
        // Default mock user if nothing in localStorage
        setUser({ name: "Demo User", email: "demo@example.com", selectedLanguages: ["English", "Spanish"], avatarUrl: "" });
      }
      setLoading(false);
    }, 500);
  }, []);

  return { user, loading, setUser };
};


export default function ProfilePage() {
  const { user, loading, setUser: setAuthUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (user) {
      const updatedUser = { ...user, name, email };
      if (setAuthUser) setAuthUser(updatedUser);
      localStorage.setItem("lingoroots_user", JSON.stringify(updatedUser));
    }
    toast({ title: "Success", description: "Your profile has been updated" });
    setIsSaving(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: "Success", description: "Your password has been updated" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSaving(false);
  };

  if (loading || !user) {
    return (
      <div className="profile-page-container flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Simplified Tabs component logic for placeholder
  const renderTabsList = () => (
    <TabsList>
      <TabsTrigger value="account" onClick={() => setActiveTab("account")} activeTab={activeTab}>Account</TabsTrigger>
      <TabsTrigger value="password" onClick={() => setActiveTab("password")} activeTab={activeTab}>Password</TabsTrigger>
      <TabsTrigger value="languages" onClick={() => setActiveTab("languages")} activeTab={activeTab}>Languages</TabsTrigger>
      <TabsTrigger value="notifications" onClick={() => setActiveTab("notifications")} activeTab={activeTab}>Notifications</TabsTrigger>
    </TabsList>
  );

  return (
    <div className="profile-page-container">
      <header className="profile-header">
         <h1>Profile Settings</h1>
         <p>Manage your account settings and preferences.</p>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Avatar style={{ height: '80px', width: '80px', marginRight: '20px' }}>
          <AvatarImage src={user.avatarUrl || `https://via.placeholder.com/80?text=${user.name ? user.name.charAt(0) : 'U'}`} alt={user.name} />
          <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{user.name}</h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{user.email}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {(user.selectedLanguages || []).map((lang) => (
              <Badge key={lang} style={{ /* Add basic badge styling if needed */ }}>
                {typeof lang === 'string' ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Language'}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab}>
        {renderTabsList()}

        <TabsContent value="account" activeTab={activeTab}>
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your account information and email address.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} style={{width: '100%', padding: '8px', marginTop: '4px'}}/>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} style={{width: '100%', padding: '8px', marginTop: '4px'}}/>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving} className="save-changes-btn">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password" activeTab={activeTab}>
          <Card>
            <form onSubmit={handlePasswordUpdate}>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password. Make sure it's a strong one.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isSaving} style={{width: '100%', padding: '8px', marginTop: '4px'}}/>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSaving} style={{width: '100%', padding: '8px', marginTop: '4px'}}/>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSaving} style={{width: '100%', padding: '8px', marginTop: '4px'}}/>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving} className="save-changes-btn">
                  {isSaving ? "Saving..." : "Update Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="languages" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Manage your language preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Language settings will go here. (e.g., select languages you are learning or proficient in)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure your notification settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Notification preferences will go here. (e.g., email notifications, app notifications)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}