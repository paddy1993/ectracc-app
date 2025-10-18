/**
 * Platform abstraction interfaces
 * These must be implemented by each platform (web, iOS, Android)
 */

import type { StorageService, CameraService, NotificationService } from '@ectracc/shared-types';

export interface PlatformAuth {
  getAuthToken(): Promise<string | null>;
  signOut(): Promise<void>;
}

export interface PlatformConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  mixpanelToken?: string;
}

// Platform services registry
export class PlatformServices {
  private static storage: StorageService;
  private static camera: CameraService;
  private static notification: NotificationService;
  private static auth: PlatformAuth;
  private static config: PlatformConfig;

  static initialize(
    storage: StorageService,
    camera: CameraService,
    notification: NotificationService,
    auth: PlatformAuth,
    config: PlatformConfig
  ) {
    this.storage = storage;
    this.camera = camera;
    this.notification = notification;
    this.auth = auth;
    this.config = config;
  }

  static getStorage(): StorageService {
    if (!this.storage) {
      throw new Error('Platform storage not initialized');
    }
    return this.storage;
  }

  static getCamera(): CameraService {
    if (!this.camera) {
      throw new Error('Platform camera not initialized');
    }
    return this.camera;
  }

  static getNotification(): NotificationService {
    if (!this.notification) {
      throw new Error('Platform notification not initialized');
    }
    return this.notification;
  }

  static getAuth(): PlatformAuth {
    if (!this.auth) {
      throw new Error('Platform auth not initialized');
    }
    return this.auth;
  }

  static getConfig(): PlatformConfig {
    if (!this.config) {
      throw new Error('Platform config not initialized');
    }
    return this.config;
  }
}

