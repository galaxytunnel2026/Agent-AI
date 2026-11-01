import { useState, useEffect } from 'react';
import { Clock, Globe, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.ts';

interface DateTimeWidgetProps {
  lang: 'en' | 'my';
}

export function DateTimeWidget({ lang }: DateTimeWidgetProps) {
  const [yangonTime, setYangonTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [activeTz, setActiveTz] = useState<string>('Asia/Yangon');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const fetchTimes = async () => {
    try {
      const data = await api.getDateTime(activeTz);
      setYangonTime(data.formattedTime);
      setUtcTime(data.utcString);
    } catch {
      const now = new Date();
      setYangonTime(now.toLocaleString());
      setUtcTime(now.toUTCString());
    }
  };

  useEffect(() => {
    fetchTimes();
    const interval = setInterval(fetchTimes, 10000);
    return () => clearInterval(interval);
  }, [activeTz]);

  const timezones = [
    { label: 'Myanmar (UTC+6:30)', id: 'Asia/Yangon' },
    { label: 'UTC Universal', id: 'UTC' },
    { label: 'Tokyo (UTC+9)', id: 'Asia/Tokyo' },
    { label: 'New York (UTC-5/EDT)', id: 'America/New_York' },
    { label: 'London (UTC+0/BST)', id: 'Europe/London' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors min-h-[36px]"
        title="Real Date & Time Engine"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-mono text-[11px] sm:text-xs hidden xs:inline">{yangonTime ? yangonTime.split(',')[1]?.trim() || yangonTime : 'Time'}</span>
        <span className="text-slate-500 text-[10px] font-mono">MMT</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-3 top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:inset-x-auto p-3.5 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 text-xs max-w-sm mx-auto sm:max-w-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'my' ? 'အချိန်နှင့် နေ့စွဲအချက်အလက်' : 'Real-Time Date Engine'}</span>
            </div>
            <button
              onClick={fetchTimes}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh time"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                {lang === 'my' ? 'ရွေးချယ်ထားသော ဒေသစံတော်ချိန်' : 'Selected Timezone'}
              </div>
              <div className="text-slate-200 font-mono font-medium mt-0.5">{yangonTime || 'Loading...'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">UTC Clock</div>
              <div className="text-slate-400 font-mono text-[11px] mt-0.5">{utcTime || 'Loading...'}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 mb-1.5">{lang === 'my' ? 'စံတော်ချိန် ပြောင်းရန်:' : 'Switch Timezone:'}</div>
            <div className="grid grid-cols-1 gap-1">
              {timezones.map((tz) => (
                <button
                  key={tz.id}
                  onClick={() => setActiveTz(tz.id)}
                  className={`px-2 py-1 text-left rounded text-[11px] transition-colors ${
                    activeTz === tz.id ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
