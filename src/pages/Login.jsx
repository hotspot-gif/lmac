import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import logo from '@/Public/logo.svg';
import { AlertCircle, ArrowRight, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, validateEmail } = useCustomAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your corporate email address.');
      return;
    }
    setLoading(true);
    try {
      const result = await validateEmail(email);
      if (!result.found) {
        setError('User not found. Please check your corporate email address.');
      } else {
        setUserName(result.user.full_name);
        setStep(2);
      }
    } catch {
      setError('Unable to verify email. Please try again.');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setError('');
    setUserName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 mb-2">
            <img src={logo} alt="Lyca Ops" className="w-full h-full object-contain" />
          </div>
          <p className="text-sm text-foreground/60 mt-1">Market Assistance Center</p>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5 rounded-2xl overflow-hidden">
          <div className="bg-foreground px-6 py-4">
            <p className="text-sm font-medium text-[hsl(var(--card))]">
              {step === 1 ? 'Step 1 of 2 — Identify Yourself' : `Hello, ${userName}`}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {step === 1 ? 'Enter your corporate email to continue' : 'Enter your password to sign in'}
            </p>
          </div>

          <div className="p-6">
            {error &&
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            }

            {step === 1 ?
            <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Corporate Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@universalservice.it"
                    className="pl-10 rounded-xl border-foreground/15 bg-white"
                    autoFocus />
                  
                  </div>
                </div>
                <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-foreground hover:bg-foreground/90 text-white font-medium h-11">
                
                  {loading ?
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> :

                <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                }
                </Button>
              </form> :

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 rounded-xl border-foreground/15 bg-white"
                    autoFocus />
                  
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="rounded-xl border-foreground/15 text-foreground hover:bg-background h-11">
                  
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-foreground hover:bg-foreground/90 text-white font-medium h-11">
                  
                    {loading ?
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> :

                  'Sign In'
                  }
                  </Button>
                </div>
              </form>
            }
          </div>
        </Card>

        <p className="text-center text-xs text-foreground/40 mt-6">Authorized personnel only. Contact your administrator for access.

        </p>
      </div>
    </div>);

}