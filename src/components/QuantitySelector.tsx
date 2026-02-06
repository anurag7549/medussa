import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}: QuantitySelectorProps) {
  const isSmall = size === 'sm';
  
  return (
    <div className={`inline-flex items-center rounded-md border border-border ${isSmall ? 'h-8' : 'h-10'}`}>
      <button
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`flex items-center justify-center border-r border-border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall ? 'h-8 w-8' : 'h-10 w-10'
        }`}
        aria-label="Decrease quantity"
      >
        <Minus className={isSmall ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      
      <span className={`flex items-center justify-center font-medium ${isSmall ? 'w-10 text-sm' : 'w-12'}`}>
        {quantity}
      </span>
      
      <button
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`flex items-center justify-center border-l border-border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall ? 'h-8 w-8' : 'h-10 w-10'
        }`}
        aria-label="Increase quantity"
      >
        <Plus className={isSmall ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
    </div>
  );
}
