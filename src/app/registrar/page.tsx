"use client";

import Link from "next/link";
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

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Registrar</CardTitle>
          <CardDescription>
            Crie sua conta para começar a comprar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="first-name">Nome</Label>
                <Input id="first-name" placeholder="Seu Nome" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required/>
            </div>
            <Button type="submit" className="w-full">
              Criar conta
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
