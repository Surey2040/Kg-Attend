import React, { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

const GooeyFilter = () => {
  return (
    <svg aria-hidden="true" className="absolute w-0 h-0">
      <defs>
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

const SearchIcon = ({ isUnsupported }) => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
        scale: 0.8,
        x: -4,
        filter: isUnsupported ? "none" : "blur(5px)",
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        filter: "blur(0px)",
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        x: -4,
        filter: isUnsupported ? "none" : "blur(5px)",
      }}
      transition={{
        delay: 0.1,
        duration: 1,
        type: "spring",
        bounce: 0.15,
      }}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </motion.svg>
  );
};

const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 hover:text-white transition-colors cursor-pointer">
    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.557 2.99385 11.1929 2.99385 10.9684 3.2184L7.50005 6.68673L4.03164 3.21832C3.80708 2.99376 3.44301 2.99376 3.21846 3.21832C2.9939 3.44287 2.9939 3.80694 3.21846 4.0315L6.68687 7.49991L3.21846 10.9683C2.9939 11.1929 2.9939 11.557 3.21846 11.7815C3.44301 12.0061 3.80708 12.0061 4.03164 11.7815L7.50005 8.3131L10.9684 11.7815C11.1929 12.0061 11.557 12.0061 11.7816 11.7815C12.0062 11.557 12.0062 11.1929 11.7816 10.9683L8.31324 7.49991L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

const buttonVariants = {
  initial: { width: 120, borderRadius: 24, backgroundColor: "#1e293b" },
  step1: { width: 120, borderRadius: 24, backgroundColor: "#1e293b" },
  step2: { width: 280, borderRadius: 12, backgroundColor: "#0f172a" },
};

const iconVariants = {
  hidden: { x: -30, opacity: 0 },
  visible: { x: 16, opacity: 1 },
};

export const isUnsupportedBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  const isChromeOniOS = ua.includes("crios");
  return isSafari || isChromeOniOS;
};

export const GooeySearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  const inputRef = useRef(null);
  const [step, setStep] = useState(value ? 2 : 1);
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  // Expand if there is value
  useEffect(() => {
    if (value && step === 1) {
      setStep(2);
    }
  }, [value, step]);

  const handleButtonClick = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setStep(1);
    onChange({ target: { value: '' } }); // Clear input
  };

  useEffect(() => {
    if (step === 2) {
      inputRef.current?.focus();
    }
  }, [step]);

  return (
    <div className={clsx("relative inline-flex items-center justify-end h-10 w-full max-w-[280px]", isUnsupported && "no-goo")}>
      <GooeyFilter />

      <div 
        className="w-full flex justify-end h-full items-center relative"
        style={{ filter: isUnsupported ? 'none' : 'url(#goo-effect)' }}
      >
        <motion.div
          className="button-content-inner relative flex items-center justify-end h-10"
          initial="initial"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
        >
          <motion.div
            variants={buttonVariants}
            onClick={handleButtonClick}
            whileHover={{ scale: step === 2 ? 1 : 1.05 }}
            whileTap={{ scale: step === 2 ? 1 : 0.95 }}
            className="search-btn relative flex items-center shadow-md cursor-pointer overflow-hidden h-full z-10"
          >
            {step === 1 ? (
              <div className="flex items-center justify-center w-full h-full text-slate-300 font-medium text-sm gap-2">
                <SearchIcon isUnsupported={isUnsupported} />
                <span>Search</span>
              </div>
            ) : (
              <div className="flex items-center w-full h-full pl-10 pr-3 relative">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-400 z-20 h-full focus:ring-0"
                  placeholder={placeholder}
                  value={value}
                  onChange={onChange}
                  aria-label="Search input"
                />
                {value && (
                  <div className="absolute right-3 z-30 flex items-center justify-center h-full" onClick={handleClose}>
                    <CloseIcon />
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="icon"
                className="absolute left-0 z-20 pointer-events-none flex items-center h-full"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{
                  delay: 0.1,
                  duration: 0.85,
                  type: "spring",
                  bounce: 0.15,
                }}
              >
                <SearchIcon isUnsupported={isUnsupported} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
