import React from 'react'
import {Navbar} from '@/components/navbar'
import {Hero} from '@/components/Blocks/Hero'
import {StudioPreview} from '@/components/Blocks/StudioPreview'
import {WorkflowSection} from '@/components/Blocks/WorkflowSection'
import {FeatureSection} from '@/components/Blocks/FeatureSection'
import {FaqSection} from '@/components/Blocks/FaqSection'
import {Footer} from '@/components/Blocks/Footer'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-150">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <StudioPreview />
        <WorkflowSection />
        <FeatureSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
