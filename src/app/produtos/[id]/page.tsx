
"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product, Variant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect, useRef } from "react";
import { cn, fixImageUrl } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { QualityBadge } from "@/components/quality-badge";
import Link from "next/link";
import { ColorSwatch } from "@/components/color-swatch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Info, ZoomIn, Search, ChevronLeft, ChevronRight, X, Share2, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { SizeChart } from "@/components/size-chart";
import { useToast } from "@/hooks/use-toast";
import { SecuritySeal } from "@/components/security-seal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


const ProductPageSkeleton = () => (
  <div className="container mx-auto max-w-5xl px-4 py-12">
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      <div>
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="mt-4 grid grid-cols-5 gap-2">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="aspect-square w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-col">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-4 h-8 w-1/3" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </div>
         <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-1/d" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-20 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
                 <Skeleton className="h-10 w-20 rounded-md" />
            </div>
        </div>
        <div className="mt-8">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);

const ImportedProductBadge = () => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="absolute left-3 top-3 z-20">
                    <Badge variant="outline" className="select-none items-center gap-1 border-red-300 bg-red-600/90 px-2.5 py-1 text-xs text-white shadow-md transition-transform duration-200 hover:-translate-y-1">
                        <Globe className="h-3 w-3" />
                        <span className="font-bold uppercase tracking-wider">Importado</span>
                    </Badge>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Este é um produto de origem internacional.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const ImageZoomView = ({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasDragged(false);
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    e.preventDefault();
    setHasDragged(true);

    if (imgRef.current && containerRef.current) {
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      const {
        width: containerWidth,
        height: containerHeight,
      } = containerRef.current.getBoundingClientRect();
      const imgWidth = imgRef.current.offsetWidth * 1.75;
      const imgHeight = imgRef.current.offsetHeight * 1.75;

      const maxX = Math.max(0, (imgWidth - containerWidth) / 2);
      const maxY = Math.max(0, (imgHeight - containerHeight) / 2);

      newX = Math.max(Math.min(newX, maxX), -maxX);
      newY = Math.max(Math.min(newY, maxY), -maxY);

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (!hasDragged && e.target === imgRef.current) {
      setIsZoomed((prev) => !prev);
      if (isZoomed) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
  };

  const getCursorStyle = () => {
    if (isZoomed) return isDragging ? "grabbing" : "grab";
    return "zoom-in";
  };

  return (
    <DialogContent
      className="flex h-full w-full max-w-full max-h-full items-center justify-center border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
    >
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <DialogTitle className="sr-only">Visualizador de Imagem: {alt}</DialogTitle>
      <div
        ref={containerRef}
        className="relative w-[35%] h-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        <Image
          ref={imgRef}
          src={images[currentIndex]}
          alt={alt}
          width={1080}
          height={1080}
          className="object-contain transition-transform duration-300 ease-out w-full h-auto relative"
          style={{
            transform: isZoomed
              ? `scale(1.75) translate(${position.x}px, ${position.y}px)`
              : "scale(1) translate(0,0)",
            cursor: getCursorStyle(),
            userSelect: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      <DialogClose asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-30 text-white bg-black/20 hover:bg-black/50 hover:text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </DialogClose>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white bg-black/20 hover:bg-black/50 hover:text-white"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white bg-black/20 hover:bg-black/50 hover:text-white"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white bg-black/40 px-2 py-1 rounded-md text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </DialogContent>
  );
};


export default function ProductPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();
  const { addToCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id as string);
  }, [firestore, id]);

  const { data: product, isLoading } = useDoc<Product>(productRef);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [giftChoice, setGiftChoice] = useState<'dourada' | 'prata' | null>(null);
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isZoomViewOpen, setIsZoomViewOpen] = useState(false);
  const [zoomStartIndex, setZoomStartIndex] = useState(0);

  const sortedSizes = useMemo(() => {
    if (!selectedVariant?.sizes) return [];
    
    const unwantedSizes = ['G1', 'G2', 'G3'];
    const filteredSizes = selectedVariant.sizes.filter(s => !unwantedSizes.includes(s.size));

    // Custom sort function
    return [...filteredSizes].sort((a, b) => {
      // Handle "U" size to always be at the end
      if (a.size === 'U') return 1;
      if (b.size === 'U') return -1;
  
      // Handle letter sizes
      const sizeOrder: Record<string, number> = { 'P': 1, 'M': 2, 'G': 3, 'GG': 4 };
      const aIsLetter = isNaN(parseFloat(a.size)) && sizeOrder[a.size.toUpperCase()];
      const bIsLetter = isNaN(parseFloat(b.size)) && sizeOrder[b.size.toUpperCase()];
      if (aIsLetter && bIsLetter) {
        return (sizeOrder[a.size.toUpperCase()] || 99) - (sizeOrder[b.size.toUpperCase()] || 99);
      }
      if (aIsLetter) return 1; // Letters after numbers
      if (bIsLetter) return -1; // Numbers before letters
      
      // Handle numeric and combined numeric sizes (e.g., "34", "33/34")
      const getFirstNumber = (s: string) => parseFloat(s.split('/')[0]);
      const numA = getFirstNumber(a.size);
      const numB = getFirstNumber(b.size);
  
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      // Fallback for any other cases
      return a.size.localeCompare(b.size);
    });
  }, [selectedVariant?.sizes]);

  const isPerfume = product?.category === 'perfumes';
  const isBackpack = product?.subCategory === 'mochilas';
  const isCap = product?.subCategory === 'bonés';
  const isWatch = product?.subCategory === 'relógios';
  const isClothing = product?.category === 'roupas';
  const hasSingleSize = useMemo(() => {
    if (!selectedVariant) return false;
    const allSizesAreU = selectedVariant.sizes.every(s => s.size === 'U');
    return selectedVariant.sizes.length === 1 && allSizesAreU;
  }, [selectedVariant]);

  const allImages = useMemo(() => selectedVariant?.images.map(fixImageUrl).filter(Boolean) as string[] ?? [], [selectedVariant]);

  useEffect(() => {
    if (product) {
        setDisplayName(product.name);
        if (product.variants.length > 0 && !selectedVariant) {
            const defaultVariant = product.variants[0];
            setSelectedVariant(defaultVariant);
            
            const firstImage = fixImageUrl(defaultVariant.images[0]) || null;
            setSelectedImage(firstImage);

            if (isBackpack && defaultVariant.imageNames?.[0]) {
                setDisplayName(defaultVariant.imageNames[0]);
            }
            
            const firstAvailableSize = defaultVariant.sizes.find(s => s.stock > 0);
            if (firstAvailableSize) {
                setSelectedSize(firstAvailableSize.size);
            }
        }
    }
  }, [product, selectedVariant, isBackpack]);

  useEffect(() => {
    if (!carouselApi || !selectedImage) return;
    
    const selectedImageIndex = allImages.indexOf(selectedImage);
    if (selectedImageIndex !== -1 && carouselApi.selectedScrollSnap() !== selectedImageIndex) {
        carouselApi.scrollTo(selectedImageIndex, true);
    }
    
    const handleSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      if(allImages[newIndex] && allImages[newIndex] !== selectedImage) {
        handleImageSelect(allImages[newIndex]);
      }
    };

    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi, selectedImage, allImages]);


  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    const firstImage = fixImageUrl(variant.images[0]) || null;
    handleImageSelect(firstImage);
    carouselApi?.scrollTo(0, true);

    const firstAvailableSize = variant.sizes.find(s => s.stock > 0);
    setSelectedSize(firstAvailableSize ? firstAvailableSize.size : null);
  };
  
  const handleImageSelect = (image: string | null) => {
    setSelectedImage(image);
    if (isBackpack && image && selectedVariant?.images && selectedVariant?.imageNames) {
        const imageIndex = selectedVariant.images.map(fixImageUrl).indexOf(image);
        if (imageIndex !== -1 && selectedVariant.imageNames[imageIndex]) {
            setDisplayName(selectedVariant.imageNames[imageIndex]);
        } else {
            setDisplayName(product?.name ?? '');
        }
    } else {
        setDisplayName(product?.name ?? '');
    }
  };

  const handleOpenZoom = (startIndex: number) => {
    setZoomStartIndex(startIndex);
    setIsZoomViewOpen(true);
  }

  const handleAddToCart = () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Acesso Necessário",
            description: "Para adicionar produtos ao carrinho, por favor, faça o login ou crie sua conta.",
        });
        return;
    }
    if (!product || !selectedVariant) return;

    if (product.hasGift && !giftChoice) {
      toast({
        variant: "destructive",
        title: "Escolha a cor do seu brinde!",
      });
      return;
    }

    if (isPerfume || isBackpack || isCap || isWatch) {
        addToCart(product, selectedVariant, 'U', 1, selectedImage, isBackpack ? displayName : undefined, giftChoice || undefined);
    } else if (selectedSize) {
        addToCart(product, selectedVariant, selectedSize, 1, selectedImage, undefined, giftChoice || undefined);
    }
  };
    
  const stockForSelectedSize = useMemo(() => {
    return selectedVariant?.sizes.find(s => (isPerfume || isBackpack || isCap || isWatch) ? s.size === 'U' : s.size === selectedSize)?.stock || 0;
  }, [selectedVariant, selectedSize, isPerfume, isBackpack, isCap, isWatch]);

  
  const isAddToCartDisabled = (isPerfume || isBackpack || isCap || isWatch)
    ? stockForSelectedSize === 0
    : !selectedSize || stockForSelectedSize === 0 || (product?.hasGift && !giftChoice);

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: `Confira este produto na PISA VIBE: ${product?.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };


  if (isLoading || !id) {
    return <ProductPageSkeleton />;
  }

  if (!product || !selectedVariant) {
    return (
        <div className="container mx-auto px-4 py-12 text-center h-96 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">Produto não encontrado</h1>
            <p className="text-muted-foreground">O produto que você está procurando não existe ou foi removido.</p>
            <Button asChild className="mt-8">
                <Link href="/produtos">Voltar para a loja</Link>
            </Button>
        </div>
    )
  }

  const acrescimoCartao = selectedVariant.acrescimoCartao ?? 20;
  const precoPix = selectedVariant.price;
  const precoCartao = precoPix + acrescimoCartao;

  return (
    <>
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2"
        >
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </Button>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* Image Gallery */}
          <Dialog open={isZoomViewOpen} onOpenChange={setIsZoomViewOpen}>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative w-full mx-auto">
                {product.isImported && <ImportedProductBadge />}
                <Carousel
                  setApi={setCarouselApi}
                  className="w-full"
                  opts={{
                    loop: allImages.length > 1,
                  }}
                >
                  <CarouselContent>
                    {allImages.length > 0 ? (
                      allImages.map((img, index) => (
                        <CarouselItem key={index}>
                          <DialogTrigger asChild>
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg cursor-pointer" onClick={() => handleOpenZoom(index)}>
                              <Image
                                src={img}
                                alt={`${displayName} - Imagem ${index + 1}`}
                                fill
                                className="object-contain mx-auto"
                                priority={index === 0}
                              />
                            </div>
                          </DialogTrigger>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem>
                        <div className="flex h-full aspect-square w-full items-center justify-center rounded-lg bg-secondary">
                          <span className="text-muted-foreground">Sem imagem</span>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {allImages.length > 1 && (
                    <>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                    </>
                  )}
                </Carousel>
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-md transition-all",
                        selectedImage === img ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
                      )}
                      onClick={() => handleImageSelect(img)}
                    >
                      <Image
                        src={img}
                        alt={`${selectedVariant?.imageNames?.[index] || product.name} - Miniatura ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isZoomViewOpen && (
              <ImageZoomView
                images={allImages}
                startIndex={zoomStartIndex}
                alt={displayName}
                onClose={() => setIsZoomViewOpen(false)}
              />
            )}
          </Dialog>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
               <div>
                  {product.brand && <p className="text-sm uppercase tracking-wider text-muted-foreground">{product.brand}</p>}
                  <h1 className="font-headline text-3xl font-bold md:text-4xl">
                      {displayName}
                  </h1>
               </div>
               <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Compartilhar</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <QualityBadge quality={product.quality} />
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-primary">R$ {precoPix.toFixed(2).replace(".", ",")}</p>
                        <span className="font-semibold text-primary">no Pix</span>
                         {acrescimoCartao > 0 && (
                            <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary/80">Economize R$ {acrescimoCartao.toFixed(2).replace(".", ",")}</Badge>
                        )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-foreground">R$ {precoCartao.toFixed(2).replace(".", ",")}</p>
                        <span className="text-lg text-muted-foreground">no cartão</span>
                    </div>
                </div>
            </div>
            
            {isPerfume ? (
              <div className="mt-8 flex flex-col space-y-6">
                  {stockForSelectedSize > 0 && (
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          <p className="text-sm font-semibold text-green-600">Disponível</p>
                      </div>
                  )}

                  <div className="space-y-4">
                      <SecuritySeal className="justify-center" />
                      <Button size="lg" className="w-full text-lg h-12" onClick={handleAddToCart} disabled={isAddToCartDisabled}>
                          {isAddToCartDisabled ? "Esgotado" : "Adicionar ao Carrinho"}
                      </Button>
                  </div>
                   
                   <Separator />
                   
                  <div>
                    <h3 className="text-base font-semibold">Descrição</h3>
                    <p className="mt-2 text-muted-foreground whitespace-pre-line">{product.longDescription}</p>
                  </div>
              </div>
            ) : (
              <>
                  <div className="mt-6">
                      <h3 className="text-base font-semibold">Descrição</h3>
                      <p className="mt-2 text-muted-foreground whitespace-pre-line">{product.longDescription}</p>
                  </div>

                  <div className="mt-8">
                      <h3 className="mb-2 text-sm font-semibold">Cor: <span className="font-normal">{selectedVariant?.color}</span></h3>
                      <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                          <button
                          key={variant.id}
                          onClick={() => handleVariantSelect(variant)}
                          className={cn(
                              "relative rounded-full transition-all",
                              selectedVariant?.id === variant.id ? "scale-110 ring-2 ring-offset-2 ring-primary" : ""
                          )}
                          >
                          <ColorSwatch
                              colorHex={variant.colorHex}
                              title={variant.color}
                          />
                          </button>
                      ))}
                      </div>
                  </div>


                  {!(isBackpack || isCap || isWatch || hasSingleSize) && (
                      <div className="mt-8">
                          <div className="flex justify-between items-baseline mb-2">
                              <h3 className="text-sm font-semibold">Tamanho:</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {sortedSizes.map(({ size, stock }) => (
                                  <Button
                                  key={size}
                                  variant={selectedSize === size ? "default" : "outline"}
                                  onClick={() => setSelectedSize(size)}
                                  disabled={stock === 0}
                                  className={cn(
                                      "w-auto px-4", // Adjusted width
                                      stock === 0 && "cursor-not-allowed bg-secondary text-muted-foreground line-through"
                                  )}
                                  >
                                  {size}
                                  </Button>
                              ))}
                          </div>
                      </div>
                  )}
                  
                  {product.showSizeChart && <SizeChart selectedSize={selectedSize} />}

                   {(isBackpack || isCap || isWatch || hasSingleSize) && stockForSelectedSize > 0 && (
                      <div className="mt-8 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          <p className="text-sm font-semibold text-green-600">Disponível</p>
                      </div>
                  )}

                  {product.hasGift && (
                    <div className="mt-8 space-y-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4">
                        <h3 className="font-semibold text-primary">Parabéns, você ganhou uma pulseira de brinde.</h3>
                        <p className="text-sm text-muted-foreground">Escolha a cor:</p>
                        <RadioGroup onValueChange={(value: 'dourada' | 'prata') => setGiftChoice(value)} value={giftChoice || undefined}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dourada" id="dourada" />
                                <Label htmlFor="dourada">Dourada</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="prata" id="prata" />
                                <Label htmlFor="prata">Prata</Label>
                            </div>
                        </RadioGroup>
                    </div>
                  )}


                  <div className="mt-8 space-y-4">
                      <SecuritySeal className="justify-center" />
                      <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isAddToCartDisabled}>
                          {isAddToCartDisabled ? (product.hasGift && !giftChoice ? "Escolha o brinde" : "Esgotado") : "Adicionar ao Carrinho"}
                      </Button>
                  </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

    