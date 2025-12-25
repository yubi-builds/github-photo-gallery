import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUser } from '@/lib/github';
import { Loader2 } from 'lucide-react';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received');
      return;
    }

    // In a real app, you would exchange this code for a token via your backend
    // For now, we'll show a message about setting up the backend
    setError(
      'To complete authentication, you need to set up a backend to exchange the authorization code for an access token. ' +
      'This requires a GitHub OAuth App with a client secret, which must be kept secure on the server side.'
    );
    
    // For development/demo purposes, if you have a token from elsewhere:
    // const demoToken = 'your_github_token';
    // handleAuth(demoToken);
  }, [searchParams]);

  const handleAuth = async (token: string) => {
    try {
      const user = await getUser(token);
      setAuthData(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to authenticate with GitHub');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Setup Required</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
