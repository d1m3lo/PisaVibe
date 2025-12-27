"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/cart-context";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import React from "react";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-foreground/80 transition-colors hover:text-foreground"
  >
    {children}
  </Link>
);

const UserMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <User className="h-5 w-5" />
        <span className="sr-only">Menu do usuário</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/login">Login</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/registrar">Registrar</Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CartButton = () => {
  const { cartCount } = useCart();
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/carrinho" aria-label="Carrinho de compras">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {cartCount}
          </span>
        )}
      </Link>
    </Button>
  );
};

const SearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produtos?q=${query}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative hidden md:block">
      <Input
        type="search"
        placeholder="Buscar produtos..."
        className="w-48 pr-10 lg:w-64"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-headline text-xl font-bold tracking-tight"
          >
            PISA VIBE
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <NavLink href="/produtos?categoria=masculino">Masculino</NavLink>
            <NavLink href="/produtos?categoria=feminino">Feminino</NavLink>
            <NavLink href="/produtos?categoria=lancamentos">Lançamentos</NavLink>
            <NavLink href="/produtos?categoria=ofertas">Ofertas</NavLink>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SearchBar />
          <div className="hidden md:flex">
             <UserMenu />
          </div>
          <CartButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 p-4">
                <Link href="/" className="font-headline text-xl font-bold">
                  PISA VIBE
                </Link>
                <nav className="flex flex-col gap-4 text-lg">
                  <NavLink href="/produtos?categoria=masculino">Masculino</NavLink>
                  <NavLink href="/produtos?categoria=feminino">Feminino</NavLink>
                  <NavLink href="/produtos?categoria=lancamentos">Lançamentos</NavLink>
                  <NavLink href="/produtos?categoria=ofertas">Ofertas</NavLink>
                </nav>
                 <div className="border-t pt-4">
                  <UserMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
