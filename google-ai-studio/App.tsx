import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuoteSection } from './components/QuoteSection';
import { Imagine } from './components/Imagine';
import { Offer } from './components/Offer';
import { About } from './components/About';
import { SocialProof } from './components/SocialProof';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <div id="offer">
        <QuoteSection />
        <Imagine />
        <Offer />
      </div>
      <About />
      {/* Flattened structure for Sticky Footer effect */}
      <SocialProof />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default App;