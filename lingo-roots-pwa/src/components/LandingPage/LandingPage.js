import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="sub-heading">Preserving indigenous languages</p>
          <h1>Learn indigenous languages, anywhere</h1>
          <p className="description">
            LinguaRoots helps you learn and preserve indigenous languages with a text-first approach that works even with limited internet access.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
          <div className="hero-features">
            <span>No credit card required</span>
            <span>Works offline</span>
          </div>
        </div>
        <div className="hero-image-placeholder">
          {/* Placeholder for image */}
        </div>
      </section>

      {/* Discover Indigenous Languages Section */}
      <section className="discover-languages-section">
        <h2>Discover Indigenous Languages</h2>
        <p>Explore and learn languages that are at risk of being lost to history</p>
        <div className="language-cards">
          {/* Language cards will be mapped here */}
          <div className="language-card">Bafaw <small>Western Cameroon • 25,000+ speakers</small></div>
          <div className="language-card">Bassa <small>Coastal Cameroon • 160,000+ speakers</small></div>
          <div className="language-card">Duala <small>Littoral Region • 87,000+ speakers</small></div>
          <div className="language-card">Ewondo <small>Central Region • 578,000+ speakers</small></div>
          <div className="language-card">Fulfulde <small>Northern Cameroon • 1.5M+ speakers</small></div>
        </div>
        <button className="btn btn-outline">View All Languages</button>
      </section>

      {/* Why Choose LinguaRoots Section */}
      <section className="why-choose-us-section">
        <h2>Why Choose LinguaRoots</h2>
        <p>Our platform is designed with cultural preservation and accessibility in mind</p>
        <div className="features-grid">
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Text-First Learning</h3>
            <p>Optimized for low-bandwidth environments with a focus on text-based lessons...</p>
          </div>
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Offline Functionality</h3>
            <p>Download lessons and continue learning without internet access...</p>
          </div>
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Cultural Context</h3>
            <p>Learn language within its cultural framework...</p>
          </div>
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Special Character Support</h3>
            <p>Proper rendering of language-specific characters...</p>
          </div>
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Community Verified</h3>
            <p>Content reviewed by native speakers...</p>
          </div>
          <div className="feature-item">
            {/* Icon placeholder */}
            <h3>Mobile-First Design</h3>
            <p>Optimized for learning on any device...</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <p>Start your language learning journey in three simple steps</p>
        <div className="steps-container">
          <div className="step-item">
            <span>1</span>
            <h3>Choose a Language</h3>
            <p>Select from our growing collection of indigenous languages to begin your learning journey</p>
          </div>
          <div className="step-item">
            <span>2</span>
            <h3>Complete Lessons</h3>
            <p>Work through structured lessons with text, audio, and cultural context at your own pace</p>
          </div>
          <div className="step-item">
            <span>3</span>
            <h3>Practice & Improve</h3>
            <p>Test your knowledge with quizzes and track your progress as you build fluency</p>
          </div>
        </div>
        <button className="btn btn-primary">Start Learning Now</button>
      </section>

      {/* Join the Movement Section */}
      <section className="join-movement-section">
        <div className="join-movement-content">
          <h2>Join the Movement</h2>
          <p>Help preserve indigenous languages for future generations. Start your learning journey today with LinguaRoots.</p>
          <div className="cta-buttons">
            <button className="btn btn-light">Create Free Account</button>
            <button className="btn btn-outline-dark">Learn More</button>
          </div>
        </div>
        <div className="stats">
          <div><strong>5+</strong> Languages</div>
          <div><strong>100+</strong> Lessons</div>
          <div><strong>1000+</strong> Learners</div>
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="partners-section">
        <h2>Our Partners</h2>
        <p>Working together to preserve linguistic diversity</p>
        <div className="partner-logos">
          {/* Partner logo placeholders */}
          <div className="partner-logo-placeholder"></div>
          <div className="partner-logo-placeholder"></div>
          <div className="partner-logo-placeholder"></div>
          <div className="partner-logo-placeholder"></div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about LinguaRoots</p>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How does offline mode work?</h3>
            <p>You can download lessons to your device when you have internet access...</p>
          </div>
          <div className="faq-item">
            <h3>Are the lessons created by native speakers?</h3>
            <p>Yes, all our content is created and verified by native speakers...</p>
          </div>
          <div className="faq-item">
            <h3>How much does LinguaRoots cost?</h3>
            <p>LinguaRoots offers a free tier with access to basic lessons...</p>
          </div>
          <div className="faq-item">
            <h3>Can I suggest a language to add?</h3>
            <p>We're always looking to expand our language offerings...</p>
          </div>
        </div>
      </section>

      {/* Footer (Implicit from images, can be a separate component later) */}
      <footer className="footer-section">
        <p>&copy; {new Date().getFullYear()} LinguaRoots. All rights reserved.</p>
        {/* Add other footer links/info as needed */}
      </footer>
    </div>
  );
};

export default LandingPage;