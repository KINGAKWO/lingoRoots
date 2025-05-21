import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './LandingPage.css';
import { db } from '../../firebase'; // Import Firestore instance
import { collection, getDocs, query } from 'firebase/firestore'; // Import Firestore functions
// Placeholder icons - replace with actual SVGs or a library like react-icons
import { FaGlobeAfrica, FaUserGraduate, FaLaptopCode, FaHeadphonesAlt, FaComments, FaLanguage, FaChalkboardTeacher, FaBars, FaTimes } from 'react-icons/fa'; // Added FaBars and FaTimes 

// Hardcoded languagesData removed as it will be fetched from Firestore

const testimonialsData = [
  {
    id: 1,
    avatar: FaComments, // Placeholder, consider actual images or more specific icons
    name: "Marie T.",
    role: "Student",
    quote: "LingoRoots helped me connect with my heritage in a way I never thought possible. I can now have basic conversations with my grandparents in Ghomala'!"
  },
  {
    id: 2,
    avatar: FaComments,
    name: "Jean P.",
    role: "Professional",
    quote: "The personalized approach made all the difference. Other apps felt generic, but LingoRoots adapts to how I learn best."
  },
  {
    id: 3,
    avatar: FaComments,
    name: "Samuel K.",
    role: "Parent",
    quote: "As someone teaching my children about their roots, LingoRoots has been an invaluable resource for our family to learn Ewondo together."
  }
];

const LandingPage = () => {
  const [fetchedLanguagesData, setFetchedLanguagesData] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [errorLanguages, setErrorLanguages] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLanguages(true);
      setErrorLanguages(null);
      try {
        const languagesCollectionRef = collection(db, 'languages');
        // Optionally, add orderBy if your languages have an 'order' field or similar
        // const q = query(languagesCollectionRef, orderBy('name')); 
        const q = query(languagesCollectionRef); // Simple query for now
        const querySnapshot = await getDocs(q);
        const languagesList = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          icon: FaLanguage, // Using placeholder icon for now
          ...doc.data() 
        }));
        setFetchedLanguagesData(languagesList);
      } catch (err) {
        console.error("Error fetching languages:", err);
        setErrorLanguages("Failed to load languages. " + err.message);
      }
      setLoadingLanguages(false);
    };

    fetchLanguages();
  }, []);

  return (
    <div className="landing-page-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">
            <img src="/logo.jpg" alt="LingoRoots Logo" className="navbar-logo-img" />
            LingoRoots
          </Link>
        </div>
        <div className="mobile-menu-icon-landing" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>
        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          <Link to="/">Home</Link>
          {/* Links to Dashboard, Languages, About removed for non-authenticated users */}
          {/* <Link to="/about">About</Link> */}
          <Link to="/signin" className="nav-signin">Sign In</Link>
          <Link to="/signup" className="nav-signup btn-primary">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section-new">
        <div className="hero-content-new">
          <h1>Discover Your Roots Through Language</h1>
          <p>Learn your mother tongue with personalized lessons tailored to your learning style and pace.</p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-start-learning cta">
              <span>Start Learning</span>
              <svg width="15px" height="10px" viewBox="0 0 13 10">
                <path d="M1,5 L11,5"></path>
                <polyline points="8 1 12 5 8 9"></polyline>
              </svg>
            </Link>
            <button onClick={() => document.getElementById('discover-languages').scrollIntoView({ behavior: 'smooth' })} className="btn btn-learn-more cta">
              <span>Learn More</span>
              <svg width="15px" height="10px" viewBox="0 0 13 10">
                <path d="M1,5 L11,5"></path>
                <polyline points="8 1 12 5 8 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div className="hero-image-placeholder-new">
          {/* Placeholder for an engaging image or illustration */}
          {/* Replace with actual images or SVGs */}
          {/* Example: <img src="path_to_image.png" alt="Language Learning Illustration" /> */}
          <img src="/logo.jpg" alt="Language Learning Illustration" style={{ maxWidth: '100%', display: 'block' }} />
          {/* <FaGlobeAfrica size={150} className="placeholder-icon" /> */}
        </div>
      </section>

      {/* Discover Our Languages Section */}
      {/* Discover Our Languages Section */}
      <section id="discover-languages" className="discover-languages-section-new">
        <h2>Discover Our Languages</h2>
        <p>Explore and connect with your cultural heritage through these rich languages.</p>
        <div className="language-cards-container-new">
          {loadingLanguages && <p>Loading languages...</p>}
          {errorLanguages && <p style={{ color: 'red' }}>{errorLanguages}</p>}
          {!loadingLanguages && !errorLanguages && fetchedLanguagesData.length === 0 && <p>No languages available at the moment.</p>}
          {!loadingLanguages && !errorLanguages && fetchedLanguagesData.map(lang => (
            <div key={lang.id} className="language-card-new">
              <div className="language-card-icon-placeholder"><lang.icon size={40}/></div>
              <h3>{lang.name}</h3>
              <p className="speakers">{lang.speakers}</p>
              <p className="description">{lang.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How LingoRoots Works Section */}
      <section className="how-it-works-section-new">
        <h2>How LingoRoots Works</h2>
        <p>Our personalized approach makes learning ancestral languages accessible and engaging.</p>
        <div className="steps-container-new">
          <div className="step-card-new">
            <div className="step-icon-placeholder"><FaChalkboardTeacher size={40}/></div>
            <span className="step-number-new">1</span>
            <h3>Choose Your Language</h3>
            <p>Select from our available languages to begin your learning journey.</p>
          </div>
          <div className="step-card-new">
            <div className="step-icon-placeholder"><FaUserGraduate size={40}/></div>
            <span className="step-number-new">2</span>
            <h3>Personalized Learning</h3>
            <p>Our system adapts to your learning style and pace for optimal progress.</p>
          </div>
          <div className="step-card-new">
            <div className="step-icon-placeholder"><FaLaptopCode size={40}/></div>
            <span className="step-number-new">3</span>
            <h3>Practice & Progress</h3>
            <p>Complete interactive exercises and track your improvement over time.</p>
          </div>
          <div className="step-card-new">
            <div className="step-icon-placeholder"><FaHeadphonesAlt size={40}/></div>
            <span className="step-number-new">4</span>
            <h3>Listen & Speak</h3>
            <p>Develop your pronunciation with audio examples from native speakers.</p>
          </div>
        </div>
      </section>

      {/* What Our Learners Say Section */}
      {/* What Our Learners Say Section */}
      <section className="testimonials-section-new">
        <h2>What Our Learners Say</h2>
        <p>Join thousands who are reconnecting with their cultural heritage through language.</p>
        <div className="testimonial-cards-container-new">
          {testimonialsData.map(testimonial => (
            <div key={testimonial.id} className="testimonial-card-new">
              <div className="testimonial-avatar-placeholder"><testimonial.avatar size={30}/></div>
              <h4>{testimonial.name}</h4>
              <p className="learner-role">{testimonial.role}</p>
              <blockquote>{testimonial.quote}</blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* Ready to Begin Section (Footer CTA) */}
      <section className="cta-footer-section-new">
        <h2>Ready to Begin Your Language Journey?</h2>
        <p>Join thousands of learners discovering their cultural heritage through language.</p>
        <Link to="/signup" className="btn btn-signup-free">Sign Up Free</Link>
      </section>

      {/* A simple footer can be added if needed, distinct from the CTA section */}
      <footer className="main-footer-new">
        <p>&copy; {new Date().getFullYear()} LingoRoots. All rights reserved.</p>
        {/* Optional: Add links to privacy policy, terms, etc. */}
      </footer>

    </div>
  );
};

export default LandingPage;