import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import logo from '@/Public/logo.svg';
import { AlertCircle, ArrowRight, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, validateEmail } = useCustomAuth();
  const { t } = useLanguage();
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
      setError(t('emailRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await validateEmail(email);
      if (!result.found) {
        setError(t('userNotFound'));
      } else {
        setUserName(result.user.full_name);
        setStep(2);
      }
    } catch {
      setError(t('emailError'));
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error === 'Invalid password. Please try again.' ? t('invalidPassword') : result.error);
      }
    } catch {
      setError(t('loginError'));
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
          <div className="inline-flex items-center justify-center w-48 h-48 mb-0">
            <img src={logo} alt="Lyca Ops" className="w-full h-full object-contain" />
          </div>
          <p className="text-sm text-foreground/60 mt-0">{t('marketAssistanceCenter')}</p>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5 rounded-2xl overflow-hidden">
          <div className="bg-foreground px-6 py-4">
            <p className="text-sm font-medium text-[hsl(var(--card))]">
              {step === 1 ? t('stepIdentify') : t('password')}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {step === 1 ? t('enterEmail') : t('enterPassword')}
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
            <form key="email-step" onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">{t('corporateEmail')}</Label>
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('verifying')}</> :

                <>{t('continue')} <ArrowRight className="w-4 h-4 ml-2" /></>
                }
                </Button>
              </form> :

            <form key="password-step" onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
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
                  
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
                  </Button>
                  <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-foreground hover:bg-foreground/90 text-white font-medium h-11">
                  
                    {loading ?
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('signingIn')}</> :

                    t('signIn')
                  }
                  </Button>
                </div>
              </form>
            }
            <div className="flex justify-end mt-5 pt-4 border-t border-foreground/10">
              <LanguageSwitcher />
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-foreground/40 mt-6">{t('authorized')}

        </p>
      </div>
    </div>);

}