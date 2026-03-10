import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Calendar, DollarSign, Users, Hotel, Sparkles, Plane } from 'lucide-react';
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
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(1000);
  const [currency, setCurrency] = useState('USD');
  const [travelers, setTravelers] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState('');

  // Today's date as YYYY-MM-DD for min date validation
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate < today) return;
    if (endDate <= startDate) return;
    onSubmit({
      origin,
      destination,
      start_date: startDate,
      end_date: endDate,
      budget_usd: budget,
      currency,
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
      {/* From → To fields */}
      <div>
        <FormField icon={MapPin} label="From (Departure)">
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="New York, USA"
            required
            className={inputClass}
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-glow)'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
          />
        </FormField>

        <div className="flex justify-center my-1.5">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <div className="w-8 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <Plane className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <div className="w-8 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        </div>

        <FormField icon={Navigation} label="To (Destination)">
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField icon={Calendar} label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate && e.target.value >= endDate) setEndDate('');
            }}
            min={today}
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
            min={startDate || today}
            required
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <FormField icon={DollarSign} label="Budget">
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-2 py-2 rounded-lg text-sm outline-none border shrink-0 w-20"
              style={inputStyle}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="INR">INR</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="THB">THB</option>
              <option value="MXN">MXN</option>
              <option value="BRL">BRL</option>
              <option value="CNY">CNY</option>
              <option value="KRW">KRW</option>
              <option value="TRY">TRY</option>
              <option value="SGD">SGD</option>
              <option value="CHF">CHF</option>
              <option value="NZD">NZD</option>
            </select>
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
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        disabled={isLoading || !origin || !destination || !startDate || !endDate || endDate <= startDate}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full gradient-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md"
      >
        {isLoading ? 'Creating...' : 'Create Trip & Generate Itinerary'}
      </motion.button>
    </form>
  );
}
