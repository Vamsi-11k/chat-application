import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  MessageSquare,
  ArrowRight,
  Github,
  CheckCheck,
  Shield,
  Zap,
  Lock,
  Paperclip,
  Smile,
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { FullPageLoader } from '../components/Loader';

// ============================================================================
// SCRIPTED DEMO CONVERSATION CONFIGURATION
// You can freely edit the messages, typing speeds, and pauses below.
// ============================================================================
const DEMO_CONVERSATION_SCRIPT = {
  // Initial messages present at the start of each cycle
  initialMessages: [
    {
      id: 'demo-1',
      sender: 'alex',
      text: 'Hey! Did you get the real-time sync update ready? 🚀',
      time: '10:42 AM'
    },
    {
      id: 'demo-2',
      sender: 'me',
      text: 'Yes! Socket.io events and read receipts are working smoothly.',
      time: '10:43 AM'
    }
  ],
  // The message typed into the input field character by character
  typewriterText: 'Testing typing indicators & multi-device sync ✨',
  typingSpeedMs: 60,            // Speed per character
  pauseBeforeSendMs: 450,       // Pause after typing completes before sending
  outgoingTimestamp: '10:43 AM', // Timestamp for sent bubble
  pauseBeforeOtherTypingMs: 850,// Delay before Alex starts typing
  otherTypingDurationMs: 1800,  // How long "Alex is typing..." is shown
  // Alex's incoming response message
  incomingReply: {
    id: 'demo-4',
    sender: 'alex',
    text: "That's awesome! Everything is lightning fast 🎉",
    time: '10:44 AM'
  },
  pauseAtEndMs: 4000            // Pause to let users read before resetting the loop
};

