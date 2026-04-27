import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Gamepad2, Loader2 } from 'lucide-react';
import type { Experience, IntentCategory, IntentMessage, IntentSelectionCategory, NetworkTier } from './app-types';
import { ControlsSheet } from './ControlsSheet';
import { ExperienceMenu } from './ExperienceMenu';
import { IntentExperience } from './IntentExperience';
import { GamingExperience, StreamingExperience } from './ShowcaseExperiences';
import { UpgradeModal } from './UpgradeModal';
import {
  armComputeScenario,
  buildComputeScenarioUrl,
  getStoredComputeNodeHost,
  persistComputeNodeHost,
} from './compute-node-scenarios';
import { buildIntentBackendUrl, getStoredIntentBackendHost, persistIntentBackendHost } from './intent-clarification-config';
import { IntentConversationRepository } from './intent-conversation-repository';
import type { ConversationSnapshot, SocketUiState } from './intent-clarification-types';
import {
  formatTimestamp,
  getIntentSocketStateAccent,
  getIntentSocketStateLabel,
  getStubIntentResult,
  isGameLaunchIntent,
  normalizeIntentCategory,
  SUGGESTED_INTENT,
} from './intent-utils';
import { findInstalledMoonlightPackage } from './moonlight-launcher';

type DemoFlowPlugin = {
  ensureNotificationPermission(): Promise<{ granted: boolean }>;
  scheduleLatencyAlert(options: {
    title: string;
    body: string;
    delayMs: number;
    upgradeAction: string;
  }): Promise<void>;
  consumePendingUpgradeAction(): Promise<{ action?: string }>;
};

const DemoFlow = registerPlugin<DemoFlowPlugin>('DemoFlow');

