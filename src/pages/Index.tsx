import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface CaseItem {
  id: number;
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  chance: number;
}

interface InventoryItem extends CaseItem {
  unboxedAt: Date;
}

interface HistoryItem {
  item: CaseItem;
  timestamp: Date;
  caseOpened: string;
}

interface TopUpHistoryItem {
  amount: number;
  timestamp: Date;
  method: 'direct' | 'promo';
  promoCode?: string;
}

const cases: CaseItem[] = [
  { id: 1, name: 'Школьник', price: 100, rarity: 'common', image: '🎒', chance: 0 },
  { id: 2, name: 'BMW', price: 500, rarity: 'rare', image: '🚗', chance: 0 },
  { id: 3, name: 'Yversy', price: 1000, rarity: 'epic', image: '💎', chance: 0 },
  { id: 4, name: 'Апокалипсис', price: 2500, rarity: 'legendary', image: '💀', chance: 0 },
];

const possibleItems: CaseItem[] = [
  { id: 101, name: 'AK-47 | Redline', price: 50, rarity: 'common', image: '🔫', chance: 35 },
  { id: 102, name: 'Glock-18 | Fade', price: 75, rarity: 'common', image: '🎨', chance: 30 },
  { id: 103, name: 'AWP | Dragon Lore', price: 200, rarity: 'rare', image: '🎯', chance: 15 },
  { id: 104, name: 'M4A4 | Howl', price: 150, rarity: 'rare', image: '🐺', chance: 12 },
  { id: 105, name: 'Knife | Karambit Fade', price: 800, rarity: 'epic', image: '🔪', chance: 5 },
  { id: 106, name: 'Desert Eagle | Blaze', price: 600, rarity: 'epic', image: '🔥', chance: 2 },
  { id: 107, name: 'Golden Desert Eagle', price: 2000, rarity: 'legendary', image: '⭐', chance: 0.8 },
  { id: 108, name: 'Dragon Knife', price: 3000, rarity: 'legendary', image: '🐉', chance: 0.2 },
];

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-600',
  legendary: 'bg-yellow-500',
};

const rarityBorders = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-600',
  legendary: 'border-yellow-500',
};

const rarityGlow = {
  common: 'shadow-[0_0_15px_rgba(107,114,128,0.5)]',
  rare: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
  epic: 'shadow-[0_0_25px_rgba(147,51,234,0.7)]',
  legendary: 'shadow-[0_0_30px_rgba(234,179,8,0.8)]',
};

