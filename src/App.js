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
  { id: 7, name: 'Submission Feedback', type: 'Lesson', duration: 30, sessions: 1, 
    description: 'Receive detailed feedback on your submissions and learn how to improve your work.', 
    tags: ['Lesson', 'Feedback'] },
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
  const [sessionPack, setSessionPack] = useState(sessionPacks[1]); // Default to 5 sessions
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [notification, setNotification] = useState(null);
  const [availableTopics, setAvailableTopics] = useState(topics); // Track available topics for removal
  
  // New: slot-based storage for precise positioning
  const [sessionSlots, setSessionSlots] = useState({});

  // Filters
  const [tagFilter, setTagFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedPlan = JSON.parse(localStorage.getItem('saa_course_plan'));
    if(savedPlan) setCoursePlan(savedPlan);
    
    const savedSlots = JSON.parse(localStorage.getItem('saa_session_slots'));
    if(savedSlots) setSessionSlots(savedSlots);
  }, []);

  useEffect(() => {
    localStorage.setItem('saa_course_plan', JSON.stringify(coursePlan));
    localStorage.setItem('saa_session_slots', JSON.stringify(sessionSlots));
  }, [coursePlan, sessionSlots]);

  useEffect(() => {
    const ids = pathways[selectedPathway];
    const initialPlan = topics.filter(t => ids.includes(t.id));
    setCoursePlan(initialPlan);
    
    // Reset available topics to full list, then remove pathway topics (except Feedback topics)
    setAvailableTopics(topics.filter(topic => {
      // Keep the topic if it's not in the pathway OR if it's a Feedback topic
      return !ids.includes(topic.id) || topic.tags.includes('Feedback');
    }));
    
    // Create sequential slot mapping for pathway topics
    const newSlots = {};
    let slotIndex = 0;
    for(let topic of initialPlan) {
      for(let i = 0; i < topic.sessions; i++) {
        newSlots[slotIndex] = { topicId: topic.id, sessionIndex: i };
        slotIndex++;
      }
    }
    setSessionSlots(newSlots);
  }, [selectedPathway]);

  const showNotification = (message, type = 'error', onYes = null, onNo = null) => {
    setNotification({ message, type, onYes, onNo });
    // Remove setTimeout - now requires manual dismissal
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const findFirstAvailableSlot = (sessionsNeeded) => {
    // Find the first consecutive available slots that can fit the topic
    for(let startSlot = 0; startSlot <= sessionPack.sessions - sessionsNeeded; startSlot++) {
      let canFit = true;
      for(let i = 0; i < sessionsNeeded; i++) {
        if(sessionSlots[startSlot + i]) {
          canFit = false;
          break;
        }
      }
      if(canFit) {
        return startSlot;
      }
    }
    return -1; // No available consecutive slots
  };

  const findFirstAvailableSlotInSlots = (slotsObject, sessionsNeeded) => {
    // Find the first consecutive available slots that can fit the topic in a given slots object
    for(let startSlot = 0; startSlot <= sessionPack.sessions - sessionsNeeded; startSlot++) {
      let canFit = true;
      for(let i = 0; i < sessionsNeeded; i++) {
        if(slotsObject[startSlot + i]) {
          canFit = false;
          break;
        }
      }
      if(canFit) {
        return startSlot;
      }
    }
    return -1; // No available consecutive slots
  };

  const compactSlots = () => {
    // Get all topics with their slot positions and sort by current position
    const topicsWithSlots = [];
    Object.keys(sessionSlots).forEach(slotIndex => {
      const slotData = sessionSlots[slotIndex];
      if (slotData && slotData.sessionIndex === 0) { // Only count the first session of each topic
        const topic = coursePlan.find(t => t.id === slotData.topicId);
        if (topic) {
          topicsWithSlots.push({
            topic: topic,
            currentStartSlot: parseInt(slotIndex)
          });
        }
      }
    });
    
    // Sort by current position to maintain relative order
    topicsWithSlots.sort((a, b) => a.currentStartSlot - b.currentStartSlot);
    
    // Create new slot mapping with topics moved to the beginning
    const newSlots = {};
    let nextAvailableSlot = 0;
    
    topicsWithSlots.forEach(({ topic }) => {
      for(let i = 0; i < topic.sessions; i++) {
        newSlots[nextAvailableSlot + i] = { topicId: topic.id, sessionIndex: i };
      }
      nextAvailableSlot += topic.sessions;
    });
    
    setSessionSlots(newSlots);
    return nextAvailableSlot; // Return the first available slot after compacting
  };

  const addTopic = (topic, event) => {
    // Check if topic already exists
    const existingTopic = coursePlan.find(t => t.id === topic.id);
    if(existingTopic) {
      // Special handling for Feedback topics
      if(topic.tags.includes('Feedback')) {
        showNotification(
          `Feedback is already added to the sessions. Are you sure you want to add another one?`,
          'warning',
          () => {
            // Yes - proceed with adding another Feedback topic
            proceedWithTopicAddition(topic, event);
          },
          () => {
            // No - do nothing, just close the dialog
          }
        );
        return;
      } else {
        showNotification(`"${topic.name}" is already added to your course plan! Please choose a different topic.`, 'error');
        return;
      }
    }

    // Proceed with normal topic addition
    proceedWithTopicAddition(topic, event);
  };

  const proceedWithTopicAddition = (topic, event) => {
    
    // Find first available consecutive slots
    let targetSlotIndex = findFirstAvailableSlot(topic.sessions);
    
    if(targetSlotIndex === -1) {
      // Check if we have enough total slots but they're not consecutive
      const totalUsedSlots = Object.keys(sessionSlots).length;
      const totalAvailableSlots = sessionPack.sessions - totalUsedSlots;
      
      if(totalAvailableSlots >= topic.sessions) {
        // We have enough slots but they're fragmented - compact them
        compactSlots();
        
        // Get current session slots and find available slot
        setSessionSlots(currentSessionSlots => {
          const newTargetSlotIndex = findFirstAvailableSlotInSlots(currentSessionSlots, topic.sessions);
          
          if(newTargetSlotIndex !== -1) {
            // Add topic to course plan
            setCoursePlan(currentCoursePlan => [...currentCoursePlan, topic]);
            
            // Remove topic from available topics unless it has Feedback tag
            if(!topic.tags.includes('Feedback')) {
              setAvailableTopics(currentAvailable => 
                currentAvailable.filter(t => t.id !== topic.id)
              );
            }
            
            // Add to slots
            const newSlots = { ...currentSessionSlots };
            for(let i = 0; i < topic.sessions; i++) {
              newSlots[newTargetSlotIndex + i] = { topicId: topic.id, sessionIndex: i };
            }
            
            return newSlots;
          } else {
            showNotification(`Still not enough consecutive sessions available after rearranging.`, 'error');
            return currentSessionSlots;
          }
        });
        return;
      } else {
        showNotification(`Not enough sessions in your ${sessionPack.sessions}-session pack! You need ${topic.sessions} sessions but only ${totalAvailableSlots} are available.`, 'warning');
        return;
      }
    }

    // Start animation
    const sourceElement = event.target.closest('.topic-row');
      
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
          // Add to course plan and slots
          setCoursePlan([...coursePlan, topic]);
          
          // Remove topic from available topics unless it has Feedback tag
          if(!topic.tags.includes('Feedback')) {
            setAvailableTopics(currentAvailable => 
              currentAvailable.filter(t => t.id !== topic.id)
            );
          }
          
          const newSlots = { ...sessionSlots };
          for(let i = 0; i < topic.sessions; i++) {
            newSlots[targetSlotIndex + i] = { topicId: topic.id, sessionIndex: i };
          }
          setSessionSlots(newSlots);
          
          document.body.removeChild(flyingElement);
          sourceElement.classList.remove('adding');
          targetSlot.classList.remove('slot-receiving');
        }, 800);
      } else {
        // Fallback if no target slot found
        addTopicToSlots(topic, targetSlotIndex);
      }
    } else {
      // Fallback if no source element found
      addTopicToSlots(topic, targetSlotIndex);
    }
  };

  const addTopicToSlots = (topic, startSlot) => {
    if(coursePlan.find(t => t.id === topic.id)) return;
    
    setCoursePlan([...coursePlan, topic]);
    
    // Remove topic from available topics unless it has Feedback tag
    if(!topic.tags.includes('Feedback')) {
      setAvailableTopics(currentAvailable => 
        currentAvailable.filter(t => t.id !== topic.id)
      );
    }
    
    const newSlots = { ...sessionSlots };
    for(let i = 0; i < topic.sessions; i++) {
      newSlots[startSlot + i] = { topicId: topic.id, sessionIndex: i };
    }
    setSessionSlots(newSlots);
  };

  const removeTopic = (id, event) => {
    const topicToRemove = coursePlan.find(t => t.id === id);
    if(!topicToRemove) return;
    
    const sourceElement = event?.target.closest('.session-slot');
    
    if(sourceElement) {
      // Get the slot index from the source element
      const slotIndex = parseInt(sourceElement.getAttribute('data-slot-index'));
      
      // For Feedback topics, only remove the specific instance
      if(topicToRemove.tags.includes('Feedback')) {
        removeSpecificFeedbackInstance(topicToRemove, slotIndex, sourceElement);
      } else {
        removeAllInstancesOfTopic(topicToRemove, sourceElement);
      }
    } else {
      // Fallback if no source element found - remove all instances
      removeAllInstancesOfTopic(topicToRemove, null);
    }
  };

  const removeSpecificFeedbackInstance = (topic, startSlotIndex, sourceElement) => {
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
    
    // Clean up and remove topic instance after animation
    setTimeout(() => {
      const newSlots = { ...sessionSlots };
      
      // Remove only the slots for this specific instance
      for(let i = 0; i < topic.sessions; i++) {
        delete newSlots[startSlotIndex + i];
      }
      setSessionSlots(newSlots);
      
      // Check if there are any remaining instances of this Feedback topic
      const remainingSlots = Object.values(newSlots).filter(slot => slot.topicId === topic.id);
      
      // If no more instances, remove from course plan
      if(remainingSlots.length === 0) {
        setCoursePlan(coursePlan.filter(t => t.id !== topic.id));
      }
      
      document.body.removeChild(flyingElement);
      sourceElement.classList.remove('slot-removing');
    }, 1000);
  };

  const removeAllInstancesOfTopic = (topic, sourceElement) => {
    
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
        // Remove from course plan and slots
        setCoursePlan(coursePlan.filter(t => t.id !== topic.id));
        
        // Add topic back to available topics unless it has Feedback tag
        if(!topic.tags.includes('Feedback')) {
          setAvailableTopics(currentAvailable => {
            // Check if topic is already in available list (shouldn't be, but just in case)
            if(!currentAvailable.find(t => t.id === topic.id)) {
              return [...currentAvailable, topic];
            }
            return currentAvailable;
          });
        }
        
        const newSlots = { ...sessionSlots };
        Object.keys(newSlots).forEach(slotIndex => {
          if(newSlots[slotIndex].topicId === topic.id) {
            delete newSlots[slotIndex];
          }
        });
        setSessionSlots(newSlots);
        
        document.body.removeChild(flyingElement);
        sourceElement.classList.remove('slot-removing');
      }, 1000);
    } else {
      // Fallback if no source element found
      setCoursePlan(coursePlan.filter(t => t.id !== topic.id));
      
      // Add topic back to available topics unless it has Feedback tag
      if(!topic.tags.includes('Feedback')) {
        setAvailableTopics(currentAvailable => {
          // Check if topic is already in available list (shouldn't be, but just in case)
          if(!currentAvailable.find(t => t.id === topic.id)) {
            return [...currentAvailable, topic];
          }
          return currentAvailable;
        });
      }
      
      const newSlots = { ...sessionSlots };
      Object.keys(newSlots).forEach(slotIndex => {
        if(newSlots[slotIndex].topicId === topic.id) {
          delete newSlots[slotIndex];
        }
      });
      setSessionSlots(newSlots);
    }
  };

  // Drag and drop functions
  const handleDragStart = (e, topic) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'library-topic',
      topic: topic
    }));
    e.target.closest('.topic-row').classList.add('dragging');
  };

  const handleSlotDragStart = (e, topic, sourceSlotIndex) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'slot-topic',
      topic: topic,
      sourceSlotIndex: sourceSlotIndex
    }));
    e.target.closest('.session-slot').classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    const topicRow = e.target.closest('.topic-row');
    const sessionSlot = e.target.closest('.session-slot');
    
    if (topicRow) {
      topicRow.classList.remove('dragging');
    }
    if (sessionSlot) {
      sessionSlot.classList.remove('dragging');
    }
    
    // Clean up any drag-over states
    document.querySelectorAll('.session-slot').forEach(slot => {
      slot.classList.remove('drag-over', 'drag-invalid');
    });
  };

  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    const slot = e.currentTarget;
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const topic = JSON.parse(dragData);
        
        // Check if topic already exists
        if(coursePlan.find(t => t.id === topic.id)) {
          slot.classList.remove('drag-over');
          slot.classList.add('drag-invalid');
          return;
        }
        
        // Check if all slots needed for this topic are empty
        let allSlotsEmpty = true;
        for(let i = 0; i < topic.sessions; i++) {
          if(sessionSlots[slotIndex + i]) {
            allSlotsEmpty = false;
            break;
          }
        }
        
        // Check if topic fits within session pack
        const canFitFromThisSlot = slotIndex + topic.sessions <= sessionPack.sessions;
        
        if (allSlotsEmpty && canFitFromThisSlot) {
          slot.classList.remove('drag-invalid');
          slot.classList.add('drag-over');
        } else {
          slot.classList.remove('drag-over');
          slot.classList.add('drag-invalid');
        }
      }
    } catch (error) {
      slot.classList.remove('drag-over');
      slot.classList.add('drag-invalid');
    }
  };

  const handleDragLeave = (e) => {
    const slot = e.currentTarget;
    slot.classList.remove('drag-over', 'drag-invalid');
  };

  const handleDrop = (e, targetSlotIndex) => {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over', 'drag-invalid');
    
    try {
      const dragDataString = e.dataTransfer.getData('application/json');
      if (dragDataString) {
        const dragData = JSON.parse(dragDataString);
        
        if (dragData.type === 'library-topic') {
          // Handle dropping from library (existing logic)
          const topic = dragData.topic;
          
          // Check if topic already exists
          const existingTopic = coursePlan.find(t => t.id === topic.id);
          if(existingTopic) {
            // Special handling for Feedback topics
            if(topic.tags.includes('Feedback')) {
              showNotification(
                `Feedback is already added to the sessions. Are you sure you want to add another one?`,
                'warning',
                () => {
                  // Yes - proceed with adding another Feedback topic
                  proceedWithDragDrop(topic, targetSlotIndex, slot);
                },
                () => {
                  // No - show invalid feedback
                  slot.classList.add('drag-invalid');
                  setTimeout(() => slot.classList.remove('drag-invalid'), 500);
                }
              );
              return;
            } else {
              showNotification(`"${topic.name}" is already added to your course plan!`, 'error');
              slot.classList.add('drag-invalid');
              setTimeout(() => slot.classList.remove('drag-invalid'), 500);
              return;
            }
          }

          proceedWithDragDrop(topic, targetSlotIndex, slot);
        } else if (dragData.type === 'slot-topic') {
          // Handle slot rearrangement
          const topic = dragData.topic;
          const sourceSlotIndex = dragData.sourceSlotIndex;
          
          if (sourceSlotIndex === targetSlotIndex) {
            // Dropped on same slot, do nothing
            return;
          }
          
          const targetSlotData = sessionSlots[targetSlotIndex];
          
          if (!targetSlotData) {
            // Target slot is empty - move topic there
            moveTopicToSlot(topic, sourceSlotIndex, targetSlotIndex);
          } else {
            // Target slot is occupied - swap topics
            const targetTopic = coursePlan.find(t => t.id === targetSlotData.topicId);
            if (targetTopic) {
              swapTopicsInSlots(topic, sourceSlotIndex, targetTopic, targetSlotIndex);
            }
          }
          
          // Add visual feedback
          slot.classList.add('slot-receiving');
          setTimeout(() => {
            slot.classList.remove('slot-receiving');
          }, 600);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const proceedWithDragDrop = (topic, targetSlotIndex, slot) => {
    // Check if all slots needed for this topic are empty
    let allSlotsEmpty = true;
    for(let i = 0; i < topic.sessions; i++) {
      if(sessionSlots[targetSlotIndex + i]) {
        allSlotsEmpty = false;
        break;
      }
    }
    
    const canFitFromThisSlot = targetSlotIndex + topic.sessions <= sessionPack.sessions;
    
    if (allSlotsEmpty && canFitFromThisSlot) {
      // Add topic to course plan and slots
      setCoursePlan([...coursePlan, topic]);
      
      // Remove topic from available topics unless it has Feedback tag
      if(!topic.tags.includes('Feedback')) {
        setAvailableTopics(currentAvailable => 
          currentAvailable.filter(t => t.id !== topic.id)
        );
      }
      
      const newSlots = { ...sessionSlots };
      for(let i = 0; i < topic.sessions; i++) {
        newSlots[targetSlotIndex + i] = { topicId: topic.id, sessionIndex: i };
      }
      setSessionSlots(newSlots);
      
      // Add visual feedback
      slot.classList.add('slot-receiving');
      setTimeout(() => {
        slot.classList.remove('slot-receiving');
      }, 600);
    } else {
      // Check if we can auto-rearrange when dropping on a specific slot that's occupied
      if (!allSlotsEmpty && canFitFromThisSlot) {
        // Check if we have enough total slots but they're not consecutive at this position
        const totalUsedSlots = Object.keys(sessionSlots).length;
        const totalAvailableSlots = sessionPack.sessions - totalUsedSlots;
        
        if(totalAvailableSlots >= topic.sessions) {
          // We have enough slots but they're fragmented - compact them
          compactSlots();
          
          // Get current session slots and find available slot
          setSessionSlots(currentSessionSlots => {
            const newTargetSlotIndex = findFirstAvailableSlotInSlots(currentSessionSlots, topic.sessions);
            
            if(newTargetSlotIndex !== -1) {
              // Add topic to course plan
              setCoursePlan(currentCoursePlan => [...currentCoursePlan, topic]);
              
              // Remove topic from available topics unless it has Feedback tag
              if(!topic.tags.includes('Feedback')) {
                setAvailableTopics(currentAvailable => 
                  currentAvailable.filter(t => t.id !== topic.id)
                );
              }
              
              // Add to slots
              const newSlots = { ...currentSessionSlots };
              for(let i = 0; i < topic.sessions; i++) {
                newSlots[newTargetSlotIndex + i] = { topicId: topic.id, sessionIndex: i };
              }
              
              // Add visual feedback
              slot.classList.add('slot-receiving');
              setTimeout(() => {
                slot.classList.remove('slot-receiving');
              }, 600);
              
              return newSlots;
            } else {
              showNotification(`Still not enough consecutive sessions available after rearranging.`, 'error');
              slot.classList.add('drag-invalid');
              setTimeout(() => slot.classList.remove('drag-invalid'), 500);
              return currentSessionSlots;
            }
          });
          return;
        }
      }
      
      // Invalid drop - show error feedback (fallback)
      const errorMessage = !canFitFromThisSlot 
        ? `"${topic.name}" needs ${topic.sessions} sessions but only ${sessionPack.sessions - targetSlotIndex} slots available from this position!`
        : `Cannot place "${topic.name}" here - some slots are already occupied! Try dropping on an empty area or use the Add button for auto-arrangement.`;
      showNotification(errorMessage, 'error');
      
      slot.classList.add('drag-invalid');
      setTimeout(() => {
        slot.classList.remove('drag-invalid');
      }, 500);
    }
  };

  const moveTopicToSlot = (topic, sourceSlotIndex, targetSlotIndex) => {
    const newSlots = { ...sessionSlots };
    
    // Clear source slots
    for(let i = 0; i < topic.sessions; i++) {
      delete newSlots[sourceSlotIndex + i];
    }
    
    // Set target slots
    for(let i = 0; i < topic.sessions; i++) {
      newSlots[targetSlotIndex + i] = { topicId: topic.id, sessionIndex: i };
    }
    
    setSessionSlots(newSlots);
  };

  const swapTopicsInSlots = (topic1, slot1Index, topic2, slot2Index) => {
    // Get the slot elements for animation
    const slot1Elements = [];
    const slot2Elements = [];
    
    // Collect all slot elements for topic1
    for(let i = 0; i < topic1.sessions; i++) {
      const element = document.querySelector(`.session-slot[data-slot-index="${slot1Index + i}"]`);
      if(element) slot1Elements.push(element);
    }
    
    // Collect all slot elements for topic2
    for(let i = 0; i < topic2.sessions; i++) {
      const element = document.querySelector(`.session-slot[data-slot-index="${slot2Index + i}"]`);
      if(element) slot2Elements.push(element);
    }
    
    // Add swap animation classes
    [...slot1Elements, ...slot2Elements].forEach(element => {
      element.classList.add('slot-swapping');
    });
    
    // Perform the swap after a short delay to show the animation start
    setTimeout(() => {
      const newSlots = { ...sessionSlots };
      
      // Clear both topics' slots
      for(let i = 0; i < topic1.sessions; i++) {
        delete newSlots[slot1Index + i];
      }
      for(let i = 0; i < topic2.sessions; i++) {
        delete newSlots[slot2Index + i];
      }
      
      // Place topic1 at slot2 position
      for(let i = 0; i < topic1.sessions; i++) {
        newSlots[slot2Index + i] = { topicId: topic1.id, sessionIndex: i };
      }
      
      // Place topic2 at slot1 position
      for(let i = 0; i < topic2.sessions; i++) {
        newSlots[slot1Index + i] = { topicId: topic2.id, sessionIndex: i };
      }
      
      setSessionSlots(newSlots);
      
      // Remove animation classes after animation completes
      setTimeout(() => {
        [...slot1Elements, ...slot2Elements].forEach(element => {
          element.classList.remove('slot-swapping');
        });
      }, 800);
    }, 100);
  };

  const totalSessionsUsed = Object.keys(sessionSlots).length;
  const totalPrice = (sessionPack.sessions * 50) * (1 - sessionPack.discount);

  const filteredTopics = availableTopics.filter(t => {
    const matchesTag = tagFilter === 'All' || t.tags.includes(tagFilter);
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesType && matchesSearch;
  });

  return (
    <div style={{display:'flex', padding:'20px'}}>
      {/* Notification Modal */}
      {notification && (
        <div className="modal-overlay" onClick={closeNotification}>
          <div className={`notification-modal notification-modal-${notification.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="notification-content">
              {notification.message}
            </div>
            {notification.onYes && notification.onNo ? (
              <div className="notification-buttons">
                <button className="notification-yes-button" onClick={() => { notification.onYes(); closeNotification(); }}>
                  Yes
                </button>
                <button className="notification-no-button" onClick={() => { notification.onNo(); closeNotification(); }}>
                  No
                </button>
              </div>
            ) : (
              <button className="notification-ok-button" onClick={closeNotification}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
      
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
          <div 
            key={t.id} 
            className="topic-row" 
            style={{padding:'8px', border:'1px solid #ccc', margin:'6px 0', borderRadius:'6px'}}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, t)}
            onDragEnd={handleDragEnd}
          >
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
              // Get topic for this slot from sessionSlots
              const slotData = sessionSlots[slotIndex];
              let topicForSlot = null;
              let sessionWithinTopic = 0;
              
              if(slotData) {
                topicForSlot = coursePlan.find(t => t.id === slotData.topicId);
                sessionWithinTopic = slotData.sessionIndex + 1;
              }
              
              return (
                <div 
                  key={slotIndex} 
                  className="session-slot" 
                  data-slot-index={slotIndex}
                  onDragOver={(e) => handleDragOver(e, slotIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slotIndex)}
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
                    <div
                      draggable="true"
                      onDragStart={(e) => handleSlotDragStart(e, topicForSlot, slotIndex)}
                      onDragEnd={handleDragEnd}
                      style={{cursor: 'move'}}
                    >
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
