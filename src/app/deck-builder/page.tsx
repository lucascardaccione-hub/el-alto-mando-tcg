'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import {
  Layers,
  Search,
  Plus,
  Minus,
  Trash2,
  Save,
  Share2,
  FileText,
  ShoppingBag,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
  Loader2,
  LayoutGrid,
  List,
  CheckCheck,
  Image as ImageIcon,
  Maximize2,
  Globe,
  Lock,
} from 'lucide-react';
import { parsePtcglDeck, exportToPtcgl, isBasicEnergy, getBasicEnergyTypeNumber, getGenericEnergyImage } from '@/lib/deckParser';
import DeckImageModal from '@/components/DeckImageModal';
import { DeckSocialSection } from '@/components/DeckSocialSection';

export interface DeckCardItem {
  id?: number;
  card_name: string;
  expansion: string;
  number: string;
  category: 'pokemon' | 'trainer' | 'energy';
  trainer_type?: string;
  count: number;
  owned_count: number;
  image_url: string;
  tcg_id?: string;
  store_card?: any;
}

function DeckBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const rawId = (params?.id as string) || searchParams.get('id');

  const { addToCart } = useCart();

  // Deck basic state
  const [deckId, setDeckId] = useState<number | null>(rawId ? parseInt(rawId, 10) : null);
  const [name, setName] = useState('Nuevo Mazo');
  const [format, setFormat] = useState('Standard');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<DeckCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [authorName, setAuthorName] = useState<string>('');
  const [cloning, setCloning] = useState<boolean>(false);

  // View mode: 'detailed' (app list with full controls) or 'visual' (PTCGL / Limitless gallery board)
  const [viewMode, setViewMode] = useState<'detailed' | 'visual'>('detailed');

  // Search card state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Store store-inventory cards cache for cross-checking
  const [storeCards, setStoreCards] = useState<any[]>([]);

  // Import / Export Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importAsOwned, setImportAsOwned] = useState<boolean>(false);
  const [importingText, setImportingText] = useState(false);
  const [importError, setImportError] = useState('');

  // Floating Hover Card Preview State (without needing to click)
  const [hoveredCard, setHoveredCard] = useState<{
    imageUrl: string;
    name: string;
    expansion?: string;
    number?: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    document.title = 'Deck Builder — El Alto Mando TCG';
  }, []);

  const handleCardHover = (
    card: { imageUrl: string; name: string; expansion?: string; number?: string },
    e: React.MouseEvent
  ) => {
    let finalImageUrl = card.imageUrl;
    if ((!finalImageUrl || finalImageUrl.includes('placeholder')) && isBasicEnergy({ card_name: card.name, expansion: card.expansion })) {
      finalImageUrl = getGenericEnergyImage(card.name) || finalImageUrl;
    }
    if (!finalImageUrl || finalImageUrl.includes('placeholder')) return;
    const previewWidth = 260;
    const previewHeight = 364;

    let x = e.clientX + 24;
    if (e.clientX + previewWidth + 30 > window.innerWidth) {
      x = e.clientX - previewWidth - 24;
    }

    let y = Math.min(
      Math.max(16, e.clientY - previewHeight / 2),
      window.innerHeight - previewHeight - 16
    );

    setHoveredCard({
      ...card,
      x,
      y,
    });
  };

  const handleCardMove = (e: React.MouseEvent) => {
    if (!hoveredCard) return;
    const previewWidth = 260;
    const previewHeight = 364;

    let x = e.clientX + 24;
    if (e.clientX + previewWidth + 30 > window.innerWidth) {
      x = e.clientX - previewWidth - 24;
    }

    let y = Math.min(
      Math.max(16, e.clientY - previewHeight / 2),
      window.innerHeight - previewHeight - 16
    );

    setHoveredCard((prev) => (prev ? { ...prev, x, y } : null));
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  // 1. Load store inventory cards to cross-reference stock
  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const data = await res.json();
          setStoreCards(data.cards || []);
        }
      } catch (e) {}
    }
    loadStore();
  }, []);

  // 2. Load existing deck or imported deck from session
  useEffect(() => {
    const imported = sessionStorage.getItem('importedDeck');
    if (imported) {
      try {
        const parsed = JSON.parse(imported);
        setName(parsed.name || 'Nuevo Mazo');
        setFormat(parsed.format || 'Standard');
        setDescription(parsed.description || '');

        if (Array.isArray(parsed.cards)) {
          const formatted: DeckCardItem[] = parsed.cards.map((c: any) => ({
            card_name: c.card_name || c.name,
            expansion: c.expansion || c.set || 'PROMO',
            number: c.number || '1',
            category: c.category || 'pokemon',
            trainer_type: c.trainer_type || c.trainerType || '',
            count: c.count || 1,
            owned_count: c.owned_count || 0,
            image_url: c.image_url || c.image || '/placeholder-card.svg',
          }));
          setCards(formatted);

          // Always enrich imported cards with Limitless verified CDN images
          fetch('/api/tcgdex/resolve-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards: formatted }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.cards && Array.isArray(data.cards)) {
                setCards((prev) =>
                  prev.map((card, idx) => {
                    const enriched = data.cards[idx];
                    if (enriched?.image_url && !enriched.image_url.includes('placeholder')) {
                      return { ...card, image_url: enriched.image_url };
                    }
                    return card;
                  })
                );
              }
            })
            .catch(() => {});
        }
        sessionStorage.removeItem('importedDeck');
      } catch (e) {}
    } else if (deckId) {
      fetchDeck(deckId);
    }
  }, [deckId]);

  const fetchDeck = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.deck.name);
        setFormat(data.deck.format);
        setDescription(data.deck.description || '');
        setIsPublic(data.deck.is_public === 1 || data.deck.is_public === true || data.deck.is_public === undefined);
        setCanEdit(data.deck.can_edit !== undefined ? Boolean(data.deck.can_edit) : true);
        setIsOwner(data.deck.is_owner !== undefined ? Boolean(data.deck.is_owner) : true);
        setAuthorName(data.deck.author_name || '');
        const rawList = data.cards || data.deck?.cards || [];
        setCards(
          rawList.map((c: any) => {
            let img = c.image_url;
            if ((!img || img.includes('placeholder')) && isBasicEnergy(c)) {
              img = getGenericEnergyImage(c.card_name) || img;
            }
            return { ...c, image_url: img };
          })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Search card via TCGdex API
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(searchQuery.trim())}&lang=en&format=${encodeURIComponent(format || 'Standard')}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, format]);

  // Deck counts and breakdowns
  const totalCount = useMemo(() => cards.reduce((acc, c) => acc + c.count, 0), [cards]);
  const pokemonCards = useMemo(() => cards.filter((c) => c.category === 'pokemon'), [cards]);
  const trainerCards = useMemo(() => cards.filter((c) => c.category === 'trainer'), [cards]);
  const energyCards = useMemo(() => cards.filter((c) => c.category === 'energy'), [cards]);

  const pokemonCount = useMemo(() => pokemonCards.reduce((acc, c) => acc + c.count, 0), [pokemonCards]);
  const trainerCount = useMemo(() => trainerCards.reduce((acc, c) => acc + c.count, 0), [trainerCards]);
  const energyCount = useMemo(() => energyCards.reduce((acc, c) => acc + c.count, 0), [energyCards]);

  // Limitless-style sorted cards for the preview widget
  const sortedPreviewCards = useMemo(() => {
    const pokemons = cards.filter((c) => c.category === 'pokemon');
    const trainers = cards.filter((c) => c.category === 'trainer');
    const energies = cards.filter((c) => c.category === 'energy');

    const supporters = trainers.filter((c) => {
      const type = (c.trainer_type || '').toLowerCase();
      const n = c.card_name.toLowerCase();
      return (
        type.includes('supporter') ||
        type.includes('partidario') ||
        n.includes('orders') ||
        n.includes('research') ||
        n.includes('determination') ||
        n.includes('compassion') ||
        n.includes('encouragement') ||
        n.includes('machinations') ||
        n.includes('petrel') ||
        n.includes('iono') ||
        n.includes('arven') ||
        n.includes('colress') ||
        n.includes('hilda') ||
        n.includes('judge') ||
        n.includes('crispin')
      );
    });

    const otherTrainers = trainers.filter((c) => !supporters.includes(c));

    const specialEnergies = energies.filter((c) => !isBasicEnergy(c));
    const basicEnergies = energies.filter((c) => isBasicEnergy(c));

    return [
      ...pokemons,
      ...supporters,
      ...otherTrainers,
      ...specialEnergies,
      ...basicEnergies,
    ];
  }, [cards]);


  const totalOwned = useMemo(() => cards.reduce((acc, c) => acc + Math.min(c.count, c.owned_count || 0), 0), [cards]);
  const totalMissing = Math.max(0, totalCount - totalOwned);

  // Cross-reference deck missing cards with store inventory
  const missingCardsWithStock = useMemo(() => {
    return cards
      .filter((c) => c.count > (c.owned_count || 0))
      .map((c) => {
        const missingCount = c.count - (c.owned_count || 0);
        const nameLower = c.card_name.toLowerCase();

        // Find match in storeCards
        const matchedStoreCard = storeCards.find((sc) => {
          const scName = sc.name.toLowerCase();
          return scName === nameLower || scName.includes(nameLower) || nameLower.includes(scName);
        });

        return {
          ...c,
          missing: missingCount,
          storeCard: matchedStoreCard || null,
          availableStock: matchedStoreCard ? matchedStoreCard.stock : 0,
        };
      });
  }, [cards, storeCards]);

  const purchasableMissingCount = useMemo(() => {
    return missingCardsWithStock.filter((m) => m.storeCard && m.availableStock > 0).length;
  }, [missingCardsWithStock]);

  const totalMissingEstimatedPrice = useMemo(() => {
    return missingCardsWithStock.reduce((acc, m) => {
      if (m.storeCard && m.availableStock > 0) {
        const qty = Math.min(m.missing, m.availableStock);
        return acc + m.storeCard.price * qty;
      }
      return acc;
    }, 0);
  }, [missingCardsWithStock]);

  // Card count controls
  const handleUpdateCardCount = (index: number, delta: number) => {
    setCards((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const newCount = target.count + delta;

      if (newCount <= 0) {
        copy.splice(index, 1);
        return copy;
      }

      // Check max 4 copies rule (except basic energy)
      const isBasic = isBasicEnergy(target);
      if (!isBasic && newCount > 4) {
        showNotification('error', 'Un mazo solo puede tener un máximo de 4 copias de la misma carta (excepto energías básicas).');
        return prev;
      }

      target.count = newCount;
      return copy;
    });
  };

  // Card owned count controls (Fine adjustments)
  const handleUpdateOwnedCount = (index: number, delta: number) => {
    setCards((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const newOwned = Math.max(0, (target.owned_count || 0) + delta);
      target.owned_count = Math.min(target.count, newOwned);
      return copy;
    });
  };

  // 1-Tap Toggle: Click on card or toggle button instantly flips between 0 and full count
  const handleToggleCardOwned = (index: number) => {
    setCards((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      const isFullyOwned = (target.owned_count || 0) >= target.count;
      target.owned_count = isFullyOwned ? 0 : target.count;
      copy[index] = target;
      return copy;
    });
  };

  // Category-level quick action: Toggle all in category
  const handleSetCategoryOwned = (category: 'pokemon' | 'trainer' | 'energy', owned: boolean) => {
    setCards((prev) =>
      prev.map((c) => (c.category === category ? { ...c, owned_count: owned ? c.count : 0 } : c))
    );
  };

  // Global toggle all
  const handleToggleAllOwned = (owned: boolean) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        owned_count: owned ? c.count : 0,
      }))
    );
  };

  // Add Card from Search Sidebar
  const handleAddCardToDeck = (tcgCard: any) => {
    // Check if card is already in deck
    const existingIndex = cards.findIndex(
      (c) => c.card_name.toLowerCase() === tcgCard.name.toLowerCase() && c.number === tcgCard.localId
    );

    if (existingIndex !== -1) {
      handleUpdateCardCount(existingIndex, 1);
      return;
    }

    // Determine category based on card name
    let category: 'pokemon' | 'trainer' | 'energy' = 'pokemon';
    const nameLower = tcgCard.name.toLowerCase();
    if (
      nameLower.includes('energy') ||
      nameLower.includes('energía') ||
      nameLower.includes('energia') ||
      isBasicEnergy({ card_name: tcgCard.name, expansion: tcgCard.setName })
    ) {
      category = 'energy';
    } else if (
      nameLower.includes('ball') ||
      nameLower.includes('candy') ||
      nameLower.includes('orders') ||
      nameLower.includes('research') ||
      nameLower.includes('catcher') ||
      nameLower.includes('stadium') ||
      nameLower.includes('rod') ||
      nameLower.includes('switch') ||
      nameLower.includes('belt') ||
      nameLower.includes('stone') ||
      nameLower.includes('vessel') ||
      nameLower.includes('poffin')
    ) {
      category = 'trainer';
    }

    let cardImage = tcgCard.image || '/placeholder-card.svg';
    if (category === 'energy' && isBasicEnergy({ card_name: tcgCard.name })) {
      const generic = getGenericEnergyImage(tcgCard.name);
      if (generic && (!cardImage || cardImage.includes('placeholder'))) {
        cardImage = generic;
      }
    }

    const newCard: DeckCardItem = {
      card_name: tcgCard.name,
      expansion: tcgCard.setName || 'PROMO',
      number: tcgCard.localId || '1',
      category,
      count: 1,
      owned_count: 0,
      image_url: cardImage,
      tcg_id: tcgCard.id,
    };

    setCards((prev) => [...prev, newCard]);
  };

  // 1-Click: Add all available missing cards to the cart
  const handleAddAllMissingToCart = () => {
    let addedCount = 0;

    for (const m of missingCardsWithStock) {
      if (m.storeCard && m.availableStock > 0) {
        const qtyToAdd = Math.min(m.missing, m.availableStock);
        addToCart(m.storeCard, qtyToAdd);
        addedCount += qtyToAdd;
      }
    }

    if (addedCount > 0) {
      showNotification('success', `¡${addedCount} carta(s) faltante(s) agregadas a tu carrito de compras!`);
    } else {
      showNotification('error', 'Ninguna de las cartas faltantes tiene stock disponible actualmente.');
    }
  };

  // Clone current deck (makes an independent copy in user's decks)
  const handleCloneCurrentDeck = async () => {
    if (!deckId) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/clone`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.deckId) {
        showNotification('success', '¡Copia creada con éxito en Mis Mazos!');
        setDeckId(data.deckId);
        setName(data.name || (`Copia de ${name}`));
        setCanEdit(true);
        setIsOwner(true);
        router.replace(`/deck-builder?id=${data.deckId}`);
      } else {
        if (res.status === 401) {
          showNotification('error', 'Debes iniciar sesión para hacer una copia de este mazo.');
          router.push('/login');
        } else {
          showNotification('error', data.error || 'Error al duplicar el mazo.');
        }
      }
    } catch {
      showNotification('error', 'Error de conexión al duplicar el mazo.');
    } finally {
      setCloning(false);
    }
  };

  // Save Deck (or Save as Copy if viewing community deck)
  const handleSaveDeck = async () => {
    if (!name.trim()) {
      showNotification('error', 'Por favor ingresa un nombre para el mazo.');
      return;
    }

    setSaving(true);
    try {
      const coverImage = cards.length > 0 ? cards[0].image_url : '';
      const isSavingAsCopy = Boolean(deckId && !canEdit);
      const saveName = isSavingAsCopy
        ? (name.toLowerCase().startsWith('copia de') ? name : `Copia de ${name}`)
        : name.trim();

      const payload = {
        name: saveName,
        format,
        description,
        is_public: isPublic ? 1 : 0,
        cover_card_image: coverImage,
        cards,
      };

      const url = (deckId && canEdit) ? `/api/decks/${deckId}` : '/api/decks';
      const method = (deckId && canEdit) ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        if (isSavingAsCopy) {
          showNotification('success', '¡Copia guardada con éxito en Mis Mazos!');
        } else {
          showNotification('success', '¡Mazo guardado correctamente!');
        }
        if (data.deckId) {
          setDeckId(data.deckId);
          setCanEdit(true);
          setIsOwner(true);
          setName(saveName);
          router.replace(`/deck-builder?id=${data.deckId}`);
        }
      } else {
        if (res.status === 401) {
          showNotification('error', 'Debes iniciar sesión para guardar tus mazos.');
          router.push('/login');
        } else {
          showNotification('error', data.error || 'Error al guardar el mazo.');
        }
      }
    } catch (e) {
      showNotification('error', 'Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  // Export to PTCGL / Limitless
  const handleExportPtcgl = () => {
    const text = exportToPtcgl(cards);
    navigator.clipboard.writeText(text);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleProcessDeckBuilderImport = async () => {
    setImportError('');
    if (!importInput.trim()) {
      setImportError('Por favor pega el texto de tu mazo en formato PTCGL / Limitless.');
      return;
    }

    const parsed = parsePtcglDeck(importInput);
    if (parsed.cards.length === 0) {
      setImportError('No se reconocieron cartas válidas. Asegúrate de incluir el formato del Live.');
      return;
    }

    setImportingText(true);
    try {
      const resolveRes = await fetch('/api/tcgdex/resolve-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: parsed.cards }),
      });
      const resolvedData = await resolveRes.json();
      const finalCards = resolvedData?.cards || parsed.cards;

      setCards(
        finalCards.map((c: any) => {
          const cardName = c.card_name || c.name;
          const expansion = c.expansion || c.set || 'PROMO';
          let category = c.category || 'pokemon';
          if (isBasicEnergy({ card_name: cardName, expansion })) {
            category = 'energy';
          }
          let imageUrl = c.image_url || c.image || '/placeholder-card.svg';
          if (isBasicEnergy({ card_name: cardName, expansion }) && (!imageUrl || imageUrl.includes('placeholder'))) {
            imageUrl = getGenericEnergyImage(cardName) || imageUrl;
          }
          return {
            card_name: cardName,
            expansion,
            number: c.number || '1',
            category,
            trainer_type: c.trainer_type || c.trainerType || '',
            count: c.count || 1,
            owned_count: importAsOwned ? (c.count || 1) : 0,
            image_url: imageUrl,
          };
        })
      );

      setImportModalOpen(false);
      setImportInput('');
      showNotification('success', `¡Mazo importado con éxito! ${parsed.totalCards} cartas reconocidas.`);
    } catch {
      setCards(
        parsed.cards.map((c: any) => ({
          card_name: c.name,
          expansion: c.set,
          number: c.number,
          category: c.category,
          count: c.count,
          owned_count: importAsOwned ? c.count : 0,
          image_url: c.image || '/placeholder-card.svg',
        }))
      );
      setImportModalOpen(false);
      setImportInput('');
      showNotification('success', `¡Mazo importado! ${parsed.totalCards} cartas cargadas.`);
    } finally {
      setImportingText(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/decks"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mis Mazos</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Deck Builder — El Alto Mando TCG
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Detallada vs Tablero Visual */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista detallada con lista y controles"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detallada</span>
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'visual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de galería visual de cartas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablero Visual</span>
              </button>
            </div>

            <button
              onClick={() => {
                setImportInput('');
                setImportError('');
                setImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-700/60 transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Importar Lista</span>
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => setImageModalOpen(true)}
              disabled={cards.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-950/40 border border-blue-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Ver la lista de mazo completa en una sola imagen (Visualizador TCG Pro)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-200" />
              <span>Ver Lista en Imagen</span>
            </button>

            {deckId && canEdit && (
              <button
                type="button"
                onClick={handleCloneCurrentDeck}
                disabled={cloning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
                title="Crear un duplicado independiente de este mazo"
              >
                {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                <span>Duplicar Mazo</span>
              </button>
            )}

            <button
              onClick={handleSaveDeck}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-950/60 border border-red-500/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ring-2 ring-red-500/30"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : deckId && !canEdit ? (
                <Copy className="w-3.5 h-3.5 text-white" />
              ) : (
                <Save className="w-3.5 h-3.5 text-white" />
              )}
              <span>{deckId ? (canEdit ? 'Guardar Cambios' : 'Guardar como Copia') : 'Guardar Mazo'}</span>
            </button>
          </div>
        </div>

        {/* Community Deck Read-Only / Clone Mode Banner */}
        {deckId && !canEdit && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/40 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Mazo de la Comunidad</span>
                  <span className="text-blue-300 font-bold">@{authorName || 'Entrenador'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/50">
                    Modo Lectura / Copia
                  </span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Solo el autor original o el Admin Master Luca pueden modificar el mazo original. Puedes crear una copia para guardarlo en tus mazos y personalizarlo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloneCurrentDeck}
              disabled={cloning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer"
            >
              {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-emerald-100" />}
              <span>Crear mi Copia</span>
            </button>
          </div>
        )}

        {/* Notifications */}
        {notification && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-300'
                : 'bg-rose-950/90 border border-rose-800 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Deck Header & Statistics Toolbar */}
        <section className="bg-[#0b1220] border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del mazo..."
                className="text-2xl sm:text-3xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none w-full"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción o notas de estrategia..."
                className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none w-full"
              />
            </div>

            {/* Options: Visibility (Público / Privado) & Format */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Visibility Selector */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-2xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isPublic
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Hacer público el deck: visible para toda la comunidad en 'Decks de la Comunidad'"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-200" />
                  <span>1. Hacer público el deck</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !isPublic
                      ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Mantenerlo privado en mi cuenta: solo tú podrás ver este mazo"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Mantenerlo privado en mi cuenta</span>
                </button>
              </div>

              {/* Format selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Formato:</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Standard">Standard (Legal)</option>
                  <option value="Expanded">Expanded</option>
                  <option value="GLC">Gym Leader Challenge</option>
                </select>
              </div>
            </div>
          </div>

          {/* 60 Cards Progress & Category Breakdown */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-sm">
                  Cartas en el mazo:{' '}
                  <span className={totalCount === 60 ? 'text-emerald-400' : 'text-blue-400'}>
                    {totalCount} / 60
                  </span>
                </span>
                {totalCount === 60 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mazo Legal
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                    {totalCount < 60 ? `Faltan ${60 - totalCount}` : `Sobran ${totalCount - 60}`}
                  </span>
                )}
              </div>

              {/* Owned Collection Status & Quick Global Toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${totalOwned === totalCount && totalCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>En tu colección:</span>
                  <strong className={totalOwned === totalCount && totalCount > 0 ? 'text-emerald-400 font-extrabold' : 'text-white font-extrabold'}>
                    {totalOwned}/{totalCount}
                  </strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleAllOwned(true)}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-white border border-emerald-800/60 transition-all flex items-center gap-1 active:scale-95"
                    title="Marcar todas las cartas del mazo como que las tienes (Full color)"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tengo todas</span>
                  </button>
                  <button
                    onClick={() => handleToggleAllOwned(false)}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all active:scale-95"
                    title="Marcar todas las cartas como faltantes para comprar (Blanco y negro 50%)"
                  >
                    <span>Faltan todas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${Math.min(100, (pokemonCount / 60) * 100)}%` }}
                className="bg-blue-500 transition-all"
                title={`Pokémon: ${pokemonCount}`}
              />
              <div
                style={{ width: `${Math.min(100, (trainerCount / 60) * 100)}%` }}
                className="bg-purple-500 transition-all"
                title={`Entrenadores: ${trainerCount}`}
              />
              <div
                style={{ width: `${Math.min(100, (energyCount / 60) * 100)}%` }}
                className="bg-amber-500 transition-all"
                title={`Energías: ${energyCount}`}
              />
            </div>

            {/* Badges breakdown */}
            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Pokémon: {pokemonCount}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Entrenadores: {trainerCount}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Energías: {energyCount}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Missing Cards & Store Stock Action Banner */}
        {totalMissing > 0 && (
          <section className="bg-gradient-to-r from-[#0d1c3a] to-[#0c182c] border border-blue-600/40 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Te faltan {totalMissing} carta(s) para completar este mazo
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                {purchasableMissingCount > 0 ? (
                  <>
                    ¡Tenemos <strong className="text-emerald-400">{purchasableMissingCount} tipo(s) de carta</strong> disponible(s) en stock en nuestra tienda!
                  </>
                ) : (
                  'No hay stock actualmente en tienda para las cartas faltantes.'
                )}
              </p>
            </div>

            {purchasableMissingCount > 0 && (
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total estimado</span>
                  <span className="text-base font-black text-white">{formatPrice(totalMissingEstimatedPrice)}</span>
                </div>
                <button
                  onClick={handleAddAllMissingToCart}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar Faltantes al Carrito</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Main Deck Layout: Cards Grid (Left 2 cols) & Search Sidebar (Right 1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deck Cards Grid (Columns 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            {cards.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0b1220] border border-slate-800 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Layers className="w-7 h-7 opacity-40" />
                </div>
                <h3 className="font-bold text-white text-base">Tu mazo está vacío</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Usa el buscador de la derecha para añadir Pokémon, entrenadores y energías, o importa una lista en formato oficial.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Pokémon Section */}
                {pokemonCards.length > 0 && (
                  <DeckCategorySection
                    title="Pokémon"
                    count={pokemonCount}
                    badgeClass="bg-blue-950 text-blue-300 border-blue-800/40"
                    cards={cards}
                    category="pokemon"
                    storeCards={storeCards}
                    viewMode={viewMode}
                    onUpdateCount={handleUpdateCardCount}
                    onUpdateOwned={handleUpdateOwnedCount}
                    onToggleOwned={handleToggleCardOwned}
                    onSetCategoryOwned={handleSetCategoryOwned}
                    onAddToCart={(c, qty) => addToCart(c, qty)}
                    onHoverCard={handleCardHover}
                    onMoveCard={handleCardMove}
                    onLeaveCard={handleCardLeave}
                  />
                )}

                {/* 2. Trainers Section */}
                {trainerCards.length > 0 && (
                  <DeckCategorySection
                    title="Entrenadores"
                    count={trainerCount}
                    badgeClass="bg-purple-950 text-purple-300 border-purple-800/40"
                    cards={cards}
                    category="trainer"
                    storeCards={storeCards}
                    viewMode={viewMode}
                    onUpdateCount={handleUpdateCardCount}
                    onUpdateOwned={handleUpdateOwnedCount}
                    onToggleOwned={handleToggleCardOwned}
                    onSetCategoryOwned={handleSetCategoryOwned}
                    onAddToCart={(c, qty) => addToCart(c, qty)}
                    onHoverCard={handleCardHover}
                    onMoveCard={handleCardMove}
                    onLeaveCard={handleCardLeave}
                  />
                )}

                {/* 3. Energy Section */}
                {energyCards.length > 0 && (
                  <DeckCategorySection
                    title="Energías"
                    count={energyCount}
                    badgeClass="bg-amber-950 text-amber-300 border-amber-800/40"
                    cards={cards}
                    category="energy"
                    storeCards={storeCards}
                    viewMode={viewMode}
                    onUpdateCount={handleUpdateCardCount}
                    onUpdateOwned={handleUpdateOwnedCount}
                    onToggleOwned={handleToggleCardOwned}
                    onSetCategoryOwned={handleSetCategoryOwned}
                    onAddToCart={(c, qty) => addToCart(c, qty)}
                    onHoverCard={handleCardHover}
                    onMoveCard={handleCardMove}
                    onLeaveCard={handleCardLeave}
                  />
                )}
              </>
            )}
          </div>

          {/* Search & Add Sidebar (Column 3) */}
          <div className="space-y-4">
            <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span>Añadir Cartas al Mazo</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/90 text-blue-300 border border-blue-800/60 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>TCG Live · Formato {format}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Busca por nombre en inglés o español. Excluye cartas no oficiales de Pocket.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Charizard, Ultra Ball, Greninja..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {searchQuery.trim().length >= 2 ? 'No se encontraron cartas.' : 'Escribe al menos 2 letras para buscar.'}
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      onMouseEnter={(e) => handleCardHover({ imageUrl: item.image || '/placeholder-card.svg', name: item.name, expansion: item.setName, number: item.localId }, e)}
                      onMouseMove={handleCardMove}
                      onMouseLeave={handleCardLeave}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer"
                    >
                      <div className="relative w-11 h-15 rounded overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 p-0.5">
                        <img
                          src={item.image || '/placeholder-card.svg'}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-contain pointer-events-none"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-card.svg'; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.setName} · #{item.localId}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddCardToDeck(item)}
                        className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Visual Decklist Preview & Quick Action Widget */}
            <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>Lista en Imagen</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Visualizador TCG Pro</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    totalCount === 60
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                      : 'bg-blue-950/80 text-blue-300 border-blue-700/60'
                  }`}
                >
                  {totalCount}/60
                </span>
              </div>

              {/* Miniature Deck Grid Preview */}
              {cards.length === 0 ? (
                <div className="py-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-4">
                  <p className="text-xs text-slate-500">Agrega cartas o importa una lista para ver el mazo en imagen.</p>
                </div>
              ) : (
                <div
                  onClick={() => setImageModalOpen(true)}
                  className="group relative cursor-pointer rounded-2xl p-2.5 bg-[#070b14] border border-slate-800/90 hover:border-blue-500/50 transition-all shadow-inner overflow-hidden"
                  title="Haz clic para ver en pantalla completa"
                >
                  {/* Subtle Grid of Mini Cards */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {sortedPreviewCards.slice(0, 36).map((card, idx) => (
                      <div
                        key={`mini-preview-${card.card_name}-${card.number}-${idx}`}
                        className="relative flex flex-col items-center pb-1.5 cursor-pointer"
                        onMouseEnter={(e) => handleCardHover({ imageUrl: card.image_url, name: card.card_name, expansion: card.expansion, number: card.number }, e)}
                        onMouseMove={handleCardMove}
                        onMouseLeave={handleCardLeave}
                      >
                        <div className="relative aspect-[2.5/3.5] w-full rounded-sm overflow-hidden bg-slate-950 border border-slate-800 pointer-events-none">
                          <CardThumbnail
                            item={card}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Limitless mini red count badge */}
                        <div className="absolute -bottom-0.5 z-10 flex items-center justify-center pointer-events-none">
                          <div
                            className="bg-gradient-to-b from-red-600 via-rose-700 to-red-800 text-white font-black text-[9px] px-1 shadow-md border border-red-400/80 flex items-center justify-center min-w-[16px] h-3.5"
                            style={{
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                            }}
                          >
                            <span className="leading-none">{card.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sortedPreviewCards.length > 36 && (
                    <div className="text-center mt-1.5 text-[10px] text-blue-400 font-semibold">
                      +{sortedPreviewCards.length - 36} cartas más...
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/85 border border-white/20 text-white text-xs font-bold shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ver Pantalla Completa</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Ver Lista en Imagen & Copiar Lista al Portapapeles */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(true)}
                  disabled={cards.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-md shadow-blue-950/40 border border-blue-500/40 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-blue-200" />
                  <span>Ver Lista de Mazo en Imagen</span>
                  <Maximize2 className="w-3.5 h-3.5 ml-auto text-blue-300 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPtcgl}
                  disabled={cards.length === 0}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
                    copiedExport
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-emerald-950/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
                  }`}
                  title="Copiar lista de cartas al portapapeles en formato oficial PTCGL"
                >
                  {copiedExport ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span className="font-extrabold text-emerald-300">¡Lista Copiada al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-400" />
                      <span>Copiar Lista al Portapapeles</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Section: Comments, Ratings, Likes */}
      {deckId && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <DeckSocialSection deckId={deckId} deckName={name} />
        </section>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div onClick={() => setExportModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="min-h-full flex items-center justify-center p-4">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg bg-[#0d1629] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>Exportar Formato Oficial (PTCGL / Limitless)</span>
                </h3>
                <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Puedes copiar este texto para importarlo directamente en <strong className="text-white">Pokémon TCG Live</strong> o compartirlo en Limitless TCG.
              </p>

              <textarea
                rows={12}
                readOnly
                value={exportToPtcgl(cards)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleExportPtcgl}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-1.5"
                >
                  {copiedExport ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedExport ? '¡Copiado al Portapapeles!' : 'Copiar Lista'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div onClick={() => setImportModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="min-h-full flex items-center justify-center p-4">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg bg-[#0d1629] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Importar Formato PTCGL / Limitless</span>
                </h3>
                <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Pega tu lista exportada de <strong className="text-white">Pokémon TCG Live</strong> o Limitless TCG. Reconoce nombres en inglés/español, categorías, códigos de expansión y energías.
              </p>

              {/* How to mark imported cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ¿Cómo marcar las cartas en tu colección?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportAsOwned(false)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      !importAsOwned
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Faltan todas (B&N 50%)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Para armar tu lista de compras y ver qué cartas comprar en tienda.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportAsOwned(true)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      importAsOwned
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Tengo todas (Full Color)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Si ya posees las cartas físicas en tu colección personal.
                    </p>
                  </button>
                </div>
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <textarea
                rows={10}
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder={`Pokémon: 8\n1 Greninja ex MEP 99\n4 Froakie CRI 88\n...\nEntrenador: 16\n2 Buddy-Buddy Poffin TWM 223\n...\nEnergía: 2\n10 Basic {W} Energy MEE 3`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={importingText}
                  onClick={handleProcessDeckBuilderImport}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importingText ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando y Reconociendo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Cargar en Mazo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Decklist Image Modal (TCG Pro Style) */}
      <DeckImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        deckName={name}
        format={format}
        cards={cards}
      />

      {/* Floating Card Hover Zoom Preview Tooltip */}
      {hoveredCard && (
        <div
          className="fixed pointer-events-none z-[99999] transition-opacity duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: `${hoveredCard.x}px`,
            top: `${hoveredCard.y}px`,
            width: '260px',
          }}
        >
          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/80 shadow-2xl shadow-black/95 bg-[#0a0f1e] p-2 flex flex-col items-center backdrop-blur-md">
            <div className="relative w-full aspect-[2.5/3.5] rounded-xl overflow-hidden bg-slate-950">
              <img
                src={hoveredCard.imageUrl}
                alt={hoveredCard.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-card.svg';
                }}
              />
            </div>
            <div className="w-full pt-2 pb-0.5 px-1 text-center">
              <p className="text-xs font-black text-white truncate">{hoveredCard.name}</p>
              {(hoveredCard.expansion || hoveredCard.number) && (
                <p className="text-[10px] font-semibold text-blue-400">
                  {hoveredCard.expansion} {hoveredCard.number ? `· #${hoveredCard.number}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: High-reliability Card Image with CDN cascade & fallback
function CardThumbnail({
  item,
  className,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: {
  item: DeckCardItem;
  className?: string;
  onMouseEnter?: (src: string, e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  const setUpper = (item.expansion || '').toUpperCase().trim();
  const cleanNum = (item.number || '').replace(/^0+/, '');
  const paddedNum = cleanNum.padStart(3, '0');

  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Direct Limitless CDN URLs (Official standard for PTCGL)
    let lSet = setUpper;
    if (setUpper === 'PR-SW' || setUpper === 'SWSHP') lSet = 'SP';
    else if (setUpper === 'PR-SV' || setUpper === 'SVP') lSet = 'SVP';
    else if (setUpper === 'PR-SM' || setUpper === 'SMP') lSet = 'SMP';
    else if (setUpper === 'PR-XY' || setUpper === 'XYP') lSet = 'XYP';
    else if (setUpper === 'PR-BW' || setUpper === 'BWP') lSet = 'BWP';
    else if (setUpper === 'SVE' || setUpper.includes('SCARLET & VIOLET ENERGY') || setUpper.includes('SCARLET AND VIOLET ENERGY')) lSet = 'SVE';
    else if (setUpper === 'MEE' || setUpper.includes('MEGA EVOLUTION ENERGY')) lSet = 'MEE';

    if (lSet === 'SP') {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SP/SP_${cleanNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SP/SP_${paddedNum}_R_EN_SM.png`);
    } else if (lSet && cleanNum) {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${paddedNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${cleanNum}_R_EN_SM.png`);
      list.push(`https://limitless3.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${paddedNum}_R_EN_SM.png`);
    }

    // 2. Specific energy variations (MEE & SVE)
    if (setUpper === 'MEE' || setUpper === 'SVE' || lSet === 'MEE' || lSet === 'SVE') {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/MEE/MEE_${paddedNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVE/SVE_${paddedNum}_R_EN_SM.png`);
    }

    // 2.5. Basic energy generic local fallback
    if (isBasicEnergy({ card_name: item.card_name, category: item.category })) {
      const genericImg = getGenericEnergyImage(item.card_name);
      if (genericImg) {
        list.push(genericImg);
      }
      const typeNum = getBasicEnergyTypeNumber(item.card_name);
      if (typeNum) {
        list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVE/SVE_00${typeNum}_R_EN_SM.png`);
        list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/MEE/MEE_00${typeNum}_R_EN_SM.png`);
      }
    }

    // 3. Provided item.image_url if not a placeholder
    if (item.image_url && !item.image_url.includes('placeholder')) {
      if (!list.includes(item.image_url)) {
        list.unshift(item.image_url);
      }
    }

    // 4. Store matched card image
    if (item.store_card?.image_url) {
      list.push(item.store_card.image_url);
    }

    // 5. Final fallback placeholder
    list.push('/placeholder-card.svg');
    return Array.from(new Set(list));
  }, [item.expansion, item.number, item.image_url, item.store_card]);

  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [item.image_url, item.expansion, item.number]);

  const currentSrc = candidateUrls[srcIndex] || '/placeholder-card.svg';

  const handleError = () => {
    if (srcIndex + 1 < candidateUrls.length) {
      setSrcIndex((prev) => prev + 1);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={item.card_name}
      loading="lazy"
      onError={handleError}
      className={className}
      onMouseEnter={(e) => onMouseEnter?.(currentSrc, e)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  );
}

// Subcomponent: Section for Pokémon, Trainers, and Energies
function DeckCategorySection({
  title,
  count,
  badgeClass,
  cards,
  category,
  storeCards,
  viewMode,
  onUpdateCount,
  onUpdateOwned,
  onToggleOwned,
  onSetCategoryOwned,
  onAddToCart,
  onHoverCard,
  onMoveCard,
  onLeaveCard,
}: {
  title: string;
  count: number;
  badgeClass: string;
  cards: DeckCardItem[];
  category: 'pokemon' | 'trainer' | 'energy';
  storeCards: any[];
  viewMode: 'detailed' | 'visual';
  onUpdateCount: (index: number, delta: number) => void;
  onUpdateOwned: (index: number, delta: number) => void;
  onToggleOwned: (index: number) => void;
  onSetCategoryOwned: (category: 'pokemon' | 'trainer' | 'energy', owned: boolean) => void;
  onAddToCart: (card: any, qty: number) => void;
  onHoverCard?: (card: { imageUrl: string; name: string; expansion?: string; number?: string }, e: React.MouseEvent) => void;
  onMoveCard?: (e: React.MouseEvent) => void;
  onLeaveCard?: () => void;
}) {
  const categoryCards = cards
    .map((c, originalIndex) => ({ ...c, originalIndex }))
    .filter((c) => c.category === category);

  const categoryOwnedCount = categoryCards.reduce(
    (acc, c) => acc + Math.min(c.count, c.owned_count || 0),
    0
  );

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
      {/* Category Section Header with 1-click batch actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <span>{title}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${badgeClass}`}>
              {count}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            ({categoryOwnedCount}/{count} en colección)
          </span>
        </div>

        {/* Quick category actions: Tengo todas / Faltan todas */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => onSetCategoryOwned(category, true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-white border border-emerald-800/60 transition-all hover:scale-105 active:scale-95"
            title={`Marcar todos los ${title.toLowerCase()} como que los tienes (Full Color)`}
          >
            <CheckCheck className="w-3 h-3 text-emerald-400" />
            <span>Tengo todas</span>
          </button>
          <button
            onClick={() => onSetCategoryOwned(category, false)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all active:scale-95"
            title={`Marcar todos los ${title.toLowerCase()} como faltantes (B&N 50%)`}
          >
            <span>Faltan todas</span>
          </button>
        </div>
      </div>

      {/* RENDER MODE 1: Detailed List View */}
      {viewMode === 'detailed' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {categoryCards.map((item) => {
            const isComplete = (item.owned_count || 0) >= item.count;
            const isPartial = (item.owned_count || 0) > 0 && !isComplete;
            const isMissing = (item.owned_count || 0) === 0;
            const missingCount = Math.max(0, item.count - (item.owned_count || 0));

            // Check store match
            const storeMatch = storeCards.find((sc) => {
              const scName = sc.name.toLowerCase();
              const itemName = item.card_name.toLowerCase();
              return scName === itemName || scName.includes(itemName) || itemName.includes(scName);
            });

            return (
              <div
                key={`${item.card_name}-${item.number}-${item.originalIndex}`}
                className={`flex gap-3 p-3.5 rounded-2xl border transition-all ${
                  isComplete
                    ? 'bg-slate-900/90 border-emerald-900/40 shadow-sm shadow-emerald-950/20'
                    : isPartial
                    ? 'bg-slate-900/75 border-amber-900/40'
                    : 'bg-[#080d19]/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Card Image Thumbnail with 1-click toggle and B&W 50% filter */}
                <div
                  onClick={() => onToggleOwned(item.originalIndex)}
                  className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 p-0.5 cursor-pointer select-none group/img transition-transform active:scale-95"
                  title="Toca para alternar entre tenerla o faltante"
                >
                  <CardThumbnail
                    item={item}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isMissing
                        ? 'filter grayscale contrast-75 opacity-50 group-hover/img:opacity-75'
                        : isPartial
                        ? 'filter grayscale-[35%] opacity-85 group-hover/img:opacity-100'
                        : 'filter grayscale-0 opacity-100 ring-2 ring-emerald-500/70 shadow-md shadow-emerald-500/20 group-hover/img:scale-105'
                    }`}
                    onMouseEnter={(src, e) => onHoverCard?.({ imageUrl: src, name: item.card_name, expansion: item.expansion, number: item.number }, e)}
                    onMouseMove={onMoveCard}
                    onMouseLeave={onLeaveCard}
                  />

                  {/* Status Badge overlay on the card thumbnail */}
                  <div className="absolute top-1 left-1 pointer-events-none">
                    {isComplete ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 shadow flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-400" /> {item.count}x
                      </span>
                    ) : isPartial ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-950/90 text-amber-300 border border-amber-600/70 shadow">
                        {item.owned_count}/{item.count}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-black/85 text-rose-300 border border-rose-800/80 shadow">
                        FALTA
                      </span>
                    )}
                  </div>

                  {/* Quick toggle indicator on image hover */}
                  <div className="absolute inset-0 bg-blue-950/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity rounded-xl pointer-events-none">
                    <span className="text-[10px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded-full border border-white/20">
                      {isComplete ? 'Desmarcar' : 'Tengo'}
                    </span>
                  </div>
                </div>

                {/* Details & Controls */}
                <div className="flex-1 flex flex-col justify-between min-w-0 space-y-1.5">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate" title={item.card_name}>
                        {item.card_name}
                      </h4>
                      <button
                        onClick={() => onUpdateCount(item.originalIndex, -item.count)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                        title="Quitar carta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.expansion} · #{item.number}
                    </p>
                  </div>

                  {/* App-like 1-tap ownership button */}
                  <div>
                    {isComplete ? (
                      <button
                        onClick={() => onToggleOwned(item.originalIndex)}
                        className="w-full inline-flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-950/70 hover:bg-rose-950/70 text-emerald-300 hover:text-rose-300 border border-emerald-700/60 hover:border-rose-700/60 transition-all group/btn"
                        title="Toca para desmarcar de tu colección"
                      >
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>En tu colección</span>
                        </span>
                        <span className="text-[10px] font-semibold opacity-80 group-hover/btn:hidden">
                          {item.count} de {item.count}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-400 hidden group-hover/btn:inline">
                          Desmarcar
                        </span>
                      </button>
                    ) : isPartial ? (
                      <button
                        onClick={() => onToggleOwned(item.originalIndex)}
                        className="w-full inline-flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-950/70 hover:bg-emerald-950/70 text-amber-300 hover:text-emerald-300 border border-amber-700/60 hover:border-emerald-600 transition-all"
                        title="Toca para marcar todas como tenidas"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Tengo {item.owned_count} de {item.count}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 underline">
                          Completar
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleOwned(item.originalIndex)}
                        className="w-full inline-flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500 transition-all shadow-sm active:scale-95 group/btn"
                        title="Toca para marcar que tienes esta carta (1-clic)"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span>Falta en tu colección</span>
                        </span>
                        <span className="text-[10px] font-extrabold text-blue-300 group-hover/btn:text-white underline">
                          ¡La tengo!
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Steppers row for fine-tuning */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    {/* Deck Count */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Mazo:</span>
                      <div className="flex items-center bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => onUpdateCount(item.originalIndex, -1)}
                          className="text-slate-400 hover:text-white px-1 font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-white px-1 text-xs">{item.count}</span>
                        <button
                          onClick={() => onUpdateCount(item.originalIndex, 1)}
                          className="text-slate-400 hover:text-white px-1 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Owned Count fine adjustments */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Tengo:</span>
                      <div className="flex items-center bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => onUpdateOwned(item.originalIndex, -1)}
                          className="text-slate-400 hover:text-white px-1 font-bold"
                        >
                          -
                        </button>
                        <span
                          className={`font-black px-1 text-xs ${
                            isComplete ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-slate-500'
                          }`}
                        >
                          {item.owned_count || 0}
                        </span>
                        <button
                          onClick={() => onUpdateOwned(item.originalIndex, 1)}
                          className="text-slate-400 hover:text-white px-1 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Store match action */}
                  {storeMatch && storeMatch.stock > 0 && !isComplete && (
                    <div className="pt-1 border-t border-slate-800/40">
                      <button
                        onClick={() => onAddToCart(storeMatch, Math.min(missingCount, storeMatch.stock))}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-95"
                        title="Agregar cartas faltantes directamente al carrito de compras"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Comprar en tienda: {formatPrice(storeMatch.price)} ({storeMatch.stock} disp.)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RENDER MODE 2: Visual PTCGL Gallery Board */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {categoryCards.map((item) => {
            const isComplete = (item.owned_count || 0) >= item.count;
            const isPartial = (item.owned_count || 0) > 0 && !isComplete;
            const isMissing = (item.owned_count || 0) === 0;
            const missingCount = Math.max(0, item.count - (item.owned_count || 0));

            const storeMatch = storeCards.find((sc) => {
              const scName = sc.name.toLowerCase();
              const itemName = item.card_name.toLowerCase();
              return scName === itemName || scName.includes(itemName) || itemName.includes(scName);
            });

            return (
              <div
                key={`visual-${item.card_name}-${item.number}-${item.originalIndex}`}
                className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isComplete
                    ? 'bg-slate-900/90 border-emerald-600/60 shadow-lg shadow-emerald-950/30 hover:border-emerald-500'
                    : isPartial
                    ? 'bg-slate-900/80 border-amber-600/50 shadow-md shadow-amber-950/20'
                    : 'bg-[#080d19]/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Card Image Thumbnail with 1-click toggle and B&W 50% filter */}
                <div
                  onClick={() => onToggleOwned(item.originalIndex)}
                  className="relative aspect-[2.5/3.5] w-full bg-slate-950 cursor-pointer overflow-hidden p-1 flex items-center justify-center select-none"
                  title="Toca para marcar o desmarcar de tu colección"
                >
                  <CardThumbnail
                    item={item}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isMissing
                        ? 'filter grayscale contrast-75 opacity-50 group-hover:opacity-75'
                        : isPartial
                        ? 'filter grayscale-[35%] opacity-85 group-hover:opacity-100'
                        : 'filter grayscale-0 opacity-100 group-hover:scale-105'
                    }`}
                    onMouseEnter={(src, e) => onHoverCard?.({ imageUrl: src, name: item.card_name, expansion: item.expansion, number: item.number }, e)}
                    onMouseMove={onMoveCard}
                    onMouseLeave={onLeaveCard}
                  />

                  {/* Top-left: Card count badge */}
                  <div className="absolute top-2 left-2 pointer-events-none">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black shadow-md border ${
                      isComplete
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : isPartial
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-black/80 text-white border-slate-700'
                    }`}>
                      {item.count}x
                    </span>
                  </div>

                  {/* Top-right: Ownership check or missing badge */}
                  <div className="absolute top-2 right-2 pointer-events-none">
                    {isComplete ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : isPartial ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                        {item.owned_count}/{item.count}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white">
                        FALTA
                      </span>
                    )}
                  </div>

                  {/* Hover toggle overlay */}
                  <div className="absolute inset-0 bg-blue-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity pointer-events-none">
                    <span className="text-xs font-extrabold text-white bg-black/80 px-2.5 py-1 rounded-xl border border-white/20 shadow-lg">
                      {isComplete ? '✕ Desmarcar' : '✓ Marcar que la tengo'}
                    </span>
                  </div>
                </div>

                {/* Card info & Quick store button */}
                <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-white truncate" title={item.card_name}>
                      {item.card_name}
                    </p>
                    <button
                      onClick={() => onUpdateCount(item.originalIndex, -item.count)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title="Quitar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.expansion} · #{item.number}
                  </p>

                  {/* If missing and in store: quick 1-click buy button */}
                  {storeMatch && storeMatch.stock > 0 && !isComplete && (
                    <button
                      onClick={() => onAddToCart(storeMatch, Math.min(missingCount, storeMatch.stock))}
                      className="w-full inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all active:scale-95"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>{formatPrice(storeMatch.price)} ({storeMatch.stock} en tienda)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DeckBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060913] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <DeckBuilderContent />
    </Suspense>
  );
}
