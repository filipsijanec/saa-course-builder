import React, { useState, useEffect } from 'react';
import './index.css';

const topics = [
  { id: 1, name: 'Film Scoring Basics', type: 'Lesson', duration: 30, sessions: 1, 
    description: 'Learn the fundamentals of scoring for film, including themes, motifs, and spotting scenes.', 
    tags: ['Film', 'Basics'] },
  { id: 2, name: 'Adaptive Game Music', type: 'Mini-Course', duration: 60, sessions: 1, 
    description: 'Understand how to create music that adapts dynamically to gameplay using FMOD/Wwise.', 
    tags: ['Game', 'Adaptive'] },
  { id: 3, name: 'Orchestration Prep', type: 'Lesson', duration: 30, sessions: 1, 
    description: 'Prepare orchestral scores and sessions efficiently, ready for recording.', 
    tags: ['Orchestration', 'Recording'] },
  { id: 4, name: 'Assignments Project', type: 'Assignment', duration: 60, sessions: 2, 
    description: 'Complete a project assignment with 2 guided sessions and feedback.', 
    tags: ['Project', 'Portfolio'] },
  { id: 5, name: 'DAW Workflow', type: 'Mini-Course', duration: 45, sessions: 1, 
    description: 'Master essential DAW functions and workflow tips for fast, professional scoring.', 
    tags: ['DAW', 'Workflow'] },
  { id: 6, name: 'Director Meeting Prep', type: 'Lesson', duration: 30, sessions: 1, 
    description: 'Learn how to effectively meet with directors and handle music briefs.', 
    tags: ['Film', 'Professional'] },
];

const allTags = [...new Set(topics.flatMap(t => t.tags))];
const types = ['All', 'Lesson', 'Mini-Course', 'Assignment'];

const pathways = {
  'Entrance Exam Prep': [1,3,5],
  'Film Portfolio Builder': [1,6,4],
  'Game Portfolio Builder': [2,4,5],
  'Learn Game Music': [2,5,4]
};

const sessionPacks = [
  { label: '1 Session', sessions: 1, discount: 0 },
  { label: '5 Sessions', sessions: 5, discount: 0.1 },
  { label: '10 Sessions', sessions: 10, discount: 0.2 },
  { label: '20 Sessions', sessions: 20, discount: 0.3 },
];

