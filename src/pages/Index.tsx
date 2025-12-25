import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Camera, Github, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getUser } from '@/lib/github';

const Index = () => {
  const { user, isLoading, login, setAuthData } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      toast.error('Please enter your GitHub token');
      return;
    }

    setIsAuthenticating(true);
    try {
      const userData = await getUser(token.trim());
      setAuthData(token.trim(), userData);
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid token. Please check and try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16 md:py-24">
        <div className="max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="p-3 rounded-xl border border-border bg-card">
              <Camera className="h-8 w-8" />
            </div>
          </div>
          
          {/* Heading */}
            OctoLens
          
          <p className="text-muted-foreground mb-8 animate-slide-up stagger-1">
            Store and manage your photos using GitHub repositories. Simple, free, and under your control.
          </p>
          
          {/* Auth Card */}
          <div className="card-minimal p-6 text-left animate-slide-up stagger-2">
            <h2 className="font-medium mb-4">Sign in with GitHub Token</h2>
            
            <div className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTokenLogin()}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Create a <strong>classic</strong> token at{' '}
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,delete_repo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    github.com/settings/tokens
                  </a>
                  {' '}with <code className="bg-secondary px-1 rounded">repo</code> and <code className="bg-secondary px-1 rounded">delete_repo</code> scopes.
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleTokenLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  'Signing in...'
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid gap-4 text-left animate-slide-up stagger-3">
            {[
              { title: 'Your storage', desc: 'Photos stay in your GitHub repos' },
              { title: 'Full control', desc: 'Public or private visibility' },
              { title: 'Easy downloads', desc: 'Single or bulk export' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
