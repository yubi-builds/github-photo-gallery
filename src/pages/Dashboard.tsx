import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { RepoCard } from '@/components/RepoCard';
import { CreateRepoDialog } from '@/components/CreateRepoDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserRepos, Repository } from '@/lib/github';
import { Plus, Search, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const fetchRepos = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await getUserRepos(token);
      setRepos(data);
    } catch (error) {
      toast.error('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRepos();
    }
  }, [token]);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Repositories</h1>
            <p className="text-muted-foreground mt-1">
              Manage your photo collections stored on GitHub
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            New Repository
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Repos grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRepos.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} onUpdate={fetchRepos} />
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No repositories yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first repository to start managing your photos
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Repository
            </Button>
          </div>
        )}
      </main>

      <CreateRepoDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchRepos}
      />
    </div>
  );
}
