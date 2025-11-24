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

interface LiveDropItem {
  playerName: string;
  item: CaseItem;
  timestamp: Date;
}

const cases: CaseItem[] = [
  { id: 1, name: 'Школьник', price: 100, rarity: 'common', image: '🎒', chance: 0 },
  { id: 2, name: 'BMW', price: 500, rarity: 'rare', image: '🚗', chance: 0 },
  { id: 3, name: 'Yversy', price: 1000, rarity: 'epic', image: '💎', chance: 0 },
  { id: 4, name: 'Апокалипсис', price: 2500, rarity: 'legendary', image: '💀', chance: 0 },
];

const possibleItems: CaseItem[] = [
  // Common (65% total)
  { id: 101, name: 'AK-47 | Призрак', price: 45, rarity: 'common', image: '🔫', chance: 12 },
  { id: 102, name: 'Glock-18 | Пустыня', price: 40, rarity: 'common', image: '🏜️', chance: 11 },
  { id: 103, name: 'MP5 | Вихрь', price: 35, rarity: 'common', image: '🌀', chance: 10 },
  { id: 104, name: 'M4A1 | Гипербeast', price: 50, rarity: 'common', image: '🦁', chance: 9 },
  { id: 105, name: 'USP | Неон', price: 38, rarity: 'common', image: '💡', chance: 8 },
  { id: 106, name: 'P90 | Азимов', price: 42, rarity: 'common', image: '🤖', chance: 8 },
  { id: 107, name: 'FAMAS | Граффити', price: 30, rarity: 'common', image: '🎨', chance: 7 },
  
  // Rare (27% total)
  { id: 201, name: 'AWP | Скелет', price: 180, rarity: 'rare', image: '💀', chance: 8 },
  { id: 202, name: 'Desert Eagle | Метеор', price: 140, rarity: 'rare', image: '☄️', chance: 6 },
  { id: 203, name: 'AK-47 | Огненный змей', price: 220, rarity: 'rare', image: '🐍', chance: 5 },
  { id: 204, name: 'M4A1 | Кибер', price: 160, rarity: 'rare', image: '⚡', chance: 4 },
  { id: 205, name: 'SCAR | Хаос', price: 130, rarity: 'rare', image: '💥', chance: 4 },
  
  // Epic (7% total)
  { id: 301, name: 'Butterfly Knife | Градиент', price: 950, rarity: 'epic', image: '🦋', chance: 2.5 },
  { id: 302, name: 'Karambit | Тигр', price: 1100, rarity: 'epic', image: '🐯', chance: 2 },
  { id: 303, name: 'AWP | Пустынный мятежник', price: 750, rarity: 'epic', image: '🎯', chance: 1.5 },
  { id: 304, name: 'Golden AK-47', price: 800, rarity: 'epic', image: '👑', chance: 1 },
  
  // Legendary (1% total)
  { id: 401, name: 'Dragon Lore AWP', price: 3500, rarity: 'legendary', image: '🐉', chance: 0.4 },
  { id: 402, name: 'Butterfly Gold', price: 4200, rarity: 'legendary', image: '✨', chance: 0.3 },
  { id: 403, name: 'Karambit Fade', price: 5000, rarity: 'legendary', image: '🌈', chance: 0.2 },
  { id: 404, name: 'M4A1 | Вой (Howl)', price: 6500, rarity: 'legendary', image: '🐺', chance: 0.1 },
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

const generatePlayerId = () => {
  return `SO2-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
};

const generatePersonalPromo = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const Index = () => {
  const [playerId] = useState(() => generatePlayerId());
  const [personalPromo] = useState(() => generatePersonalPromo());
  const [balance, setBalance] = useState(90000);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const dragonLore = possibleItems.find(item => item.id === 401);
    if (!dragonLore) return [];
    return Array.from({ length: 10 }, () => ({ ...dragonLore, unboxedAt: new Date() }));
  });
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
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNickname, setWithdrawNickname] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState<{amount: number; timestamp: Date; status: string; nickname: string}[]>([]);
  
  const [upgradeItem, setUpgradeItem] = useState<InventoryItem | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<CaseItem | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<'win' | 'lose' | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const [ladderBet, setLadderBet] = useState('');
  const [ladderStep, setLadderStep] = useState(0);
  const [ladderMultiplier, setLadderMultiplier] = useState(1);
  const [isLadderPlaying, setIsLadderPlaying] = useState(false);
  
  const [contractItems, setContractItems] = useState<InventoryItem[]>([]);
  
  const [rouletteBet, setRouletteBet] = useState('');
  const [rouletteColor, setRouletteColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  
  const [liveDrops, setLiveDrops] = useState<LiveDropItem[]>([]);
  
  const [bonusWheelSpinning, setBonusWheelSpinning] = useState(false);
  const [bonusWheelResult, setBonusWheelResult] = useState<number | null>(null);
  const [bonusWheelRotation, setBonusWheelRotation] = useState(0);
  const [lastBonusSpin, setLastBonusSpin] = useState<Date | null>(null);
  
  const bonusWheelPrizes = [
    { label: '10₽', amount: 10, color: 'bg-gray-600' },
    { label: '50₽', amount: 50, color: 'bg-blue-600' },
    { label: '25₽', amount: 25, color: 'bg-gray-600' },
    { label: '100₽', amount: 100, color: 'bg-purple-600' },
    { label: '5₽', amount: 5, color: 'bg-gray-600' },
    { label: '500₽', amount: 500, color: 'bg-yellow-600' },
    { label: '15₽', amount: 15, color: 'bg-gray-600' },
    { label: '250₽', amount: 250, color: 'bg-green-600' },
  ];

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
  
  const generateRandomPlayerName = () => {
    const names = ['ProGamer', 'SkillzZ', 'LuckyOne', 'TopPlayer', 'CaseKing', 'DropMaster', 'EZ_WIN', 'GG_WP', 'Ninja', 'Shadow'];
    const suffixes = ['123', '777', '999', 'Pro', 'YT', 'TTV', '2025', 'MVP'];
    return `${names[Math.floor(Math.random() * names.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      const newDrop: LiveDropItem = {
        playerName: generateRandomPlayerName(),
        item: randomItem,
        timestamp: new Date()
      };
      
      setLiveDrops(prev => [newDrop, ...prev].slice(0, 50));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

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
        setLiveDrops(prev => [{ playerName: playerId.split('-')[1], item: winningItem, timestamp: new Date() }, ...prev].slice(0, 50));
        setIsOpening(false);
        playWinSound(winningItem.rarity);
        triggerConfetti(winningItem.rarity);
        toast.success(`Выпало: ${winningItem.name}!`);
      }, 4000);
    }, 100);
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    
    if (code === personalPromo) {
      const bonusAmount = Math.round(balance * 0.45);
      setBalance(balance + bonusAmount);
      setTopUpHistory([{ amount: bonusAmount, timestamp: new Date(), method: 'promo', promoCode: personalPromo }, ...topUpHistory]);
      playSound(880, 0.1, 'sine', 0.2);
      setTimeout(() => playSound(1047, 0.2, 'sine', 0.25), 100);
      triggerConfetti('legendary');
      toast.success(`Личный промокод активирован! +${bonusAmount}₽ (45% от баланса)`);
      setPromoCode('');
    } else if (promoCode.toLowerCase() === 'standoff') {
      setBalance(balance + 500);
      setTopUpHistory([{ amount: 500, timestamp: new Date(), method: 'promo', promoCode: 'STANDOFF' }, ...topUpHistory]);
      playSound(880, 0.1, 'sine', 0.2);
      setTimeout(() => playSound(1047, 0.2, 'sine', 0.25), 100);
      toast.success('Промокод активирован! +500₽ к балансу');
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

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount < 700) {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Минимальная сумма вывода — 700 рублей');
      return;
    }
    
    if (amount > balance) {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Недостаточно средств на балансе');
      return;
    }
    
    if (!withdrawNickname.trim()) {
      playSound(200, 0.3, 'sawtooth', 0.15);
      toast.error('Введи свой игровой ник');
      return;
    }
    
    setBalance(balance - amount);
    setWithdrawHistory([{ amount, timestamp: new Date(), status: 'В обработке', nickname: withdrawNickname }, ...withdrawHistory]);
    playSound(880, 0.1, 'sine', 0.2);
    setTimeout(() => playSound(1047, 0.2, 'sine', 0.25), 100);
    toast.success(`Заявка на вывод ${amount} ₽ для ${withdrawNickname} принята!`);
    setWithdrawAmount('');
    setWithdrawNickname('');
  };

  const closeDialog = () => {
    setSelectedCase(null);
    setWonItem(null);
    setRouletteItems([]);
    setRouletteOffset(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/80 backdrop-blur-sm border-b border-primary/30 py-2 overflow-hidden">
        <div className="flex gap-4 animate-scroll">
          {liveDrops.map((drop, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg border ${rarityBorders[drop.item.rarity]} whitespace-nowrap flex-shrink-0`}
            >
              <Icon name="User" size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium">{drop.playerName}</span>
              <span className="text-lg">{drop.item.image}</span>
              <span className={`text-sm font-semibold ${
                drop.item.rarity === 'legendary' ? 'text-yellow-500' :
                drop.item.rarity === 'epic' ? 'text-purple-500' :
                drop.item.rarity === 'rare' ? 'text-blue-500' :
                'text-gray-400'
              }`}>{drop.item.name}</span>
              <span className="text-xs text-accent">{drop.item.price}₽</span>
            </div>
          ))}
        </div>
      </div>
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎮</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STANDOFF CASES
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon name="User" className="text-primary" size={18} />
                <span className="text-sm font-mono text-muted-foreground">{playerId}</span>
              </CardContent>
            </Card>
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
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-6 mb-8">
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
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Icon name="Gamepad2" size={18} />
              Игры
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
                    <CardContent className="text-center space-y-2">
                      <Badge className={`${rarityColors[item.rarity]} text-xs`}>
                        {item.rarity}
                      </Badge>
                      <p className="text-accent font-semibold">{item.price} ₽</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => {
                          setBalance(balance + item.price);
                          setInventory(inventory.filter((_, i) => i !== index));
                          playSound(440, 0.1, 'sine', 0.2);
                          toast.success(`Продано за ${item.price} ₽`);
                        }}
                      >
                        <Icon name="DollarSign" size={14} className="mr-1" />
                        Продать
                      </Button>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                  <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-yellow-500">
                      <Icon name="Sparkles" size={18} />
                      Твой личный промокод:
                    </h3>
                    <div className="flex items-center gap-2">
                      <code className="bg-yellow-600/30 text-yellow-300 px-3 py-2 rounded font-bold text-lg tracking-wider">
                        {personalPromo}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(personalPromo);
                          toast.success('Промокод скопирован!');
                        }}
                        className="hover:bg-yellow-600/20"
                      >
                        <Icon name="Copy" size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-200/70">
                      Дает +45% от текущего баланса. Используй один раз!
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Icon name="Info" size={18} />
                      Другие промокоды:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Попробуй: <code className="bg-primary/20 px-2 py-1 rounded">STANDOFF</code> (+500₽)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">💸</div>
                  <CardTitle className="text-2xl">Вывод в игру</CardTitle>
                  <CardDescription>Минимальная сумма вывода — 700₽</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Твой игровой ник в Standoff 2
                      </label>
                      <Input
                        type="text"
                        placeholder="Например: ProGamer123"
                        value={withdrawNickname}
                        onChange={(e) => setWithdrawNickname(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Введи сумму (от 700₽)..."
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="700"
                        className="flex-1"
                      />
                      <Button onClick={handleWithdraw} className="bg-green-600 hover:bg-green-700">
                        <Icon name="ArrowDownToLine" size={18} className="mr-2" />
                        Вывести
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[700, 1000, 2500, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setWithdrawAmount(amount.toString())}
                        className="hover:bg-green-600/20"
                        disabled={balance < amount}
                      >
                        {amount} ₽
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </div>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="History" size={24} />
                    История транзакций
                  </CardTitle>
                  <CardDescription>Все пополнения и выводы</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUpHistory.length === 0 && withdrawHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Icon name="Receipt" size={48} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">История транзакций пуста</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {[...topUpHistory.map(e => ({...e, type: 'topup'})), ...withdrawHistory.map(e => ({...e, type: 'withdraw'}))]
                          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                          .map((entry: any, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${
                                entry.type === 'withdraw' ? 'bg-green-600/20' :
                                entry.method === 'promo' ? 'bg-accent/20' : 'bg-primary/20'
                              }`}>
                                <Icon 
                                  name={entry.type === 'withdraw' ? 'ArrowDownToLine' : entry.method === 'promo' ? 'Gift' : 'CreditCard'} 
                                  size={24} 
                                  className={entry.type === 'withdraw' ? 'text-green-600' : entry.method === 'promo' ? 'text-accent' : 'text-primary'}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{entry.type === 'withdraw' ? '-' : '+'}{entry.amount} ₽</p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.type === 'withdraw' ? `Вывод в игру → ${entry.nickname} (${entry.status})` :
                                   entry.method === 'promo' ? `Промокод: ${entry.promoCode}` : 'Прямое пополнение'
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
                              className={entry.type === 'withdraw' ? 'bg-green-600' : entry.method === 'promo' ? 'bg-accent' : 'bg-primary'}
                            >
                              {entry.type === 'withdraw' ? 'Вывод' : entry.method === 'promo' ? 'Бонус' : 'Пополнение'}
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

          <TabsContent value="games" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Мини-игры</h2>
              <p className="text-muted-foreground">Испытай удачу в играх на баланс</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-600/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="ArrowUpCircle" className="text-purple-500" size={24} />
                    Апгрейд
                  </CardTitle>
                  <CardDescription>Улучши предмет из инвентаря на более дорогой</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isUpgrading ? (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Выбери предмет для апгрейда</label>
                        <ScrollArea className="h-32 border rounded-lg p-2">
                          <div className="grid grid-cols-3 gap-2">
                            {inventory.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => setUpgradeItem(item)}
                                className={`cursor-pointer p-2 border-2 rounded-lg text-center hover:scale-105 transition-transform ${
                                  upgradeItem === item ? rarityBorders[item.rarity] : 'border-border'
                                }`}
                              >
                                <div className="text-2xl">{item.image}</div>
                                <p className="text-xs truncate">{item.name}</p>
                                <p className="text-xs text-accent">{item.price}₽</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      
                      {upgradeItem && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Выбери целевой предмет (шанс: {upgradeItem.price > 0 ? Math.round((upgradeItem.price / (upgradeItem.price * 2)) * 100) : 50}%)</label>
                          <ScrollArea className="h-32 border rounded-lg p-2">
                            <div className="grid grid-cols-3 gap-2">
                              {possibleItems.filter(i => i.price > upgradeItem.price).map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => setUpgradeTarget(item)}
                                  className={`cursor-pointer p-2 border-2 rounded-lg text-center hover:scale-105 transition-transform ${
                                    upgradeTarget?.id === item.id ? rarityBorders[item.rarity] : 'border-border'
                                  }`}
                                >
                                  <div className="text-2xl">{item.image}</div>
                                  <p className="text-xs truncate">{item.name}</p>
                                  <p className="text-xs text-accent">{item.price}₽</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => {
                          if (!upgradeItem || !upgradeTarget) {
                            toast.error('Выбери оба предмета!');
                            return;
                          }
                          setIsUpgrading(true);
                          playSound(440, 0.2, 'sine', 0.2);
                          setTimeout(() => {
                            const chance = (upgradeItem.price / upgradeTarget.price) * 100;
                            const success = Math.random() * 100 < chance;
                            setUpgradeResult(success ? 'win' : 'lose');
                            
                            if (success) {
                              const itemIndex = inventory.indexOf(upgradeItem);
                              const newInv = [...inventory];
                              newInv.splice(itemIndex, 1);
                              setInventory([...newInv, { ...upgradeTarget, unboxedAt: new Date() }]);
                              playWinSound('epic');
                              triggerConfetti('epic');
                              toast.success(`Апгрейд успешен! Получен ${upgradeTarget.name}`);
                            } else {
                              const itemIndex = inventory.indexOf(upgradeItem);
                              const newInv = [...inventory];
                              newInv.splice(itemIndex, 1);
                              setInventory(newInv);
                              playSound(200, 0.5, 'sawtooth', 0.2);
                              toast.error('Апгрейд провален!');
                            }
                            
                            setTimeout(() => {
                              setIsUpgrading(false);
                              setUpgradeResult(null);
                              setUpgradeItem(null);
                              setUpgradeTarget(null);
                            }, 2000);
                          }, 2000);
                        }}
                        disabled={!upgradeItem || !upgradeTarget}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Icon name="Zap" size={18} className="mr-2" />
                        Улучшить
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4 animate-spin-slow">{upgradeResult === 'win' ? '✨' : upgradeResult === 'lose' ? '💥' : '⚡'}</div>
                      <p className="text-lg font-semibold">
                        {upgradeResult === null ? 'Апгрейд...' : upgradeResult === 'win' ? 'Успех!' : 'Провал!'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-600/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="TrendingUp" className="text-blue-500" size={24} />
                    Лесенка
                  </CardTitle>
                  <CardDescription>Поднимайся по лесенке и увеличивай выигрыш</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isLadderPlaying ? (
                    <>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Ставка (от 10₽)"
                          value={ladderBet}
                          onChange={(e) => setLadderBet(e.target.value)}
                          min="10"
                        />
                        <Button
                          onClick={() => {
                            const bet = parseFloat(ladderBet);
                            if (isNaN(bet) || bet < 10) {
                              toast.error('Минимальная ставка 10₽');
                              return;
                            }
                            if (bet > balance) {
                              toast.error('Недостаточно средств');
                              return;
                            }
                            setBalance(balance - bet);
                            setIsLadderPlaying(true);
                            setLadderStep(0);
                            setLadderMultiplier(1);
                            playSound(440, 0.1, 'sine', 0.2);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Начать
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((step) => {
                          const multipliers = [20, 15, 10, 7, 5, 3.5, 2.5, 2, 1.5, 1.2];
                          const mult = multipliers[10 - step];
                          const isPassed = ladderStep > (10 - step);
                          const isCurrent = ladderStep === (10 - step);
                          
                          return (
                            <div
                              key={step}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isPassed ? 'bg-green-600/20 border-green-600' :
                                isCurrent ? 'bg-blue-600/20 border-blue-600 animate-pulse' :
                                'bg-muted/20 border-border'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">Ступень {step}</span>
                                <span className="text-accent font-bold">x{mult}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const chance = 50 - (ladderStep * 3);
                            const success = Math.random() * 100 < chance;
                            
                            if (success) {
                              const multipliers = [1.2, 1.5, 2, 2.5, 3.5, 5, 7, 10, 15, 20];
                              setLadderStep(ladderStep + 1);
                              setLadderMultiplier(multipliers[ladderStep]);
                              playSound(523 + ladderStep * 50, 0.1, 'sine', 0.2);
                              
                              if (ladderStep === 9) {
                                const bet = parseFloat(ladderBet);
                                const winAmount = Math.round(bet * 20);
                                setBalance(balance + winAmount);
                                triggerConfetti('legendary');
                                toast.success(`Победа! +${winAmount}₽`);
                                setIsLadderPlaying(false);
                              }
                            } else {
                              playSound(200, 0.5, 'sawtooth', 0.2);
                              toast.error('Проигрыш!');
                              setIsLadderPlaying(false);
                            }
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Icon name="ArrowUp" size={18} className="mr-2" />
                          Вверх
                        </Button>
                        <Button
                          onClick={() => {
                            const bet = parseFloat(ladderBet);
                            const winAmount = Math.round(bet * ladderMultiplier);
                            setBalance(balance + winAmount);
                            playSound(659, 0.2, 'sine', 0.25);
                            toast.success(`Забрано ${winAmount}₽ (x${ladderMultiplier})`);
                            setIsLadderPlaying(false);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <Icon name="Download" size={18} className="mr-2" />
                          Забрать
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-600/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="FileText" className="text-orange-500" size={24} />
                    Контракты
                  </CardTitle>
                  <CardDescription>Обменяй 3 предмета на 1 случайный</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Выбери 3 предмета (выбрано: {contractItems.length}/3)</label>
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      <div className="grid grid-cols-3 gap-2">
                        {inventory.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (contractItems.includes(item)) {
                                setContractItems(contractItems.filter(i => i !== item));
                              } else if (contractItems.length < 3) {
                                setContractItems([...contractItems, item]);
                              }
                            }}
                            className={`cursor-pointer p-2 border-2 rounded-lg text-center hover:scale-105 transition-transform ${
                              contractItems.includes(item) ? 'border-orange-600 bg-orange-600/20' : 'border-border'
                            }`}
                          >
                            <div className="text-2xl">{item.image}</div>
                            <p className="text-xs truncate">{item.name}</p>
                            <p className="text-xs text-accent">{item.price}₽</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (contractItems.length !== 3) {
                        toast.error('Выбери ровно 3 предмета!');
                        return;
                      }
                      
                      const avgPrice = contractItems.reduce((sum, i) => sum + i.price, 0) / 3;
                      const eligibleItems = possibleItems.filter(i => i.price >= avgPrice * 0.5 && i.price <= avgPrice * 2);
                      const resultItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
                      
                      contractItems.forEach(item => {
                        const idx = inventory.indexOf(item);
                        if (idx > -1) {
                          const newInv = [...inventory];
                          newInv.splice(idx, 1);
                          setInventory(newInv);
                        }
                      });
                      
                      setInventory([...inventory, { ...resultItem, unboxedAt: new Date() }]);
                      setContractItems([]);
                      playWinSound(resultItem.rarity);
                      triggerConfetti(resultItem.rarity);
                      toast.success(`Получен: ${resultItem.name}!`);
                    }}
                    disabled={contractItems.length !== 3}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Icon name="Repeat" size={18} className="mr-2" />
                    Обменять
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-600/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="CircleDot" className="text-red-500" size={24} />
                    Рулетка
                  </CardTitle>
                  <CardDescription>Ставь на красное (x2), черное (x2) или зеленое (x14)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isRouletteSpinning ? (
                    <>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Ставка (от 10₽)"
                          value={rouletteBet}
                          onChange={(e) => setRouletteBet(e.target.value)}
                          min="10"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => setRouletteColor('red')}
                          className={`h-20 ${rouletteColor === 'red' ? 'ring-2 ring-white' : ''} bg-red-600 hover:bg-red-700`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🔴</div>
                            <div className="text-xs">x2</div>
                          </div>
                        </Button>
                        <Button
                          onClick={() => setRouletteColor('black')}
                          className={`h-20 ${rouletteColor === 'black' ? 'ring-2 ring-white' : ''} bg-gray-900 hover:bg-gray-800`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">⚫</div>
                            <div className="text-xs">x2</div>
                          </div>
                        </Button>
                        <Button
                          onClick={() => setRouletteColor('green')}
                          className={`h-20 ${rouletteColor === 'green' ? 'ring-2 ring-white' : ''} bg-green-600 hover:bg-green-700`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🟢</div>
                            <div className="text-xs">x14</div>
                          </div>
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => {
                          const bet = parseFloat(rouletteBet);
                          if (isNaN(bet) || bet < 10) {
                            toast.error('Минимальная ставка 10₽');
                            return;
                          }
                          if (bet > balance) {
                            toast.error('Недостаточно средств');
                            return;
                          }
                          if (!rouletteColor) {
                            toast.error('Выбери цвет!');
                            return;
                          }
                          
                          setBalance(balance - bet);
                          setIsRouletteSpinning(true);
                          playRouletteSound();
                          
                          setTimeout(() => {
                            const random = Math.random() * 100;
                            let resultNum: number;
                            let resultColor: 'red' | 'black' | 'green';
                            
                            if (random < 7) {
                              resultNum = 0;
                              resultColor = 'green';
                            } else if (random < 53.5) {
                              resultNum = Math.floor(Math.random() * 7) * 2 + 1;
                              resultColor = 'red';
                            } else {
                              resultNum = Math.floor(Math.random() * 7) * 2 + 2;
                              resultColor = 'black';
                            }
                            
                            setRouletteResult(resultNum);
                            
                            setTimeout(() => {
                              if (resultColor === rouletteColor) {
                                const multiplier = resultColor === 'green' ? 14 : 2;
                                const winAmount = Math.round(bet * multiplier);
                                setBalance(balance + winAmount);
                                playWinSound(resultColor === 'green' ? 'legendary' : 'rare');
                                triggerConfetti(resultColor === 'green' ? 'legendary' : 'rare');
                                toast.success(`Победа! +${winAmount}₽ (x${multiplier})`);
                              } else {
                                playSound(200, 0.5, 'sawtooth', 0.2);
                                toast.error('Проигрыш!');
                              }
                              
                              setTimeout(() => {
                                setIsRouletteSpinning(false);
                                setRouletteResult(null);
                                setRouletteColor(null);
                              }, 2000);
                            }, 1000);
                          }, 3000);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Icon name="Play" size={18} className="mr-2" />
                        Крутить
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4 animate-spin">
                        {rouletteResult === null ? '🎰' : rouletteResult === 0 ? '🟢' : rouletteResult % 2 === 1 ? '🔴' : '⚫'}
                      </div>
                      <p className="text-lg font-semibold">
                        {rouletteResult === null ? 'Крутим...' : `Выпало: ${rouletteResult}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-2 border-yellow-600/50 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Trophy" className="text-yellow-500" size={24} />
                  Бонусное колесо
                </CardTitle>
                <CardDescription>Крути бесплатно каждые 30 минут и получай бонусы!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!bonusWheelSpinning ? (
                  <>
                    <div className="relative w-64 h-64 mx-auto">
                      <div 
                        className="w-full h-full rounded-full border-8 border-yellow-600 relative overflow-hidden transition-transform duration-[5000ms] ease-out"
                        style={{ transform: `rotate(${bonusWheelRotation}deg)` }}
                      >
                        {bonusWheelPrizes.map((prize, index) => {
                          const rotation = (360 / bonusWheelPrizes.length) * index;
                          return (
                            <div
                              key={index}
                              className={`absolute w-1/2 h-1/2 origin-bottom-right ${prize.color} flex items-center justify-center font-bold text-white text-lg`}
                              style={{
                                transform: `rotate(${rotation}deg) skew(${-90 + 360 / bonusWheelPrizes.length}deg)`,
                                left: '50%',
                                top: '50%',
                              }}
                            >
                              <span className="transform rotate-45">{prize.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600 z-10"></div>
                    </div>
                    
                    {lastBonusSpin && new Date().getTime() - lastBonusSpin.getTime() < 30 * 60 * 1000 ? (
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground">Следующий спин через:</p>
                        <p className="text-2xl font-bold text-yellow-500">
                          {Math.ceil((30 * 60 * 1000 - (new Date().getTime() - lastBonusSpin.getTime())) / 1000 / 60)} мин
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setBonusWheelSpinning(true);
                          playRouletteSound();
                          
                          const randomIndex = Math.floor(Math.random() * bonusWheelPrizes.length);
                          const targetRotation = bonusWheelRotation + 360 * 5 + (360 / bonusWheelPrizes.length) * randomIndex;
                          
                          setBonusWheelRotation(targetRotation);
                          
                          setTimeout(() => {
                            const prize = bonusWheelPrizes[randomIndex];
                            setBonusWheelResult(randomIndex);
                            setBalance(balance + prize.amount);
                            setTopUpHistory([{ amount: prize.amount, timestamp: new Date(), method: 'promo', promoCode: 'BONUS_WHEEL' }, ...topUpHistory]);
                            setLastBonusSpin(new Date());
                            
                            if (prize.amount >= 250) {
                              playWinSound('legendary');
                              triggerConfetti('legendary');
                            } else if (prize.amount >= 100) {
                              playWinSound('epic');
                              triggerConfetti('epic');
                            } else {
                              playWinSound('rare');
                            }
                            
                            toast.success(`Выиграно: ${prize.amount}₽!`);
                            
                            setTimeout(() => {
                              setBonusWheelSpinning(false);
                              setBonusWheelResult(null);
                            }, 3000);
                          }, 5000);
                        }}
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold text-lg py-6"
                      >
                        <Icon name="Play" size={24} className="mr-2" />
                        Крутить колесо (Бесплатно)
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4 animate-spin-slow">🎰</div>
                    <p className="text-lg font-semibold">
                      {bonusWheelResult === null ? 'Крутим колесо...' : `Поздравляем! +${bonusWheelPrizes[bonusWheelResult].amount}₽`}
                    </p>
                  </div>
                )}
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Info" size={18} />
                    Призы:
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {bonusWheelPrizes.map((prize, idx) => (
                      <div key={idx} className={`${prize.color} text-white rounded px-2 py-1 text-center font-semibold`}>
                        {prize.label}
                      </div>
                    ))}
                  </div>
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