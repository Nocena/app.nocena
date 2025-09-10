// contexts/BackgroundTaskContext.tsx - CLEANED VERSION - ONLY 3 TASKS
'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SimpleVerificationService } from '../lib/verification/simpleVerificationService';

// Background Task Types - ONLY 3 TASKS
export type TaskType = 'nft-generation' | 'model-preload' | 'verification';

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
  persistent?: boolean; // Prevent cancellation for important tasks
}

interface BackgroundTaskState {
  tasks: { [key: string]: BackgroundTask };
  isProcessing: boolean;
  overallProgress: number;
}

type TaskAction =
  | { type: 'QUEUE_TASK'; payload: Omit<BackgroundTask, 'id' | 'createdAt'> & { id: string } }
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

  // The 3 specific methods you need
  startNFTGeneration: (userId: string, challengeData?: any, persistent?: boolean) => string;
  startModelPreload: () => string;
  startVerification: (args: { videoBlob: Blob; photoBlob?: Blob; challenge: any; dependencies?: string[] }) => string;
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
      const task: BackgroundTask = {
        ...action.payload,
        createdAt: Date.now(),
      };

      console.log('[Queue] Task queued:', task.id.slice(-8), task.type, task.persistent ? '(PERSISTENT)' : '');

      return {
        ...state,
        tasks: { ...state.tasks, [task.id]: task },
        isProcessing: true,
      };
    }

    case 'START_TASK': {
      const task = state.tasks[action.payload.id];
      if (!task) return state;

      console.log('[Start] Task started:', action.payload.id.slice(-8));

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

      console.log('[Complete] Task completed:', action.payload.id.slice(-8), task.type);

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
      const completedTasks = taskList.filter((t) => t.status === 'completed').length;
      const overallProgress = taskList.length > 0 ? (completedTasks / taskList.length) * 100 : 0;
      const isProcessing = taskList.some((t) => t.status === 'running' || t.status === 'queued');

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

      console.log('[Fail] Task failed:', action.payload.id.slice(-8), action.payload.error);

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

      // Don't cancel persistent tasks
      if (task.persistent) {
        console.log('[Cancel Blocked] Task is persistent:', action.payload.id.slice(-8), task.type);
        return state;
      }

      console.log('[Cancel] Task cancelled:', action.payload.id.slice(-8), task.type);

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
      // Only clear non-persistent tasks
      const persistentTasks: { [key: string]: BackgroundTask } = {};
      Object.entries(state.tasks).forEach(([id, task]) => {
        if (task.persistent && (task.status === 'running' || task.status === 'queued')) {
          persistentTasks[id] = task;
        }
      });

      console.log('[Clear] Clearing tasks, keeping', Object.keys(persistentTasks).length, 'persistent tasks');

      return {
        ...state,
        tasks: persistentTasks,
        isProcessing: Object.keys(persistentTasks).length > 0,
      };
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

  // MINIMAL LOGGING: Only log active tasks summary
  useEffect(() => {
    const activeTasks = Object.values(state.tasks).filter((t) => t.status === 'queued' || t.status === 'running');

    if (activeTasks.length > 0) {
      const summary = activeTasks.map((t) => `${t.id.slice(-8)}:${t.type}(${t.status})`).join(', ');
      console.log('[Active Tasks]', summary);
    }
  }, [state.isProcessing]);

  useEffect(() => {
    // Process all queued tasks
    Object.values(state.tasks).forEach((task) => {
      if (task.status === 'queued' && !taskProcessorRef.current[task.id]) {
        // Only process if not already processing
        processTask(task.id);
      }
    });
  }, [state.tasks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(taskProcessorRef.current).forEach((controller) => {
        controller.abort();
      });
    };
  }, []);

  // Queue a new background task
  const queueTask = useCallback((taskData: Omit<BackgroundTask, 'id' | 'createdAt'>): string => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    dispatch({
      type: 'QUEUE_TASK',
      payload: {
        ...taskData,
        id,
      },
    });

    return id;
  }, []);

  // Process individual tasks
  const processTask = async (taskId: string) => {
    // Wait for state to update before processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    const task = state.tasks[taskId];
    if (!task) {
      console.log('[Process] Task not found:', taskId.slice(-8));

      // RETRY: Try again after state updates (max 3 retries)
      const retryCount = (processTask as any).retryCount || 0;
      if (retryCount < 3) {
        console.log('[Process] Retrying in 500ms, attempt:', retryCount + 1);
        (processTask as any).retryCount = retryCount + 1;
        setTimeout(() => processTask(taskId), 500);
      }
      return;
    }

    if (task.status !== 'queued') return;

    // Check dependencies
    const dependenciesCompleted = task.dependencies.every((depId) => {
      const depTask = state.tasks[depId];
      return depTask && depTask.status === 'completed';
    });

    if (!dependenciesCompleted) {
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
        case 'nft-generation':
          result = await processNFTGeneration(task.data, taskId, abortController.signal);
          break;
        case 'model-preload':
          result = await processModelPreload(task.data, taskId, abortController.signal);
          break;
        case 'verification':
          result = await processVerification(task.data, taskId, abortController.signal);
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
      delete (processTask as any).retryCount;
    }
  };

  // Background task processors
  const updateProgress = (taskId: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id: taskId, progress } });
  };

  // 1. NFT GENERATION - KEEP EXACTLY AS IS (working perfectly)
  const processNFTGeneration = async (data: any, taskId: string, signal: AbortSignal) => {
    const { userId, challengeData } = data;

    console.log('[NFT] Starting generation for user:', userId);
    updateProgress(taskId, 5);

    try {
      // Use the correct API endpoint path with better error handling
      const response = await fetch('/api/chainGPT/generate-clothing-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: userId,
          completionId: `bg_${Date.now()}_${userId}`,
          challengeTitle: challengeData?.title || 'Challenge',
          challengeDescription: challengeData?.description || 'Complete this challenge',
          templateType: undefined,
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

      // FIXED: Better error handling for the response
      if (!response.ok) {
        let errorMessage;

        // Clone the response so we can try multiple parsing methods
        const responseClone = response.clone();

        try {
          // Try JSON first
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
          console.error('[NFT] API Error Response:', errorData);
        } catch (jsonError) {
          try {
            // If JSON fails, try text on the cloned response
            const textError = await responseClone.text();
            errorMessage = `HTTP ${response.status}: ${textError || 'Unknown server error'}`;
            console.error('[NFT] Raw Error Response:', textError);
          } catch (textError) {
            // If both fail, use status information
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown server error'}`;
            console.error('[NFT] Could not parse error response');
          }
        }

        throw new Error(`NFT generation failed: ${errorMessage}`);
      }

      const result = await response.json();
      updateProgress(taskId, 90);

      console.log('[NFT] API Response:', result);

      if (!result.success) {
        throw new Error(result.error || 'NFT generation failed - no success flag');
      }

      // Check for required fields in the response
      if (!result.generation?.imageUrl) {
        console.error('[NFT] Missing imageUrl in response:', result);
        throw new Error('NFT generation failed - no image URL returned');
      }

      updateProgress(taskId, 100);

      const finalResult = {
        success: true,
        collectionId: result.clothingInfo?.templateCID || 'generated',
        templateType: result.clothingInfo?.type || 'clothing',
        templateName: result.clothingInfo?.name || 'Generated Item',
        imageUrl: result.generation.imageUrl,
        completionId: `bg_${Date.now()}_${userId}`,
        rarity: result.clothingInfo?.rarity || 'common',
        tokenBonus: result.clothingInfo?.tokenBonus || 0,
        itemType: result.clothingInfo?.type || 'hoodie',
      };

      console.log('[NFT] Generation completed successfully:', finalResult.templateName, finalResult.rarity);
      return finalResult;
    } catch (error: any) {
      if (signal.aborted) throw error;

      console.error('[NFT] Generation error details:', {
        message: error.message,
        stack: error.stack,
        isNftError: error.isNftError,
        userId,
        challengeData,
      });

      // FIXED: Handle 504 Gateway Timeout specifically
      if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
        throw new Error('NFT generation timed out - server is busy. Please try again.');
      }

      throw new Error(`NFT generation failed: ${error.message}`);
    }
  };

  // 2. MODEL PRELOAD - Preload TensorFlow face recognition models
  const processModelPreload = async (data: any, taskId: string, signal: AbortSignal) => {
    console.log('[Models] Starting preload...');
    updateProgress(taskId, 10);

    try {
      // Import the TensorFlow detection helper
      const { preloadModels } = await import('../lib/verification/helpers/tensorflowHumanDetection');

      if (signal.aborted) throw new Error('Cancelled');
      updateProgress(taskId, 30);

      // Preload the models
      await preloadModels();

      if (signal.aborted) throw new Error('Cancelled');
      updateProgress(taskId, 80);

      // Small delay to ensure models are fully loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (signal.aborted) throw new Error('Cancelled');
      updateProgress(taskId, 100);

      console.log('[Models] Preload completed');
      return {
        success: true,
        modelsLoaded: true,
        loadedAt: Date.now(),
      };
    } catch (error: any) {
      if (signal.aborted) throw error;
      console.error('[Models] Preload error:', error.message);
      throw new Error(`Model preload failed: ${error.message}`);
    }
  };

  // 3. VERIFICATION - Run SimpleVerificationService in background
  const processVerification = async (data: any, taskId: string, signal: AbortSignal) => {
    const { videoBlob, photoBlob, challenge } = data;

    console.log('[Verification] Starting background verification...');

    // Step weights for progress calculation (matching SimpleVerificationService)
    const stepWeights: Record<string, number> = {
      'basic-check': 20,
      'human-selfie-check': 40, // Adjusted since no human-video-check in your service
      'ai-challenge-check': 40,
    };

    let accumulated = 0;

    const onProgress = (steps: any[]) => {
      let total = 0;
      for (const s of steps) {
        const w = stepWeights[s.id] || 0;
        const pct = s.status === 'completed' ? 100 : s.progress || 0;
        total += (pct / 100) * w;
      }
      const progress = Math.max(accumulated, Math.round(total));
      accumulated = progress;
      updateProgress(taskId, Math.min(progress, 99)); // avoid claiming 100 before result set
    };

    const service = new SimpleVerificationService(onProgress);

    updateProgress(taskId, 1);
    if (signal.aborted) throw new Error('Cancelled');

    try {
      const result = await service.runFullVerification(videoBlob, photoBlob, challenge?.description || '');

      if (signal.aborted) throw new Error('Cancelled');

      // Check if verification actually passed
      if (result.passed) {
        updateProgress(taskId, 100);
        console.log('[Verification] Background verification completed, passed:', result.passed);
        return result;
      } else {
        // Get details from failed steps instead of result.details
        const failedSteps = result.steps.filter((step) => step.status === 'failed');
        const errorDetails =
          failedSteps.length > 0
            ? failedSteps.map((step) => step.message).join('; ')
            : 'Challenge completion not detected properly';

        throw new Error(`Verification failed: ${errorDetails}`);
      }
    } catch (error: any) {
      if (signal.aborted) throw error;
      console.error('[Verification] Background verification error:', error.message);
      throw new Error(`Verification failed: ${error.message}`);
    }
  };

  // CONVENIENCE METHODS FOR THE 3 TASKS

  // 1. NFT Generation (persistent by default to protect important process)
  const startNFTGeneration = useCallback(
    (userId: string, challengeData?: any, persistent: boolean = true): string => {
      console.log('Starting NFT generation for user:', userId, persistent ? '(PERSISTENT)' : '');
      return queueTask({
        type: 'nft-generation',
        status: 'queued',
        progress: 0,
        data: { userId, challengeData },
        dependencies: [],
        priority: 'medium',
        persistent: persistent,
      });
    },
    [queueTask],
  );

  // 2. Model Preload (run once when app starts or before verification)
  const startModelPreload = useCallback((): string => {
    console.log('Starting model preload...');
    return queueTask({
      type: 'model-preload',
      status: 'queued',
      progress: 0,
      data: {},
      dependencies: [],
      priority: 'low', // Low priority, can run in background
    });
  }, [queueTask]);

  // 3. Verification (pre-run verification before user reaches verification screen)
  const startVerification = useCallback(
    (args: { videoBlob: Blob; photoBlob?: Blob; challenge: any; dependencies?: string[] }): string => {
      const { videoBlob, photoBlob, challenge, dependencies = [] } = args;
      console.log('Starting background verification...', photoBlob ? 'with selfie' : 'video-only');
      return queueTask({
        type: 'verification',
        status: 'queued',
        progress: 0,
        data: { videoBlob, photoBlob: photoBlob || new Blob(), challenge }, // Use empty blob if no photo
        dependencies, // Can depend on model-preload task
        priority: 'high',
      });
    },
    [queueTask],
  );

  // Helper methods
  const getTask = useCallback(
    (id: string) => {
      return state.tasks[id];
    },
    [state.tasks],
  );

  const getTasksByType = useCallback(
    (type: TaskType) => Object.values(state.tasks).filter((task) => task.type === type),
    [state.tasks],
  );

  const isTaskCompleted = useCallback((id: string) => state.tasks[id]?.status === 'completed', [state.tasks]);
  const isTaskRunning = useCallback((id: string) => state.tasks[id]?.status === 'running', [state.tasks]);
  const getTaskProgress = useCallback((id: string) => state.tasks[id]?.progress || 0, [state.tasks]);

  const cancelTask = useCallback(
    (id: string) => {
      const task = state.tasks[id];
      if (task?.persistent) {
        console.log('[Cancel Blocked] Cannot cancel persistent task:', id.slice(-8), task.type);
        return;
      }

      const controller = taskProcessorRef.current[id];
      if (controller) {
        controller.abort();
        delete taskProcessorRef.current[id];
      }
      dispatch({ type: 'CANCEL_TASK', payload: { id } });
    },
    [state.tasks],
  );

  const clearAllTasks = useCallback(() => {
    // Only abort non-persistent tasks
    Object.entries(state.tasks).forEach(([id, task]) => {
      if (!task.persistent) {
        const controller = taskProcessorRef.current[id];
        if (controller) {
          controller.abort();
          delete taskProcessorRef.current[id];
        }
      }
    });

    dispatch({ type: 'CLEAR_TASKS' });
  }, [state.tasks]);

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
    startNFTGeneration,
    startModelPreload,
    startVerification,
  };

  return <BackgroundTaskContext.Provider value={value}>{children}</BackgroundTaskContext.Provider>;
};

// Hook to use the context
export const useBackgroundTasks = (): BackgroundTaskContextType => {
  const context = useContext(BackgroundTaskContext);
  if (!context) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTaskProvider');
  }
  return context;
};
