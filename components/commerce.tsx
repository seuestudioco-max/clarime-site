'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ShoppingCart, Search, Heart, Star, Sparkles, X, Plus, Minus, Trash2,
  Music, VolumeX, ChevronRight, Send, CreditCard, Copy, Check,
  Filter, ArrowUp, Phone, Mail, Instagram, MapPin, Package, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

/* ───────────── helpers ───────────── */

function corrigirTexto(texto: string): string {
  if (typeof texto !== 'string' || !/[ÃÂâ]/.test(texto)) return texto;
  try {
    const bytes = new Uint8Array(
      Array.from(texto, (c) => {
        const code = c.charCodeAt(0);
        if (code > 255) throw new Error('fora');
        return code;
      })
    );
    const corrigido = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const cnt = (v: string) => (v.match(/Ã|Â|â€|�/g) || []).length;
    return cnt(corrigido) < cnt(texto) ? corrigido : texto;
  } catch {
    return texto;
  }
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ───────────── Floating Beads ───────────── */

const BEAD_COLORS = ['#FF2D78', '#00D4C8', '#FFD54F', '#C9A0E8', '#7B2D8E', '#FF6B9D'];

function FloatingBeads() {
  const beads = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        color: BEAD_COLORS[i % BEAD_COLORS.length],
        size: 6 + Math.random() * 14,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 15,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {beads.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full opacity-20"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: '-20px',
            backgroundColor: b.color,
            animation: `bead-rise ${b.duration}s ease-in ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────── Music Player ───────────── */

function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const melody = useMemo(
    () => [
      { f: 523.25, d: 0.3 }, { f: 587.33, d: 0.3 }, { f: 659.25, d: 0.3 },
      { f: 698.46, d: 0.4 }, { f: 659.25, d: 0.2 }, { f: 587.33, d: 0.3 },
      { f: 523.25, d: 0.5 }, { f: 0, d: 0.2 },
      { f: 698.46, d: 0.3 }, { f: 783.99, d: 0.3 }, { f: 880.0, d: 0.4 },
      { f: 783.99, d: 0.2 }, { f: 698.46, d: 0.3 }, { f: 659.25, d: 0.5 },
      { f: 0, d: 0.3 },
      { f: 523.25, d: 0.25 }, { f: 523.25, d: 0.25 }, { f: 587.33, d: 0.3 },
      { f: 659.25, d: 0.4 }, { f: 523.25, d: 0.3 }, { f: 440.0, d: 0.3 },
      { f: 523.25, d: 0.6 }, { f: 0, d: 0.4 },
    ],
    []
  );

  const playNote = useCallback(
    (ctx: AudioContext, freq: number, dur: number, startTime: number) => {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur);
    },
    []
  );

  const playMelody = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    let t = ctx.currentTime + 0.1;
    for (const note of melody) {
      playNote(ctx, note.f, note.d, t);
      t += note.d + 0.05;
    }
  }, [melody, playNote]);

  const toggle = useCallback(() => {
    if (!started) {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      setStarted(true);
      setPlaying(true);
      setTimeout(() => {
        playMelody();
        intervalRef.current = setInterval(playMelody, 9000);
      }, 100);
      return;
    }
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctxRef.current?.suspend();
      setPlaying(false);
    } else {
      ctxRef.current?.resume();
      playMelody();
      intervalRef.current = setInterval(playMelody, 9000);
      setPlaying(true);
    }
  }, [started, playing, playMelody]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] text-white shadow-lg transition-transform hover:scale-110"
      title={playing ? 'Pausar música' : 'Tocar música'}
    >
      {playing ? (
        <div className="flex items-end gap-[3px]">
          {[0, 0.15, 0.3].map((d) => (
            <span
              key={d}
              className="inline-block w-[3px] rounded bg-white"
              style={{ animation: `equalizer 0.6s ease-in-out ${d}s infinite alternate`, height: 4 }}
            />
          ))}
        </div>
      ) : (
        <VolumeX size={20} />
      )}
    </button>
  );
}

/* ───────────── types ───────────── */

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  collection: string | null;
  in_stock: boolean;
  featured: boolean;
  created_at: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

/* ───────────── MAIN: CustomerStore ───────────── */

export function CustomerStore({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut?: () => void;
}) {
  /* state */
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /* fetch products */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
      setLoadingProducts(false);
    })();
  }, []);

  /* scroll-to-top */
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* derived */
  const collections = useMemo(() => {
    const s = new Set(products.map((p) => p.collection).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (collection !== 'Todos') list = list.filter((p) => p.collection === collection);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.collection ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, collection, search]);

  const cartTotal = useMemo(
    () => cart.reduce((s, c) => s + c.product.price * c.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((s, c) => s + c.quantity, 0),
    [cart]
  );

  /* cart actions */
  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  /* checkout via WhatsApp */
  const sendWhatsApp = () => {
    const lines = cart.map(
      (c) => `• ${corrigirTexto(c.product.name)} (x${c.quantity}) — ${formatBRL(c.product.price * c.quantity)}`
    );
    const msg = encodeURIComponent(
      `Olá! 💖 Gostaria de fazer um pedido na Clarimê:\n\n${lines.join('\n')}\n\n*Total: ${formatBRL(cartTotal)}*\n\nPagamento via PIX 🔑`
    );
    window.open(`https://wa.me/5587981942480?text=${msg}`, '_blank');
  };

  /* PIX copy */
  const pixKey = 'edilaclarissa1@outlook.com';
  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ────── render ────── */
  return (
    <div className="relative min-h-screen bg-[#170824] text-white">
      <FloatingBeads />
      <MusicPlayer />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-[#7B2D8E]/30 bg-[#170824]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="font-display bg-gradient-to-r from-[#FF2D78] via-[#C9A0E8] to-[#00D4C8] bg-clip-text text-2xl font-extrabold text-transparent">
            Clarimê
          </h1>

          <div className="flex items-center gap-3">
            {/* search (desktop) */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A0E8]" size={16} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-48 border-[#7B2D8E]/40 bg-[#2A1240] pl-9 text-sm text-white placeholder:text-[#C9A0E8]/50 focus:border-[#FF2D78]"
              />
            </div>

            {/* cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-[#C9A0E8] hover:text-[#FF2D78]"
                >
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF2D78] text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="border-[#7B2D8E]/30 bg-[#1E0E30] text-white">
                <SheetHeader>
                  <SheetTitle className="text-[#C9A0E8]">Sacola ({cartCount})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4">
                  {cart.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#C9A0E8]/60">
                      Sua sacola está vazia 💜
                    </p>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3 rounded-xl border border-[#7B2D8E]/20 bg-[#2A1240] p-3"
                        >
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#4A1A6B]">
                              <Sparkles size={20} className="text-[#FFD54F]" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{corrigirTexto(item.product.name)}</p>
                            <p className="text-xs text-[#C9A0E8]">
                              {formatBRL(item.product.price)}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                onClick={() => updateQty(item.product.id, -1)}
                                className="rounded bg-[#4A1A6B] p-1 hover:bg-[#7B2D8E]"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(item.product.id, 1)}
                                className="rounded bg-[#4A1A6B] p-1 hover:bg-[#7B2D8E]"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#C9A0E8]/50 hover:text-[#FF2D78]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <Separator className="bg-[#7B2D8E]/30" />
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-[#FF2D78]">{formatBRL(cartTotal)}</span>
                      </div>
                      <Button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] text-white hover:opacity-90"
                      >
                        Finalizar Pedido
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {session && onSignOut && (
              <Button variant="ghost" size="sm" onClick={onSignOut} className="text-xs text-[#C9A0E8]">
                Sair
              </Button>
            )}
          </div>
        </div>

        {/* search mobile */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A0E8]" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar acessórios..."
              className="w-full border-[#7B2D8E]/40 bg-[#2A1240] pl-9 text-sm text-white placeholder:text-[#C9A0E8]/50 focus:border-[#FF2D78]"
            />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-16 text-center sm:py-24">
        <div className="animate-slide-up mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF2D78]/30 bg-[#FF2D78]/10 px-4 py-1.5 text-sm text-[#FF2D78]">
            <Sparkles size={14} /> Feito à mão com amor
          </div>
          <h2 className="font-display mb-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            <span className="animate-gradient-x bg-gradient-to-r from-[#FF2D78] via-[#C9A0E8] to-[#00D4C8] bg-clip-text text-transparent">
              Acessórios que contam histórias
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-[#C9A0E8]/80">
            Cada peça da Clarimê é única, feita à mão para colorir os seus dias, celebrar
            amizades e guardar memórias.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              onClick={() =>
                document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="animate-pulse-glow bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] px-8 text-white"
            >
              Ver Coleção <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      <div id="produtos" className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter size={16} className="shrink-0 text-[#C9A0E8]" />
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setCollection(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                collection === c
                  ? 'border-[#FF2D78] bg-[#FF2D78]/20 text-[#FF2D78]'
                  : 'border-[#7B2D8E]/30 text-[#C9A0E8]/70 hover:border-[#C9A0E8] hover:text-[#C9A0E8]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-4">
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#2A1240]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Sparkles size={48} className="mx-auto mb-4 text-[#C9A0E8]/30" />
            <p className="text-[#C9A0E8]/60">Nenhum acessório encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product, idx) => (
              <div
                key={product.id}
                className="product-card animate-fade-in group cursor-pointer overflow-hidden rounded-2xl border border-[#7B2D8E]/20 bg-[#1E0E30]"
                style={{ animationDelay: `${idx * 0.08}s` }}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-square overflow-hidden bg-[#2A1240]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Sparkles size={40} className="text-[#FFD54F]/40" />
                    </div>
                  )}
                  {product.featured && (
                    <Badge className="absolute left-2 top-2 border-0 bg-[#FFD54F] text-[#170824]">
                      <Star size={10} className="mr-1" /> Destaque
                    </Badge>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye size={24} className="text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">
                    {corrigirTexto(product.name)}
                  </h3>
                  {product.collection && (
                    <p className="mt-0.5 text-xs text-[#C9A0E8]/60">{product.collection}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-[#FF2D78]">{formatBRL(product.price)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="rounded-full bg-[#FF2D78]/20 p-2 text-[#FF2D78] transition-colors hover:bg-[#FF2D78] hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Product Detail Dialog ── */}
      <Dialog open={!!selectedProduct} onOpenChange={(v) => !v && setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#7B2D8E]/30 bg-[#1E0E30] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#C9A0E8]">
              {selectedProduct && corrigirTexto(selectedProduct.name)}
            </DialogTitle>
            <DialogDescription className="text-[#C9A0E8]/60">
              Detalhes do produto
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="mt-2 space-y-4">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl bg-[#2A1240]">
                  <Sparkles size={48} className="text-[#FFD54F]/40" />
                </div>
              )}
              {selectedProduct.description && (
                <p className="text-sm text-[#C9A0E8]/80">
                  {corrigirTexto(selectedProduct.description)}
                </p>
              )}
              {selectedProduct.collection && (
                <Badge variant="secondary" className="bg-[#7B2D8E]/30 text-[#C9A0E8]">
                  {selectedProduct.collection}
                </Badge>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#FF2D78]">
                  {formatBRL(selectedProduct.price)}
                </span>
                <Button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] text-white"
                >
                  <ShoppingCart size={16} className="mr-2" /> Adicionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Checkout Dialog ── */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#7B2D8E]/30 bg-[#1E0E30] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#C9A0E8]">Finalizar Pedido</DialogTitle>
            <DialogDescription className="text-[#C9A0E8]/60">
              Pagamento via PIX
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#7B2D8E]/30 bg-[#2A1240] p-4">
              <p className="mb-2 text-sm font-semibold text-[#C9A0E8]">Resumo do pedido</p>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>
                    {corrigirTexto(item.product.name)} x{item.quantity}
                  </span>
                  <span className="text-[#FF2D78]">
                    {formatBRL(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator className="my-2 bg-[#7B2D8E]/30" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#FF2D78]">{formatBRL(cartTotal)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#00D4C8]/30 bg-[#00D4C8]/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#00D4C8]">
                <CreditCard size={16} /> Dados PIX
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-[#C9A0E8]/60">Chave (e-mail):</span>{' '}
                  <span className="font-mono">{pixKey}</span>
                </p>
                <p>
                  <span className="text-[#C9A0E8]/60">Nome:</span> Édila Eloterio Ferreira
                </p>
                <p>
                  <span className="text-[#C9A0E8]/60">Banco:</span> Banco do Brasil
                </p>
              </div>
              <Button
                onClick={copyPix}
                variant="outline"
                size="sm"
                className="mt-3 border-[#00D4C8]/40 text-[#00D4C8] hover:bg-[#00D4C8]/20"
              >
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? 'Copiado!' : 'Copiar chave PIX'}
              </Button>
            </div>

            <Button
              onClick={sendWhatsApp}
              className="w-full bg-[#25D366] text-white hover:bg-[#20BA59]"
            >
              <Send size={16} className="mr-2" /> Enviar pedido via WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Footer ── */}
      <footer className="border-t border-[#7B2D8E]/20 bg-[#0D0518] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-display mb-3 text-xl font-bold text-[#FF2D78]">Clarimê</h3>
              <p className="text-sm text-[#C9A0E8]/60">
                Acessórios feitos à mão para colorir os seus dias.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#C9A0E8]">Contato</h4>
              <div className="space-y-2 text-sm text-[#C9A0E8]/60">
                <p className="flex items-center gap-2">
                  <Phone size={14} /> (87) 98194-2480
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} /> edilaclarissa1@outlook.com
                </p>
                <p className="flex items-center gap-2">
                  <Instagram size={14} /> @clarime.acessorios
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#C9A0E8]">Sobre</h4>
              <p className="text-sm text-[#C9A0E8]/60">
                Cada peça é artesanal, feita com carinho e dedicação. Encomendas e dúvidas pelo WhatsApp.
              </p>
            </div>
          </div>
          <Separator className="my-8 bg-[#7B2D8E]/20" />
          <p className="text-center text-xs text-[#C9A0E8]/40">
            &copy; {new Date().getFullYear()} Clarimê — Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* ── Scroll to top ── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 z-50 rounded-full bg-[#7B2D8E] p-3 text-white shadow-lg transition-transform hover:scale-110"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