export default function App() {
  const [experience, setExperience] = useState<Experience>('streaming');
  const [showExperienceMenu, setShowExperienceMenu] = useState(false);
  const [showControlsSheet, setShowControlsSheet] = useState(false);
  const [networkTier, setNetworkTier] = useState<NetworkTier>('5G');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [systemAgentHost, setSystemAgentHost] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredIntentBackendHost(window.localStorage)
  );
  const [systemAgentDraft, setSystemAgentDraft] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredIntentBackendHost(window.localStorage)
  );
  const [computeNodeHost, setComputeNodeHost] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredComputeNodeHost(window.localStorage)
  );
  const [computeNodeDraft, setComputeNodeDraft] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredComputeNodeHost(window.localStorage)
  );
  const [intentDraft, setIntentDraft] = useState('');
  const [intentCategory, setIntentCategory] = useState<IntentSelectionCategory | null>('experience');
  const [isIntentSending, setIsIntentSending] = useState(false);
  const intentConversationRepositoryRef = useRef<IntentConversationRepository | null>(null);
  if (!intentConversationRepositoryRef.current) {
    intentConversationRepositoryRef.current = new IntentConversationRepository({
      formatTimestamp,
      createId: () => `conversation-${Math.random().toString(36).slice(2, 10)}`,
    });
  }
  const intentConversationRepository = intentConversationRepositoryRef.current;
  const [backendConversation, setBackendConversation] = useState<ConversationSnapshot>(() =>
    intentConversationRepository.getSnapshot()
  );
  const [handoffMessages, setHandoffMessages] = useState<IntentMessage[]>([]);
  const [intentMessages, setIntentMessages] = useState<IntentMessage[]>(() => [
    {
      id: 'network-0',
      role: 'network',
      title: 'NETAGENT',
      text: "Hello! I'm your Network-Aware Agent. How can I help you today?",
      timestamp: formatTimestamp(),
      status: 'complete',
      category: 'unknown',
    },
  ]);

  const degradationTimer = useRef<number | null>(null);
  const upgradeTimer = useRef<number | null>(null);
  const successTimer = useRef<number | null>(null);
  const intentReplyTimer = useRef<number | null>(null);
  const intentMessageId = useRef(1);
  const intentInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastShowcaseExperience = useRef<'streaming' | 'gaming'>('streaming');

  const isStreaming = experience === 'streaming';
  const isGaming = experience === 'gaming';
  const isIntent = experience === 'intent';
  const hasSystemAgentEndpoint = Boolean(systemAgentHost);
  const hasComputeNodeEndpoint = Boolean(computeNodeHost);

  const clearNetworkTimers = () => {
    if (degradationTimer.current !== null) {
      window.clearTimeout(degradationTimer.current);
      degradationTimer.current = null;
    }
    if (upgradeTimer.current !== null) {
      window.clearTimeout(upgradeTimer.current);
      upgradeTimer.current = null;
    }
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }
  };

  const nextIntentMessageId = () => `intent-${intentMessageId.current++}`;

  const saveSystemAgentEndpoint = () => {
    const nextHost = systemAgentDraft.trim();
    setSystemAgentHost(nextHost);
    setSystemAgentDraft(nextHost);
    persistIntentBackendHost(window.localStorage, nextHost);
  };

  const clearSystemAgentEndpoint = () => {
    setSystemAgentHost('');
    setSystemAgentDraft('');
    persistIntentBackendHost(window.localStorage, '');
    intentConversationRepository.resetSession();
    setHandoffMessages([]);
  };

  const saveComputeNodeEndpoint = () => {
    const nextHost = computeNodeDraft.trim();
    setComputeNodeHost(nextHost);
    setComputeNodeDraft(nextHost);
    persistComputeNodeHost(window.localStorage, nextHost);
  };

  const clearComputeNodeEndpoint = () => {
    setComputeNodeHost('');
    setComputeNodeDraft('');
    persistComputeNodeHost(window.localStorage, '');
  };

  const resetNetwork = () => {
    clearNetworkTimers();
    setNetworkTier('5G');
    setShowModal(false);
    setModalExpanded(false);
    setIsUpgrading(false);
    setUpgradeSuccess(false);
    setIsPlaying(true);
    setIntentCategory('experience');
  };

  const updateIntentMessage = (messageId: string, updater: (message: IntentMessage) => IntentMessage) => {
    setIntentMessages((messages) =>
      messages.map((message) => (message.id === messageId ? updater(message) : message))
    );
    setHandoffMessages((messages) =>
      messages.map((message) => (message.id === messageId ? updater(message) : message))
    );
  };

  const appendNetworkIntentMessage = useCallback((
    title: string,
    text: string,
    category: IntentCategory = 'unknown',
    isError = false
  ) => {
    const message: IntentMessage = {
      id: nextIntentMessageId(),
      role: 'network',
      title,
      text,
      timestamp: formatTimestamp(),
      status: 'complete',
      category,
      isError,
    };

    if (hasSystemAgentEndpoint) {
      setHandoffMessages((messages) => [...messages, message]);
      return;
    }

    setIntentMessages((messages) => [...messages, message]);
  }, [hasSystemAgentEndpoint]);

  const resumeGamingUpgradeFlow = useCallback(() => {
    if (degradationTimer.current !== null) {
      window.clearTimeout(degradationTimer.current);
      degradationTimer.current = null;
    }
    if (upgradeTimer.current !== null) {
      window.clearTimeout(upgradeTimer.current);
      upgradeTimer.current = null;
    }
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }

    setExperience('gaming');
    lastShowcaseExperience.current = 'gaming';
    setShowExperienceMenu(false);
    setShowControlsSheet(false);
    setNetworkTier('Degraded');
    setShowModal(true);
    setModalExpanded(true);
    setIsUpgrading(false);
    setUpgradeSuccess(false);
    setIsPlaying(true);
  }, []);

  const consumePendingUpgradeAction = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      const { action } = await DemoFlow.consumePendingUpgradeAction();
      if (action === 'gaming-upgrade') {
        try {
          await armComputeScenario(computeNodeHost, 'base');
        } catch (error) {
          console.error('Compute Node base scenario arming failed', error);
          appendNetworkIntentMessage(
            'Compute Node recovery failed',
            'The Fix action was accepted, but IntentLink could not arm the base scenario on the Compute Node. The Moonlight stream may stay degraded.',
            'gaming',
            true
          );
        }
        resumeGamingUpgradeFlow();
      }
    } catch (error) {
      console.error('Pending upgrade action check failed', error);
    }
  }, [appendNetworkIntentMessage, computeNodeHost, resumeGamingUpgradeFlow]);

  const handleExperienceChange = (nextExperience: Experience) => {
    if (nextExperience === experience) {
      setShowExperienceMenu(false);
      return;
    }

    if (nextExperience !== 'intent') {
      lastShowcaseExperience.current = nextExperience;
    }

    setExperience(nextExperience);
    setShowExperienceMenu(false);
    setShowControlsSheet(false);
    setIntentCategory('experience');
    resetNetwork();
  };

  const handleMoonlightLaunch = async (messageId: string) => {
    updateIntentMessage(messageId, (message) => ({
      ...message,
      actionCard: message.actionCard
        ? {
            ...message.actionCard,
            state: 'launching',
            buttonLabel: 'Launching...',
          }
        : undefined,
    }));

    try {
      await armComputeScenario(computeNodeHost, 'overload');
    } catch (error) {
      console.error('Compute Node overload scenario arming failed', error);
      updateIntentMessage(messageId, (message) => ({
        ...message,
        actionCard: message.actionCard
          ? {
              ...message.actionCard,
              state: 'unavailable',
              buttonLabel: hasComputeNodeEndpoint ? 'Scenario Failed' : 'Configure Node',
            }
          : undefined,
      }));
      appendNetworkIntentMessage(
        hasComputeNodeEndpoint ? 'Compute Node unavailable' : 'Compute Node required',
        hasComputeNodeEndpoint
          ? 'IntentLink could not arm the overload scenario on the Compute Node, so Moonlight was not launched.'
          : 'Configure the Compute Node Host in the Control Panel before launching Moonlight.',
        'gaming',
        true
      );
      return;
    }

    if (Capacitor.getPlatform() !== 'android') {
      updateIntentMessage(messageId, (message) => ({
        ...message,
        actionCard: message.actionCard
          ? {
              ...message.actionCard,
              state: 'unavailable',
              buttonLabel: 'Android Only',
            }
          : undefined,
      }));
      appendNetworkIntentMessage(
        'Android launch only',
        'Moonlight handoff is available only inside the installed Android app.',
        'gaming'
      );
      return;
    }

    try {
      const moonlightPackage = await findInstalledMoonlightPackage(AppLauncher);

      if (!moonlightPackage) {
        updateIntentMessage(messageId, (message) => ({
          ...message,
          actionCard: message.actionCard
            ? {
                ...message.actionCard,
                state: 'unavailable',
                buttonLabel: 'Moonlight Missing',
              }
            : undefined,
        }));
        appendNetworkIntentMessage(
          'Moonlight not found',
          'Install Moonlight on this Android device to continue the high-performance handoff.',
          'gaming'
        );
        return;
      }

      let notificationsGranted = true;
      try {
        const permission = await DemoFlow.ensureNotificationPermission();
        notificationsGranted = permission.granted;
      } catch (error) {
        console.error('Notification permission request failed', error);
        notificationsGranted = false;
      }

      await AppLauncher.openUrl({ url: moonlightPackage });

      if (notificationsGranted) {
        try {
          await DemoFlow.scheduleLatencyAlert({
            title: 'Input Latency High',
            body: 'Moonlight is currently running on a degraded path. Tap Fix to return and apply 6G Edge Boost.',
            delayMs: 6000,
            upgradeAction: 'gaming-upgrade',
          });
        } catch (error) {
          console.error('Latency alert scheduling failed', error);
          appendNetworkIntentMessage(
            'Alert scheduling failed',
            'Moonlight opened, but the background latency alert could not be scheduled on this device.',
            'gaming'
          );
        }
      } else {
        appendNetworkIntentMessage(
          'Notifications blocked',
          'Moonlight opened, but Android notifications are disabled so the background latency alert will not appear.',
          'gaming'
        );
      }

      updateIntentMessage(messageId, (message) => ({
        ...message,
        actionCard: message.actionCard
          ? {
              ...message.actionCard,
              state: 'launched',
              buttonLabel: 'Moonlight Opening',
            }
          : undefined,
      }));
      appendNetworkIntentMessage(
        'Cloud handoff complete',
        'Moonlight launch request sent. Android should now switch to Moonlight.',
        'gaming'
      );
    } catch (error) {
      console.error('Moonlight launch failed', error);
      updateIntentMessage(messageId, (message) => ({
        ...message,
        actionCard: message.actionCard
          ? {
              ...message.actionCard,
              state: 'unavailable',
              buttonLabel: 'Launch Failed',
            }
          : undefined,
      }));
      appendNetworkIntentMessage(
        'Launch failed',
        'The Cloud Orchestrator handoff could not open Moonlight on this device.',
        'gaming'
      );
    }
  };

  const triggerDegradation = () => {
    clearNetworkTimers();
    setNetworkTier('Degraded');
    setShowModal(false);
    setModalExpanded(false);
    setIsUpgrading(false);
    setUpgradeSuccess(false);

    degradationTimer.current = window.setTimeout(() => {
      setShowModal(true);
      setModalExpanded(false);
    }, isGaming ? 4000 : 3000);
  };

  const handleUpgrade = () => {
    setIsUpgrading(true);

    upgradeTimer.current = window.setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);

      successTimer.current = window.setTimeout(() => {
        setNetworkTier('6G');
        setShowModal(false);
        setModalExpanded(false);
        setUpgradeSuccess(false);
      }, 1500);
    }, 2000);
  };

  const submitIntent = async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput || (!hasSystemAgentEndpoint && (isIntentSending || !intentCategory))) {
      return;
    }

    const selectedCategory = intentCategory ?? 'experience';
    const isComputeGameIntent = selectedCategory === 'compute' && isGameLaunchIntent(trimmedInput.toLowerCase());

    if (isComputeGameIntent) {
      if (hasSystemAgentEndpoint && backendConversation.awaitingReply) {
        return;
      }

      const stubResult = getStubIntentResult(trimmedInput);
      const handoffId = nextIntentMessageId();
      const nextMessages: IntentMessage[] = [
        {
          id: nextIntentMessageId(),
          role: 'user',
          text: trimmedInput,
          timestamp: formatTimestamp(),
          status: 'sent',
          category: 'gaming',
        },
        {
          id: handoffId,
          role: 'network',
          title: stubResult.title,
          text: stubResult.text,
          timestamp: formatTimestamp(),
          status: 'complete',
          category: stubResult.category,
          actionCard: stubResult.actionCard ? { ...stubResult.actionCard, state: 'ready' } : undefined,
        },
      ];

      if (hasSystemAgentEndpoint) {
        setHandoffMessages((messages) => [...messages, ...nextMessages]);
      } else {
        setIntentMessages((messages) => [...messages, ...nextMessages]);
      }

      setIntentDraft('');
      setIntentCategory('experience');
      return;
    }

    if (hasSystemAgentEndpoint) {
      const sent = intentConversationRepository.submitTurn(trimmedInput);
      if (sent) {
        setIntentDraft('');
        setIntentCategory('experience');
      }
      return;
    }

    const pendingId = nextIntentMessageId();

    setIntentMessages((messages) => [
      ...messages,
      {
        id: nextIntentMessageId(),
        role: 'user',
        text: trimmedInput,
        timestamp: formatTimestamp(),
        status: 'sent',
        category: selectedCategory as any,
      },
      {
        id: pendingId,
        role: 'network',
        title: 'NETAGENT',
        text: hasSystemAgentEndpoint
          ? 'Forwarding the request to the configured System Agent in the core network.'
          : 'Evaluating the request and checking nearby network-computing resources.',
        timestamp: formatTimestamp(),
        status: 'processing',
      },
    ]);

    setIntentDraft('');
    setIntentCategory('experience');
    setIsIntentSending(true);

    intentReplyTimer.current = window.setTimeout(() => {
      const stubResult = getStubIntentResult(trimmedInput);
      const categoryAwareText = selectedCategory === 'experience'
        ? `Acknowledged: Network experience intent for ${stubResult.category}. ${stubResult.text}`
        : `Acknowledged: Compute resource intent for ${stubResult.category}. ${stubResult.text}`;

      setIntentMessages((messages) =>
        messages.map((message) =>
          message.id === pendingId
            ? {
                ...message,
                title: stubResult.title,
                text: categoryAwareText,
                timestamp: formatTimestamp(),
                status: 'complete',
                category: stubResult.category,
                actionCard: stubResult.actionCard
                  ? {
                      ...stubResult.actionCard,
                      state: 'ready',
                    }
                  : undefined,
              }
            : message
        )
      );
      setIsIntentSending(false);
      intentReplyTimer.current = null;
    }, 700);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void consumePendingUpgradeAction();
      }
    };

    const handleFocus = () => {
      void consumePendingUpgradeAction();
    };

    void consumePendingUpgradeAction();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [consumePendingUpgradeAction]);

  useEffect(() => {
    const unsubscribe = intentConversationRepository.subscribe((snapshot) => {
      setBackendConversation(snapshot);
    });

    return () => {
      unsubscribe();
      intentConversationRepository.dispose();
    };
  }, [intentConversationRepository]);

  useEffect(() => {
    intentConversationRepository.setBackendHost(systemAgentHost);
  }, [intentConversationRepository, systemAgentHost]);

  useEffect(() => {
    if (isIntent && hasSystemAgentEndpoint) {
      intentConversationRepository.activate();
      return;
    }

    intentConversationRepository.deactivate();
  }, [hasSystemAgentEndpoint, intentConversationRepository, isIntent]);

  useEffect(() => {
    if (!isStreaming || !videoRef.current) {
      return;
    }

    if (networkTier === 'Degraded' || !isPlaying) {
      videoRef.current.pause();
      return;
    }

    videoRef.current.play().catch((error) => console.log('Autoplay blocked:', error));
  }, [isStreaming, isPlaying, networkTier]);

  useEffect(() => {
    return () => {
      clearNetworkTimers();
      if (intentReplyTimer.current !== null) {
        window.clearTimeout(intentReplyTimer.current);
      }
    };
  }, []);

  const modalAccent = isGaming
    ? {
        border: 'border-cyan-400',
        chip: 'bg-cyan-100 text-cyan-600',
        button: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-blue-500',
        shadow: 'shadow-cyan-200 hover:shadow-cyan-300',
        price: 'text-cyan-600',
      }
    : {
        border: 'border-purple-200',
        chip: 'bg-purple-100 text-purple-600',
        button: 'bg-purple-600',
        gradient: 'from-purple-600 to-indigo-600',
        shadow: 'shadow-purple-200 hover:shadow-purple-300',
        price: 'text-purple-600',
      };

  const initialStateCopy = isIntent
    ? 'Direct Intent now performs a stubbed compute-discovery flow and can hand off to Moonlight on Android.'
    : isGaming
      ? 'Cloud gameplay starts on standard 5G with acceptable responsiveness.'
      : 'The stream starts on standard 5G best-effort delivery and plays smoothly.';
  const congestionCopy = isIntent
    ? 'Congestion simulation remains disabled while the Direct Intent console is active.'
    : isGaming
      ? 'Inject latency and packet loss. The session feels sluggish, then the 6G Edge offer appears after 4 seconds.'
      : 'Simulate tower congestion. Video quality collapses, buffering starts, then the upgrade offer appears after 3 seconds.';
  const intentSocketState: SocketUiState = hasSystemAgentEndpoint ? backendConversation.uiState : isIntentSending ? 'sending' : 'disconnected';
  const displayedIntentMessages = hasSystemAgentEndpoint
    ? [
        ...backendConversation.messages.map<IntentMessage>((message) => ({
          id: message.id,
          role: message.role === 'user' ? 'user' : 'network',
          title: message.title,
          text: message.text,
          timestamp: message.timestamp,
          status: 'complete',
          finalData: message.finalData,
          isError: message.isError,
        })),
        ...handoffMessages,
      ]
    : intentMessages;
  const backendConnectionLabel = getIntentSocketStateLabel(intentSocketState);
  const backendConnectionAccent = getIntentSocketStateAccent(intentSocketState);
  const resolvedBackendUrl = buildIntentBackendUrl(systemAgentHost);
  const resolvedComputeNodeBaseUrl = hasComputeNodeEndpoint ? buildComputeScenarioUrl(computeNodeHost, 'base') : '';
  const resolvedComputeNodeOverloadUrl = hasComputeNodeEndpoint ? buildComputeScenarioUrl(computeNodeHost, 'overload') : '';

  const experienceMenu = (
    <ExperienceMenu
      experience={experience}
      isOpen={showExperienceMenu}
      onToggle={() => setShowExperienceMenu((open) => !open)}
      onSelect={handleExperienceChange}
    />
  );

  const renderIntent = () => (
    <IntentExperience
      awaitingReply={backendConversation.awaitingReply}
      backendConnectionAccent={backendConnectionAccent}
      backendConnectionLabel={backendConnectionLabel}
      backendConversation={backendConversation}
      displayedMessages={displayedIntentMessages}
      experienceMenu={experienceMenu}
      hasSystemAgentEndpoint={hasSystemAgentEndpoint}
      inputRef={intentInputRef}
      intentCategory={intentCategory}
      intentDraft={intentDraft}
      isIntentSending={isIntentSending}
      lastShowcaseExperience={lastShowcaseExperience.current}
      resolvedBackendUrl={resolvedBackendUrl}
      showExperienceMenu={showExperienceMenu}
      onBack={handleExperienceChange}
      onClearHandoffMessages={() => setHandoffMessages([])}
      onLaunchMoonlight={handleMoonlightLaunch}
      onResetLocalMessages={() =>
        setIntentMessages([
          {
            id: 'network-0',
            role: 'network',
            title: 'NETAGENT',
            text: "Hello! I'm your Network-Aware Agent. How can I help you today?",
            timestamp: formatTimestamp(),
            status: 'complete',
            category: 'unknown',
          },
        ])
      }
      onResetRemoteSession={() => intentConversationRepository.resetSession()}
      onSetIntentCategory={setIntentCategory}
      onSetIntentDraft={setIntentDraft}
      onSetShowExperienceMenu={setShowExperienceMenu}
      onSubmitIntent={submitIntent}
      onSuggestIntent={() => {
        setIntentDraft(SUGGESTED_INTENT);
        window.requestAnimationFrame(() => intentInputRef.current?.focus());
      }}
    />
  );

  const controlsSheet = (
    <ControlsSheet
      backendConnectionLabel={backendConnectionLabel}
      computeNodeDraft={computeNodeDraft}
      congestionCopy={congestionCopy}
      hasComputeNodeEndpoint={hasComputeNodeEndpoint}
      hasSystemAgentEndpoint={hasSystemAgentEndpoint}
      initialStateCopy={initialStateCopy}
      isGaming={isGaming}
      isIntent={isIntent}
      isOpen={showControlsSheet}
      isStreaming={isStreaming}
      networkTier={networkTier}
      resolvedBackendUrl={resolvedBackendUrl}
      resolvedComputeNodeBaseUrl={resolvedComputeNodeBaseUrl}
      resolvedComputeNodeOverloadUrl={resolvedComputeNodeOverloadUrl}
      systemAgentDraft={systemAgentDraft}
      onChangeComputeNodeDraft={setComputeNodeDraft}
      onChangeExperience={handleExperienceChange}
      onChangeSystemAgentDraft={setSystemAgentDraft}
      onClearComputeNode={clearComputeNodeEndpoint}
      onClearSystemAgent={clearSystemAgentEndpoint}
      onClose={() => setShowControlsSheet(false)}
      onOpen={() => setShowControlsSheet(true)}
      onResetNetwork={() => {
        resetNetwork();
        setShowControlsSheet(false);
      }}
      onSaveComputeNode={saveComputeNodeEndpoint}
      onSaveSystemAgent={saveSystemAgentEndpoint}
      onTriggerDegradation={() => {
        triggerDegradation();
        setShowControlsSheet(false);
      }}
    />
  );

  const renderRootPage = () => (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="w-full">
        <div className="relative min-h-screen overflow-hidden bg-white">
          {!isIntent && (
            <div className="relative z-30 flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center font-bold text-white ${
                    isStreaming ? 'rounded-full bg-blue-600' : 'rounded-lg bg-indigo-600'
                  }`}
                >
                  {isStreaming ? 'V' : <Gamepad2 size={18} />}
                </div>
                <h1 className="text-lg font-bold">{isStreaming ? 'StreamFlex' : 'CloudPlay'}</h1>
              </div>
              {experienceMenu}
            </div>
          )}

          <div
            className={`relative ${isIntent ? 'h-[100dvh] overflow-hidden bg-white' : isGaming ? 'overflow-y-auto bg-gray-50 pb-8' : 'overflow-y-auto pb-8'}`}
            onClick={() => {
              if (showExperienceMenu && !isIntent) {
                setShowExperienceMenu(false);
              }
            }}
          >
            {isStreaming ? (
              <StreamingExperience
                isPlaying={isPlaying}
                networkTier={networkTier}
                videoRef={videoRef}
                onTogglePlayback={() => setIsPlaying((playing) => !playing)}
              />
            ) : isGaming ? (
              <GamingExperience networkTier={networkTier} />
            ) : (
              renderIntent()
            )}

            {!isIntent && (
              <UpgradeModal
                isGaming={isGaming}
                isExpanded={modalExpanded}
                isUpgrading={isUpgrading}
                show={showModal}
                success={upgradeSuccess}
                accent={modalAccent}
                onActivate={handleUpgrade}
                onCollapse={() => {
                  setShowModal(false);
                  setModalExpanded(false);
                }}
                onExpand={() => setModalExpanded(true)}
              />
            )}
          </div>
        </div>
        {controlsSheet}
      </div>
    </div>
  );

  return renderRootPage();
}
