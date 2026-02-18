import React, { useState } from "react";
import { Bell, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
      emailNotifications: true,
      smsNotifications: false,
      theme: "light"
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleToggle = async (key) => {
    const newVal = !settings[key];
    setSettings({ ...settings, [key]: newVal });
    
    // Optimistic UI, attempt save
    try {
        await api.patch(`/settings/user/${user.username}`, { [key]: newVal });
    } catch(err) {
        console.error("Failed to update setting", err);
        // Revert (optional)
        setSettings({ ...settings, [key]: !newVal });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-gray-500">Manage your preferences</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Notifications */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <Bell size={20} />
             </div>
             <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive order updates and promos via email</p>
             </div>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.emailNotifications} 
                onChange={() => handleToggle("emailNotifications")}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
           </label>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-gray-100">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <Bell size={20} />
             </div>
             <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-500">Receive OTPs and updates via SMS</p>
             </div>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.smsNotifications} 
                onChange={() => handleToggle("smsNotifications")}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
           </label>
        </div>

      </div>
    </div>
  );
};

export default Settings;
