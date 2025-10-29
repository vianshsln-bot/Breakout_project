
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/employees/validate`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.reason || `Login failed with status: ${response.status}`);
      }

      if (data.exists) {
        const role = data.is_admin ? 'admin' : 'employee';
        login({ email, role });
        router.push('/dashboard');
        toast({
          title: 'Login Successful',
          description: `Welcome back! You are logged in as ${role}.`,
        });
      } else {
        throw new Error(data.reason || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-3 w-fit">
                <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-2xl font-bold mt-4">Enterprise Command</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
