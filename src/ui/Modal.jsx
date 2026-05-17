import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { portfolio } from "../data/portfolio.js";

// ─── Animated stat counter ────────────────────────────────────────────────────
function StatCounter({ value, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return (
    <div className="stat-card">
      <span className="stat-value">{count}+</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ─── About panel ─────────────────────────────────────────────────────────────
function AboutPanel() {
  return (
    <div className="panel-about">
      {/* Avatar + intro */}
      <div className="about-hero">
        <div className="about-avatar">
          <span>AE</span>
        </div>
        <div className="about-intro">
          <div className="panel-eyebrow">{portfolio.about.kicker}</div>
          <h3 className="about-name">{portfolio.name}</h3>
          <p className="about-title-text">{portfolio.title}</p>
        </div>
      </div>

      {/* Bio */}
      {portfolio.about.body.split("\n\n").map((para, i) => (
        <p key={i} className="panel-body">{para}</p>
      ))}

      {/* Stats */}
      <div className="stats-row">
        {portfolio.about.stats.map((s) => (
          <StatCounter key={s.label} value={s.value} label={s.label} />
        ))}
      </div>

      {/* Goals */}
      <div className="panel-tags">
        {portfolio.about.goals.map((g) => (
          <span key={g} className="tag-badge">{g}</span>
        ))}
      </div>

      {/* Timeline */}
      <div className="timeline">
        {portfolio.about.timeline.map((item, i) => (
          <motion.div
            key={i}
            className="timeline-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 + 0.2 }}
          >
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-year">{item.year}</div>
              <div className="timeline-role">{item.role}</div>
              <div className="timeline-desc">{item.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Skills panel ─────────────────────────────────────────────────────────────
function SkillsPanel() {
  const [activeTab, setActiveTab] = useState("technical");

  return (
    <div className="panel-skills">
      {/* Tab switcher */}
      <div className="skill-tabs">
        {["technical", "tools"].map((tab) => (
          <button
            key={tab}
            className={`skill-tab${activeTab === tab ? " skill-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "technical" ? "Technical Skills" : "Tools & Software"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "technical" ? (
          <motion.div
            key="technical"
            className="skill-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {portfolio.skills.technical.map((skill, i) => (
              <motion.div
                key={skill.name}
                className="skill-row"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="skill-meta">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-pct">{skill.level}%</span>
                </div>
                <div className="skill-bar-track">
                  <motion.div
                    className="skill-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.level}%` }}
                    transition={{ delay: i * 0.04 + 0.1, duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="tools"
            className="tools-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {portfolio.skills.tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                className="tool-card"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.06 }}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-name">{tool.name}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Projects panel ───────────────────────────────────────────────────────────
function ProjectsPanel() {
  return (
    <div className="panel-projects">
      {portfolio.projects.map((project, i) => (
        <motion.article
          key={project.id}
          className="project-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{ "--accent": project.color }}
        >
          <div className="project-header">
            <div className="project-accent-line" />
            <div className="project-role">{project.role}</div>
            <h3 className="project-title">{project.title}</h3>
          </div>
          <p className="project-desc">{project.text}</p>
          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="project-tag">{tag}</span>
            ))}
          </div>
          <div className="project-actions">
            <a
              className="btn-ghost"
              href={project.github}
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon /> GitHub
            </a>
            {project.demo && project.demo !== "#" ? (
              <a
                className="btn-neon"
                href={project.demo}
                target="_blank"
                rel="noreferrer"
              >
                ↗ Live Demo
              </a>
            ) : (
              <span className="btn-coming">Coming Soon</span>
            )}
          </div>
        </motion.article>
      ))}
    </div>
  );
}

// ─── Resume panel ─────────────────────────────────────────────────────────────
function ResumePanel() {
  return (
    <div className="panel-resume">
      <p className="panel-body">{portfolio.resume.body}</p>

      {/* Certifications */}
      <div className="resume-section">
        <div className="resume-section-title">🏆 Certifications</div>
        {portfolio.resume.certifications.map((cert) => (
          <motion.div
            key={cert.title}
            className="cert-card"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cert-title">{cert.title}</div>
            <div className="cert-meta">{cert.issuer} · {cert.year}</div>
          </motion.div>
        ))}
      </div>

      {/* Activities */}
      <div className="resume-section">
        <div className="resume-section-title">⚡ Activities</div>
        <ul className="activity-list">
          {portfolio.resume.activities.map((act, i) => (
            <motion.li
              key={i}
              className="activity-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.15 }}
            >
              {act}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Download CTA */}
      <div className="resume-cta">
        <a className="btn-neon btn-neon--large" href={portfolio.resume.url} download="Asheed_Eliyangod_Resume.pdf">
          ⬇ Download Resume
        </a>
      </div>
    </div>
  );
}

// ─── Contact panel ────────────────────────────────────────────────────────────
function ContactPanel() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Visual-only — no backend
    setSent(true);
    setTimeout(() => setSent(false), 3200);
  }

  return (
    <div className="panel-contact">
      {/* Social links */}
      <div className="contact-socials">
        {portfolio.contact.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="social-chip"
          >
            <SocialIcon type={item.icon} />
            {item.label}
          </a>
        ))}
      </div>

      {/* Form */}
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            className="form-input form-textarea"
            placeholder="What's on your mind?"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>
        <motion.button
          type="submit"
          className="btn-neon btn-neon--large btn-neon--full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {sent ? "✓ Message Sent!" : "Send Message"}
        </motion.button>
      </form>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.93C5.73 21.1 5.04 18.9 5.04 18.9c-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.64 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.38-2.67 5.35-5.21 5.63.41.35.78 1.04.78 2.1v3.12c0 .3.2.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

function SocialIcon({ type }) {
  if (type === "github") return <GithubIcon />;
  if (type === "linkedin") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zm7.5 0h3.83v2.13h.06c.53-1 1.84-2.13 3.79-2.13C19.61 8.5 21 10.73 21 15v9h-4v-8.13c0-1.93-.03-4.41-2.69-4.41-2.69 0-3.1 2.1-3.1 4.27V24H8V8.5z" />
    </svg>
  );
  if (type === "email") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
  if (type === "itch") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.13 1.6C1.74 2.4.04 4.18 0 5.9v1.03c0 1.3.59 2.44 1.57 3.2a1.85 1.85 0 0 0 2.1 0C4.67 9.37 5.25 8.23 5.25 6.93v-.2C5.27 7.8 5.86 8.9 6.84 9.65a1.85 1.85 0 0 0 2.1 0c.98-.74 1.56-1.87 1.56-3.15v-.34c0 1.28.58 2.41 1.56 3.15a1.85 1.85 0 0 0 2.1 0c.98-.74 1.57-1.87 1.57-3.15v.2c0 1.3.58 2.44 1.56 3.2a1.85 1.85 0 0 0 2.1 0C20.37 8.8 21 7.7 21 6.43V5.9C20.96 4.18 19.26 2.4 17.87 1.6 16.3.72 10.63 0 10.5 0S4.7.72 3.13 1.6zM8 12.6c-.44 0-3.42.28-5 1.5v6.4c0 .83.67 1.5 1.5 1.5h12c.83 0 1.5-.67 1.5-1.5v-6.4c-1.58-1.22-4.56-1.5-5-1.5-.55 0-1.14.77-2.5.77S8.55 12.6 8 12.6z" />
    </svg>
  );
  return null;
}

// ─── Content router ───────────────────────────────────────────────────────────
function Content({ panel }) {
  if (panel === "about")    return <AboutPanel />;
  if (panel === "skills")   return <SkillsPanel />;
  if (panel === "projects") return <ProjectsPanel />;
  if (panel === "resume")   return <ResumePanel />;
  return <ContactPanel />;
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
const PANEL_LABELS = {
  about: "About Me",
  skills: "Skills",
  projects: "Projects",
  resume: "Resume & Certs",
  contact: "Contact",
};

export function Modal({ panel, onClose }) {
  const title = PANEL_LABELS[panel] ?? panel;

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="modal-panel"
        initial={{ opacity: 0, scale: 0.94, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">Asheed Eliyangod</div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="modal-sep" />

        {/* Content */}
        <div className="modal-body">
          <Content panel={panel} />
        </div>
      </motion.section>
    </motion.div>
  );
}
