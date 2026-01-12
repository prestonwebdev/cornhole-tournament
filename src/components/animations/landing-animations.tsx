"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";

export function LandingContent() {
  return (
    <motion.div
      className="flex flex-col flex-1"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
    >
      {/* Header */}
      <motion.header
        className="pt-12 pb-4"
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
          },
        }}
      >
        <p className="text-center text-white/80 text-sm tracking-wide">
          Copperbend Ward | 2026
        </p>
      </motion.header>

      {/* Logo centered */}
      <motion.main
        className="flex-1 flex items-center justify-center px-8"
        variants={{
          hidden: { opacity: 0, scale: 0.85 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          },
        }}
      >
        <div className="w-full max-w-xs">
          <Image
            src="/logo.svg"
            alt="Cornhole Tournament"
            width={300}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
      </motion.main>

      {/* Bottom buttons */}
      <motion.footer
        className="px-8 pb-12"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
          },
        }}
      >
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/signup" className="block">
              <button className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium text-lg transition-colors">
                Signup
              </button>
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/login" className="block">
              <button className="w-full py-4 bg-transparent text-white font-medium text-lg hover:bg-white/5 transition-colors">
                Login
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
