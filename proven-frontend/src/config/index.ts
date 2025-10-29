/**
 * Centralized Configuration Index
 *
 * Export all configuration modules for easier imports throughout the application.
 * Instead of importing from individual config files, you can import from this index.
 */

// API Configuration
export * from './api';

// Constants
export * from './constants';

// Note: blockchain.ts exports PublicKey objects which may not work with export *
// Import blockchain config directly: import { PROGRAM_ID, USDC_MINT, ... } from '@/config/blockchain'
