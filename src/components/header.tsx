
"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingCart, User, Sun, Moon, ChevronDown } from "lucide-react";
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
import React, { useMemo, useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import { megaMenuData, type MenuCategory } from "@/lib/menu-data";
import { CartSheet } from "./cart-sheet";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Product } from "@/lib/types";
import { useTheme } from "next-themes";

function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
    </Button>
  );
}


function DesktopMegaMenu({ category }: { category: MenuCategory }) {
  const getCategoryHref = (title: string) => {
    if (title.toLowerCase() === 'masculino') return "/produtos?genero=masculino";
    if (title.toLowerCase() === 'feminino') return "/produtos?genero=feminino";
    if (title.toLowerCase() === 'lançamentos') return "/produtos?categoria=lancamentos";
    if (title.toLowerCase() === 'ofertas') return "/produtos?categoria=ofertas";
    return "#";
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>
        <Link href={getCategoryHref(category.title)}>{category.title}</Link>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[600px] grid-cols-4 gap-6 p-6">
          {category.columns.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h3 className="mb-3 font-bold">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}


function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Link href="/" className="text-xl font-bold">
              PISA VIBE
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {megaMenuData.map((category) => (
              <Collapsible key={category.title} className="border-b">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-semibold">
                  {category.title}
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col space-y-2 px-4 pb-4">
                    {category.columns.map((col) => (
                      <div key={col.title}>
                        <h4 className="px-2 py-1 font-bold">{col.title}</h4>
                        {col.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent"
                          >
                            {link.title}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


function SearchBar() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/produtos?q=${searchQuery}`);
            setSearchQuery('');
        }
    };
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Pesquisar</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2">
                <form onSubmit={handleSearch}>
                    <Input 
                        placeholder="Buscar produtos..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function Header() {
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-300",
        scrolled ? "bg-background/80 shadow-md backdrop-blur-sm" : "bg-background"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MobileMenu />
          <Link href="/" className="text-xl font-bold">
            PISA VIBE
          </Link>
        </div>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {megaMenuData.map((category) => (
              <DesktopMegaMenu key={category.title} category={category} />
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1">
          <SearchBar />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Conta do usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/login">Login</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/registrar">Registrar</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CartSheet>
            <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {cartCount}
                    </span>
                )}
                <span className="sr-only">Abrir carrinho</span>
            </Button>
          </CartSheet>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

