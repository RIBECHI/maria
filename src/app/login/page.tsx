
"use client";

import * as React from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import Logo from "@/components/layout/Logo";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type FormValues = z.infer<typeof loginSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.108-11.187-7.481l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.846,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { auth } = initializeFirebase();

  const loginForm = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLogin: SubmitHandler<FormValues> = async ({ email, password }) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo(a) de volta!" });
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Erro no Login",
        description: error.message.includes('auth/invalid-credential') 
          ? "Credenciais inválidas. Verifique seu e-mail e senha." 
          : "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRegister: SubmitHandler<FormValues> = async ({ email, password }) => {
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Cadastro realizado com sucesso!", description: "Você já pode fazer o login." });
      // Idealmente, redirecionar para a aba de login ou fazer login direto
    } catch (error: any) {
      toast({
        title: "Erro no Cadastro",
        description: error.message.includes('auth/email-already-in-use') 
          ? "Este e-mail já está em uso." 
          : "Ocorreu um erro no cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Login com Google bem-sucedido!", description: "Bem-vindo(a)!" });
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Erro no Login com Google",
        description: "Não foi possível fazer o login com Google. Tente novamente.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
                <Logo className="h-10 w-10 text-primary" />
                <CardTitle className="text-3xl">LexManager</CardTitle>
            </div>
          <CardDescription>
            Seu software de gestão jurídica inteligente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" type="email" placeholder="seu@email.com" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" {...loginForm.register("password")} />
                   {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-mail</Label>
                  <Input id="register-email" type="email" placeholder="seu@email.com" {...registerForm.register("email")} />
                   {registerForm.formState.errors.email && <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input id="register-password" type="password" {...registerForm.register("password")} />
                   {registerForm.formState.errors.password && <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" /> : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-2" /> Google</> }
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
