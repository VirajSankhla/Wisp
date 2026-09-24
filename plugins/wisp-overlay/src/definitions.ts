export interface WispOverlayPlugin {
  canDrawOverlays(): Promise<{ value: boolean }>;
  requestPermission(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<{ value: boolean }>;
  resize(options: { width: number; height: number }): Promise<void>;
  setLook(options: { handleDp: number }): Promise<void>;
  readStore(options: { name: string }): Promise<{ value: string }>;
  writeStore(options: { name: string; json: string }): Promise<void>;
  storeRev(): Promise<{ value: number }>;
}
