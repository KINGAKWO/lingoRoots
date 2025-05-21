import React from 'react';
import './AboutPage.css'; // We'll create this CSS file next for styling

const AboutPage = () => {
  return (
    <div className="about-page-container">
      <header className="about-header">
        <h1>About LingoRoots</h1>
        <p>Connecting you to your cultural heritage through language.</p>
      </header>

      <section className="mission-section">
        <h2>Our Mission</h2>
        <p>
          At LingoRoots, our mission is to empower individuals to reconnect with their ancestral languages and cultural heritage.
          We believe that language is a vital link to identity, history, and community. We strive to make learning these languages
          accessible, engaging, and personalized for everyone, regardless of their current proficiency or location.
        </p>
      </section>

      <section className="vision-section">
        <h2>Our Vision</h2>
        <p>
          We envision a world where every individual has the opportunity to learn and preserve their mother tongue, fostering a deeper
          understanding of their roots and strengthening cultural bonds across generations. LingoRoots aims to be the leading platform
          for learning indigenous and less commonly taught languages, supported by a vibrant community of learners and educators.
        </p>
      </section>

      <section className="team-section">
        <h2>Meet the Team (Placeholder)</h2>
        <p>
          LingoRoots is built by a passionate team of linguists, educators, developers, and cultural enthusiasts dedicated to language preservation and education.
          <em>(More detailed team information can be added here later.)</em>
        </p>
        {/* Placeholder for team member cards or images */}
      </section>

      <section className="contact-info">
          <h2>Contact Us</h2>
          <p>Have questions or want to get involved? Reach out to us!</p>
          <p>Email: <a href="mailto:info@lingoroots.com">info@lingoroots.com</a></p>
          {/* Add more contact details or a contact form link if necessary */}
      </section>

      <footer className="about-footer">
        <p>&copy; {new Date().getFullYear()} LingoRoots. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;