
"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingCart, User, Sun, Moon, ChevronDown, LogOut } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { megaMenuData, type MenuCategory } from "@/lib/menu-data";
import { CartSheet } from "./cart-sheet";
import { useCollection, useMemoFirebase, useFirestore, useUser, useAuth } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Product } from "@/lib/types";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";

function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="transition-transform duration-200 hover:-translate-y-1"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

const UserMenu = () => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  if (isUserLoading) {
    return (
      <div className="h-10 w-10 flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Button variant="ghost" asChild className="transition-transform duration-200 hover:-translate-y-1">
        <Link href="/login">Login</Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="transition-transform duration-200 hover:-translate-y-1"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">Menu do usuário</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Olá, {user.displayName || user.email?.split('@')[0]}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="#">Meus Pedidos</Link>
        </DropdownMenuItem>
         <DropdownMenuItem asChild>
            <Link href="/minha-conta">Minha Conta</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};

const CartButton = () => {
  const { cartCount } = useCart();
  return (
    <CartSheet>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-transform duration-200 hover:-translate-y-1"
          aria-label="Carrinho de compras"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Button>
    </CartSheet>
  );
};

const SearchBar = () => {
  const router = useRouter();
  const [queryValue, setQueryValue] = React.useState("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('status', '==', 'ativo'));
  }, [firestore]);

  const { data: products } = useCollection<Product>(productsQuery);

  const searchResults = useMemo(() => {
    if (queryValue.trim().length < 2 || !products) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(queryValue.toLowerCase()))
      .slice(0, 5);
  }, [queryValue, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryValue.trim()) {
      router.push(`/produtos?q=${queryValue}`);
      closePopover();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQueryValue(newQuery);
    if (newQuery.trim().length > 1 && !isPopoverOpen) {
      setIsPopoverOpen(true);
    } else if (newQuery.trim().length <= 1 && isPopoverOpen) {
      setIsPopoverOpen(false);
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (!open) {
      inputRef.current?.blur();
    }
  };
  
  const closePopover = () => {
    setIsPopoverOpen(false);
    setQueryValue("");
    inputRef.current?.blur();
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Buscar produtos..."
            className="w-48 pr-10 lg:w-64"
            value={queryValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (queryValue.trim().length > 1) setIsPopoverOpen(true);
            }}
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
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2 lg:w-[400px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        {searchResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {searchResults.map((product) => (
              <Link
                key={product.id}
                href={`/produtos/${product.id}`}
                className="flex items-center gap-4 rounded-md p-2 hover:bg-accent"
                onClick={closePopover}
              >
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image
                    src={product.variants[0].images[0]}
                    alt={product.name}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          queryValue.trim().length > 1 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </p>
          )
        )}
      </PopoverContent>
    </Popover>
  );
};

const MobileSubMenu = ({
  category,
  onClose,
}: {
  category: MenuCategory;
  onClose: () => void;
}) => (
  <Collapsible>
    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold text-foreground/80 transition-colors hover:text-foreground">
      {category.title}
      <ChevronDown className="h-5 w-5" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="mt-2 flex flex-col gap-2 pl-4">
        {category.columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">{column.title}</h3>
            <div className="flex flex-col gap-1 pl-2">
              {column.links.map((link) => (
                <Link
                  key={link.title + link.href}
                  href={link.href}
                  className="text-sm text-foreground/70"
                  onClick={onClose}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
);

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-300",
        scrolled ? "border-b bg-background/95 backdrop-blur-sm" : "bg-transparent border-b border-transparent"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-headline text-xl font-bold tracking-tight"
          >
            PISA VIBE
          </Link>
          <nav className="hidden md:flex gap-1 items-center">
            {megaMenuData.map((category) => (
              <DropdownMenu 
                key={category.title} 
                open={openMenu === category.title} 
                onOpenChange={(isOpen) => setOpenMenu(isOpen ? category.title : null)}
              >
                <div
                  onMouseEnter={() => setOpenMenu(category.title)}
                  onMouseLeave={() => setOpenMenu(null)}
                  className="group"
                >
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-sm font-medium text-muted-foreground hover:text-primary data-[state=open]:text-primary"
                    >
                      {category.title}
                      <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start"
                    className="w-auto rounded-lg p-2"
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <div className="flex gap-4 p-2">
                      {category.columns.map((column) => (
                        <div key={column.title} className="flex flex-col">
                          <DropdownMenuLabel>{column.title}</DropdownMenuLabel>
                          {column.links.length > 0 ? column.links.map((link) => (
                            <DropdownMenuItem key={link.href} asChild>
                              <Link href={link.href}>{link.title}</Link>
                            </DropdownMenuItem>
                          )) : (
                            <DropdownMenuItem disabled>Em breve</DropdownMenuItem>
                          )}
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </div>
              </DropdownMenu>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SearchBar />
          <div className="hidden items-center md:flex">
             <UserMenu />
             <ModeToggle />
          </div>
          <CartButton />
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm">
              <div className="flex flex-col gap-6 p-4">
                <Link href="/" className="font-headline text-xl font-bold" onClick={() => setIsSheetOpen(false)}>
                  PISA VIBE
                </Link>
                <nav className="flex flex-col gap-1">
                   {megaMenuData.map((cat) => (
                    <MobileSubMenu key={cat.title} category={cat} onClose={() => setIsSheetOpen(false)} />
                  ))}
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

    

    