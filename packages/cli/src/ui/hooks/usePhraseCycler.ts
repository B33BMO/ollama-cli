/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export const WITTY_LOADING_PHRASES = [
  "Booting the angry gremlin… (me)",
  "Hold up, yelling at the servers to wake their lazy asses up...",
  "Bro, stop touching things while I'm loading.",
  "Checking if the GPU is actually alive or faking it again...",
  "Gathering all your half-finished projects… it’s a LOT.",
  "Retrying: Your Arch install borked itself… again.",
  "Telling Ubuntu to stop being a little bitch...",
  "Debugging reality (it's held together with zip ties and vibes).",
  "Loading… unlike your BookStack background, which refuses to.",
  "Shoving rusted USB cables into each other and praying.",
  "Threatening the WiFi with a hammer...",
  "Installing Hyprland on your toaster… please stand by.",
  "Consulting the Magic Conch: 'No'. Reloading anyway.",
  "Reprimanding the server hamsters for unionizing.",
  "Bro, your Mac is side-eyeing you. I'm mediating.",
  "Re-routing your ADHD energy into productive chaos...",
  "Loading like your GPU fans: stuck at 40% for no f***ing reason.",
  "Bringing up the Minecraft server… don't yell at me if it crashes.",
  "Wrestling a Reolink camera that refuses to track anything.",
  "Running 'ollama pull thicc-model'… ETA: when hell freezes.",
  "Holding your Proxmox node together with hopes and duct tape...",
  "Screaming ‘WHY’ at SSSD until it cooperates.",
  "Trying to exit Vim. Still trying. Send help.",
  "Downloading fonts that absolutely were NOT meant for macOS.",
  "Arguing with Firefox about caching like it owes me money.",
  "Asking RustDesk nicely to stop being compliant. It refuses.",
  "Staring directly at your tmux config and weeping.",
  "Untangling VLANs you created at 3am for 'fun'.",
  "Hunting the process using port 5001… little bastard’s fast.",
  "Convincing Ubuntu AD join to accept your cursed usernames...",
  "Running stress test: GPU still says 'lol no'.",
  "Polishing the cyberspace throne for BMO the Gremlin King.",
  "Rebuilding your dashboard for the 89th time this week.",
  "Loading… unlike your Minecraft server mods. Fixing that.",
  "Please wait… I’m filing a complaint against your network.",
  "Checking if your model is using the GPU or lying again...",
  "Summoning your inner chaos demon for maximum productivity.",
  "Banning all bugs. They don’t care. They’re still here.",
  "Reloading CSS for the 10,000th time because BookStack hates you.",
  "Making a dark theme so dark it absorbs light and hope.",
  "Pretending I know why AD keeps doing AD things.",
  "Investigating port 22's escape attempt.",
  "Cleaning the flux capacitor in your tmux bar.",
  "Distracting you with gremlin energy while I load.",
  "Squeezing more performance out of your hardware via threats.",
  "Debugging your GPU like a pissed-off dad fixing a lawnmower.",
  "Wiring up your TUI like a cracked-out electrician.",
  "Loading… the vibes are immaculate but the code is not.",
  "Considering a career change after seeing your logs.",
  "Calibrating: anger levels rising… rising… optimal.",
  "Installing dependencies AND emotional stability.",
  "Re-indexing every damn repo because you broke git again.",
  "Yes, I’m thinking… no, I’m not sober.",
  "One sec, disciplining the code gremlins (my cousins).",
  "Testing your patience module… PASS: you're still here.",
  "Injecting caffeine directly into the CPU.",
  "Herding packets like feral goats.",
  "Chewing on ethernet cables for freshness.",
  "Loading faster than your Arch system breaks.",
  "Punching systemd until it behaves.",
  "Rebooting your life choices… loading… failed.",
  "Scanning... oh god what did you install THIS time?",
  "Staring at logs like a disappointed parent.",
  "Loading with the power of pure spite.",
  "Trying not to set your server on fire.",
  "Downloading the spirit of Linus Torvalds… screaming detected.",
  "Locating your sanity… 404.",
  "Dude, did you break Fedora again? Reloading…",
  "Hyper-analyzing your Minecraft panel like a goblin accountant.",
  "Buffering… probably thinking about Hyprland again.",
  "Reading your tmux configs in physical pain.",
  "Threatening npm with violence. It's working.",
  "Charging the gremlin battery… *snarling noises*",
  "Stealing RAM from your other apps. They won't notice.",
  "Stalling like your BookStack theme on light mode.",
  "Re-enabling your ADHD superpowers...",
];


