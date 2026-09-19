import * as React from 'react'
import {Play, X} from 'lucide-react'
import {AnimatePresence, motion} from 'motion/react'
import {cn} from '@/lib/utils'

interface HeroVideoProps {
  videoSrc?: string
  thumbnailSrc?: string
  thumbnailAlt?: string
  className?: string
  children?: React.ReactNode
  customDialogContent?: React.ReactNode
}

export function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = 'Evaluation Studio Preview',
  className,
  children,
  customDialogContent
}: HeroVideoProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn('relative', className)}>
      {children ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Play preview"
          className="group relative w-full cursor-pointer border-0 bg-transparent p-0"
          onClick={() => setIsOpen(true)}
        >
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={thumbnailAlt}
              className="w-full rounded-xl border border-border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.85]"
            />
          ) : (
            <div className="w-full h-72 rounded-xl border border-border bg-card shadow-lg flex items-center justify-center">
              <span className="text-muted-foreground">{thumbnailAlt}</span>
            </div>
          )}
          <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
            <div className="bg-primary/20 flex size-20 items-center justify-center rounded-full backdrop-blur-md">
              <div className="bg-primary flex size-14 items-center justify-center rounded-full shadow-md transition-all duration-200 ease-out group-hover:scale-110">
                <Play className="size-6 fill-primary-foreground text-primary-foreground ml-0.5" />
              </div>
            </div>
          </div>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              exit={{scale: 0.9, opacity: 0}}
              transition={{type: 'spring', damping: 30, stiffness: 300}}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
                <h3 className="font-semibold text-sm text-foreground">
                  Interactive Evaluation Studio Preview
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                {customDialogContent ||
                  (videoSrc ? (
                    <div className="aspect-video w-full overflow-hidden rounded-lg">
                      <iframe
                        src={videoSrc}
                        title="Preview"
                        className="size-full"
                        allowFullScreen
                      />
                    </div>
                  ) : null)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
