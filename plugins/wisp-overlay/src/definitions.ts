export interface WispOverlayPlugin {
  canDrawOverlays(): Promise<{ value: boolean }>;
  requestPermission(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<{ value: boolean }>;
  localAddress(): Promise<{ value: string }>;
  publishSnapshot(options: { json: string }): Promise<void>;
  takeIncoming(): Promise<{ value: string }>;
  resize(options: { width: number; height: number }): Promise<void>;
}
