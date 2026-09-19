use std::sync::Mutex;
use tauri::{
    AppHandle, LogicalPosition, LogicalSize, Manager, Position, Size, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder,
};

const OVERLAY: &str = "overlay";

struct OverlayState {
    y: Option<f64>,
    handle: f64,
    peeked: bool,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self {
            y: None,
            handle: 44.0,
            peeked: false,
        }
    }
}

fn state() -> &'static Mutex<OverlayState> {
    static STATE: Mutex<OverlayState> = Mutex::new(OverlayState {
        y: None,
        handle: 44.0,
        peeked: false,
    });
    &STATE
}

fn overlay_url() -> WebviewUrl {
    WebviewUrl::App("/?overlay=1".into())
}

fn place_right(win: &WebviewWindow, width: f64, height: f64, y: Option<f64>) -> Result<(), String> {
    let monitor = win
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or(win.primary_monitor().map_err(|e| e.to_string())?)
        .ok_or_else(|| "no monitor".to_string())?;
    let scale = monitor.scale_factor();
    let area = monitor.work_area();
    let origin_x = area.position.x as f64 / scale;
    let origin_y = area.position.y as f64 / scale;
    let screen_w = area.size.width as f64 / scale;
    let screen_h = area.size.height as f64 / scale;
    let x = origin_x + screen_w - width;
    let min_y = origin_y + 24.0;
    let max_y = origin_y + screen_h - height - 24.0;
    let fallback = origin_y + ((screen_h - height) / 2.0).max(24.0);
    let y = y.unwrap_or(fallback).clamp(min_y, max_y.max(min_y));
    if let Ok(mut s) = state().lock() {
        s.y = Some(y);
    }
    win.set_position(Position::Logical(LogicalPosition { x, y }))
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn size_window(win: &WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    win.set_size(Size::Logical(LogicalSize { width, height }))
        .map_err(|e| e.to_string())?;
    let y = state().lock().ok().and_then(|s| s.y);
    place_right(win, width, height, y)
}

fn drop_size() -> (f64, f64) {
    let s = state().lock().ok();
    if s.as_ref().is_some_and(|s| s.peeked) {
        return (8.0, 56.0);
    }
    let handle = s.map(|s| s.handle).unwrap_or(44.0).clamp(28.0, 72.0);
    (handle, handle)
}

#[tauri::command]
fn overlay_start(app: AppHandle) -> Result<(), String> {
    if app.get_webview_window(OVERLAY).is_some() {
        return Ok(());
    }
    let (w, h) = drop_size();
    let win = WebviewWindowBuilder::new(&app, OVERLAY, overlay_url())
        .title("Wisp")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .visible(true)
        .inner_size(w, h)
        .shadow(false)
        .build()
        .map_err(|e| e.to_string())?;
    let _ = win.set_ignore_cursor_events(false);
    place_right(&win, w, h, state().lock().ok().and_then(|s| s.y))?;
    Ok(())
}

#[tauri::command]
fn overlay_stop(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(OVERLAY) {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn overlay_running(app: AppHandle) -> bool {
    app.get_webview_window(OVERLAY).is_some()
}

#[tauri::command]
fn overlay_resize(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    let win = app
        .get_webview_window(OVERLAY)
        .ok_or_else(|| "overlay off".to_string())?;
    let w = width.clamp(8.0, 420.0);
    let h = height.clamp(8.0, 720.0);
    size_window(&win, w, h)
}

#[tauri::command]
fn overlay_collapse(app: AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window(OVERLAY)
        .ok_or_else(|| "overlay off".to_string())?;
    if let Ok(mut s) = state().lock() {
        s.peeked = false;
    }
    let (w, h) = drop_size();
    size_window(&win, w, h)
}

#[tauri::command]
fn overlay_peek(app: AppHandle, peeked: bool) -> Result<(), String> {
    if let Ok(mut s) = state().lock() {
        s.peeked = peeked;
    }
    let win = app
        .get_webview_window(OVERLAY)
        .ok_or_else(|| "overlay off".to_string())?;
    let (w, h) = drop_size();
    size_window(&win, w, h)
}

#[tauri::command]
fn overlay_set_y(app: AppHandle, y: f64) -> Result<(), String> {
    let win = app
        .get_webview_window(OVERLAY)
        .ok_or_else(|| "overlay off".to_string())?;
    let (w, h) = win
        .inner_size()
        .map(|s| {
            let scale = win.scale_factor().unwrap_or(1.0);
            (s.width as f64 / scale, s.height as f64 / scale)
        })
        .unwrap_or_else(|_| drop_size());
    place_right(&win, w, h, Some(y))
}

#[tauri::command]
fn overlay_set_look(app: AppHandle, handle: f64) -> Result<(), String> {
    if let Ok(mut s) = state().lock() {
        s.handle = handle.clamp(28.0, 72.0);
    }
    if let Some(win) = app.get_webview_window(OVERLAY) {
        let (w, h) = drop_size();
        size_window(&win, w, h)?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            overlay_start,
            overlay_stop,
            overlay_running,
            overlay_resize,
            overlay_collapse,
            overlay_peek,
            overlay_set_y,
            overlay_set_look,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Wisp");
}