export const Landing = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // State toggle allowing easy preview toggle between Component Mockup vs Image Screenshot
  const [useScreenshotImage, setUseScreenshotImage] = useState(false);

  // Phone Mockup Simulation States
  const [displayedMessages, setDisplayedMessages] = useState(DEMO_CONVERSATION_SCRIPT.initialMessages);
  const [inputTypedText, setInputTypedText] = useState('');
  const [isTypingIndicatorActive, setIsTypingIndicatorActive] = useState(false);
  const [isPhoneInView, setIsPhoneInView] = useState(true);

  const phoneContainerRef = useRef(null);
  const messagesScrollRef = useRef(null);

  // --------------------------------------------------------------------------
  // 1. Accessibility: Check for prefers-reduced-motion
  // --------------------------------------------------------------------------
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // 2. Performance: IntersectionObserver (Pauses animation when off-screen)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!phoneContainerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPhoneInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(phoneContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // --------------------------------------------------------------------------
  // 3. Auto-scroll phone message list to bottom on new message / typing event
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTo({
        top: messagesScrollRef.current.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  }, [displayedMessages, isTypingIndicatorActive, prefersReducedMotion]);

  // --------------------------------------------------------------------------
  // 4. State Machine / Animation Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    // If reduced motion is requested, show complete static conversation without animation
    if (prefersReducedMotion) {
      setDisplayedMessages([
        ...DEMO_CONVERSATION_SCRIPT.initialMessages,
        {
          id: 'demo-3',
          sender: 'me',
          text: DEMO_CONVERSATION_SCRIPT.typewriterText,
          time: DEMO_CONVERSATION_SCRIPT.outgoingTimestamp
        },
        DEMO_CONVERSATION_SCRIPT.incomingReply
      ]);
      setInputTypedText('');
      setIsTypingIndicatorActive(false);
      return;
    }

    // If phone mockup is not in viewport or user is viewing image mode, do not run timers
    if (!isPhoneInView || useScreenshotImage) return;

    let isMounted = true;
    const timeouts = [];

    const scheduleTimeout = (fn, delay) => {
      const id = setTimeout(() => {
        if (isMounted) fn();
      }, delay);
      timeouts.push(id);
      return id;
    };

    const runSimulationSequence = () => {
      // Step 0: Reset to initial conversation state
      setDisplayedMessages(DEMO_CONVERSATION_SCRIPT.initialMessages);
      setInputTypedText('');
      setIsTypingIndicatorActive(false);

      const targetText = DEMO_CONVERSATION_SCRIPT.typewriterText;
      let accumulatedDelay = 800; // Initial breath before typing begins

      // Step 1: Character-by-character typewriter effect in input bar
      for (let i = 0; i <= targetText.length; i++) {
        const textSlice = targetText.slice(0, i);
        scheduleTimeout(() => {
          setInputTypedText(textSlice);
        }, accumulatedDelay);
        accumulatedDelay += DEMO_CONVERSATION_SCRIPT.typingSpeedMs;
      }

      // Step 2: Pause briefly, then Send outgoing message
      accumulatedDelay += DEMO_CONVERSATION_SCRIPT.pauseBeforeSendMs;
      scheduleTimeout(() => {
        setInputTypedText('');
        setDisplayedMessages((prev) => [
          ...prev,
          {
            id: `demo-sent-${Date.now()}`,
            sender: 'me',
            text: targetText,
            time: DEMO_CONVERSATION_SCRIPT.outgoingTimestamp
          }
        ]);
      }, accumulatedDelay);

      // Step 3: Pause, then activate Alex's typing indicator
      accumulatedDelay += DEMO_CONVERSATION_SCRIPT.pauseBeforeOtherTypingMs;
      scheduleTimeout(() => {
        setIsTypingIndicatorActive(true);
      }, accumulatedDelay);

      // Step 4: Hide typing indicator and deliver Alex's reply bubble
      accumulatedDelay += DEMO_CONVERSATION_SCRIPT.otherTypingDurationMs;
      scheduleTimeout(() => {
        setIsTypingIndicatorActive(false);
        setDisplayedMessages((prev) => [
          ...prev,
          {
            ...DEMO_CONVERSATION_SCRIPT.incomingReply,
            id: `demo-reply-${Date.now()}`
          }
        ]);
      }, accumulatedDelay);

      // Step 5: Pause for reading, then loop back to Step 0
      accumulatedDelay += DEMO_CONVERSATION_SCRIPT.pauseAtEndMs;
      scheduleTimeout(() => {
        runSimulationSequence();
      }, accumulatedDelay);
    };

    // Start simulation
    runSimulationSequence();

    // Cleanup all scheduled timeouts on unmount or pause
    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
    };
  }, [isPhoneInView, prefersReducedMotion, useScreenshotImage]);

  // Redirect authenticated users straight to the protected chat screen
  if (loading) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f0fdfa] via-[#e6f7f4] to-[#ddf4ef] dark:from-[#031714] dark:via-[#072420] dark:to-[#0f3d37] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden p-3 sm:p-6 md:p-8">
      
      {/* Background Soft Deep Teal Watercolor & Radial Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft mint wash shapes in light mode */}
        <div className="absolute -top-16 -right-16 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] bg-teal-200/40 dark:bg-transparent rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl transform rotate-12" />
        <div className="absolute -bottom-24 -left-20 w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] bg-emerald-200/35 dark:bg-transparent rounded-[40%_60%_70%_30%/40%_40%_60%_60%] blur-3xl transform -rotate-6" />
        
        {/* Dark mode deep emerald/teal center radial glow */}
        <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-radial from-teal-500/15 via-[#092c27]/40 to-transparent rounded-full blur-3xl" />
        <div className="hidden dark:block absolute -top-20 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="hidden dark:block absolute -bottom-20 -right-20 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl" />
      </div>

      {/* ========================================================================= */}
      {/* MAIN FRAMED HERO CONTAINER (Pale Mint Panel in Light / Deep Teal in Dark) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col rounded-3xl sm:rounded-4xl border border-teal-100/90 dark:border-[#0f3d37]/90 bg-white/95 dark:bg-[#061e1a]/90 backdrop-blur-2xl shadow-2xl shadow-teal-950/10 dark:shadow-black/70 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top inner highlight line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 dark:via-teal-400/30 to-transparent pointer-events-none" />

        {/* ----------------------------------------------------------------------- */}
        {/* 1. NAVBAR                                                               */}
        {/* ----------------------------------------------------------------------- */}
        <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between border-b border-teal-100/80 dark:border-[#0d332c]/80 relative z-20">
          {/* Brand Logo / Wordmark */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <MessageSquare size={22} className="stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                PulseChat
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase text-teal-600 dark:text-teal-400 mt-1">
                Real-Time Messaging
              </span>
            </div>
          </Link>

          {/* Minimal Nav Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggle className="bg-teal-50/90 dark:bg-[#0b2823]/90 border border-teal-200/70 dark:border-[#14423a] shadow-xs" />
            
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-100/60 dark:hover:bg-[#0e312b] rounded-full transition-all"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 rounded-full shadow-md shadow-teal-600/30 transition-all duration-150"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* ----------------------------------------------------------------------- */}
        {/* 2. HERO BODY (Two-Column Layout)                                         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8 px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 relative">
          
          {/* LEFT COLUMN: Confident Copy & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 sm:space-y-8 z-10 max-w-2xl">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800/80 text-teal-700 dark:text-teal-300 text-xs font-semibold shadow-xs">
              <Sparkles size={13} className="text-teal-600 animate-pulse" />
              <span>Real-Time 1-on-1 Messaging</span>
            </div>

            {/* Bold 2-Line Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.12]">
              Real Conversations.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 dark:from-teal-400 dark:via-emerald-300 dark:to-teal-300">
                Real Time.
              </span>
            </h1>

            {/* Honest, Plain-English Value Proposition */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Instant messaging built exclusively for people you actually know. Enjoy live typing indicators, instant read receipts, and multi-device sync with zero unsolicited spam or clutter.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-semibold rounded-full text-sm shadow-xl shadow-teal-600/35 transition-all duration-150"
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-white hover:bg-teal-50 dark:hover:bg-[#0c2a25] rounded-full border border-teal-200/80 dark:border-[#14423a] transition-all duration-150"
              >
                Sign In
              </Link>
            </div>

            {/* Feature Highlights Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-4 sm:pt-6 border-t border-teal-100 dark:border-[#0f3d37] w-full max-w-lg">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Shield size={14} />
                </div>
                <div className="text-[11px] leading-tight font-medium text-slate-700 dark:text-slate-300">
                  Friend-Gated Privacy
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
                <div className="text-[11px] leading-tight font-medium text-slate-700 dark:text-slate-300">
                  Socket.io Live Speed
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Lock size={14} />
                </div>
                <div className="text-[11px] leading-tight font-medium text-slate-700 dark:text-slate-300">
                  JWT Auth Sessions
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Deep Teal Layered CSS Radial Shapes + Animated Phone Mockup */}
          <div 
            ref={phoneContainerRef}
            className="lg:col-span-5 flex items-center justify-center relative w-full mt-4 lg:mt-0"
          >
            
            {/* Layered CSS Radial Background Shapes */}
            <div className="absolute w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-600/15 to-cyan-500/10 blur-2xl pointer-events-none -z-10" />
            <div className="absolute w-[260px] sm:w-[340px] h-[260px] sm:h-[340px] rounded-full border border-teal-400/25 dark:border-teal-500/20 pointer-events-none -z-10 scale-95" />
            <div className="absolute w-[210px] sm:w-[280px] h-[210px] sm:h-[280px] rounded-full bg-gradient-to-br from-teal-600/15 to-emerald-500/15 backdrop-blur-3xl pointer-events-none -z-10" />

            {/* Smartphone Mockup Frame */}
            <div className="relative w-full max-w-[290px] sm:max-w-[320px] rounded-[44px] bg-slate-900 dark:bg-black p-3 shadow-2xl shadow-teal-950/40 ring-1 ring-slate-800 dark:ring-[#123e37] transition-transform duration-300 hover:scale-[1.02]">
              
              {/* Dynamic Island / Speaker Pill */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 dark:bg-slate-900 rounded-full flex items-center justify-center z-30 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-700 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500/80" />
              </div>

              {/* Inner Phone Screen Content */}
              <div className="w-full h-[480px] sm:h-[510px] bg-slate-50 dark:bg-[#051815] rounded-[34px] overflow-hidden flex flex-col relative border border-slate-200/70 dark:border-[#0e3a33]/80">
                
                {/* 
                  ========================================================================
                  HOW TO SWAP IN YOUR REAL SCREENSHOT:
                  1. Drop your real screenshot into `client/public/assets/hero-phone-preview.png`
                  2. Set `useScreenshotImage` to `true` or replace the conditional block below.
                  ========================================================================
                */}
                {useScreenshotImage ? (
                  <img
                    src="/assets/hero-phone-preview.png"
                    alt="PulseChat App Live Interface"
                    className="w-full h-full object-cover"
                    onError={() => setUseScreenshotImage(false)}
                  />
                ) : (
                  /* Animated Live Interactive Mockup of PulseChat */
                  <div className="w-full h-full flex flex-col justify-between text-xs select-none">
                    
                    {/* Mockup Header */}
                    <div className="pt-8 pb-3 px-3.5 bg-white dark:bg-[#0a231f] border-b border-slate-200 dark:border-[#0e3831] flex items-center justify-between shrink-0">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                            AK
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0a231f] rounded-full" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] leading-tight">
                            Alex Kim
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Online
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        Mutual Friend
                      </span>
                    </div>

                    {/* Chat Messages Scroll Container */}
                    <div 
                      ref={messagesScrollRef}
                      className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-slate-100/50 dark:bg-[#031310]/50 transition-all duration-300"
                    >
                      {/* System timestamp badge */}
                      <div className="text-center my-1">
                        <span className="text-[9px] text-slate-400 bg-white dark:bg-[#0d2a25] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#133e37]">
                          Today
                        </span>
                      </div>

                      {/* Rendered Message Stream */}
                      {displayedMessages.map((msg) => {
                        const isMe = msg.sender === 'me';
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end ${
                              isMe ? 'justify-end self-end' : 'justify-start self-start'
                            } max-w-[85%] animate-fadeIn transition-all`}
                          >
                            {isMe ? (
                              /* Outgoing / Sent Bubble (Bright Teal) */
                              <div className="bg-teal-600 text-white p-2.5 rounded-2xl rounded-br-xs shadow-md shadow-teal-600/25">
                                <p className="text-[11px] leading-snug break-words">
                                  {msg.text}
                                </p>
                                <div className="flex items-center justify-end space-x-1 mt-1">
                                  <span className="text-[8px] text-teal-100">{msg.time}</span>
                                  <CheckCheck size={12} className="text-teal-100 stroke-[2.5]" />
                                </div>
                              </div>
                            ) : (
                              /* Incoming / Received Bubble (Neutral Dark) */
                              <div className="bg-white dark:bg-[#0d2a25] p-2.5 rounded-2xl rounded-bl-xs border border-slate-200/80 dark:border-[#14423b] shadow-xs">
                                <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-snug break-words">
                                  {msg.text}
                                </p>
                                <span className="text-[8px] text-slate-400 mt-1 block text-right">
                                  {msg.time}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Animated Typing Indicator Bubble (Appears when Alex is typing) */}
                      {isTypingIndicatorActive && (
                        <div className="flex items-center space-x-1.5 bg-white dark:bg-[#0d2a25] border border-slate-200/80 dark:border-[#14423b] px-2.5 py-1.5 rounded-full w-fit shadow-xs animate-fadeIn">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                          <span className="text-[9px] text-slate-400 ml-1 font-medium">Alex is typing...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Input Bar Mockup with Live Typewriter Effect */}
                    <div className="p-2.5 bg-white dark:bg-[#0a231f] border-t border-slate-200 dark:border-[#0e3831] flex items-center space-x-1.5 shrink-0">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Paperclip size={14} />
                      </div>
                      
                      <div className="flex-1 bg-slate-100 dark:bg-[#0f2e29] rounded-full px-3 py-1.5 text-[10px] text-slate-700 dark:text-slate-200 flex items-center justify-between min-h-[28px] overflow-hidden">
                        <span className="truncate flex items-center">
                          {inputTypedText ? (
                            <>
                              <span>{inputTypedText}</span>
                              <span className="inline-block w-1 h-3 bg-teal-500 ml-0.5 animate-pulse" />
                            </>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Type a message...</span>
                          )}
                        </span>
                        <Smile size={12} className="text-slate-400 shrink-0 ml-1" />
                      </div>

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xs transition-all duration-150 ${
                          inputTypedText
                            ? 'bg-teal-600 scale-105 shadow-teal-600/30'
                            : 'bg-teal-600/80'
                        }`}
                      >
                        <Send size={11} className="translate-x-[0.5px]" />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MINIMAL CLEAN FOOTER (High Contrast Pale Mint / Deep Teal Palette)     */}
      {/* ========================================================================= */}
      <footer className="w-full max-w-7xl mx-auto mt-4 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-teal-950/80 dark:text-teal-200/60 font-medium">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-teal-950 dark:text-teal-100">PulseChat</span>
          <span>•</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/Vamsi-11k/chat-application"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
          >
            <Github size={14} />
            <span>GitHub</span>
          </a>
        </div>
      </footer>

    </div>
  );
};
