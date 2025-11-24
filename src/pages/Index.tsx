import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface CaseItem {
  id: number;
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
}

interface InventoryItem extends CaseItem {
  unboxedAt: Date;
}

const cases: CaseItem[] = [
  { id: 1, name: 'Starter Case', price: 100, rarity: 'common', image: '🎁' },
  { id: 2, name: 'Gold Case', price: 500, rarity: 'rare', image: '💰' },
  { id: 3, name: 'Diamond Case', price: 1000, rarity: 'epic', image: '💎' },
  { id: 4, name: 'Legendary Case', price: 2500, rarity: 'legendary', image: '👑' },
];

const possibleItems: CaseItem[] = [
  { id: 101, name: 'AK-47 | Redline', price: 50, rarity: 'common', image: '🔫' },
  { id: 102, name: 'AWP | Dragon Lore', price: 200, rarity: 'rare', image: '🎯' },
  { id: 103, name: 'Knife | Karambit Fade', price: 800, rarity: 'epic', image: '🔪' },
  { id: 104, name: 'Golden Desert Eagle', price: 2000, rarity: 'legendary', image: '⭐' },
  { id: 105, name: 'M4A4 | Howl', price: 150, rarity: 'rare', image: '🐺' },
  { id: 106, name: 'Glock-18 | Fade', price: 75, rarity: 'common', image: '🎨' },
];

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
};

const rarityBorders = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

const Index = () => {
  const [balance, setBalance] = useState(1000);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [wonItem, setWonItem] = useState<CaseItem | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [leaderboard] = useState([
    { name: 'Player1', bestDrop: 'Golden Desert Eagle', value: 2000 },
    { name: 'Player2', bestDrop: 'Knife | Karambit Fade', value: 800 },
    { name: 'Player3', bestDrop: 'AWP | Dragon Lore', value: 200 },
    { name: 'Player4', bestDrop: 'M4A4 | Howl', value: 150 },
    { name: 'Player5', bestDrop: 'Glock-18 | Fade', value: 75 },
  ]);

  const openCase = (caseItem: CaseItem) => {
    if (balance < caseItem.price) {
      toast.error('Недостаточно средств!');
      return;
    }

    setSelectedCase(caseItem);
    setIsOpening(true);
    setBalance(balance - caseItem.price);

    setTimeout(() => {
      const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      setWonItem(randomItem);
      setInventory([...inventory, { ...randomItem, unboxedAt: new Date() }]);
      setIsOpening(false);
      toast.success(`Выпало: ${randomItem.name}!`);
    }, 3000);
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'standoff') {
      setBalance(balance + 500);
      toast.success('Промокод активирован! +500 к балансу');
      setPromoCode('');
    } else {
      toast.error('Неверный промокод');
    }
  };

  const closeDialog = () => {
    setSelectedCase(null);
    setWonItem(null);
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
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Icon name="Package" size={18} />
              Кейсы
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Icon name="Backpack" size={18} />
              Инвентарь
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Icon name="Gift" size={18} />
              Промокоды
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
                  <Card key={index} className={`border-2 ${rarityBorders[item.rarity]}`}>
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

          <TabsContent value="promo" className="space-y-6">
            <div className="max-w-xl mx-auto">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {isOpening ? 'Открываем кейс...' : wonItem ? 'Поздравляем!' : ''}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isOpening && selectedCase && (
                <div className="py-8">
                  <div className="text-8xl animate-spin-slow mb-4">{selectedCase.image}</div>
                  <p className="text-lg">Открываем {selectedCase.name}</p>
                </div>
              )}
              {wonItem && !isOpening && (
                <div className="py-8 space-y-4">
                  <div className={`text-8xl animate-float mb-4`}>{wonItem.image}</div>
                  <h3 className="text-2xl font-bold">{wonItem.name}</h3>
                  <Badge className={`${rarityColors[wonItem.rarity]} text-lg py-1 px-4`}>
                    {wonItem.rarity.toUpperCase()}
                  </Badge>
                  <div className="text-accent text-3xl font-bold">+{wonItem.price} ₽</div>
                  <Button onClick={closeDialog} className="w-full mt-4">
                    Забрать
                  </Button>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
