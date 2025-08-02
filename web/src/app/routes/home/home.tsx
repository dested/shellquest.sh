import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Terminal, Swords, Trophy, Sparkles, Zap, Shield, Clock, Users, ChevronRight, Gamepad2, Code2, Heart } from 'lucide-react';

const Index: React.FC = () => {
  const [glitchText, setGlitchText] = useState('shellquest.sh');
  const [terminalText, setTerminalText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Terminal typing effect
  useEffect(() => {
    const fullCommand = '$ bunx shellquest';
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= fullCommand.length) {
        setTerminalText(fullCommand.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, []);

  // Cursor blink
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Glitch effect
  useEffect(() => {
    const glitchChars = '█▓▒░╔╗║═╚╝';
    const originalText = 'shellquest.sh';
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        let glitched = '';
        for (let i = 0; i < originalText.length; i++) {
          if (Math.random() > 0.7) {
            glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else {
            glitched += originalText[i];
          }
        }
        setGlitchText(glitched);
        setTimeout(() => setGlitchText(originalText), 100);
      }
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  const features = [
    {
      icon: <Swords className="w-5 h-5" />,
      title: "Real-time Combat",
      description: "ASCII-powered battles at 30 FPS"
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: "Competitive Ladders",
      description: "Hourly, daily, weekly rankings"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Procedural Dungeons",
      description: "Infinite unique levels to explore"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Anti-Cheat",
      description: "Server-verified gameplay"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Quick Sessions",
      description: "30s, 60s, or 120s dungeons"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Social Features",
      description: "Share replays & compete"
    }
  ];

  const dungeonSample = [
    "╔═══════════════════════════════════╗",
    "║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║",
    "║ ▓.....#########.....###########▓ ║",
    "║ ▓.@...#.......#.....#.........#▓ ║",
    "║ ▓.....#...∞...#.....#....⚔....#▓ ║",
    "║ ▓##############+#####+##########▓ ║",
    "║ ▓#.....#.............#.........#▓ ║",
    "║ ▓#.🗝..#.....ξ.......#....💀....#▓ ║",
    "║ ▓#.....#.............#.........#▓ ║",
    "║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║",
    "╚═══════════════════════════════════╝",
    "  HP: ██████░░░░  MP: ████████░░  ",
    "  Keys: 1/3  Time: 00:42  Floor: 3  "
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent animate-pulse" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
          animation: 'scanline 8s linear infinite'
        }} />
      </div>

      {/* Matrix rain effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500 text-xs animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animation: `fall ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          >
            {String.fromCharCode(0x30A0 + Math.random() * 96)}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* ASCII Logo */}
          <div className="mb-8">
            <pre className="text-green-400 text-xs sm:text-sm md:text-base lg:text-lg inline-block mx-auto leading-none select-none">
{`    ╔═══════════════════════════════════════╗
    ║  ███████╗██╗  ██╗███████╗██╗     ██╗  ║
    ║  ██╔════╝██║  ██║██╔════╝██║     ██║  ║
    ║  ███████╗███████║█████╗  ██║     ██║  ║
    ║  ╚════██║██╔══██║██╔══╝  ██║     ██║  ║
    ║  ███████║██║  ██║███████╗███████╗███████╗
    ║  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
    ║    QUEST.SH - DUNGEON CRAWLER v1.0   ║
    ╚═══════════════════════════════════════╝`}
            </pre>
          </div>

          {/* Glitchy title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider relative">
            <span className="relative">
              <span className="absolute inset-0 text-red-500 opacity-50 animate-pulse" style={{ transform: 'translate(2px, -1px)' }}>
                {glitchText}
              </span>
              <span className="absolute inset-0 text-blue-500 opacity-50 animate-pulse" style={{ transform: 'translate(-2px, 1px)' }}>
                {glitchText}
              </span>
              <span className="relative text-green-400">
                {glitchText}
              </span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-green-300 opacity-90 max-w-2xl mx-auto">
            The terminal dungeon crawler for engineers. Play while your code compiles.
          </p>

          {/* Install command */}
          <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6 max-w-xl mx-auto shadow-2xl shadow-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">TERMINAL</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="mt-4 font-mono text-lg sm:text-xl">
              <span className="text-green-400">{terminalText}</span>
              <span className={`inline-block w-3 h-5 bg-green-400 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-6 text-lg group transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/50"
            >
              <Gamepad2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Play Now
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-500 text-green-900 hover:bg-green-500/10 px-8 py-6 text-lg group"
            >
              <Code2 className="mr-2 h-5 w-5" />
              View on GitHub
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Badge variant="outline" className="border-green-500 text-green-400 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              30 FPS
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-400 px-4 py-2">
              <Terminal className="w-4 h-4 mr-2" />
              120x80 Terminal
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-400 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Anti-Cheat
            </Badge>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="text-green-400 opacity-50">
            <div className="text-2xl">▼</div>
          </div>
        </div>
      </section>

      {/* Game Preview Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-green-400">
            <span className="inline-block border-b-2 border-green-500 pb-2">
              ENTER THE DUNGEON
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-4 shadow-2xl shadow-green-500/20">
              <pre className="text-green-400 text-xs sm:text-sm overflow-x-auto">
                {dungeonSample.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </pre>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-green-400">Game Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 mt-1">▶</span>
                  <div>
                    <strong className="text-green-400">Procedural Generation:</strong>
                    <span className="text-green-300 opacity-80"> Every dungeon is unique and verified beatable</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 mt-1">▶</span>
                  <div>
                    <strong className="text-green-400">Two Classes:</strong>
                    <span className="text-green-300 opacity-80"> Wizard (magic & swords) or Fighter (axes & swords)</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 mt-1">▶</span>
                  <div>
                    <strong className="text-green-400">Quick Sessions:</strong>
                    <span className="text-green-300 opacity-80"> 30s, 60s, or 120s dungeons perfect for breaks</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 mt-1">▶</span>
                  <div>
                    <strong className="text-green-400">Competitive Ladder:</strong>
                    <span className="text-green-300 opacity-80"> Climb hourly, daily, weekly, and monthly leaderboards</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-950/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-green-400">
            <span className="inline-block border-b-2 border-green-500 pb-2">
              CORE SYSTEMS
            </span>
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="bg-gray-900/50 border-green-500/30 p-6 hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 group hover:scale-105"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-green-400 group-hover:text-green-300 transition-colors">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-green-400 mb-2">{feature.title}</h3>
                    <p className="text-green-300 opacity-80 text-sm">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-green-400">
            <span className="inline-block border-b-2 border-green-500 pb-2">
              HOW TO PLAY
            </span>
          </h2>
          
          <div className="space-y-8">
            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">1. Install & Launch</h3>
              <code className="text-green-300 bg-black p-3 rounded block">
                $ bunx shellquest
              </code>
              <p className="text-green-300 opacity-80 mt-3">
                Works with bunx or npx. Requires 120x80 terminal with 256 color support.
              </p>
            </div>

            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">2. Create Your Character</h3>
              <p className="text-green-300 opacity-80">
                Choose between Wizard (magic focus) or Fighter (melee focus). Name your hero and start your quest.
              </p>
            </div>

            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">3. Controls</h3>
              <div className="grid grid-cols-2 gap-4 text-green-300 opacity-80">
                <div><kbd className="bg-black px-2 py-1 rounded">WASD/Arrows</kbd> Move</div>
                <div><kbd className="bg-black px-2 py-1 rounded">Space</kbd> Attack</div>
                <div><kbd className="bg-black px-2 py-1 rounded">Shift</kbd> Run</div>
                <div><kbd className="bg-black px-2 py-1 rounded">Tab</kbd> Swap Weapon</div>
              </div>
            </div>

            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">4. Complete Dungeons</h3>
              <p className="text-green-300 opacity-80">
                Collect all keys and reach the exit before time runs out. Defeat enemies, gather loot, and climb the leaderboards!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-green-950/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-green-400">
            Ready to Quest?
          </h2>
          <p className="text-xl text-green-300 opacity-90">
            Join thousands of engineers dungeon crawling during their builds.
          </p>
          
          <div className="bg-gray-900 border border-green-500/30 rounded-lg p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <Terminal className="w-12 h-12 text-green-400 mx-auto" />
              <code className="text-green-400 text-xl block">
                $ bunx shellquest
              </code>
              <p className="text-green-300 opacity-80 text-sm">
                Or npm if you prefer: <code className="bg-black px-2 py-1 rounded">npx shellquest</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 group"
            >
              <Heart className="mr-2 h-5 w-5 text-red-600 group-hover:animate-pulse" />
              Support Development
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-4"
            >
              Join Discord
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-green-500/30">
        <div className="max-w-6xl mx-auto text-center text-green-400 opacity-60 text-sm">
          <p>© 2024 shellquest.sh | Made with 💚 for developers</p>
          <p className="mt-2">
            <Link to="/privacy" className="hover:text-green-300 transition-colors">Privacy</Link>
            {' | '}
            <Link to="/terms" className="hover:text-green-300 transition-colors">Terms</Link>
            {' | '}
            <a href="https://github.com/shellquest/shellquest" className="hover:text-green-300 transition-colors">GitHub</a>
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;