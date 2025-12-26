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

  const handleRepoRename = (oldName: string, newName: string) => {
    setRepos(prev => prev.map(repo => 
      repo.name === oldName 
        ? { ...repo, name: newName } 
        : repo
    ));
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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Repositories</h1>
            <p className="text-sm text-muted-foreground">
              {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Repos grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRepos.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} onUpdate={fetchRepos} onRename={handleRepoRename} />
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No repositories</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first repository
            </p>
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="h-4 w-4" />
              New Repository
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
