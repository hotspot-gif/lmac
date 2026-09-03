import React from 'react';
import { useCustomAuth } from '@/lib/customAuth';
import { Card } from '@/components/ui/card';
import { Mail, Phone, MapPin, Briefcase, Shield, User } from 'lucide-react';

export default function Profile() {
  const { currentUser } = useCustomAuth();

  const fields = [
    { label: 'Full Name', value: currentUser?.full_name, icon: User },
    { label: 'Role', value: currentUser?.role, icon: Shield },
    { label: 'Designation', value: currentUser?.designation, icon: Briefcase },
    { label: 'Corporate Email', value: currentUser?.corporate_email, icon: Mail },
    { label: 'Mobile Number', value: '••••••' + (currentUser?.mobile_number?.slice(-4) || ''), icon: Phone },
    { label: 'Territory', value: currentUser?.territory, icon: MapPin },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-foreground/50 mt-1">Your account information.</p>
      </div>

      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-foreground to-foreground p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-foreground">
            {currentUser?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{currentUser?.full_name}</h2>
            <p className="text-accent text-sm">{currentUser?.role}</p>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/50">{field.label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{field.value || '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}