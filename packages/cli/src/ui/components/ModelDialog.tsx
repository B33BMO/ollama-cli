/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useCallback, useContext, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import {
  ModelSlashCommandEvent,
  logModelSlashCommand,
} from '@google/gemini-cli-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
import { DescriptiveRadioButtonSelect } from './shared/DescriptiveRadioButtonSelect.js';
import { ConfigContext } from '../contexts/ConfigContext.js';
import { TextInput } from './shared/TextInput.js';
import { useTextBuffer } from './shared/text-buffer.js';
import { useUIState } from '../contexts/UIStateContext.js';

interface ModelDialogProps {
  onClose: () => void;
}

type View = 'providers' | 'ollama-models' | 'custom-input';

interface OllamaModel {
  name: string;
  size: number;
  parameter_size?: string;
  family?: string;
}

const PROVIDER_OPTIONS = [
  {
    value: 'ollama',
    title: '📦 Ollama',
    description: 'Browse and select from available Ollama models',
    key: 'ollama',
  },
  {
    value: 'custom',
    title: '✏️  Custom',
    description: 'Enter a custom model name manually',
    key: 'custom',
  },
];

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export function ModelDialog({ onClose }: ModelDialogProps): React.JSX.Element {
  const config = useContext(ConfigContext);
  const { mainAreaWidth } = useUIState();
  const [view, setView] = useState<View>('providers');
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModel = config?.getModel() || '';

  const viewportWidth = mainAreaWidth - 8;
  const customModelBuffer = useTextBuffer({
    initialText: '',
    initialCursorOffset: 0,
    viewport: {
      width: viewportWidth,
      height: 1,
    },
    isValidPath: () => false,
    singleLine: true,
  });

  // Fetch Ollama models when entering that view
  useEffect(() => {
    if (view === 'ollama-models') {
      setLoading(true);
      setError(null);

      const baseUrl = process.env['OLLAMA_BASE_URL'] || 'https://ollama.com';

      fetch(`${baseUrl}/api/tags`, {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env['OLLAMA_API_KEY']
            ? { Authorization: `Bearer ${process.env['OLLAMA_API_KEY']}` }
            : {}),
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch models: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const models = (data.models || []).map(
            (m: {
              name: string;
              size: number;
              details?: { parameter_size?: string; family?: string };
            }) => ({
              name: m.name,
              size: m.size,
              parameter_size: m.details?.parameter_size,
              family: m.details?.family,
            }),
          );
          setOllamaModels(models);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [view]);

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        if (view === 'providers') {
          onClose();
        } else {
          setView('providers');
          setError(null);
        }
      }
    },
    { isActive: true },
  );

  const handleSelectModel = useCallback(
    (model: string) => {
      if (config) {
        config.setModel(model);
        const event = new ModelSlashCommandEvent(model);
        logModelSlashCommand(config, event);
      }
      onClose();
    },
    [config, onClose],
  );

  const handleProviderSelect = useCallback((provider: string) => {
    if (provider === 'ollama') {
      setView('ollama-models');
    } else if (provider === 'custom') {
      setView('custom-input');
    }
  }, []);

  const handleCustomSubmit = useCallback(
    (value: string) => {
      if (value.trim()) {
        handleSelectModel(value.trim());
      }
    },
    [handleSelectModel],
  );

  // Provider selection view
  if (view === 'providers') {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        flexDirection="column"
        padding={1}
        width="100%"
      >
        <Text bold>Select Model Provider</Text>
        <Box marginTop={1} marginBottom={1}>
          <Text color={theme.text.secondary}>
            Current model:{' '}
            <Text color={theme.text.primary}>{currentModel}</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <DescriptiveRadioButtonSelect
            items={PROVIDER_OPTIONS}
            onSelect={handleProviderSelect}
            initialIndex={0}
            showNumbers={true}
          />
        </Box>
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>(Press Esc to close)</Text>
        </Box>
      </Box>
    );
  }

  // Ollama models view
  if (view === 'ollama-models') {
    if (loading) {
      return (
        <Box
          borderStyle="round"
          borderColor={theme.border.default}
          flexDirection="column"
          padding={1}
          width="100%"
        >
          <Text bold>Ollama Models</Text>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>Loading models...</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>(Press Esc to go back)</Text>
          </Box>
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          borderStyle="round"
          borderColor={theme.border.default}
          flexDirection="column"
          padding={1}
          width="100%"
        >
          <Text bold>Ollama Models</Text>
          <Box marginTop={1}>
            <Text color={theme.status.error}>Error: {error}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>
              Make sure your Ollama service is running and accessible.
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>(Press Esc to go back)</Text>
          </Box>
        </Box>
      );
    }

    if (ollamaModels.length === 0) {
      return (
        <Box
          borderStyle="round"
          borderColor={theme.border.default}
          flexDirection="column"
          padding={1}
          width="100%"
        >
          <Text bold>Ollama Models</Text>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>No models found.</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>
              Pull models with: ollama pull {'<model-name>'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>(Press Esc to go back)</Text>
          </Box>
        </Box>
      );
    }

    const modelOptions = ollamaModels.map((model) => {
      const sizeStr = formatSize(model.size);
      const paramStr = model.parameter_size ? ` • ${model.parameter_size}` : '';
      const familyStr = model.family ? ` • ${model.family}` : '';

      return {
        value: model.name,
        title: model.name,
        description: `${sizeStr}${paramStr}${familyStr}`,
        key: model.name,
      };
    });

    const currentIndex = modelOptions.findIndex(
      (opt) => opt.value === currentModel,
    );

    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        flexDirection="column"
        padding={1}
        width="100%"
      >
        <Text bold>Ollama Models</Text>
        <Box marginTop={1} marginBottom={1}>
          <Text color={theme.text.secondary}>
            {ollamaModels.length} model{ollamaModels.length !== 1 ? 's' : ''}{' '}
            available
          </Text>
        </Box>
        <DescriptiveRadioButtonSelect
          items={modelOptions}
          onSelect={handleSelectModel}
          initialIndex={currentIndex >= 0 ? currentIndex : 0}
          showNumbers={true}
          showScrollArrows={true}
          maxItemsToShow={8}
        />
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>(Press Esc to go back)</Text>
        </Box>
      </Box>
    );
  }

  // Custom input view
  if (view === 'custom-input') {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        flexDirection="column"
        padding={1}
        width="100%"
      >
        <Text bold>Enter Custom Model</Text>
        <Box marginTop={1} marginBottom={1}>
          <Text color={theme.text.secondary}>
            Current model:{' '}
            <Text color={theme.text.primary}>{currentModel}</Text>
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="row">
          <Text color={theme.text.secondary}>Model name: </Text>
          <Box
            borderStyle="round"
            borderColor={theme.border.default}
            paddingX={1}
            flexGrow={1}
          >
            <TextInput
              buffer={customModelBuffer}
              onSubmit={handleCustomSubmit}
              onCancel={() => setView('providers')}
              placeholder="e.g., llama3.2, qwen2.5-coder:32b"
            />
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>
            Press Enter to confirm, Esc to go back
          </Text>
        </Box>
      </Box>
    );
  }

  return <></>;
}
