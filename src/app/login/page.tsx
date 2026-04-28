"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useSupabase } from "@/firebase";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025A20.023 20.023 0 0 0 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.533 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta à PISA VIBE.",
      });
      router.push("/");
    } catch (err: any) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha inválidos.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login.';
      } else {
        errorMessage = 'Falha no login. Por favor, tente novamente.';
      }
       setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: errorMessage,
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      // Note: After OAuth redirect, user creation in the DB
      // should be handled via a Supabase trigger or in the auth callback
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Erro no Login com Google",
        description: "Não foi possível fazer login com o Google. Tente novamente.",
      });
      console.error("Google sign-in error:", error);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingReset(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o email de recuperação. Verifique o endereço e tente novamente.",
      });
    } finally {
      setIsSendingReset(false);
    }
  };


  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
             <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                    <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setForgotEmail(email); }}
                    className="text-sm underline text-muted-foreground hover:text-foreground text-left w-fit transition-colors"
                >
                    Esqueceu sua senha?
                </button>
                </div>
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                Entrar
                </Button>
             </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/registrar" className="underline">
              Registre-se
            </Link>
          </div>

          {/* Modal de Esqueceu Senha */}
          {showForgotPassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForgotPassword(false)}>
              <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-headline text-lg font-semibold mb-1">Recuperar Senha</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Informe seu email e enviaremos um link para redefinir sua senha.
                </p>
                <form onSubmit={handleForgotPassword} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSendingReset}>
                    {isSendingReset ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      "Enviar Link de Recuperação"
                    )}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                    Voltar ao Login
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
