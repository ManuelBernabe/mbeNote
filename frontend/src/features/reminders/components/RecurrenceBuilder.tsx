import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../../lib/utils';

type Frequency = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface RecurrenceBuilderProps {
  value?: string;
  onChange: (rrule: string) => void;
}

const presets: { key: Frequency; label: string }[] = [
  { key: 'none', label: 'Una vez' },
  { key: 'daily', label: 'Diario' },
  { key: 'weekdays', label: 'L-V' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'yearly', label: 'Anual' },
  { key: 'custom', label: 'Personalizado' },
];

const dayLabels = [
  { key: 'MO', label: 'L' },
  { key: 'TU', label: 'M' },
  { key: 'WE', label: 'X' },
  { key: 'TH', label: 'J' },
  { key: 'FR', label: 'V' },
  { key: 'SA', label: 'S' },
  { key: 'SU', label: 'D' },
];

const frequencyOptions = [
  { value: 'DAILY', label: 'Día(s)' },
  { value: 'WEEKLY', label: 'Semana(s)' },
  { value: 'MONTHLY', label: 'Mes(es)' },
  { value: 'YEARLY', label: 'Año(s)' },
];

type EndType = 'never' | 'count' | 'until';

export function RecurrenceBuilder({ value, onChange }: RecurrenceBuilderProps) {
  const [selected, setSelected] = useState<Frequency>('none');
  const [customFreq, setCustomFreq] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [endType, setEndType] = useState<EndType>('never');
  const [endCount, setEndCount] = useState(10);
  const [endDate, setEndDate] = useState('');

  const buildRRule = useCallback(() => {
    if (selected === 'none') return '';

    let rule = '';
    switch (selected) {
      case 'daily':
        rule = 'FREQ=DAILY;INTERVAL=1';
        break;
      case 'weekdays':
        rule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
        break;
      case 'weekly':
        rule = 'FREQ=WEEKLY;INTERVAL=1';
        break;
      case 'monthly':
        rule = 'FREQ=MONTHLY;INTERVAL=1';
        break;
      case 'yearly':
        rule = 'FREQ=YEARLY;INTERVAL=1';
        break;
      case 'custom': {
        rule = `FREQ=${customFreq};INTERVAL=${interval}`;
        if (customFreq === 'WEEKLY' && selectedDays.length > 0) {
          rule += `;BYDAY=${selectedDays.join(',')}`;
        }
        break;
      }
    }

    if (selected === 'custom') {
      if (endType === 'count') {
        rule += `;COUNT=${endCount}`;
      } else if (endType === 'until' && endDate) {
        rule += `;UNTIL=${endDate.replace(/-/g, '')}T235959Z`;
      }
    }

    return `RRULE:${rule}`;
  }, [selected, customFreq, interval, selectedDays, endType, endCount, endDate]);

  useEffect(() => {
    onChange(buildRRule());
  }, [buildRRule, onChange]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getSummary = (): string => {
    switch (selected) {
      case 'none':
        return 'No se repite';
      case 'daily':
        return 'Todos los días';
      case 'weekdays':
        return 'De lunes a viernes';
      case 'weekly':
        return 'Cada semana';
      case 'monthly':
        return 'Cada mes';
      case 'yearly':
        return 'Cada año';
      case 'custom': {
        const freq = frequencyOptions.find((f) => f.value === customFreq);
        let s = `Cada ${interval > 1 ? interval + ' ' : ''}${freq?.label.toLowerCase() ?? ''}`;
        if (customFreq === 'WEEKLY' && selectedDays.length > 0) {
          const labels = selectedDays.map(
            (d) => dayLabels.find((l) => l.key === d)?.label
          );
          s += ` (${labels.join(', ')})`;
        }
        if (endType === 'count') s += `, ${endCount} veces`;
        if (endType === 'until' && endDate) s += `, hasta ${endDate}`;
        return s;
      }
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Repetición
      </label>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setSelected(preset.key)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              selected === preset.key
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom options */}
      {selected === 'custom' && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          {/* Frequency + interval */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Cada
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={customFreq}
              onChange={(e) => setCustomFreq(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {frequencyOptions.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day-of-week chips */}
          {customFreq === 'WEEKLY' && (
            <div className="flex gap-1.5">
              {dayLabels.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all',
                    selectedDays.includes(day.key)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600'
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          {/* End condition */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Finaliza
            </span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="h-4 w-4 text-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Nunca
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                  className="h-4 w-4 text-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Después de
                </span>
                <input
                  type="number"
                  min={1}
                  value={endCount}
                  onChange={(e) =>
                    setEndCount(Math.max(1, Number(e.target.value)))
                  }
                  disabled={endType !== 'count'}
                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-center text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  veces
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'until'}
                  onChange={() => setEndType('until')}
                  className="h-4 w-4 text-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  En fecha
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'until'}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {getSummary()}
      </p>
    </div>
  );
}
