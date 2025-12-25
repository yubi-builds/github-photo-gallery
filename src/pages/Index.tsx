import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Camera, Github, Shield, Cloud, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const features = [
    {
      icon: Cloud,
      title: 'GitHub Storage',
      description: 'Your photos are stored securely in your own GitHub repositories'
    },
    {
      icon: Shield,
      title: 'Privacy Control',
      description: 'Make repositories public or private with a single click'
    },
    {
      icon: Zap,
      title: 'Fast Downloads',
      description: 'Download single or multiple photos instantly'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
          </div>
          
          <div className="container px-4 py-24 md:py-32">
            <div className="max-w-3xl mx-auto text-center">
              {/* Logo */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
                  <div className="relative p-4 rounded-2xl bg-card border border-border/50">
                    <Camera className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
              
              {/* Heading */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
                Your Photos,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Infinite Storage
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up stagger-1">
                InfiPhotos lets you manage your photo collections using GitHub as your personal cloud storage. 
                Secure, unlimited, and completely under your control.
              </p>
              
              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up stagger-2">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={login}
                  className="group"
                >
                  <Github className="h-5 w-5" />
                  Sign in with GitHub
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4 animate-slide-up stagger-3">
                Free forever • No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-t border-border/50">
          <div className="container px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className={`glass-card rounded-xl p-6 animate-slide-up stagger-${index + 1}`}
                >
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 border-t border-border/50">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Sign In', desc: 'Connect with your GitHub account' },
                { step: '2', title: 'Create Repo', desc: 'Create a new repository for your photos' },
                { step: '3', title: 'Upload', desc: 'Add photos to your repository' },
                { step: '4', title: 'Manage', desc: 'View, download, and organize freely' },
              ].map((item, index) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Built with GitHub API • Your data stays in your repositories</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