const Index = () => {
  const [balance, setBalance] = useState(90000);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [wonItem, setWonItem] = useState<CaseItem | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [rouletteItems, setRouletteItems] = useState<CaseItem[]>([]);
  const [rouletteOffset, setRouletteOffset] = useState(0);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpHistory, setTopUpHistory] = useState<TopUpHistoryItem[]>([]);

  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = volume;
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  const playOpenSound = () => {
    playSound(440, 0.1, 'sine', 0.2);
    setTimeout(() => playSound(554, 0.1, 'sine', 0.2), 100);
    setTimeout(() => playSound(659, 0.15, 'sine', 0.25), 200);
  };

  const playRouletteSound = () => {
    let interval: NodeJS.Timeout;
    let delay = 50;
    let count = 0;
    
    interval = setInterval(() => {
      if (count > 40) {
        clearInterval(interval);
        return;
      }
      playSound(300 + count * 10, 0.05, 'square', 0.1);
      count++;
      delay += 10;
      clearInterval(interval);
      interval = setInterval(() => {
        if (count > 40) {
          clearInterval(interval);
          return;
        }
        playSound(300 + count * 10, 0.05, 'square', 0.1);
        count++;
      }, delay);
    }, delay);
  };

  const playWinSound = (rarity: string) => {
    if (rarity === 'legendary') {
      playSound(523, 0.15, 'sine', 0.3);
      setTimeout(() => playSound(659, 0.15, 'sine', 0.3), 150);
      setTimeout(() => playSound(784, 0.15, 'sine', 0.3), 300);
      setTimeout(() => playSound(1047, 0.3, 'sine', 0.35), 450);
    } else if (rarity === 'epic') {
      playSound(523, 0.15, 'sine', 0.25);
      setTimeout(() => playSound(659, 0.15, 'sine', 0.25), 150);
      setTimeout(() => playSound(784, 0.25, 'sine', 0.3), 300);
    } else if (rarity === 'rare') {
      playSound(440, 0.15, 'sine', 0.2);
      setTimeout(() => playSound(554, 0.2, 'sine', 0.25), 150);
    } else {
      playSound(330, 0.2, 'sine', 0.2);
    }
  };

  const triggerConfetti = (rarity: string) => {
    if (rarity === 'legendary') {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493']
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (rarity === 'epic') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff']
      });
    } else if (rarity === 'rare') {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
      });
    }
  };

  const [leaderboard] = useState([
    { name: 'Player1', bestDrop: 'Dragon Knife', value: 3000 },
    { name: 'Player2', bestDrop: 'Golden Desert Eagle', value: 2000 },
    { name: 'Player3', bestDrop: 'Knife | Karambit Fade', value: 800 },
    { name: 'Player4', bestDrop: 'Desert Eagle | Blaze', value: 600 },
    { name: 'Player5', bestDrop: 'AWP | Dragon Lore', value: 200 },
  ]);

  const generateRouletteItems = (winningItem: CaseItem) => {
    const items: CaseItem[] = [];
    const totalItems = 50;
    const winningIndex = 42;

    for (let i = 0; i < totalItems; i++) {
      if (i === winningIndex) {
        items.push(winningItem);
      } else {
        const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        items.push(randomItem);
      }
    }
    return items;
  };

  const getRandomItemByChance = (): CaseItem => {
    const random = Math.random() * 100;
    let cumulativeChance = 0;

    for (const item of possibleItems) {
      cumulativeChance += item.chance;
      if (random <= cumulativeChance) {
        return item;
      }
    }
    return possibleItems[0];
  };

  const openCase = (caseItem: CaseItem) => {
    if (balance < caseItem.price) {
      toast.error('Недостаточно средств!');
      return;
    }

    setSelectedCase(caseItem);
    setIsOpening(true);
    setBalance(balance - caseItem.price);

    playOpenSound();

    const winningItem = getRandomItemByChance();
    const items = generateRouletteItems(winningItem);
    setRouletteItems(items);
    setRouletteOffset(0);

    setTimeout(() => {
      const itemWidth = 150;
      const winningIndex = 42;
      const centerOffset = window.innerWidth / 2 - itemWidth / 2;
      const targetOffset = -(winningIndex * itemWidth - centerOffset);
      
      playRouletteSound();
      setRouletteOffset(targetOffset);

      setTimeout(() => {
        setWonItem(winningItem);
        setInventory([...inventory, { ...winningItem, unboxedAt: new Date() }]);
        setHistory([{ item: winningItem, timestamp: new Date(), caseOpened: caseItem.name }, ...history]);
        setIsOpening(false);
        playWinSound(winningItem.rarity);
        triggerConfetti(winningItem.rarity);
        toast.success(`Выпало: ${winningItem.name}!`);
      }, 4000);
    }, 100);
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'standoff') {
      setBalance(balance + 500);
      setTopUpHistory([{ amount: 500, timestamp: new Date(), method: 'promo', promoCode: 'STANDOFF' }, ...topUpHistory]);
      playSound(880, 0.1, 'sine', 0.2);
      setTimeout(() => playSound(1047, 0.2, 'sine', 0.25), 100);
      toast.success('Промокод активирован! +500 к балансу');
      setPromoCode('');
    } else {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Неверный промокод');
    }
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount < 10) {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Минимальная сумма пополнения — 10 рублей');
      return;
    }
    
    if (amount > 100000) {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Максимальная сумма пополнения — 100 000 рублей');
      return;
    }
    
    setBalance(balance + amount);
    setTopUpHistory([{ amount, timestamp: new Date(), method: 'direct' }, ...topUpHistory]);
    playSound(880, 0.1, 'sine', 0.2);
    setTimeout(() => playSound(1047, 0.2, 'sine', 0.25), 100);
    toast.success(`Баланс пополнен на ${amount} ₽!`);
    setTopUpAmount('');
  };

  const closeDialog = () => {
    setSelectedCase(null);
    setWonItem(null);
    setRouletteItems([]);
    setRouletteOffset(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎮</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STANDOFF CASES
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Card className="bg-card border-primary/20">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon name="Wallet" className="text-accent" size={20} />
                <span className="text-lg font-semibold">{balance}</span>
                <span className="text-sm text-muted-foreground">₽</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 mb-8">
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Icon name="Package" size={18} />
              Кейсы
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Icon name="Backpack" size={18} />
              Инвентарь
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Icon name="History" size={18} />
              История
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Icon name="Wallet" size={18} />
              Баланс
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Icon name="Trophy" size={18} />
              Рейтинг
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Доступные кейсы</h2>
              <p className="text-muted-foreground text-lg">Выбери кейс и испытай удачу!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className={`relative overflow-hidden border-2 ${rarityBorders[caseItem.rarity]} hover:scale-105 transition-transform cursor-pointer group`}
                >
                  <div className={`absolute inset-0 ${rarityColors[caseItem.rarity]} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <CardHeader className="text-center pb-2">
                    <div className="text-6xl mb-4 animate-float">{caseItem.image}</div>
                    <CardTitle className="text-xl">{caseItem.name}</CardTitle>
                    <CardDescription>
                      <Badge className={`${rarityColors[caseItem.rarity]} mt-2`}>
                        {caseItem.rarity.toUpperCase()}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-accent">
                      <Icon name="Coins" size={24} />
                      {caseItem.price} ₽
                    </div>
                    <Button
                      onClick={() => openCase(caseItem)}
                      className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold"
                      disabled={balance < caseItem.price}
                    >
                      <Icon name="Unlock" size={18} className="mr-2" />
                      Открыть
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="max-w-4xl mx-auto mt-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Percent" size={24} />
                  Шансы выпадения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {possibleItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.image}</span>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <Badge className={`${rarityColors[item.rarity]} text-xs`}>
                            {item.rarity}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-accent">{item.chance}%</p>
                        <p className="text-sm text-muted-foreground">{item.price} ₽</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Твой инвентарь</h2>
              <p className="text-muted-foreground">Всего предметов: {inventory.length}</p>
            </div>

            {inventory.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="text-center py-12">
                  <Icon name="PackageOpen" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">Инвентарь пуст</p>
                  <p className="text-sm text-muted-foreground mt-2">Открой свой первый кейс!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inventory.map((item, index) => (
                  <Card key={index} className={`border-2 ${rarityBorders[item.rarity]} ${rarityGlow[item.rarity]}`}>
                    <CardHeader className="text-center pb-2">
                      <div className="text-4xl mb-2">{item.image}</div>
                      <CardTitle className="text-sm">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Badge className={`${rarityColors[item.rarity]} text-xs`}>
                        {item.rarity}
                      </Badge>
                      <p className="text-accent font-semibold mt-2">{item.price} ₽</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">История открытий</h2>
              <p className="text-muted-foreground">Твои последние дропы</p>
            </div>

            {history.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="text-center py-12">
                  <Icon name="Clock" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">История пуста</p>
                  <p className="text-sm text-muted-foreground mt-2">Открой кейс, чтобы начать!</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-6">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {history.map((entry, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 border-2 ${rarityBorders[entry.item.rarity]} rounded-lg bg-card/50`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{entry.item.image}</span>
                            <div>
                              <p className="font-semibold">{entry.item.name}</p>
                              <p className="text-xs text-muted-foreground">из {entry.caseOpened}</p>
                              <Badge className={`${rarityColors[entry.item.rarity]} text-xs mt-1`}>
                                {entry.item.rarity}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-accent">{entry.item.price} ₽</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="promo" className="space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">💳</div>
                  <CardTitle className="text-2xl">Пополнить баланс</CardTitle>
                  <CardDescription>Минимальная сумма — 10 рублей</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Введи сумму (от 10₽)..."
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      min="10"
                      className="flex-1"
                    />
                    <Button onClick={handleTopUp} className="bg-primary hover:bg-primary/80">
                      <Icon name="Plus" size={18} className="mr-2" />
                      Пополнить
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 500, 1000, 2500, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setTopUpAmount(amount.toString())}
                        className="hover:bg-primary/20"
                      >
                        {amount} ₽
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">🎁</div>
                  <CardTitle className="text-2xl">Промокоды</CardTitle>
                  <CardDescription>Введи промокод и получи бонус на баланс</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введи промокод..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={applyPromoCode} className="bg-accent hover:bg-accent/80 text-accent-foreground">
                      <Icon name="Check" size={18} className="mr-2" />
                      Применить
                    </Button>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Icon name="Info" size={18} />
                      Подсказка:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Попробуй промокод: <code className="bg-primary/20 px-2 py-1 rounded">STANDOFF</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="History" size={24} />
                    История пополнений
                  </CardTitle>
                  <CardDescription>Все твои транзакции</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUpHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Icon name="Receipt" size={48} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">История пополнений пуста</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {topUpHistory.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${
                                entry.method === 'promo' ? 'bg-accent/20' : 'bg-primary/20'
                              }`}>
                                <Icon 
                                  name={entry.method === 'promo' ? 'Gift' : 'CreditCard'} 
                                  size={24} 
                                  className={entry.method === 'promo' ? 'text-accent' : 'text-primary'}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-lg">+{entry.amount} ₽</p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.method === 'promo' 
                                    ? `Промокод: ${entry.promoCode}` 
                                    : 'Прямое пополнение'
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {entry.timestamp.toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              className={entry.method === 'promo' ? 'bg-accent' : 'bg-primary'}
                            >
                              {entry.method === 'promo' ? 'Бонус' : 'Пополнение'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Топ дропов</h2>
              <p className="text-muted-foreground">Лучшие выпадения игроков</p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.bestDrop}</p>
                        </div>
                      </div>
                      <div className="text-accent font-bold text-lg">
                        {entry.value} ₽
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={selectedCase !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {isOpening ? `Открываем ${selectedCase?.name}...` : wonItem ? 'Поздравляем!' : ''}
            </DialogTitle>
          </DialogHeader>
          
          {isOpening && rouletteItems.length > 0 && (
            <div className="py-8 overflow-hidden relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary z-10 transform -translate-x-1/2"></div>
              <div 
                ref={rouletteRef}
                className="flex gap-4 transition-transform duration-[4000ms] ease-out"
                style={{ transform: `translateX(${rouletteOffset}px)` }}
              >
                {rouletteItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-[130px] h-[150px] border-2 ${rarityBorders[item.rarity]} rounded-lg flex flex-col items-center justify-center bg-card p-3 ${rarityGlow[item.rarity]}`}
                  >
                    <span className="text-4xl mb-2">{item.image}</span>
                    <p className="text-xs text-center font-semibold truncate w-full">{item.name}</p>
                    <Badge className={`${rarityColors[item.rarity]} text-xs mt-1`}>
                      {item.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wonItem && !isOpening && (
            <div className="py-8 space-y-4">
              <div className={`text-8xl animate-float mb-4 text-center ${rarityGlow[wonItem.rarity]} inline-block px-8 py-4 rounded-xl`}>
                {wonItem.image}
              </div>
              <h3 className="text-2xl font-bold text-center">{wonItem.name}</h3>
              <div className="flex justify-center gap-2">
                <Badge className={`${rarityColors[wonItem.rarity]} text-lg py-1 px-4`}>
                  {wonItem.rarity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-lg py-1 px-4">
                  {wonItem.chance}% шанс
                </Badge>
              </div>
              <div className="text-accent text-3xl font-bold text-center">+{wonItem.price} ₽</div>
              <Button onClick={closeDialog} className="w-full mt-4 bg-primary hover:bg-primary/80">
                Забрать в инвентарь
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;