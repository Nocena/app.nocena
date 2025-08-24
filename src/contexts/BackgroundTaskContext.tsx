'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Background Task Types
export type TaskType = 
  | 'video-analysis' 
  | 'nft-generation' 
  | 'verification-prep' 
  | 'face-matching'
  | 'blockchain-prep';

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  data: any;
  result?: any;
  error?: string;
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface BackgroundTaskState {
  tasks: { [key: string]: BackgroundTask };
  isProcessing: boolean;
  overallProgress: number;
}

type TaskAction = 
  | { type: 'QUEUE_TASK'; payload: Omit<BackgroundTask, 'id' | 'createdAt'> }
  | { type: 'START_TASK'; payload: { id: string } }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'COMPLETE_TASK'; payload: { id: string; result: any } }
  | { type: 'FAIL_TASK'; payload: { id: string; error: string } }
  | { type: 'CANCEL_TASK'; payload: { id: string } }
  | { type: 'CLEAR_TASKS' };

// Task Context
interface BackgroundTaskContextType {
  state: BackgroundTaskState;
  queueTask: (task: Omit<BackgroundTask, 'id' | 'createdAt'>) => string;
  getTask: (id: string) => BackgroundTask | undefined;
  getTasksByType: (type: TaskType) => BackgroundTask[];
  isTaskCompleted: (id: string) => boolean;
  isTaskRunning: (id: string) => boolean;
  getTaskProgress: (id: string) => number;
  cancelTask: (id: string) => void;
  clearAllTasks: () => void;
  
  // Convenience methods for specific tasks
  startVideoAnalysis: (videoBlob: Blob, challenge: any) => string;
  startNFTGeneration: (userId: string, completionId?: string) => string;
  startVerificationPrep: (videoBlob: Blob, challenge: any) => string;
  startFaceMatching: (videoBlob: Blob, photoBlob: Blob) => string;
}

// Initial state
const initialState: BackgroundTaskState = {
  tasks: {},
  isProcessing: false,
  overallProgress: 0,
};

// Reducer
function backgroundTaskReducer(state: BackgroundTaskState, action: TaskAction): BackgroundTaskState {
  switch (action.type) {
    case 'QUEUE_TASK': {
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const task: BackgroundTask = {
        ...action.payload,
        id,
        createdAt: Date.now(),
      };
      
      return {
        ...state,
        tasks: { ...state.tasks, [id]: task },
        isProcessing: true,
      };
    }
    
    case 'START_TASK': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...task,
            status: 'running',
            startedAt: Date.now(),
          },
        },
      };
    }
    
    case 'UPDATE_PROGRESS': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...task,
            progress: action.payload.progress,
          },
        },
      };
    }
    
    case 'COMPLETE_TASK': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;
      
      const updatedTasks = {
        ...state.tasks,
        [action.payload.id]: {
          ...task,
          status: 'completed' as TaskStatus,
          progress: 100,
          result: action.payload.result,
          completedAt: Date.now(),
        },
      };
      
      // Calculate overall progress
      const taskList = Object.values(updatedTasks);
      const completedTasks = taskList.filter(t => t.status === 'completed').length;
      const overallProgress = taskList.length > 0 ? (completedTasks / taskList.length) * 100 : 0;
      const isProcessing = taskList.some(t => t.status === 'running' || t.status === 'queued');
      
      return {
        ...state,
        tasks: updatedTasks,
        overallProgress,
        isProcessing,
      };
    }
    
    case 'FAIL_TASK': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...task,
            status: 'failed',
            error: action.payload.error,
            completedAt: Date.now(),
          },
        },
      };
    }
    
    case 'CANCEL_TASK': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...task,
            status: 'cancelled',
          },
        },
      };
    }
    
    case 'CLEAR_TASKS': {
      return initialState;
    }
    
    default:
      return state;
  }
}

// Context
const BackgroundTaskContext = createContext<BackgroundTaskContextType | undefined>(undefined);

// Provider component
interface BackgroundTaskProviderProps {
  children: React.ReactNode;
}

