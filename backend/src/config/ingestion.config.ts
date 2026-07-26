/**
 * Ingestion Configuration
 *
 * Purpose:
 *   Owns repository cloning and storage configuration settings, such as the
 *   root filesystem path where cloned Git repositories are stored.
 *
 * Why storage path configuration is centralized:
 *   Hardcoding filesystem paths across storage services or clone engines creates
 *   brittle dependencies and risks scattering repository files across arbitrary
 *   directories. By centralizing the storage root here, deployment environments
 *   (local dev, Docker containers, cloud VMs) can easily override the location
 *   via the REPO_STORAGE_PATH environment variable without touching application code.
 *
 * Why immutable configuration prevents runtime bugs:
 *   Using Object.freeze guarantees that the storage root path cannot be altered
 *   at runtime by concurrent ingestion tasks or third-party modules, ensuring
 *   consistent filesystem behavior across all repository synchronization cycles.
 */

import path from 'path';

const storageRoot = process.env.REPO_STORAGE_PATH
  ? path.resolve(process.cwd(), process.env.REPO_STORAGE_PATH)
  : path.resolve(process.cwd(), 'storage/repositories');

export const ingestionConfig = Object.freeze({
  storageRoot,
});
