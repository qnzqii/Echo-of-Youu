import React, { useState, useEffect, useRef } from 'react';
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
    <div id="app-root-container" className="relative w-full h-screen flex flex-col items-center justify-center p-5 overflow-hidden select-none">
      
      {/* 🌌 ✨ 极致唯美：动态弥散光影渐变层 (Ambient Flowing Mesh Gradient) */}
      <div id="ambient-mesh-gradient-viewport" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* 基础温暖燕麦大底色，自带渐变以提供丰盈的深度 */}
        <div id="base-bg-canvas" className="absolute inset-0 bg-[#FAF8F5]" />
        
        {/* 1. 少女晨曦色 (杏柔橘粉球) - 在左上方呼吸飘散 */}
        <div 
          id="auroral-orb-1-peach"
          className="absolute w-[65vw] h-[65vw] md:w-[45vw] md:h-[45vw] rounded-full filter blur-[80px] md:blur-[115px] bg-[#FCEADF] opacity-40 mix-blend-multiply top-[-10%] left-[-15%] animate-float-orb-1" 
        />
        
        {/* 2. 润雅香槟色 (鎏金奶黄球) - 自带高阶暖色光。定格时轻微融入，极其平静舒展 */}
        <div 
          id="auroral-orb-2-champagne"
          className={`absolute w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full filter blur-[90px] md:blur-[130px] mix-blend-multiply bottom-[-10%] right-[-10%] animate-float-orb-2 transition-all duration-[2400ms] ease-out ${
            isLocked 
              ? 'bg-[#FFF2D5] opacity-55 scale-105' 
              : 'bg-[#FFF6E3] opacity-45'
          }`}
        />
        
        {/* 3. 清透鼠尾草色 (雨后青绿球) - 中和画面的甜腻，极具不经意的自然呼吸感 */}
        <div 
          id="auroral-orb-3-sage"
          className="absolute w-[55vw] h-[55vw] md:w-[42vw] md:h-[42vw] rounded-full filter blur-[80px] md:blur-[110px] bg-[#E2ECE6] opacity-45 mix-blend-multiply top-[35%] left-[25%] animate-float-orb-3" 
        />
        
        {/* 4. 轻浅风信子紫 (柔润紫晕球) - 在锁定状态下会悄悄与浅香槟色交织辉映 */}
        <div 
          id="auroral-orb-4-lavender"
          className={`absolute w-[50vw] h-[50vw] md:w-[38vw] md:h-[38vw] rounded-full filter blur-[80px] md:blur-[115px] mix-blend-multiply bottom-[30%] left-[-10%] animate-float-orb-4 transition-all duration-[2000ms] ${
            isLocked 
              ? 'bg-[#EAE4F5] opacity-40 scale-105' 
              : 'bg-[#F2EEFA] opacity-30'
          }`}
        />
      </div>

      {/* 🎬 纸张实体电影级噪点纹理覆层 (Film Grain) */}
      <div id="grain-canvas-overlay" className="grain-overlay" />

      {/* 💧 Interactive liquid water ripple flow background */}
      <WaterRippleCanvas />

      {/* 🔒 定格状态时激发的极柔和暖金背景光圈与横向辉光条（与文字同频呼吸） */}
      <div 
        id="lockGlow"
        className={`absolute left-0 w-full h-[1.9em] pointer-events-none transition-all duration-[1600ms] z-1 bg-[linear-gradient(90deg,transparent_0%,rgba(212,175,55,0.05)_15%,rgba(212,175,55,0.05)_85%,transparent_100%)] [mask-image:radial-gradient(ellipse,black_70%,transparent_100%)] ${
          isLocked ? 'opacity-100 scale-100 animate-lock-bg-breath' : 'opacity-0 scale-[0.9]'
        }`}
        style={{ top: 'calc(50% - 0.95em)' }}
      />

      {/* 核心排版排布与轮椅视口区 */}
      <main id="scroller-main-viewport" className="relative flex flex-row items-center justify-center w-full max-w-[1400px] text-[clamp(1.4rem,3.6vw,2.6rem)] leading-[1.2] z-2">
        
        {/* 左侧锚点：平滑的双态淡入淡出（"I am" <--> "Today, I am"） */}
        <div id="fixed-words-container" className="relative w-[28%] text-right pr-[5%] h-[8.2em] flex justify-end items-center whitespace-nowrap">
          
          <span 
            id="anchorNormal"
            className={`absolute font-medium italic text-[1.12em] flex items-center h-[1.6em] transition-all duration-[1800ms] cubic-bezier(0.65, 0, 0.35, 1) origin-right ${
              isLocked 
                ? 'opacity-0 translate-y-[15px] scale-[0.95] pointer-events-none' 
                : 'opacity-100 translate-y-0 scale-100'
            }`}
            style={{ top: 'calc(50% - 0.8em)' }}
          >
            I am
          </span>
          
          <span 
            id="anchorLocked"
            className={`absolute font-medium italic text-[1.12em] flex items-center h-[1.6em] transition-all duration-[1800ms] cubic-bezier(0.65, 0, 0.35, 1) origin-right ${
              isLocked 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-[15px] scale-[0.95] pointer-events-none'
            }`}
            style={{ top: 'calc(50% - 0.8em)' }}
          >
            Today, I am
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
          {/* 拨动总轨 - 保持静置无重叠平移，将所有 3D 动力学解耦给每一个子项目 */}
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

      {/* 底部暗示交互的小标签 - 自适应深浅金调，安静平静，严格还原美学 */}
      <div 
        id="statusTip"
        className={`absolute bottom-10 md:bottom-12 text-[0.8rem] tracking-[0.22em] uppercase font-sans pointer-events-none transition-all duration-[1200ms] z-5 ${
          isLocked 
            ? 'opacity-100 text-[#c9a01c]' 
            : 'opacity-40 text-[#c9a01c]'
        }`}
      >
        SCROLL TO WHEEL • TAP TO FREEZE
      </div>
    </div>
  );
}
