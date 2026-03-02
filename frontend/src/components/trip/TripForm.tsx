import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, Users, Hotel, Sparkles } from 'lucide-react';
import InterestPicker from './InterestPicker';
import type { TripCreate } from '../../types/trip';

interface Props {
  onSubmit: (trip: TripCreate) => void;
  isLoading?: boolean;
}

function FormField({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium mb-1"
        style={{ color: 'var(--color-text-secondary)' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow duration-200 border";

export default function TripForm({ onSubmit, isLoading }: Props) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(1000);
  const [travelers, setTravelers] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      destination,
      start_date: startDate,
      end_date: endDate,
      budget_usd: budget,
      travelers,
      interests,
      accommodation_area: accommodation,
    });
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface-secondary)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField icon={MapPin} label="Destination">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Paris, France"
          required
          className={inputClass}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-glow)'}
          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField icon={Calendar} label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
        <FormField icon={Calendar} label="End Date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField icon={DollarSign} label="Budget (USD)">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            min={100}
            step={100}
            required
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
        <FormField icon={Users} label="Travelers">
          <input
            type="number"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            min={1}
            max={20}
            required
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField icon={Hotel} label="Accommodation Area (optional)">
        <input
          type="text"
          value={accommodation}
          onChange={(e) => setAccommodation(e.target.value)}
          placeholder="e.g. Le Marais, Downtown"
          className={inputClass}
          style={inputStyle}
        />
      </FormField>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
          Interests
        </label>
        <InterestPicker selected={interests} onChange={setInterests} />
      </div>

      <motion.button
        type="submit"
        disabled={isLoading || !destination || !startDate || !endDate}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full gradient-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md"
      >
        {isLoading ? 'Creating...' : 'Create Trip & Generate Itinerary'}
      </motion.button>
    </form>
  );
}