function App() {
  const [selectedPathway, setSelectedPathway] = useState('Entrance Exam Prep');
  const [coursePlan, setCoursePlan] = useState([]);
  const [sessionPack, setSessionPack] = useState(sessionPacks[0]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [animatingTopic, setAnimatingTopic] = useState(null);

  // Filters
  const [tagFilter, setTagFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedPlan = JSON.parse(localStorage.getItem('saa_course_plan'));
    if(savedPlan) setCoursePlan(savedPlan);
  }, []);

  useEffect(() => {
    localStorage.setItem('saa_course_plan', JSON.stringify(coursePlan));
  }, [coursePlan]);

  useEffect(() => {
    const ids = pathways[selectedPathway];
    const initialPlan = topics.filter(t => ids.includes(t.id));
    setCoursePlan(initialPlan);
  }, [selectedPathway]);

  const addTopic = (topic, event) => {
    const totalSessions = coursePlan.reduce((acc,t)=>acc+t.sessions,0);
    if(totalSessions + topic.sessions <= sessionPack.sessions){
      // Start animation
      const sourceElement = event.target.closest('.topic-row');
      const targetSlotIndex = totalSessions; // First available slot
      
      if(sourceElement) {
        // Create flying element
        const flyingElement = sourceElement.cloneNode(true);
        flyingElement.className = 'topic-row topic-flying';
        flyingElement.style.position = 'fixed';
        flyingElement.style.pointerEvents = 'none';
        flyingElement.style.zIndex = '500';
        
        // Get source position
        const sourceRect = sourceElement.getBoundingClientRect();
        flyingElement.style.left = sourceRect.left + 'px';
        flyingElement.style.top = sourceRect.top + 'px';
        flyingElement.style.width = sourceRect.width + 'px';
        
        // Find target slot position
        const targetSlot = document.querySelector(`.session-slot[data-slot-index="${targetSlotIndex}"]`);
        if(targetSlot) {
          const targetRect = targetSlot.getBoundingClientRect();
          const deltaX = targetRect.left - sourceRect.left;
          const deltaY = targetRect.top - sourceRect.top;
          
          flyingElement.style.setProperty('--fly-x', deltaX + 'px');
          flyingElement.style.setProperty('--fly-y', deltaY + 'px');
          
          // Add to DOM and start animation
          document.body.appendChild(flyingElement);
          sourceElement.classList.add('adding');
          targetSlot.classList.add('slot-receiving');
          
          // Clean up after animation
          setTimeout(() => {
            setCoursePlan([...coursePlan, topic]);
            document.body.removeChild(flyingElement);
            sourceElement.classList.remove('adding');
            targetSlot.classList.remove('slot-receiving');
          }, 800);
        } else {
          // Fallback if no target slot found
          setCoursePlan([...coursePlan, topic]);
        }
      } else {
        // Fallback if no source element found
        setCoursePlan([...coursePlan, topic]);
      }
    } else {
      alert('Not enough sessions in your pack!');
    }
  };

  const removeTopic = (id, event) => {
    const topicToRemove = coursePlan.find(t => t.id === id);
    if(!topicToRemove) return;
    
    const sourceElement = event?.target.closest('.session-slot');
    
    if(sourceElement) {
      // Create flying element for removal animation
      const flyingElement = sourceElement.cloneNode(true);
      flyingElement.className = 'session-slot topic-flying-away';
      flyingElement.style.position = 'fixed';
      flyingElement.style.pointerEvents = 'none';
      flyingElement.style.zIndex = '500';
      
      // Get source position
      const sourceRect = sourceElement.getBoundingClientRect();
      flyingElement.style.left = sourceRect.left + 'px';
      flyingElement.style.top = sourceRect.top + 'px';
      flyingElement.style.width = sourceRect.width + 'px';
      flyingElement.style.height = sourceRect.height + 'px';
      
      // Random direction for flying away (upper corners)
      const directions = [
        { x: -200, y: -150 }, // upper left
        { x: 200, y: -150 },  // upper right
        { x: -300, y: -100 }, // far upper left
        { x: 300, y: -100 },  // far upper right
      ];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      
      flyingElement.style.setProperty('--fly-out-x', randomDirection.x + 'px');
      flyingElement.style.setProperty('--fly-out-y', randomDirection.y + 'px');
      
      // Add visual feedback to source slot
      sourceElement.classList.add('slot-removing');
      
      // Add flying element to DOM
      document.body.appendChild(flyingElement);
      
      // Clean up and remove topic after animation
      setTimeout(() => {
        setCoursePlan(coursePlan.filter(t => t.id !== id));
        document.body.removeChild(flyingElement);
        sourceElement.classList.remove('slot-removing');
      }, 1000);
    } else {
      // Fallback if no source element found
      setCoursePlan(coursePlan.filter(t => t.id !== id));
    }
  };

  const totalSessionsUsed = coursePlan.reduce((acc,t)=>acc+t.sessions,0);
  const totalPrice = (sessionPack.sessions * 50) * (1 - sessionPack.discount);

  const filteredTopics = topics.filter(t => {
    const matchesTag = tagFilter === 'All' || t.tags.includes(tagFilter);
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesType && matchesSearch;
  });

  return (
    <div style={{display:'flex', padding:'20px'}}>
      {/* Left Panel: Topic Library */}
      <div style={{flex:1, marginRight:'20px'}}>
        <h2>Select Pathway</h2>
        <select value={selectedPathway} onChange={e=>setSelectedPathway(e.target.value)}>
          {Object.keys(pathways).map(p=><option key={p} value={p}>{p}</option>)}
        </select>

        <h3 style={{marginTop:'15px'}}>Filters</h3>
        <div>
          <label>Tag: </label>
          <select value={tagFilter} onChange={e=>setTagFilter(e.target.value)}>
            <option value="All">All</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
        <div>
          <label>Type: </label>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Search: </label>
          <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by name" />
        </div>

        <h2 style={{marginTop:'20px'}}>Topic Library</h2>
        {filteredTopics.map(t => (
          <div key={t.id} className="topic-row" style={{padding:'8px', border:'1px solid #ccc', margin:'6px 0', borderRadius:'6px'}}>
            <div>
              <strong>{t.name}</strong> ({t.type}, {t.duration} min, {t.sessions} session{t.sessions>1?'s':''})
              <button className="add-remove" style={{marginLeft:'10px'}} onClick={(e)=>addTopic(t, e)}>Add</button>
              <button className="info" style={{marginLeft:'6px'}} onClick={()=>setSelectedTopic(t)}>Info</button>
            </div>
            <div>
              {t.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Right Panel: Course Plan */}
      <div style={{flex:1}}>
        <h2>Your Course Plan</h2>
        <div>
          Session Pack: 
          <select value={sessionPack.label} onChange={e=>setSessionPack(sessionPacks.find(sp=>sp.label===e.target.value))}>
            {sessionPacks.map(sp=><option key={sp.label} value={sp.label}>{sp.label}</option>)}
          </select>
        </div>
        <div>Sessions Used: {totalSessionsUsed}/{sessionPack.sessions}</div>
        
        {/* Session Slots */}
        <div style={{marginTop:'15px'}}>
          <h3>Session Slots</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'8px', marginTop:'10px'}}>
            {Array.from({length: sessionPack.sessions}, (_, slotIndex) => {
              // Calculate which topic occupies this slot
              let currentSlot = 0;
              let topicForSlot = null;
              let sessionWithinTopic = 0;
              
              for(let topic of coursePlan) {
                for(let i = 0; i < topic.sessions; i++) {
                  if(currentSlot === slotIndex) {
                    topicForSlot = topic;
                    sessionWithinTopic = i + 1;
                    break;
                  }
                  currentSlot++;
                }
                if(topicForSlot) break;
              }
              
              return (
                <div 
                  key={slotIndex} 
                  className="session-slot" 
                  data-slot-index={slotIndex}
                  style={{
                    padding: '12px',
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    backgroundColor: topicForSlot ? '#e8f5e8' : '#f8f8f8',
                    borderColor: topicForSlot ? '#4caf50' : '#ccc',
                    borderStyle: topicForSlot ? 'solid' : 'dashed',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  {topicForSlot ? (
                    <div>
                      <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '4px'}}>
                        {topicForSlot.name}
                      </div>
                      <div style={{fontSize: '12px', color: '#666', marginBottom: '6px'}}>
                        Session {sessionWithinTopic} of {topicForSlot.sessions} • {topicForSlot.type}
                      </div>
                      <div>
                        <button 
                          className="add-remove" 
                          style={{fontSize: '11px', padding: '2px 6px'}}
                          onClick={(e)=>removeTopic(topicForSlot.id, e)}
                        >
                          Remove
                        </button>
                        <button 
                          className="info" 
                          style={{fontSize: '11px', padding: '2px 6px'}}
                          onClick={()=>setSelectedTopic(topicForSlot)}
                        >
                          Info
                        </button>
                      </div>
                      <div style={{marginTop: '4px'}}>
                        {topicForSlot.tags.map(tag => 
                          <span key={tag} className="tag" style={{fontSize: '10px', padding: '1px 4px'}}>{tag}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', color: '#999', fontSize: '14px'}}>
                      <div style={{marginBottom: '8px'}}>Slot {slotIndex + 1}</div>
                      <div style={{fontStyle: 'italic'}}>Add Topic</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{marginTop:'20px'}}>
          <strong>Total Price: £{totalPrice.toFixed(2)}</strong>
        </div>
      </div>

      {/* Modal for Topic Description */}
      {selectedTopic && (
        <div className="modal-overlay" onClick={()=>setSelectedTopic(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <h3>{selectedTopic.name}</h3>
            <p>{selectedTopic.description}</p>
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
