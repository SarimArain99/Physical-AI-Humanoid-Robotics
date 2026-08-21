import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { useSession } from '../utils/authClient';
import { Bot, Layers, Cpu, Eye, ArrowRight, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import './index.css';

const modules = [
  {
    icon: <Bot className="module-icon" />,
    title: 'Module 1: The Robotic Nervous System',
    description: 'Master ROS 2 middleware for robot control — nodes, topics, services, and bridging Python agents to controllers.',
    weeks: 'Weeks 1–5',
    link: '/docs/module-1-ros2/intro-physical-ai',
  },
  {
    icon: <Layers className="module-icon" />,
    title: 'Module 2: The Digital Twin',
    description: 'Build physics simulations in Gazebo and Unity — simulate gravity, collisions, LiDAR, and IMU sensors.',
    weeks: 'Weeks 6–7',
    link: '/docs/module-2-simulation/gazebo-setup',
  },
  {
    icon: <Cpu className="module-icon" />,
    title: 'Module 3: The AI-Robot Brain',
    description: 'Leverage NVIDIA Isaac for photorealistic simulation, synthetic data generation, and Nav2 path planning.',
    weeks: 'Weeks 8–10',
    link: '/docs/module-3-nvidia-isaac/isaac-sdk-sim',
  },
  {
    icon: <Eye className="module-icon" />,
    title: 'Module 4: Vision-Language-Action',
    description: 'Converge LLMs and robotics — voice commands with Whisper, cognitive planning with GPT, and autonomous manipulation.',
    weeks: 'Weeks 11–13',
    link: '/docs/module-4-vla/humanoid-kinematics',
  },
];

const outcomes = [
  'Understand Physical AI principles and embodied intelligence',
  'Master ROS 2 (Robot Operating System) for robotic control',
  'Simulate robots with Gazebo and Unity digital twins',
  'Develop with NVIDIA Isaac AI robot platform',
  'Design humanoid robots for natural human interactions',
  'Integrate GPT models for conversational robotics',
];

function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">

          
          <Heading as="h1" className="hero-title">
            {session ? (
              <>Welcome back, <span className="hero-title-accent">{session.user.name}</span></>
            ) : (
              <>Physical AI & <span className="hero-title-accent">Humanoid Robotics</span></>
            )}
          </Heading>
          
          <p className="hero-subtitle">
            Bridge the gap between digital intelligence and the physical world. 
            Learn to design, simulate, and deploy humanoid robots capable of 
            natural human interactions using ROS 2, Gazebo, and NVIDIA Isaac.
          </p>
          
          <div className="hero-buttons">
            <Link className="button button--primary button--lg" to="/docs/intro">
              Start Learning <ArrowRight size={18} style={{marginLeft: '8px'}}/>
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/module-1-ros2/intro-physical-ai">
              Explore Modules
            </Link>
          </div>
          
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">Modules</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">13</span>
              <span className="stat-label">Weeks</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">20+</span>
              <span className="stat-label">Chapters</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1</span>
              <span className="stat-label">Capstone</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section className="modules-section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Course Structure</span>
          <h2 className="section-title">Four Pillars of Physical AI</h2>
          <p className="section-subtitle">
            A comprehensive engineering journey from robot middleware to autonomous humanoid systems.
          </p>
        </div>
        <div className="modules-grid">
          {modules.map((mod, idx) => (
            <Link key={idx} className="card module-card" to={mod.link}>
              <div className="module-icon-wrapper">{mod.icon}</div>
              <h3 className="module-card-title">{mod.title}</h3>
              <p className="module-card-desc">{mod.description}</p>
              <div className="module-card-footer">
                <span className="module-weeks">{mod.weeks}</span>
                <ChevronRight size={16} className="module-chevron" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="why-section">
      <div className="container">
        <div className="why-grid">
          <div className="why-content">
            <span className="section-label">Why This Matters</span>
            <h2 className="why-title">The Future of AI is Physical</h2>
            <p className="why-text">
              Humanoid robots are poised to excel in our human-centered world because they 
              share our physical form and can be trained with abundant data from interacting 
              in human environments. This represents a significant transition from AI models 
              confined to digital environments to embodied intelligence that operates in 
              physical space.
            </p>
          </div>
          <div className="outcomes-list">
            {outcomes.map((text, idx) => (
              <div key={idx} className="outcome-item">
                <CheckCircle2 size={20} className="outcome-icon" />
                <span className="outcome-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Physical AI & Humanoid Robotics"
      description="Professional engineering textbook for designing and simulating humanoid robots.">
      <HeroSection />
      <main>
        <ModulesSection />
        <WhySection />
      </main>
    </Layout>
  );
}
