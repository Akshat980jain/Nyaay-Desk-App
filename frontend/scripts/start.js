const { spawn } = require('child_process');

// ANSI Colors (Zero-Dependency)
const cyan = '\x1b[36m';
const bold = '\x1b[1m';
const green = '\x1b[32m';
const gray = '\x1b[90m';
const underline = '\x1b[4m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

console.log(`${cyan}${bold}\n  ⚖️  e-Court CMS ${reset}${gray}— Development Mode${reset}`);
console.log(`${gray}  ──────────────────────────────────────────${reset}`);

// Start react-scripts start
const child = spawn('npm', ['run', 'start'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

const filterNoise = (data) => {
  const message = data.toString();
  
  const noise = [
    'Browserslist: browsers data',
    'npx update-browserslist-db@latest',
    'Why you should do it regularly',
    'DEP_WEBPACK_DEV_SERVER',
    'DeprecationWarning',
    'node --trace-deprecation',
    'Starting the development server',
    'You can now view',
    'On Your Network',
    'Note that the development build',
    'To create a production build',
    'webpack compiled successfully',
    '> frontend@',
    'react-scripts start'
  ];

  if (noise.some(str => message.includes(str))) return null;
  
  // Minimal formatting for the URL
  if (message.includes('Local:')) {
    const url = message.match(/http:\/\/localhost:\d+/);
    if (url) return `  ${green}🚀 Ready at:${reset}  ${bold}${underline}${url[0]}${reset}\n`;
    return null;
  }

  // Hide the extra "Compiled successfully" if it's just the header
  if (message.includes('Compiled successfully!')) {
    return `  ${green}✨ Compiled Successfully${reset}\n`;
  }

  return message.trim() ? `  ${message.trim()}\n` : null;
};

child.stdout.on('data', (data) => {
  const filtered = filterNoise(data);
  if (filtered) process.stdout.write(filtered);
});

child.stderr.on('data', (data) => {
  const filtered = filterNoise(data);
  if (filtered) process.stderr.write(filtered);
});

child.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`${red}\n  ❌ Error (Code: ${code})${reset}`);
  }
});
