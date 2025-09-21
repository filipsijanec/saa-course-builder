import React, { useState, useEffect } from 'react';
import './index.css';

const TOPICS = [
  {
    id: 1,
    name: 'Spotting a Film',
    type: 'Mini-course',
    description: 'Learn the 5 crucial decisions when spotting a film.',
    tags: ['Film', 'Technique'],
    sessionsRequired: 1
  },
  {
    id: 2,
    name: 'FMOD Basics',
    type: 'Mini-course',
    description: 'Understand the essentials of FMOD for game music.',
    tags: ['Game', 'Tech'],
    sessionsRequired: 1
  },
  {
    id: 3,
    name: 'Portfolio Assignment: Film',
    type: 'Assignment',
    description: 'Create a portfolio piece for film scoring. Requires 2 sessions.',
    tags: ['Film', 'Portfolio'],
    sessionsRequired: 2
  },
  // Add more topics here...
];

const PATHWAYS = [
  {
    name: 'Film Portfolio',
    topicIds: [1, 3]
  },
  {
    name: 'Game Portfolio',
    topicIds: [2]
  },
  {
    name: 'Game Music Essentials',
    topicIds: [2]
  },
  {
    name: 'Entrance Exam Prep',
    topicIds: [1,2]
  }
];

const SESSION_PACKS = [
  { sessions: 1, discount: 0 },
  { sessions: 5, discount: 0.1 },
  { sessions: 10, discount: 0.2 },
  { sessions: 20, discount: 0.3 }
];

function App() {
  const savedSelection = JSON.parse(localStorage.getItem('saaSelection')) || [];
  const [selectedTopics, setSelectedTopics] = useState(savedSelection);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [filterTag, setFilterTag] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [sessionPack, setSessionPack] = useState(1);
  const [pathway, setPathway] = useState(null);

  useEffect(() => {
    localStorage.setItem('saaSelection', JSON.stringify(selectedTopics));
  }, [selectedTopics]);

  // Auto-send iframe height
  useEffect(() => {
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'setHeight', height }, '*');
    };
    sendHeight();
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sendHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, []);

  const filteredTopics = TOPICS.filter(t => 
    (filterTag ? t.tags.includes(filterTag) : true) &&
    (filterType ? t.type === filterType : true) &&
    (search ? t.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const toggleTopic = (topic) => {
    if(selectedTopics.find(t=>t.id===topic.id)){
      setSelectedTopics(selectedTopics.filter(t=>t.id!==topic.id));
    } else {
      const totalSessions = selectedTopics.reduce((sum,t)=>sum+t.sessionsRequired,0) + topic.sessionsRequired;
      if(totalSessions <= sessionPack) setSelectedTopics([...selectedTopics, topic]);
      else alert(`This selection exceeds your session pack of ${sessionPack} sessions.`);
    }
  };

  const applyPathway = (p) => {
    setPathway(p.name);
    const pathwayTopics = TOPICS.filter(t=>p.topicIds.includes(t.id));
    const totalSessions = pathwayTopics.reduce((sum,t)=>sum+t.sessionsRequired,0);
    if(totalSessions <= sessionPack){
      setSelectedTopics(pathwayTopics);
    } else {
      alert(`Pathway exceeds your session pack. Adjust sessions or selection.`);
    }
  };

  return (
    <div className="container">
      <h1>Sound Arcade Academy — Course Builder</h1>

      {/* Session Pack Selector */}
      <div className="session-pack">
        <label>Session Pack: </label>
        <select value={sessionPack} onChange={e=>setSessionPack(Number(e.target.value))}>
          {SESSION_PACKS.map(p=>(
            <option key={p.sessions} value={p.sessions}>
              {p.sessions} sessions {p.discount>0 ? `(${p.discount*100}% off)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Pathways */}
      <div className="pathways">
        <h3>Predefined Pathways:</h3>
        {PATHWAYS.map(p => (
          <button key={p.name} onClick={()=>applyPathway(p)} style={{marginRight:'6px', marginBottom:'6px', backgroundColor:'#f4147f', color:'#fff'}}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="filters">
        <select onChange={e=>setFilterType(e.target.value)} value={filterType}>
          <option value="">Filter by Type</option>
          <option value="1:1 lesson">1:1 lesson</option>
          <option value="Mini-course">Mini-course</option>
          <option value="Assignment">Assignment</option>
        </select>
        <select onChange={e=>setFilterTag(e.target.value)} value={filterTag}>
          <option value="">Filter by Tag</option>
          <option value="Film">Film</option>
          <option value="Game">Game</option>
          <option value="Tech">Tech</option>
          <option value="Portfolio">Portfolio</option>
          <option value="Technique">Technique</option>
        </select>
        <input type="text" placeholder="Search by name" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Topics List */}
      <div className="topics-list">
        {filteredTopics.map(topic=>(
          <div key={topic.id} className="topic">
            <div style={{flex:'1'}} onClick={()=>toggleTopic(topic)}>
              {topic.name} ({topic.type}) - {topic.sessionsRequired} session(s)
            </div>
            <div style={{display:'flex', gap:'4px', color:'#aaa'}}>
              {topic.tags.map(tag=><span key={tag} className="tag">{tag}</span>)}
            </div>
            <button className="info" onClick={()=>setSelectedTopic(topic)}>Info</button>
          </div>
        ))}
      </div>

      {/* Selected Topics */}
      <div className="selected-topics">
        <h3>Selected Topics:</h3>
        {selectedTopics.length===0 ? <p>None</p> : selectedTopics.map(t=>(
          <div key={t.id}>{t.name} ({t.type})</div>
        ))}
      </div>

      {/* Modal for Info */}
      {selectedTopic && (
        <div className="modal-overlay" onClick={()=>setSelectedTopic(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <h3>{selectedTopic.name}</h3>
            <p style={{color:'#666'}}>{selectedTopic.description}</p>
            <div style={{marginTop:'6px'}}>
              {selectedTopic.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
            <button className="info" onClick={()=>setSelectedTopic(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
