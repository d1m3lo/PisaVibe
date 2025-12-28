
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, KeyRound, Heart } from 'lucide-react';

const AccountPageSkeleton = () => (
    <div className="container mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-2/3 mb-8" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
            <Skeleton className="h-40 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-11 w-32" />
                </CardContent>
            </Card>
        </div>
    </div>
);


export default function MyAccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setName(data.name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
      } else {
         // Create a profile if it doesn't exist (e.g. for users who signed up before profile creation)
        const newProfile = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        setName(newProfile.name);
      }
    };

    fetchProfile();
  }, [user, isUserLoading, firestore, router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
        // Update Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            name,
            address,
            phone,
        });

        // Also update Firebase Auth profile if name changed
        if (auth.currentUser && auth.currentUser.displayName !== name) {
            await updateProfile(auth.currentUser, { displayName: name });
        }

        toast({
            title: 'Perfil Atualizado!',
            description: 'Suas informações foram salvas com sucesso.',
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar seu perfil. Tente novamente.',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isUserLoading || !profile) {
    return <AccountPageSkeleton />;
  }

  const menuItems = [
      { id: 'profile', label: 'Detalhes do Perfil', icon: User },
      { id: 'password', label: 'Alterar Senha', icon: KeyRound },
      { id: 'favorites', label: 'Favoritos', icon: Heart },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-headline text-4xl font-bold">Minha Conta</h1>
      <p className="mt-2 text-lg text-muted-foreground">Gerencie suas informações e preferências.</p>
      
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
            <nav className="flex flex-col gap-2">
                {menuItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => setActiveView(item.id)}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </Button>
                ))}
            </nav>

            <div>
                {activeView === 'profile' && (
                    <form onSubmit={handleSave}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhes do Perfil</CardTitle>
                                <CardDescription>
                                    Mantenha seus dados de contato e entrega atualizados.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={profile.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" />
                                </div>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                )}

                {activeView === 'password' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Alterar Senha</CardTitle>
                            <CardDescription>
                                Para sua segurança, recomendamos o uso de uma senha forte.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Funcionalidade a ser implementada.</p>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Senha Atual</Label>
                                <Input id="current-password" type="password" disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input id="new-password" type="password" disabled />
                            </div>
                            <Button disabled>Salvar Nova Senha</Button>
                        </CardContent>
                    </Card>
                )}

                {activeView === 'favorites' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Favoritos</CardTitle>
                            <CardDescription>
                               Seus produtos salvos para não perder de vista.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-muted-foreground py-8">
                                 <p>Você ainda não tem produtos favoritos.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
