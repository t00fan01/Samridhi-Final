import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: fullName });
        }
        onLoginSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans relative overflow-hidden">
      {/* Left Panel: Diagonal Design */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] bg-teal-900 p-16 relative z-10 [clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)] shadow-2xl">
        <div className="w-full max-w-md lg:max-w-lg pr-12 lg:pr-24 xl:pr-32 ml-auto mr-12 lg:mr-0 lg:mx-auto text-right lg:text-left">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">Samridhi</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Start empowering<br />with Samridhi
          </h1>
          <p className="text-teal-100/90 text-lg font-medium leading-relaxed max-w-[400px]">
            Join our centralized command network to streamline NGO field operations, securely manage intelligence, and accelerate community impact.
          </p>
        </div>
      </div>

      {/* Right Panel: Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 z-0 relative bg-white lg:-ml-12">
        <div className="w-full max-w-[420px]">
          
          {/* Auth Tabs */}
          <div className="flex gap-8 mb-8 border-b border-slate-200">
            <button 
              onClick={() => { setIsRegistering(true); setError(''); }}
              className={`pb-3 font-bold text-lg transition-all ${isRegistering ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Register
            </button>
            <button 
              onClick={() => { setIsRegistering(false); setError(''); }}
              className={`pb-3 font-bold text-lg transition-all ${!isRegistering ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign in
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                    placeholder="Jane Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="jane.doe@ngo.org"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold text-lg transition-all shadow-md active:scale-[0.98] disabled:opacity-80 disabled:pointer-events-none mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                isRegistering ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