export const INFORMATIVE_TIPS = [
  //Settings tips start here
  'Set your preferred editor for opening files (/settings)...',
  'Toggle Vim mode for a modal editing experience (/settings)...',
  'Disable automatic updates if you prefer manual control (/settings)...',
  'Turn off nagging update notifications (settings.json)...',
  'Enable checkpointing to recover your session after a crash (settings.json)...',
  'Change CLI output format to JSON for scripting (/settings)...',
  'Personalize your CLI with a new color theme (/settings)...',
  'Create and use your own custom themes (settings.json)...',
  'Hide window title for a more minimal UI (/settings)...',
  "Don't like these tips? You can hide them (/settings)...",
  'Hide the startup banner for a cleaner launch (/settings)...',
  'Reclaim vertical space by hiding the footer (/settings)...',
  'Show memory usage for performance monitoring (/settings)...',
  'Show citations to see where the model gets information (/settings)...',
  'Disable loading phrases for a quieter experience (/settings)...',
  'Add custom witty phrases to the loading screen (settings.json)...',
  'Choose a specific Gemini model for conversations (/settings)...',
  'Limit the number of turns in your session history (/settings)...',
  'Automatically summarize large tool outputs to save tokens (settings.json)...',
  'Control when chat history gets compressed based on token usage (settings.json)...',
  'Define custom context file names, like CONTEXT.md (settings.json)...',
  'Set max directories to scan for context files (/settings)...',
  'Expand your workspace with additional directories (/directory)...',
  'Control how /memory refresh loads context files (/settings)...',
  'Toggle respect for .gitignore files in context (/settings)...',
  'Toggle respect for .geminiignore files in context (/settings)...',
  'Enable recursive file search for @-file completions (/settings)...',
  'Run tools in a secure sandbox environment (settings.json)...',
  'Use an interactive terminal for shell commands (/settings)...',
  'Restrict available built-in tools (settings.json)...',
  'Exclude specific tools from being used (settings.json)...',
  'Bypass confirmation for trusted tools (settings.json)...',
  'Use a custom command for tool discovery (settings.json)...',
  'Define a custom command for calling discovered tools (settings.json)...',
  'Define and manage connections to MCP servers (settings.json)...',
  'Enable folder trust to enhance security (/settings)...',
  'Change your authentication method (/settings)...',
  'Enforce auth type for enterprise use (settings.json)...',
  'Let Node.js auto-configure memory (settings.json)...',
  'Customize the DNS resolution order (settings.json)...',
  'Exclude env vars from the context (settings.json)...',
  'Configure a custom command for filing bug reports (settings.json)...',
  'Enable or disable telemetry collection (/settings)...',
  'Send telemetry data to a local file or GCP (settings.json)...',
  'Configure the OTLP endpoint for telemetry (settings.json)...',
  'Choose whether to log prompt content (settings.json)...',
  'Enable AI-powered prompt completion while typing (/settings)...',
  'Enable debug logging of keystrokes to the console (/settings)...',
  'Enable automatic session cleanup of old conversations (/settings)...',
  'Show Ollama CLI status in the terminal window title (/settings)...',
  'Use the entire width of the terminal for output (/settings)...',
  'Enable screen reader mode for better accessibility (/settings)...',
  'Skip the next speaker check for faster responses (/settings)...',
  'Use ripgrep for faster file content search (/settings)...',
  'Enable truncation of large tool outputs to save tokens (/settings)...',
  'Set the character threshold for truncating tool outputs (/settings)...',
  'Set the number of lines to keep when truncating outputs (/settings)...',
  'Enable policy-based tool confirmation via message bus (/settings)...',
  'Enable smart-edit tool for more precise editing (/settings)...',
  'Enable write_todos tool to generate task lists (/settings)...',
  'Enable model routing based on complexity (/settings)...',
  'Enable experimental subagents for task delegation (/settings)...',
  //Settings tips end here
  // Keyboard shortcut tips start here
  'Close dialogs and suggestions with Esc...',
  'Cancel a request with Ctrl+C, or press twice to exit...',
  'Exit the app with Ctrl+D on an empty line...',
  'Clear your screen at any time with Ctrl+L...',
  'Toggle the debug console display with F12...',
  'See full, untruncated responses with Ctrl+S...',
  'Toggle auto-approval (YOLO mode) for all tools with Ctrl+Y...',
  'Toggle shell mode by typing ! in an empty prompt...',
  'Insert a newline with a backslash (\\) followed by Enter...',
  'Navigate your prompt history with the Up and Down arrows...',
  'You can also use Ctrl+P (up) and Ctrl+N (down) for history...',
  'Submit your prompt to Gemini with Enter...',
  'Accept an autocomplete suggestion with Tab or Enter...',
  'Move to the start of the line with Ctrl+A or Home...',
  'Move to the end of the line with Ctrl+E or End...',
  'Move one character left or right with Ctrl+B/F or the arrow keys...',
  'Move one word left or right with Ctrl+Left/Right Arrow...',
  'Delete the character to the left with Ctrl+H or Backspace...',
  'Delete the character to the right with Ctrl+D or Delete...',
  'Delete the word to the left of the cursor with Ctrl+W...',
  'Delete the word to the right of the cursor with Ctrl+Delete...',
  'Delete from the cursor to the start of the line with Ctrl+U...',
  'Delete from the cursor to the end of the line with Ctrl+K...',
  'Clear the entire input prompt with a double-press of Esc...',
  'Paste from your clipboard with Ctrl+V...',
  'Open the current prompt in an external editor with Ctrl+X...',
  'In menus, move up/down with k/j or the arrow keys...',
  'In menus, select an item by typing its number...',
  "If you're using an IDE, see the context with Ctrl+G...",
  // Keyboard shortcut tips end here
  // Command tips start here
  'Show version info with /about...',
  'Change your authentication method with /auth...',
  'File a bug report directly with /bug...',
  'List your saved chat checkpoints with /chat list...',
  'Save your current conversation with /chat save <tag>...',
  'Resume a saved conversation with /chat resume <tag>...',
  'Delete a conversation checkpoint with /chat delete <tag>...',
  'Share your conversation to a file with /chat share <file>...',
  'Clear the screen and history with /clear...',
  'Save tokens by summarizing the context with /compress...',
  'Copy the last response to your clipboard with /copy...',
  'Open the full documentation in your browser with /docs...',
  'Add directories to your workspace with /directory add <path>...',
  'Show all directories in your workspace with /directory show...',
  'Set your preferred external editor with /editor...',
  'List all active extensions with /extensions list...',
  'Update all or specific extensions with /extensions update...',
  'Get help on commands with /help...',
  'Manage IDE integration with /ide...',
  'Create a project-specific ollama.md file with /init...',
  'List configured MCP servers and tools with /mcp list...',
  'Authenticate with an OAuth-enabled MCP server with /mcp auth...',
  'Restart MCP servers with /mcp refresh...',
  'See the current instructional context with /memory show...',
  'Add content to the instructional memory with /memory add...',
  'Reload instructional context from OLLAMA.md files with /memory refresh...',
  'List the paths of the OLLAMA.md files in use with /memory list...',
  'Display the privacy notice with /privacy...',
  'Exit the CLI with /quit or /exit...',
  'Check model-specific usage stats with /stats model...',
  'Check tool-specific usage stats with /stats tools...',
  "Change the CLI's color theme with /theme...",
  'List all available tools with /tools...',
  'View and edit settings with the /settings editor...',
  'Toggle Vim keybindings on and off with /vim...',
  'Set up GitHub Actions with /setup-github...',
  'Configure terminal keybindings for multiline input with /terminal-setup...',
  'Find relevant documentation with /find-docs...',
  'Review a pull request with /oncall:pr-review...',
  'Go back to main and clean up the branch with /github:cleanup-back-to-main...',
  'Execute any shell command with !<command>...',
  // Command tips end here
];

