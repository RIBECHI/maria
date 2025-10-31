
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Logo from "@/components/layout/Logo";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

const registerSchema = z.object({
  displayName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres."}),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});


export default function LoginPage() {
  const [isLoginView, setIsLoginView] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuthInstance();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const handleLogin: SubmitHandler<z.infer<typeof loginSchema>> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo(a) de volta!",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no Login",
        description: error.code === 'auth/invalid-credential' 
            ? "Credenciais inválidas. Verifique seu e-mail e senha."
            : "Não foi possível fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister: SubmitHandler<z.infer<typeof registerSchema>> = async (data) => {
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(userCredential.user, { displayName: data.displayName });

        toast({
            title: "Conta criada com sucesso!",
            description: "Você será redirecionado para o painel.",
        });
        router.push('/');
    } catch (error: any) {
        console.error("Erro no registro:", error);
        toast({
            title: "Erro no Registro",
            description: error.code === 'auth/email-already-in-use'
                ? 'Este e-mail já está em uso. Tente fazer login.'
                : 'Não foi possível criar sua conta. Tente novamente.',
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">LexManager</CardTitle>
          <CardDescription>
            {isLoginView ? "Faça login para acessar seu painel" : "Crie uma nova conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoginView ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="login-email">E-mail</Label>
                      <FormControl>
                        <Input id="login-email" type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="login-password">Senha</Label>
                      <FormControl>
                        <Input id="login-password" type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="register-name">Nome Completo</Label>
                      <FormControl>
                        <Input id="register-name" type="text" placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="register-email">E-mail</Label>
                      <FormControl>
                        <Input id="register-email" type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="register-password">Senha</Label>
                      <FormControl>
                        <Input id="register-password" type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Criar Conta"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
            <Button variant="link" onClick={() => setIsLoginView(!isLoginView)}>
                {isLoginView ? "Não tem uma conta? Crie agora" : "Já tem uma conta? Faça login"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    