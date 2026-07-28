import React from 'react';
import { Star } from 'lucide-react';

export function LineupGlass() {
  return (
    <div className="font-['Inter'] text-white" style={{ width: '1280px', height: '860px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0a0a1e 0%, #1a0a3e 30%, #0d1b4e 60%, #0a1628 100%)' }}>
      {/* Background blobs for layered depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-[#E11D48] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-[#4338CA] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[20%] w-[800px] h-[800px] bg-[#1D4ED8] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.15] pointer-events-none" />

      <div className="relative w-full h-full flex flex-col z-10">
        
        {/* Score Banner (~110px tall) */}
        <div className="w-full h-[110px] relative shrink-0">
          <div className="absolute inset-0">
            {/* Right side dark grey */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#6b7280] to-black" />
            {/* Left side club red with diagonal split */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#CC4125] to-black" style={{ clipPath: 'polygon(0 0, 52% 0, 48% 100%, 0 100%)' }} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {/* Floating Score Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col items-center">
              <div className="flex items-center gap-8">
                {/* Home */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#CC4125] flex items-center justify-center font-bold text-white shadow-inner tracking-wider">ENG</div>
                  <div className="flex flex-col items-start justify-center">
                    <span className="text-xl font-bold tracking-wide leading-tight">England</span>
                    <span className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-semibold mt-0.5">Home</span>
                  </div>
                </div>
                
                {/* Score */}
                <div className="flex flex-col items-center justify-center w-24">
                  <div className="text-4xl font-black tabular-nums tracking-widest flex items-center">
                    0 <span className="text-white/30 font-normal mx-2 text-2xl">-</span> 1
                  </div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.25em] mt-1">FT</div>
                </div>

                {/* Away */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-xl font-bold tracking-wide leading-tight">Spain</span>
                    <span className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-semibold mt-0.5">Away</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center font-bold text-white shadow-inner tracking-wider">S</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar (~48px tall) */}
        <div className="w-full h-[48px] shrink-0 bg-white/5 backdrop-blur-lg border-b border-white/10 flex items-center justify-center gap-1.5 shadow-sm relative z-20">
          {['Fixture Details', 'Match Report', 'Line-Ups', 'Videos', 'Upload Data', 'Statistics', 'Spider Charts', 'AI Analysis'].map((tab) => (
            <button key={tab} className={`px-4 py-1.5 text-[13px] transition-all duration-200 ${
              tab === 'Line-Ups' 
                ? 'bg-white/15 backdrop-blur-md border border-white/25 rounded-lg text-white font-semibold shadow-[0_0_15px_rgba(255,255,255,0.12)]' 
                : 'text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg'
            }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Lineup Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Substitutes panel */}
          <div className="w-[210px] h-full bg-white/8 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 p-4 relative z-10">
            <h2 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-5 pl-2">Substitutes</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <SubGroup title="Goalkeeper">
                <SubRow num="13" name="Hannah Hampton" />
              </SubGroup>
              <SubGroup title="Defender">
                <SubRow num="12" name="Niamh Charles" />
                <SubRow num="14" name="Esme Morgan" />
                <SubRow num="15" name="Maya Le Tissier" />
              </SubGroup>
              <SubGroup title="Midfielder">
                <SubRow num="17" name="Jess Park" />
                <SubRow num="19" name="Grace Clinton" />
              </SubGroup>
              <SubGroup title="Forward">
                <SubRow num="20" name="Chloe Kelly" />
                <SubRow num="22" name="Beth Mead" star />
              </SubGroup>
            </div>

            <button className="mt-4 w-full py-2.5 bg-white/15 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-[13px] transition-colors shadow-lg">
              Save Lineup
            </button>
          </div>

          {/* RIGHT: Pitch Area */}
          <div className="flex-1 flex items-center justify-center p-8 relative">
            
            {/* Glass wrapper */}
            <div className="w-full max-h-[660px] aspect-[1/1.44] bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.4)] relative">
              
              {/* Pitch Surface */}
              <div className="relative w-full h-full">
                <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xl" viewBox="0 0 700 980" preserveAspectRatio="none">
                  {/* Grass surface */}
                  <rect width="700" height="980" fill="#1E293B" rx="10" />
                  
                  {/* Pitch Lines */}
                  <g stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none">
                    {/* Outer border */}
                    <rect x="35" y="35" width="630" height="910" />
                    {/* Halfway line */}
                    <line x1="35" y1="490" x2="665" y2="490" />
                    {/* Center circle */}
                    <circle cx="350" cy="490" r="70" />
                    {/* Center spot */}
                    <circle cx="350" cy="490" r="3" fill="rgba(255,255,255,0.65)" />
                    
                    {/* Top penalty area */}
                    <rect x="157.5" y="35" width="385" height="115.5" />
                    {/* Top goal area */}
                    <rect x="262.5" y="35" width="175" height="38.5" />
                    {/* Top penalty arc */}
                    <path d="M 291.5 150.5 A 70 70 0 0 0 408.5 150.5" />
                    {/* Top penalty spot */}
                    <circle cx="350" cy="112" r="3" fill="rgba(255,255,255,0.65)" />

                    {/* Bottom penalty area */}
                    <rect x="157.5" y="829.5" width="385" height="115.5" />
                    {/* Bottom goal area */}
                    <rect x="262.5" y="906.5" width="175" height="38.5" />
                    {/* Bottom penalty arc */}
                    <path d="M 291.5 829.5 A 70 70 0 0 1 408.5 829.5" />
                    {/* Bottom penalty spot */}
                    <circle cx="350" cy="868" r="3" fill="rgba(255,255,255,0.65)" />

                    {/* Corner arcs */}
                    <path d="M 35 56 A 21 21 0 0 0 56 35" />
                    <path d="M 665 56 A 21 21 0 0 1 644 35" />
                    <path d="M 35 924 A 21 21 0 0 1 56 945" />
                    <path d="M 665 924 A 21 21 0 0 0 644 945" />
                  </g>
                </svg>

                {/* Formation Pill */}
                <div className="absolute top-[13%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-md border border-white/25 rounded-lg px-3.5 py-1 text-white text-sm font-bold font-mono shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-20">
                  4-3-3
                </div>

                {/* Player Tokens Container */}
                <div className="absolute inset-0">
                  {/* GK */}
                  <PlayerToken x={50} y={85} num="1" name="Torres" star />
                  
                  {/* DEF (4) */}
                  <PlayerToken x={20} y={65} num="2" name="Walsh" />
                  <PlayerToken x={40} y={65} num="5" name="Bright" />
                  <PlayerToken x={60} y={65} num="6" name="Carter" />
                  <PlayerToken x={80} y={65} num="3" name="Hemp" star />

                  {/* MID (3) */}
                  <PlayerToken x={25} y={43} num="8" name="Scott" />
                  <PlayerToken x={50} y={43} num="6" name="Kirby" />
                  <PlayerToken x={75} y={43} num="10" name="Stanway" star />

                  {/* FWD (3) */}
                  <PlayerToken x={25} y={22} num="11" name="Russo" star />
                  <PlayerToken x={50} y={22} num="9" name="England" />
                  <PlayerToken x={75} y={22} num="7" name="Toone" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}} />
    </div>
  );
}

function SubGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1.5 px-2">{title}</h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function SubRow({ num, name, star }: { num: string, name: string, star?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 hover:bg-white/8 rounded-lg cursor-pointer transition-colors group">
      <span className="text-white/40 font-mono text-xs w-5 text-right tabular-nums shrink-0">{num}</span>
      <span className="text-white/80 text-[13px] font-medium group-hover:text-white transition-colors truncate">{name}</span>
      {star && <Star className="ml-auto w-3 h-3 text-amber-400 fill-amber-400 shrink-0 filter drop-shadow-sm" />}
    </div>
  );
}

function PlayerToken({ x, y, num, name, star }: { x: number, y: number, num: string, name: string, star?: boolean }) {
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer group hover:z-30" 
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border-2 border-white/40 shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center relative transition-transform duration-200 group-hover:scale-110 group-hover:bg-white/25 group-hover:border-white/60">
        <span className={`text-white font-bold leading-none ${star ? 'text-[13px] mt-0.5' : 'text-sm'}`}>
          {num}
        </span>
        {star && (
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 mt-[1px] filter drop-shadow-md" />
        )}
      </div>
      <div className="mt-1.5 text-white text-[11px] font-semibold tracking-wide bg-black/40 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md shadow-lg transition-colors group-hover:bg-black/60 whitespace-nowrap">
        {name}
      </div>
    </div>
  );
}
