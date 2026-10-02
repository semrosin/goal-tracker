import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// The deployment base path is a build-time concern; tests always run against
// the domain root even when PUBLIC_PATH is set in the shell.
process.env.PUBLIC_PATH = '/';

Object.assign(globalThis, { TextDecoder, TextEncoder });
