# Notification Sounds

This directory contains audio files for the notification system.

## Required Files

### notification.mp3
- **Location**: `/assets/sounds/notification.mp3`
- **Purpose**: Main notification sound played when notifications are triggered
- **Format**: MP3
- **Recommended Duration**: 1-2 seconds
- **Volume**: Should be normalized to avoid being too loud

## How to Add the Sound File

1. Place your `notification.mp3` file in this directory
2. Ensure the file is accessible via the web server at `/assets/sounds/notification.mp3`
3. The notification system will automatically use this sound when enabled

## Sound Variations

The notification system automatically adjusts the playback rate based on priority:
- **Low Priority**: 0.8x speed (deeper tone)
- **Medium Priority**: 1.0x speed (normal)
- **High Priority**: 1.2x speed (higher pitch)

## Alternative Implementation

If you prefer not to use an MP3 file, you can modify the `playNotificationSound` function in `NotificationContext.js` to use the Web Audio API for generated sounds instead.

## File Structure
```
frontend/src/assets/sounds/
├── README.md
└── notification.mp3 (add this file)
