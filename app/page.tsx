'use client';

import { useEffect, useState } from 'react';
import {
  Package, Plus, Trash2, Edit, LogOut, Users, ShoppingCart,
  BarChart3, Eye, EyeOff, Star, StarOff, Save, X, Check,
  ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

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

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  pix_status: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
}

/* ───────────── Admin Page ───────────── */

export default function AdminPage() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'products' | 'orders' | 'users'>('dashboard');

  /* products */
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formCollection, setFormCollection] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);

  /* orders & users */
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);

      if (s) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', s.user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
      setLoading(false);
    })();
  }, []);

  /* login */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPass,
    });
    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }
    window.location.reload();
  };

  /* fetch data */
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };
  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchOrders();
      fetchUsers();
    }
  }, [isAdmin]);

  /* product CRUD */
  const openNewProduct = () => {
    setEditingProduct(null);
    setFormName(''); setFormDesc(''); setFormPrice('');
    setFormImage(''); setFormCollection('');
    setFormInStock(true); setFormFeatured(false);
    setShowProductForm(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description ?? '');
    setFormPrice(String(p.price ?? 0));
    setFormImage(p.image_url ?? '');
    setFormCollection(p.collection ?? '');
    setFormInStock(p.in_stock);
    setFormFeatured(p.featured);
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    const payload = {
      name: formName,
      description: formDesc || null,
      price: parseFloat(formPrice) || 0,
      image_url: formImage || null,
      collection: formCollection || null,
      in_stock: formInStock,
      featured: formFeatured,
    };
    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setShowProductForm(false);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const toggleStock = async (p: Product) => {
    await supabase.from('products').update({ in_stock: !p.in_stock }).eq('id', p.id);
    fetchProducts();
  };

  const toggleFeatured = async (p: Product) => {
    await supabase.from('products').update({ featured: !p.featured }).eq('id', p.id);
    fetchProducts();
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170824] text-[#C9A0E8]">
        Carregando...
      </main>
    );
  }

  /* ── Login screen ── */
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170824] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#7B2D8E]/30 bg-[#1E0E30] p-8">
          <h1 className="font-display mb-6 text-center text-2xl font-bold text-[#FF2D78]">
            Admin Clarimê
          </h1>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="E-mail"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="border-[#7B2D8E]/40 bg-[#2A1240] text-white placeholder:text-[#C9A0E8]/50"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="border-[#7B2D8E]/40 bg-[#2A1240] text-white placeholder:text-[#C9A0E8]/50"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <Button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] text-white"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ── Not admin ── */
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170824] text-white">
        <div className="text-center">
          <p className="mb-4 text-lg text-[#C9A0E8]">Acesso restrito a administradores.</p>
          <Button
            variant="ghost"
            className="text-[#C9A0E8]"
            onClick={() => { supabase.auth.signOut(); window.location.reload(); }}
          >
            <LogOut size={16} className="mr-2" /> Sair
          </Button>
        </div>
      </main>
    );
  }

  /* ── Admin Panel ── */
  const tabs = [
    { key: 'dashboard' as const, label: 'Painel', icon: BarChart3 },
    { key: 'products' as const, label: 'Produtos', icon: Package },
    { key: 'orders' as const, label: 'Pedidos', icon: ShoppingCart },
    { key: 'users' as const, label: 'Usuários', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#170824] text-white">
      {/* Topbar */}
      <nav className="sticky top-0 z-40 border-b border-[#7B2D8E]/30 bg-[#170824]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold text-[#FF2D78]">
            Admin Clarimê
          </h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm text-[#C9A0E8] hover:text-[#FF2D78]">
              Ver Loja
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#C9A0E8]"
              onClick={() => { supabase.auth.signOut(); window.location.reload(); }}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-[#7B2D8E]/20 bg-[#1E0E30]/50">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-[#FF2D78] text-[#FF2D78]'
                    : 'border-transparent text-[#C9A0E8]/60 hover:text-[#C9A0E8]'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* ─── Dashboard ─── */}
        {tab === 'dashboard' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Produtos', value: products.length, icon: Package, color: '#FF2D78' },
              { label: 'Em estoque', value: products.filter((p) => p.in_stock).length, icon: Eye, color: '#00D4C8' },
              { label: 'Pedidos', value: orders.length, icon: ShoppingCart, color: '#FFD54F' },
              { label: 'Usuários', value: users.length, icon: Users, color: '#C9A0E8' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#7B2D8E]/20 bg-[#1E0E30] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#C9A0E8]/60">{stat.label}</p>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <p className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Products ─── */}
        {tab === 'products' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#C9A0E8]">Produtos</h2>
              <Button onClick={openNewProduct} className="bg-[#FF2D78] text-white hover:bg-[#FF2D78]/80">
                <Plus size={16} className="mr-1" /> Novo Produto
              </Button>
            </div>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-[#7B2D8E]/20 bg-[#1E0E30] p-4"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#2A1240]">
                      <ImageIcon size={20} className="text-[#C9A0E8]/40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <div className="flex items-center gap-2 text-sm text-[#C9A0E8]/60">
                      <span className="font-bold text-[#FF2D78]">
                        R$ {(p.price ?? 0).toFixed(2)}
                      </span>
                      {p.collection && <Badge variant="secondary" className="bg-[#7B2D8E]/20 text-[#C9A0E8] text-xs">{p.collection}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeatured(p)}
                      className={`rounded p-2 ${p.featured ? 'text-[#FFD54F]' : 'text-[#C9A0E8]/30'} hover:bg-[#2A1240]`}
                      title={p.featured ? 'Remover destaque' : 'Destacar'}
                    >
                      {p.featured ? <Star size={16} /> : <StarOff size={16} />}
                    </button>
                    <button
                      onClick={() => toggleStock(p)}
                      className={`rounded p-2 ${p.in_stock ? 'text-[#00D4C8]' : 'text-[#C9A0E8]/30'} hover:bg-[#2A1240]`}
                      title={p.in_stock ? 'Tirar de estoque' : 'Colocar em estoque'}
                    >
                      {p.in_stock ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => openEditProduct(p)} className="rounded p-2 text-[#C9A0E8] hover:bg-[#2A1240]">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="rounded p-2 text-red-400 hover:bg-[#2A1240]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="py-12 text-center text-sm text-[#C9A0E8]/40">
                  Nenhum produto cadastrado.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Orders ─── */}
        {tab === 'orders' && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#C9A0E8]">Pedidos</h2>
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-[#7B2D8E]/20 bg-[#1E0E30] p-4"
                >
                  <div>
                    <p className="text-sm font-mono text-[#C9A0E8]/60">#{o.id.slice(0, 8)}</p>
                    <p className="font-bold text-[#FF2D78]">R$ {o.total?.toFixed(2) ?? '0.00'}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        o.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : o.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-[#7B2D8E]/20 text-[#C9A0E8]'
                      }
                    >
                      {o.status === 'pending' ? 'Pendente' : o.status === 'completed' ? 'Concluído' : o.status}
                    </Badge>
                    <p className="mt-1 text-xs text-[#C9A0E8]/40">
                      {new Date(o.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="py-12 text-center text-sm text-[#C9A0E8]/40">
                  Nenhum pedido recebido ainda.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Users ─── */}
        {tab === 'users' && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#C9A0E8]">Usuários</h2>
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-[#7B2D8E]/20 bg-[#1E0E30] p-4"
                >
                  <div>
                    <p className="font-semibold">{u.full_name || 'Sem nome'}</p>
                    <p className="text-sm text-[#C9A0E8]/60">{u.email}</p>
                  </div>
                  <Badge
                    className={
                      u.role === 'admin'
                        ? 'bg-[#FF2D78]/20 text-[#FF2D78]'
                        : 'bg-[#7B2D8E]/20 text-[#C9A0E8]'
                    }
                  >
                    {u.role === 'admin' ? 'Admin' : 'Cliente'}
                  </Badge>
                </div>
              ))}
              {users.length === 0 && (
                <p className="py-12 text-center text-sm text-[#C9A0E8]/40">Nenhum usuário.</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Product Form Dialog ── */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#7B2D8E]/30 bg-[#1E0E30] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#C9A0E8]">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription className="text-[#C9A0E8]/60">
              Preencha os dados do produto
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs text-[#C9A0E8]/60">Nome *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="border-[#7B2D8E]/40 bg-[#2A1240] text-white"
                placeholder="Pulseira Arco-Íris"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#C9A0E8]/60">Descrição</label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="border-[#7B2D8E]/40 bg-[#2A1240] text-white"
                placeholder="Pulseira feita com miçangas coloridas..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[#C9A0E8]/60">Preço (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="border-[#7B2D8E]/40 bg-[#2A1240] text-white"
                  placeholder="25.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#C9A0E8]/60">Coleção</label>
                <Input
                  value={formCollection}
                  onChange={(e) => setFormCollection(e.target.value)}
                  className="border-[#7B2D8E]/40 bg-[#2A1240] text-white"
                  placeholder="Verão 2026"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#C9A0E8]/60">URL da Imagem</label>
              <Input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                className="border-[#7B2D8E]/40 bg-[#2A1240] text-white"
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formInStock}
                  onChange={(e) => setFormInStock(e.target.checked)}
                  className="rounded"
                />
                Em estoque
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded"
                />
                Destaque
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={saveProduct}
                disabled={!formName || !formPrice}
                className="flex-1 bg-gradient-to-r from-[#FF2D78] to-[#7B2D8E] text-white"
              >
                <Save size={16} className="mr-1" /> Salvar
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowProductForm(false)}
                className="text-[#C9A0E8]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
