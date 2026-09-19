import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const socials = [
  { label: 'GitHub', src: 'https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/github-logo.png' },
  { label: 'Email', src: 'https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/gmail.png' },
  { label: 'LinkedIn', src: 'https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/linkedin.png' },
  { label: 'X', src: 'https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/twitter.png' }
]

const Footer = () => {
  return (
    <footer className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <Separator className='flex-1' />
          <div className='flex items-center gap-3'>
            {socials.map(social => (
              <Button key={social.label} variant='outline' size='icon' aria-label={social.label} className='rounded-md'>
                <img src={social.src} alt='' aria-hidden='true' loading='lazy' className='size-4' />
              </Button>
            ))}
          </div>
          <Separator className='flex-1' />
        </div>

        <div className='flex flex-wrap items-center justify-center gap-5 text-center sm:ml-8'>
          <p className='text-muted-foreground'>Thank you, for visiting here</p>
          <img
            src='https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/seal.png'
            alt=''
            aria-hidden='true'
            loading='lazy'
            className='max-sm:hidden sm:size-25'
          />
          <p className='text-muted-foreground'>Let&apos;s create something beautiful</p>
        </div>

        <div className='space-y-1 text-center'>
          <img
            src='https://cdn.shadcnstudio.com/ss-assets/template/landing-page/zolt/signature.png'
            alt=''
            aria-hidden='true'
            loading='lazy'
            className='mx-auto -mb-6 w-60'
          />
          <p className='text-xs'>@zolt Mercer {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
