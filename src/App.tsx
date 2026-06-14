import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Wind, X } from 'lucide-react';
import WaterRippleCanvas from './components/WaterRippleCanvas';

// 🔮 极致单行治愈系高能第一人称文案
const SUB_PHRASES = [
  "enough, just as I am.",
  "doing better than I think.",
  "exactly where I need to be.",
  "growing at my own pace.",
  "allowed to take a break.",
  "the author of my own story.",
  "braver than I feel right now.",
  "capable of amazing things.",
  "deserving of inner peace.",
  "not defined by my past.",
  "the light in someone's dark.",
  "unfolding beautifully every day.",
  "stronger than my deepest fear.",
  "perfectly unique in my way.",
  "allowed to say no today.",
  "creating a life that feels good.",
  "closer to my dreams now.",
  "always worthy of real love.",
  "making real progress every day.",
  "the magic this world needs."
];

export default function App() {
  const len = SUB_PHRASES.length;
  
  // 三倍拼接，支撑无缝上下物理无限穿梭。初始在第二组 (第 len 个)
  const triplePhrases = [...SUB_PHRASES, ...SUB_PHRASES, ...SUB_PHRASES];
  
  const [currentIndex, setCurrentIndex] = useState(len);
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [hasTransition, setHasTransition] = useState(true);

  // 🪷 Mindfulness Zen Breathing state
  const [isMindfulMode, setIsMindfulMode] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('exhale');

  // Synchronize dynamic breathe state machine (4-4-4 Box Breath Rhythm: 4s inhale, 4s hold, 4s exhale)
  useEffect(() => {
    if (!isMindfulMode) {
      setBreathPhase('exhale');
      return;
    }

    let active = true;
    let timerId: any;

    const runCycle = (phase: 'inhale' | 'hold' | 'exhale') => {
      if (!active) return;
      setBreathPhase(phase);

      const delay = 4000; // Strict 4 seconds for all stages
      let nextPhase: 'inhale' | 'hold' | 'exhale' = 'hold';

      if (phase === 'inhale') {
        nextPhase = 'hold';
      } else if (phase === 'hold') {
        nextPhase = 'exhale';
      } else if (phase === 'exhale') {
        nextPhase = 'inhale';
      }

      timerId = setTimeout(() => {
        runCycle(nextPhase);
      }, delay);
    };

    runCycle('inhale');

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [isMindfulMode]);

  // 🌙 Dark Theme state initialization (Time-prioritized, system preference combined)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOverride = localStorage.getItem('user-theme-override');
      if (savedOverride === 'dark') return true;
      if (savedOverride === 'light') return false;

      // Hour priority: 20:00 (8 PM) to 6:00 AM matches beautiful midnight theme automatically
      const hour = new Date().getHours();
      const isNightTime = hour >= 20 || hour < 6;
      if (isNightTime) return true;

      // System preference fallback
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Handle system color scheme modifications dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Rotate themes only if the user hasn't explicitly overridden them in this session
      if (!localStorage.getItem('user-theme-override')) {
        setIsDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 引用变量记录轮播定时、滚动累加和触控起始
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumDeltaYRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isTouchCapturedRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);

  // 物理配置数值
  const ROLL_THRESHOLD = 55; // 累计滚动力度阈值
  const COOL_DOWN = 350;     // 两次手动卡位之间的物理冷冻时间

  // 1. 自动轮播控制器 (极速至平稳滑行)
  const startAutoplay = () => {
    if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current);
    autoFlipTimerRef.current = setInterval(() => {
      moveRoller(1);
    }, 3800); // 适度放缓轮播时间，呼吸更平静
  };

  const stopAutoplay = () => {
    if (autoFlipTimerRef.current) {
      clearInterval(autoFlipTimerRef.current);
      autoFlipTimerRef.current = null;
    }
  };

  // 2. 核心移动控制 (带有无缝循环重置)
  const moveRoller = (direction: number) => {
    if (isTransitioningRef.current) return;
    
    // 允许切换
    setCurrentIndex((prev) => {
      const next = prev + direction;
      
      triggerMechanicalFeedback();

      // 检测越界并安排无缝瞬切
      // A. 向下滚穿了第二组 (>= len * 2)
      if (next >= len * 2) {
        isTransitioningRef.current = true;
        setTimeout(() => {
          // 在动画结束后悄无声息地关闭过渡并回弹
          setHasTransition(false);
          setCurrentIndex(len);
          // 强制重绘
          setTimeout(() => {
            setHasTransition(true);
            isTransitioningRef.current = false;
          }, 60);
        }, 1800); // 完美对齐 1.8s 高级舒缓自然阻尼曲线时间
      }
      // B. 向上滚穿了第一组下置边界 (< len)
      else if (next < len) {
        isTransitioningRef.current = true;
        setTimeout(() => {
          setHasTransition(false);
          setCurrentIndex(len * 2 - 1);
          setTimeout(() => {
            setHasTransition(true);
            isTransitioningRef.current = false;
          }, 60);
        }, 1800);
      }

      return next;
    });
  };

  // 3. 物理机械小震动 (只针对移动端进行微弱脉动反馈，视觉保持平滑不闪烁)
  const triggerMechanicalFeedback = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch (e) {
        // 忽略浏览器限制
      }
    }
  };

  // 触觉确认震动 (锁定/解锁)
  const triggerConfirmVibrate = (double: boolean) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        if (double) {
          window.navigator.vibrate([12, 40, 12]);
        } else {
          window.navigator.vibrate(8);
        }
      } catch (e) {}
    }
  };

  // 4. 定时和主动暂停交互处理
  useEffect(() => {
    if (!isLocked && !isHovered) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
    return () => {
      stopAutoplay();
    };
  }, [isLocked, isHovered, currentIndex]);

  // 5. 鼠标滚动监听 (手动拨轮)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;

    accumDeltaYRef.current += e.deltaY;

    if (isThrottled) return;

    if (Math.abs(accumDeltaYRef.current) >= ROLL_THRESHOLD) {
      const direction = accumDeltaYRef.current > 0 ? 1 : -1;
      moveRoller(direction);

      accumDeltaYRef.current = 0;
      setIsThrottled(true);
      setTimeout(() => {
        setIsThrottled(false);
      }, COOL_DOWN);
    }
  };

  // 定时物理衰减，防止能量过于滞留
  useEffect(() => {
    const handleDecay = setInterval(() => {
      accumDeltaYRef.current *= 0.5;
      if (Math.abs(accumDeltaYRef.current) < 1) {
        accumDeltaYRef.current = 0;
      }
    }, 100);
    return () => clearInterval(handleDecay);
  }, []);

  // 6. 移动端触摸轻扫 (Touch Handlers)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0].clientY;
    isTouchCapturedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked || isTouchCapturedRef.current) return;

    const currentY = e.touches[0].clientY;
    const diffY = touchStartYRef.current - currentY;
    const SWIPE_THRESHOLD = 45;

    if (Math.abs(diffY) > SWIPE_THRESHOLD) {
      const direction = diffY > 0 ? 1 : -1;
      moveRoller(direction);
      isTouchCapturedRef.current = true; // 每次触摸只前进一格，严防肆虐滚动
    }
  };

  // 7. 定格锁屏机制
  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    triggerConfirmVibrate(nextLocked);
  };

  // 7.5. 昼夜模式手动控制切换
  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('user-theme-override', nextDark ? 'dark' : 'light');
    triggerConfirmVibrate(false);
  };

  // 8. 辅助高度和相对偏移对齐
  const getItemClassName = (idx: number) => {
    const distance = idx - currentIndex;
    let classes = "scrolling-item ";

    if (distance === 0) {
      classes += "level-0 ";
      if (isLocked) classes += "locked ";
    } else if (distance === -1) {
      classes += "level-1-up ";
    } else if (distance === 1) {
      classes += "level-1-down ";
    } else if (distance === -2) {
      classes += "level-2-up ";
    } else if (distance === 2) {
      classes += "level-2-down ";
    } else if (distance === -3) {
      classes += "level-3-up ";
    } else if (distance === 3) {
      classes += "level-3-down ";
    } else if (distance < -3) {
      classes += "level-out-up opacity-0 pointer-events-none ";
    } else if (distance > 3) {
      classes += "level-out-down opacity-0 pointer-events-none ";
    }

    return classes;
  };

  return (
    <div 
      id="app-root-container" 
      className={`relative w-full h-screen flex flex-col items-center justify-center p-5 overflow-hidden select-none transition-colors duration-[1500ms] ease-out ${
        isDarkMode ? 'dark-theme bg-[#0E110F]' : 'bg-[#FAF8F5]'
      }`}
    >
      
      {/* 🪷 Mindfulness Zen Breathing Mini-Toggle Button (左上角精致静止极简按钮) */}
      <button
        id="mindfulness-toggle"
        onClick={() => {
          setIsMindfulMode(true);
          triggerConfirmVibrate(false);
        }}
        className={`absolute top-6 left-6 md:top-8 md:left-8 px-[1.1rem] h-10 rounded-full flex items-center justify-center gap-2 border transition-all duration-[600ms] cubic-bezier(0.25, 1, 0.5, 1) cursor-pointer z-50 hover:scale-[1.03] active:scale-95 shadow-sm text-[0.7rem] tracking-[0.25em] font-sans font-light ${
          isDarkMode
            ? 'border-[#1E1E22] bg-[#0E0F12]/90 hover:bg-[#16171C] text-slate-300'
            : 'border-[#E5E5E5] bg-[#FAF8F5]/80 hover:bg-[#F3F0EC] text-slate-700'
        } ${
          isMindfulMode ? 'opacity-0 pointer-events-none translate-y-[-10px]' : 'opacity-100 pointer-events-auto'
        }`}
        style={{ pointerEvents: isMindfulMode ? 'none' : 'auto' }}
        aria-label="Start Mindfulness Breathing"
      >
        <Wind className="w-[0.95rem] h-[0.95rem] text-teal-600/80 dark:text-teal-400/80 animate-pulse" />
        <span>BREATHE</span>
      </button>

      {/* ☀️/🌙 Theme Micro-Toggle Button (右上角精致静止的小太阳/小月亮小圆标) */}
      <button
        id="theme-toggle"
        onClick={handleToggleTheme}
        className={`absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-[600ms] cubic-bezier(0.25, 1, 0.5, 1) cursor-pointer z-50 hover:scale-105 active:scale-95 shadow-sm ${
          isDarkMode
            ? 'border-[#1E1E22] bg-[#0E0F12]/90 hover:bg-[#16171C] text-slate-100'
            : 'border-[#E5E5E5] bg-[#FAF8F5]/80 hover:bg-[#F3F0EC] text-slate-800'
        } ${
          isMindfulMode ? 'opacity-0 pointer-events-none translate-y-[-10px]' : 'opacity-100 pointer-events-auto'
        }`}
        style={{ pointerEvents: isMindfulMode ? 'none' : 'auto' }}
        aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? (
          <Sun className="w-[1.12rem] h-[1.12rem] text-amber-200 animate-pulse" />
        ) : (
          <Moon className="w-[1.05rem] h-[1.05rem] text-slate-800" />
        )}
      </button>

      {/* 🌌 ✨ 动态弥散光影渐变层 (Ambient Flowing Mesh Gradient) */}
      <div id="ambient-mesh-gradient-viewport" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* 基础色底，自适应渐变以提供丰盈的深度 */}
        <div 
          id="base-bg-canvas" 
          className={`absolute inset-0 transition-colors duration-[1500ms] ease-out ${
            isDarkMode ? 'bg-[#0B0D0C]' : 'bg-[#FAF8F5]'
          }`} 
        />
        
        {/* 1. 润古雅竹绿 (雅致青绿球) - 在左上方呼吸飘散 */}
        <div 
          id="auroral-orb-1-peach"
          className={`absolute w-[65vw] h-[65vw] md:w-[45vw] md:h-[45vw] rounded-full filter blur-[80px] md:blur-[115px] transition-all duration-[2000ms] ease-out top-[-10%] left-[-15%] animate-float-orb-1 ${
            isDarkMode ? 'bg-[#0F1612] opacity-35 mix-blend-screen' : 'bg-[#FAF3E2] opacity-50 mix-blend-multiply'
          }`}
        />
        
        {/* 2. 润雅香槟色 (鎏金奶黄球) - 自带高阶暖色光 */}
        <div 
          id="auroral-orb-2-champagne"
          className={`absolute w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full filter blur-[90px] md:blur-[130px] transition-all duration-[2000ms] ease-out bottom-[-10%] right-[-10%] animate-float-orb-2 ${
            isDarkMode 
              ? isLocked 
                ? 'bg-[#181C15] opacity-35 scale-105 mix-blend-screen' 
                : 'bg-[#121611] opacity-25 mix-blend-screen'
              : isLocked 
                ? 'bg-[#FFF2D5] opacity-55 scale-105 mix-blend-multiply' 
                : 'bg-[#FFF6E3] opacity-45 mix-blend-multiply'
          }`}
        />
        
        {/* 3. 清透鼠尾草色 (雨后青绿球) - 极具自然呼吸感 */}
        <div 
          id="auroral-orb-3-sage"
          className={`absolute w-[55vw] h-[55vw] md:w-[42vw] md:h-[42vw] rounded-full filter blur-[80px] md:blur-[110px] transition-all duration-[2000ms] ease-out top-[35%] left-[25%] animate-float-orb-3 ${
            isDarkMode ? 'bg-[#0C150E] opacity-30 mix-blend-screen' : 'bg-[#E0EBE4] opacity-55 mix-blend-multiply'
          }`}
        />
        
        {/* 4. 轻浅温和松针绿 (松绿云雾球) */}
        <div 
          id="auroral-orb-4-lavender"
          className={`absolute w-[50vw] h-[50vw] md:w-[38vw] md:h-[38vw] rounded-full filter blur-[80px] md:blur-[115px] transition-all duration-[2000ms] ease-out bottom-[30%] left-[-10%] animate-float-orb-4 ${
            isDarkMode 
              ? isLocked 
                ? 'bg-[#151D18] opacity-30 scale-105 mix-blend-screen' 
                : 'bg-[#0E1511] opacity-20 mix-blend-screen'
              : isLocked 
                ? 'bg-[#ECEAE4] opacity-50 scale-105 mix-blend-multiply' 
                : 'bg-[#F4F3ED] opacity-35 mix-blend-multiply'
          }`}
        />
      </div>

      {/* 🎬 纸张实体电影级噪点纹理覆层 (Film Grain) */}
      <div id="grain-canvas-overlay" className="grain-overlay" />

      {/* 💧 Interactive liquid water ripple flow background */}
      <WaterRippleCanvas isDarkMode={isDarkMode} />

      {/* 🔒 定格状态时激发极柔暖金背景辉光 */}
      <div 
        id="lockGlow"
        className={`absolute left-0 w-full h-[1.9em] pointer-events-none transition-all duration-[1600ms] z-1 bg-[linear-gradient(90deg,transparent_0%,rgba(212,175,55,0.05)_15%,rgba(212,175,55,0.05)_85%,transparent_100%)] [mask-image:radial-gradient(ellipse,black_70%,transparent_100%)] ${
          isLocked && !isMindfulMode ? 'opacity-100 scale-100 animate-lock-bg-breath' : 'opacity-0 scale-[0.9]'
        }`}
        style={{ top: 'calc(50% - 0.95em)' }}
      />

      {/* 核心排版与视口 */}
      <main 
        id="scroller-main-viewport" 
        className={`relative flex flex-row items-center justify-center w-full max-w-[1400px] text-[clamp(1.4rem,3.6vw,2.6rem)] leading-[1.2] z-2 transition-all duration-[1000ms] cubic-bezier(0.25, 1, 0.3, 1) ${
          isMindfulMode ? 'opacity-0 scale-[0.96] pointer-events-none blur-[4px]' : 'opacity-100 scale-100 pointer-events-auto'
        }`}
      >
        
        {/* 左侧锚点：定格时与右侧同频高阶呼吸暖金辉光，慢速聚拢 */}
        <div 
          id="fixed-words-container" 
          className={`relative w-[28%] text-right h-[8.2em] flex justify-end items-center whitespace-nowrap transition-all duration-[1800ms] cubic-bezier(0.16, 1, 0.3, 1) ${
            isLocked ? 'pr-[1.2%]' : 'pr-[5%]'
          }`}
        >
          <span 
            id="anchorNormal"
            className={`font-medium italic text-[1.15em] flex items-center h-[1.6em] transition-all duration-[1200ms] cubic-bezier(0.25, 1, 0.3, 1) origin-right ${
              isLocked 
                ? 'anchor-locked-breath' 
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            I am
          </span>
        </div>

        {/* 右侧 3D 旋转舞台窗口 */}
        <div 
          id="scrollWindow"
          className="relative w-[72%] text-left h-[8.2em] flex items-center overflow-visible select-none cursor-[ns-resize] touch-none"
          style={{
            perspective: '1200px',
            perspectiveOrigin: 'left center',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* 拨动总轨 */}
          <div 
            id="scroller-track-chasis" 
            className="absolute left-0 top-0 w-full h-[1.6em]"
            style={{
              transformStyle: 'preserve-3d',
              top: 'calc(50% - 0.8em)'
            }}
          >
            {triplePhrases.map((phrase, idx) => {
              const isCenter = idx === currentIndex;
              return (
                <div 
                  key={idx}
                  id={`item-${idx}`}
                  className={`${getItemClassName(idx)}`}
                  style={{
                    transition: hasTransition 
                      ? 'transform 1.8s cubic-bezier(0.65, 0, 0.35, 1), opacity 1.8s cubic-bezier(0.65, 0, 0.35, 1), color 1.8s cubic-bezier(0.65, 0, 0.35, 1)' 
                      : 'none',
                  }}
                  onClick={() => {
                    if (isCenter) {
                      handleToggleLock();
                    }
                  }}
                >
                  {phrase}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 底部小字提示 */}
      <div 
        id="statusTip"
        className={`absolute bottom-10 md:bottom-12 text-[0.8rem] tracking-[0.22em] uppercase font-sans pointer-events-none transition-all duration-[1200ms] z-5 ${
          isMindfulMode 
            ? 'opacity-0 translate-y-[10px] text-[#c9a01c]'
            : isLocked 
              ? 'opacity-100 text-[#c9a01c]' 
              : 'opacity-40 text-[#c9a01c]'
        }`}
      >
        SCROLL TO WHEEL • TAP TO FREEZE
      </div>

      {/* 🪷 Zen Mindfulness Breathing Screen Area (清屏后的极简正念空间) */}
      <div
        id="mindfulness-zen-stage"
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-[1400ms] cubic-bezier(0.25, 1, 0.3, 1) ${
          isMindfulMode 
            ? 'opacity-100 pointer-events-auto scale-100 z-[60]' 
            : 'opacity-0 pointer-events-none scale-[1.06] z-40'
        }`}
      >
        {/* ❌ 退出正念模式按钮 */}
        <button
          id="close-mindfulness"
          onClick={() => {
            setIsMindfulMode(false);
            triggerConfirmVibrate(false);
          }}
          className={`absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-[600ms] cubic-bezier(0.25, 1, 0.5, 1) cursor-pointer hover:scale-105 active:scale-95 shadow-sm z-[70] ${
            isDarkMode
              ? 'border-[#1E1E22] bg-[#0E0F12]/90 hover:bg-[#16171C] text-slate-100'
              : 'border-[#E5E5E5] bg-[#FAF8F5]/80 hover:bg-[#F3F0EC] text-slate-800'
          }`}
          aria-label="Exit Mindfulness Mode"
        >
          <X className="w-[1.1rem] h-[1.1rem]" />
        </button>

        {/* 呼吸不规则填充图形容器 */}
        <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] flex items-center justify-center">
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: (breathPhase === 'inhale' || breathPhase === 'hold') ? 'scale(1)' : 'scale(0.35)',
              transition: 'transform 4000ms cubic-bezier(0.36, 0, 0.64, 1)',
            }}
          >
            <div 
              className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] transition-all duration-1000 ease-out animate-zen-blob shadow-2xl backdrop-blur-[2px]"
              style={{
                background: isDarkMode
                  ? 'radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(130, 155, 142, 0.18) 55%, rgba(68, 88, 77, 0.08) 100%)'
                  : 'radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, rgba(183, 198, 189, 0.85) 55%, rgba(153, 172, 160, 0.75) 100%)',
                boxShadow: isDarkMode 
                  ? '0 0 100px rgba(130, 155, 142, 0.14), inset 0 0 40px rgba(255, 255, 255, 0.04)' 
                  : '0 0 80px rgba(153, 172, 160, 0.22), inset 0 0 50px rgba(255, 255, 255, 0.6)'
              }}
            />
          </div>
        </div>

        {/* 精致正念引导字幕 */}
        <div className="absolute bottom-20 md:bottom-24 text-center select-none pointer-events-none">
          <p 
            className={`text-xs md:text-sm tracking-[0.32em] font-sans font-light uppercase transition-all duration-1000 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
            style={{
              textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {breathPhase === 'inhale' && "吸气 · Inhale 4s"}
            {breathPhase === 'hold' && "屏息 · Hold 4s"}
            {breathPhase === 'exhale' && "呼气 · Exhale 4s"}
          </p>
        </div>
      </div>
    </div>
  );
}
