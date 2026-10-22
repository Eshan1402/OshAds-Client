import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin brand-spectrum bar that tracks page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 })
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[linear-gradient(90deg,#1B3FD0,#2C5BEF,#3D7BFF,#7CC4FF)]"
    />
  )
}
