import { motion } from 'framer-motion';
import {
  Landmark, UtensilsCrossed, TreePine, Palette, Moon, ShoppingBag,
  Mountain, Theater, Building2, Camera, Music, Dumbbell, Coffee,
} from 'lucide-react';
import { INTEREST_OPTIONS } from '../../utils/constants';

const ICON_MAP: Record<string, typeof Landmark> = {
  History: Landmark, Food: UtensilsCrossed, Nature: TreePine, Art: Palette,
  Nightlife: Moon, Shopping: ShoppingBag, Adventure: Mountain, Culture: Theater,
  Architecture: Building2, Photography: Camera, Music: Music, Sports: Dumbbell,
  Relaxation: Coffee,
};

interface Props {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export default function InterestPicker({ selected, onChange }: Props) {
  const toggle = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else {
      onChange([...selected, interest]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {INTEREST_OPTIONS.map((interest) => {
        const Icon = ICON_MAP[interest] || Landmark;
        const isSelected = selected.includes(interest);

        return (
          <motion.button
            key={interest}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(interest)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'gradient-primary text-white shadow-sm'
                : ''
            }`}
            style={!isSelected ? {
              backgroundColor: 'var(--color-surface-tertiary)',
              color: 'var(--color-text-secondary)',
            } : undefined}
          >
            <Icon className="w-3.5 h-3.5" />
            {interest}
          </motion.button>
        );
      })}
    </div>
  );
}