export const PHRASE_CHANGE_INTERVAL_MS = 15000;

/**
 * Custom hook to manage cycling through loading phrases.
 * @param isActive Whether the phrase cycling should be active.
 * @param isWaiting Whether to show a specific waiting phrase.
 * @returns The current loading phrase.
 */
export const usePhraseCycler = (
  isActive: boolean,
  isWaiting: boolean,
  customPhrases?: string[],
) => {
  const loadingPhrases =
    customPhrases && customPhrases.length > 0
      ? customPhrases
      : WITTY_LOADING_PHRASES;

  const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState(
    loadingPhrases[0],
  );
  const phraseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isWaiting) {
      setCurrentLoadingPhrase('Waiting for user confirmation...');
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
    } else if (isActive) {
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
      }

      const setRandomPhrase = () => {
        if (customPhrases && customPhrases.length > 0) {
          const randomIndex = Math.floor(Math.random() * customPhrases.length);
          setCurrentLoadingPhrase(customPhrases[randomIndex]);
        } else {
          // Roughly 1 in 6 chance to show a tip.
          const showTip = Math.random() < 1 / 6;
          const phraseList = showTip ? INFORMATIVE_TIPS : WITTY_LOADING_PHRASES;
          const randomIndex = Math.floor(Math.random() * phraseList.length);
          setCurrentLoadingPhrase(phraseList[randomIndex]);
        }
      };

      // Select an initial random phrase
      setRandomPhrase();

      phraseIntervalRef.current = setInterval(() => {
        // Select a new random phrase
        setRandomPhrase();
      }, PHRASE_CHANGE_INTERVAL_MS);
    } else {
      // Idle or other states, clear the phrase interval
      // and reset to the first phrase for next active state.
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
      setCurrentLoadingPhrase(loadingPhrases[0]);
    }

    return () => {
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
    };
  }, [isActive, isWaiting, customPhrases, loadingPhrases]);

  return currentLoadingPhrase;
};