export const BackgroundTaskProvider: React.FC<BackgroundTaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(backgroundTaskReducer, initialState);
  const { user } = useAuth();
  const taskProcessorRef = useRef<{ [key: string]: AbortController }>({});
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all running tasks
      Object.values(taskProcessorRef.current).forEach(controller => {
        controller.abort();
      });
    };
  }, []);
  
  // Queue a new background task
  const queueTask = useCallback((taskData: Omit<BackgroundTask, 'id' | 'createdAt'>): string => {
    dispatch({ type: 'QUEUE_TASK', payload: taskData });
    
    // Get the task ID (we need to generate it the same way)
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start processing the task immediately if dependencies are met
    setTimeout(() => processTask(id), 100);
    
    return id;
  }, []);
  
  // Process individual tasks
  const processTask = async (taskId: string) => {
    const task = state.tasks[taskId];
    if (!task || task.status !== 'queued') return;
    
    // Check if dependencies are completed
    const dependenciesCompleted = task.dependencies.every(depId => {
      const depTask = state.tasks[depId];
      return depTask && depTask.status === 'completed';
    });
    
    if (!dependenciesCompleted) {
      // Retry after a delay
      setTimeout(() => processTask(taskId), 1000);
      return;
    }
    
    // Create abort controller for this task
    const abortController = new AbortController();
    taskProcessorRef.current[taskId] = abortController;
    
    dispatch({ type: 'START_TASK', payload: { id: taskId } });
    
    try {
      let result: any;
      
      switch (task.type) {
        case 'video-analysis':
          result = await processVideoAnalysis(task.data, taskId, abortController.signal);
          break;
        case 'nft-generation':
          result = await processNFTGeneration(task.data, taskId, abortController.signal);
          break;
        case 'verification-prep':
          result = await processVerificationPrep(task.data, taskId, abortController.signal);
          break;
        case 'face-matching':
          result = await processFaceMatching(task.data, taskId, abortController.signal);
          break;
        case 'blockchain-prep':
          result = await processBlockchainPrep(task.data, taskId, abortController.signal);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      if (!abortController.signal.aborted) {
        dispatch({ type: 'COMPLETE_TASK', payload: { id: taskId, result } });
      }
    } catch (error: any) {
      if (!abortController.signal.aborted) {
        dispatch({ type: 'FAIL_TASK', payload: { id: taskId, error: error.message } });
      }
    } finally {
      delete taskProcessorRef.current[taskId];
    }
  };
  
  // Background task processors
  const updateProgress = (taskId: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id: taskId, progress } });
  };
  
  const processVideoAnalysis = async (data: any, taskId: string, signal: AbortSignal) => {
    const { videoBlob, challenge } = data;
    
    updateProgress(taskId, 10);
    
    // Simulate video quality analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 40);
    
    // Simulate video compression/optimization
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 70);
    
    // Simulate activity detection prep
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 100);
    
    return {
      quality: 'high',
      duration: 8.5,
      activityDetected: true,
      compressionReady: true,
    };
  };
  
  const processNFTGeneration = async (data: any, taskId: string, signal: AbortSignal) => {
    const { userId, completionId } = data;
    
    updateProgress(taskId, 5);
    
    try {
      // Call the actual NFT generation API
      const response = await fetch('/api/chainGPT/generate-clothing-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: userId,
          completionId: completionId || `bg_${Date.now()}_${userId}`,
          templateType: undefined, // Let it select random
          model: 'velogen',
          width: 512,
          height: 512,
          steps: 2,
          enhance: '2x',
        }),
        signal,
      });
      
      if (signal.aborted) throw new Error('Cancelled');
      updateProgress(taskId, 50);
      
      if (!response.ok) {
        throw new Error(`NFT generation failed: ${response.status}`);
      }
      
      const result = await response.json();
      updateProgress(taskId, 90);
      
      if (!result.success || !result.generation?.imageUrl) {
        throw new Error(result.error || 'NFT generation failed');
      }
      
      updateProgress(taskId, 100);
      
      return {
        success: true,
        collectionId: result.clothingInfo?.templateCID || 'generated',
        templateType: result.clothingInfo?.type,
        templateName: result.clothingInfo?.name,
        imageUrl: result.generation.imageUrl,
        completionId: completionId,
      };
    } catch (error: any) {
      if (signal.aborted) throw error;
      throw new Error(`NFT generation failed: ${error.message}`);
    }
  };
  
  const processVerificationPrep = async (data: any, taskId: string, signal: AbortSignal) => {
    const { videoBlob, challenge } = data;
    
    updateProgress(taskId, 20);
    
    // Simulate verification preparation
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 60);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 100);
    
    return {
      verificationReady: true,
      activityConfidence: 0.92,
      qualityScore: 0.88,
    };
  };
  
  const processFaceMatching = async (data: any, taskId: string, signal: AbortSignal) => {
    const { videoBlob, photoBlob } = data;
    
    updateProgress(taskId, 30);
    
    // Simulate face matching
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 100);
    
    return {
      faceMatch: true,
      confidence: 0.94,
      identityVerified: true,
    };
  };
  
  const processBlockchainPrep = async (data: any, taskId: string, signal: AbortSignal) => {
    updateProgress(taskId, 50);
    
    // Simulate blockchain preparation
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (signal.aborted) throw new Error('Cancelled');
    updateProgress(taskId, 100);
    
    return {
      transactionReady: true,
      gasEstimate: 0.002,
    };
  };
  
  // Convenience methods
  const startVideoAnalysis = useCallback((videoBlob: Blob, challenge: any): string => {
    return queueTask({
      type: 'video-analysis',
      status: 'queued',
      progress: 0,
      data: { videoBlob, challenge },
      dependencies: [],
      priority: 'high',
    });
  }, [queueTask]);
  
  const startNFTGeneration = useCallback((userId: string, completionId?: string): string => {
    return queueTask({
      type: 'nft-generation',
      status: 'queued',
      progress: 0,
      data: { userId, completionId },
      dependencies: [],
      priority: 'medium',
    });
  }, [queueTask]);
  
  const startVerificationPrep = useCallback((videoBlob: Blob, challenge: any): string => {
    return queueTask({
      type: 'verification-prep',
      status: 'queued',
      progress: 0,
      data: { videoBlob, challenge },
      dependencies: [],
      priority: 'high',
    });
  }, [queueTask]);
  
  const startFaceMatching = useCallback((videoBlob: Blob, photoBlob: Blob): string => {
    return queueTask({
      type: 'face-matching',
      status: 'queued',
      progress: 0,
      data: { videoBlob, photoBlob },
      dependencies: [],
      priority: 'high',
    });
  }, [queueTask]);
  
  // Helper methods
  const getTask = useCallback((id: string) => state.tasks[id], [state.tasks]);
  const getTasksByType = useCallback((type: TaskType) => 
    Object.values(state.tasks).filter(task => task.type === type), [state.tasks]);
  const isTaskCompleted = useCallback((id: string) => state.tasks[id]?.status === 'completed', [state.tasks]);
  const isTaskRunning = useCallback((id: string) => state.tasks[id]?.status === 'running', [state.tasks]);
  const getTaskProgress = useCallback((id: string) => state.tasks[id]?.progress || 0, [state.tasks]);
  const cancelTask = useCallback((id: string) => {
    const controller = taskProcessorRef.current[id];
    if (controller) {
      controller.abort();
      delete taskProcessorRef.current[id];
    }
    dispatch({ type: 'CANCEL_TASK', payload: { id } });
  }, []);
  const clearAllTasks = useCallback(() => {
    Object.values(taskProcessorRef.current).forEach(controller => controller.abort());
    taskProcessorRef.current = {};
    dispatch({ type: 'CLEAR_TASKS' });
  }, []);
  
  const value: BackgroundTaskContextType = {
    state,
    queueTask,
    getTask,
    getTasksByType,
    isTaskCompleted,
    isTaskRunning,
    getTaskProgress,
    cancelTask,
    clearAllTasks,
    startVideoAnalysis,
    startNFTGeneration,
    startVerificationPrep,
    startFaceMatching,
  };
  
  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
};

// Hook to use the context
export const useBackgroundTasks = (): BackgroundTaskContextType => {
  const context = useContext(BackgroundTaskContext);
  if (!context) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTaskProvider');
  }
  return context;
};