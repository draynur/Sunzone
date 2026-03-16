import { useEffect, useState } from 'react';
import { LayoutGrid, Monitor, ListFilter, MonitorOff, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

const CHANNELS = [
  'cstro34',
  'bradyschroeder7',
  'bigdinoboi76',
  'tpeek5',
  'itzeimer22',
  'loveland4president',
  'draynur',
  'supertf'
];

type ChannelStatus = {
  isLive: boolean;
  avatarUrl: string;
  loading: boolean;
};

const StreamIframe = ({ channel, hostname }: { channel: string, hostname: string }) => {
  const parents = [
    hostname,
    'aistudio.google.com',
    'build.aistudio.google.com',
    'ai.studio',
    'build.ai.studio',
    'localhost'
  ];
  const parentQuery = parents.map(p => `parent=${p}`).join('&');

  return (
    <iframe
      src={`https://player.twitch.tv/?channel=${channel}&${parentQuery}&muted=true`}
      className="w-full h-full absolute inset-0 border-0"
      allowFullScreen
    ></iframe>
  );
};

const ChannelCard = ({ channel, hostname, status }: { channel: string, hostname: string, status?: ChannelStatus }) => {
  if (!status || status.loading) {
    return (
      <div className="w-full h-full absolute inset-0 bg-neutral-900 flex items-center justify-center border-0">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin"></div>
      </div>
    );
  }

  if (!status.isLive) {
    return (
      <div className="w-full h-full absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-3 border-0">
        <div className="relative">
          {status.avatarUrl && !status.avatarUrl.includes('error') ? (
            <img 
              src={status.avatarUrl} 
              alt={channel} 
              className="w-16 h-16 rounded-full border-2 border-white/10 grayscale opacity-50 object-cover" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-neutral-800 flex items-center justify-center">
              <span className="text-white/30 text-xl font-bold">{channel[0].toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10 shadow-lg">
            Away
          </div>
        </div>
        <div className="text-white/40 font-medium text-sm tracking-wide">
          {channel}
        </div>
      </div>
    );
  }

  return <StreamIframe channel={channel} hostname={hostname} />;
};

export default function App() {
  const [hostname, setHostname] = useState('');
  const [mode, setMode] = useState<'grid' | 'featured'>('grid');
  const [featured, setFeatured] = useState(CHANNELS[0]);
  const [statuses, setStatuses] = useState<Record<string, ChannelStatus>>({});
  
  const [visibleChannels, setVisibleChannels] = useState<string[]>(CHANNELS);
  const [showChecklist, setShowChecklist] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const toggleChannel = (channel: string) => {
    setVisibleChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  useEffect(() => {
    setHostname(window.location.hostname);
    
    const fetchStatuses = async (isInitial = false) => {
      if (isInitial) {
        setStatuses(prev => {
          const next = { ...prev };
          CHANNELS.forEach(c => {
            if (!next[c]) {
              next[c] = { isLive: false, avatarUrl: '', loading: true };
            }
          });
          return next;
        });
      }

      const newStatuses: Record<string, ChannelStatus> = {};
      const liveChannels: string[] = [];

      await Promise.all(CHANNELS.map(async (channel) => {
        try {
          const [uptimeRes, avatarRes] = await Promise.all([
            fetch(`https://decapi.me/twitch/uptime/${channel}`),
            fetch(`https://decapi.me/twitch/avatar/${channel}`)
          ]);
          
          const uptimeText = await uptimeRes.text();
          const avatarUrl = await avatarRes.text();
          
          const isLive = !uptimeText.toLowerCase().includes('offline') && 
                         !uptimeText.toLowerCase().includes('error') && 
                         !uptimeText.toLowerCase().includes('not found');
          
          newStatuses[channel] = { isLive, avatarUrl, loading: false };
          if (isLive) liveChannels.push(channel);
        } catch (err) {
          console.error(`Failed to fetch status for ${channel}`, err);
          newStatuses[channel] = { isLive: false, avatarUrl: '', loading: false };
        }
      }));

      setStatuses(prev => ({ ...prev, ...newStatuses }));

      if (isInitial) {
        if (liveChannels.length > 0) {
          setFeatured(liveChannels[0]);
        }
        setInitialLoadDone(true);
      }
    };

    fetchStatuses(true);
    const interval = setInterval(() => fetchStatuses(false), 120000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, []);

  if (!hostname || !initialLoadDone) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white/50 animate-pulse font-mono">Loading streams...</div>
      </div>
    );
  }

  const displayedChannels = CHANNELS.filter(c => visibleChannels.includes(c));
  const anyLive = CHANNELS.some(c => statuses[c]?.isLive);
  const activeFeatured = displayedChannels.includes(featured) ? featured : displayedChannels[0];

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2 || count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    if (count === 5 || count === 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="w-screen h-screen bg-neutral-950 overflow-hidden relative font-sans text-white">
      {/* Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
        
        {/* Checklist Popover */}
        {showChecklist && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[240px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider">Visible Channels</h3>
              <button 
                onClick={() => setVisibleChannels(CHANNELS)}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Show All
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2">
              {CHANNELS.map(channel => (
                <label key={channel} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={visibleChannels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleChannels.includes(channel) ? 'bg-white border-white' : 'border-white/30 group-hover:border-white/60'}`}>
                      {visibleChannels.includes(channel) && <div className="w-2 h-2 bg-black rounded-sm" />}
                    </div>
                    <span className={`text-sm transition-colors ${visibleChannels.includes(channel) ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                      {channel}
                    </span>
                  </div>
                  {statuses[channel] && !statuses[channel].loading && (
                    <div className={`w-2 h-2 rounded-full ${statuses[channel].isLive ? 'bg-red-500' : 'bg-white/20'}`} title={statuses[channel].isLive ? 'Live' : 'Away'} />
                  )}
                </label>
              ))}
            </div>
          </motion.div>
        )}

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex gap-1 shadow-2xl">
          <button 
            onClick={() => setMode('grid')} 
            className={`p-3 rounded-xl transition-all flex items-center gap-2 ${mode === 'grid' ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-sm font-medium hidden md:block">Grid</span>
          </button>
          <button 
            onClick={() => setMode('featured')} 
            className={`p-3 rounded-xl transition-all flex items-center gap-2 ${mode === 'featured' ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <Monitor className="w-5 h-5" />
            <span className="text-sm font-medium hidden md:block">Featured</span>
          </button>
          
          <div className="w-px bg-white/10 my-2 mx-1"></div>
          <button 
            onClick={() => setShowChecklist(!showChecklist)} 
            className={`p-3 rounded-xl transition-all flex items-center gap-2 ${showChecklist ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <ListFilter className="w-5 h-5" />
            <span className="text-sm font-medium hidden md:block">Channels</span>
          </button>
        </div>
      </div>

      {/* Layouts */}
      <div className={`w-full h-full p-2 gap-2 ${mode === 'grid' ? `grid ${getGridClass(displayedChannels.length)} auto-rows-fr` : 'flex flex-col lg:flex-row'}`}>
        {displayedChannels.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-white/50 h-full w-full">
            <MonitorOff className="w-12 h-12 mb-4 opacity-20" />
            <p>{anyLive ? 'No channels selected.' : 'No one is currently streaming.'}</p>
            <button onClick={() => setVisibleChannels(CHANNELS)} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
              Show All Channels
            </button>
          </div>
        ) : (
          <>
            {mode === 'featured' && activeFeatured && (
              <div className="flex-grow rounded-xl overflow-hidden bg-black relative shadow-2xl border border-white/10 group">
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20 flex justify-between items-center pointer-events-none">
                  <span className="font-semibold text-sm drop-shadow-md px-2">{activeFeatured}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChannel(activeFeatured);
                    }}
                    className="p-2 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white cursor-pointer pointer-events-auto"
                    title="Hide channel"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
                <ChannelCard channel={activeFeatured} hostname={hostname} status={statuses[activeFeatured]} />
              </div>
            )}
            
            <div className={`${mode === 'featured' ? 'flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-64 xl:w-80 shrink-0 pb-20 lg:pb-0' : 'contents'}`}>
              {displayedChannels.map(channel => {
                if (mode === 'featured' && channel === activeFeatured) return null;
                return (
                  <div
                    key={channel}
                    onClick={() => mode === 'featured' && setFeatured(channel)}
                    className={`
                      rounded-xl overflow-hidden bg-black shadow-lg border border-white/10 relative group
                      ${mode === 'featured' ? 'w-48 lg:w-full aspect-video shrink-0 cursor-pointer opacity-60 hover:opacity-100 transition-opacity ring-2 ring-transparent hover:ring-white/20' : 'w-full h-full min-h-[200px]'}
                    `}
                  >
                    <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20 flex justify-between items-center pointer-events-none">
                      <span className="font-semibold text-xs drop-shadow-md px-2">{channel}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChannel(channel);
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white cursor-pointer pointer-events-auto"
                        title="Hide channel"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {mode === 'featured' && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Monitor className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                    <ChannelCard channel={channel} hostname={hostname} status={statuses[channel]} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
