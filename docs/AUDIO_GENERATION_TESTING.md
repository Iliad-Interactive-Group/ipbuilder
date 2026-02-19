# Audio Generation Testing Guide

## Overview

This guide helps you test and troubleshoot audio generation in IPbuilder.

## Quick Test Procedure

### 1. Edit Copy Before Generating Audio

**Important**: You CAN and SHOULD edit the generated copy before creating audio.

1. Generate a Radio Script or TV Script
2. **Click directly in the text area** to edit the copy
3. Make your changes (the system auto-saves as you type)
4. Click "Generate Audio Spec"
5. Wait for processing (5-30 seconds depending on script length)
6. Download or play the audio

### 2. Visual Indicators

- **Editable Copy**: Look for the info message "Click to edit the copy below..."
- **Hover Effect**: The textarea border will highlight when you hover
- **Auto-Save**: Edits are automatically saved and will be used for audio generation
- **Confirmation**: The message "Audio will be generated from your edited copy above" appears near the Generate button

### 3. Audio Generation Steps

```
1. Generate Script → 2. Edit Copy (optional) → 3. Generate Audio → 4. Download/Play
```

## Testing Checklist

### Basic Functionality
- [ ] Generate a radio script
- [ ] Click in the textarea and edit some text
- [ ] Click "Generate Audio Spec"
- [ ] Verify loading spinner appears
- [ ] Wait for completion
- [ ] Click "Download Audio" button
- [ ] Verify .wav file downloads
- [ ] Open the .wav file and verify it plays
- [ ] Verify audio matches the edited text (not the original)

### Voice Selection
- [ ] Select different voice from dropdown (Algenib, Kore, Puck)
- [ ] Generate audio with each voice
- [ ] Verify different voice characteristics

### Error Handling
- [ ] Try generating audio with empty/very short script
- [ ] Try with very long script (>5000 characters)
- [ ] Check browser console for any errors

## Troubleshooting Silent Audio

### Check Console Logs

Look for these log messages in the terminal where you ran `npm run dev`:

```
[Audio Flow] Starting audio generation with: { scriptLength: ..., voiceName: ..., scriptPreview: ... }
[Audio Flow] Generation response: { hasMedia: true, mediaUrl: ..., mediaContentType: ... }
[Audio Flow] Audio buffer size: [should be > 0]
[Audio Flow] WAV conversion complete. Base64 length: [should be large]
```

### Common Issues and Solutions

#### Issue: "Audio buffer size: 0"
**Solution**: The AI model isn't returning audio data
- Check your `GOOGLE_GENAI_API_KEY` is valid
- Verify the model supports TTS
- Try updating to latest Genkit version

#### Issue: Audio file downloads but is silent
**Solution**: PCM to WAV conversion issue
- Check the sample rate (should be 24000 Hz)
- Verify bit depth (should be 16-bit)
- Check if browser supports the WAV format

#### Issue: "No media in response"
**Solution**: Model configuration problem
- The model needs to support `responseModalities: ['AUDIO']`
- Check if the model name is correct
- Verify Google AI API has TTS enabled

#### Issue: Very long generation time (>1 minute)
**Solution**: Script might be too long
- Keep scripts under 2000 characters for best results
- Break longer content into multiple segments

## Technical Details

### Current Configuration

**Model**: `googleai/gemini-3-pro`
**Format**: WAV (24kHz, 16-bit PCM)
**Processing**: Server-side via Next.js Server Actions
**Storage**: Base64 data URIs (in-memory, no external storage)

### Available Voices

- **Algenib** - Male, gravelly, authoritative
- **Kore** - Female, professional, clear
- **Puck** - Male, energetic, dynamic
- (More voices available through Google AI Studio)

### Production Cue Stripping

The following patterns are automatically removed before TTS:
- `[SFX: ...]` - Sound effects
- `[MUSIC: ...]` - Music cues
- `[VOICEOVER: ...]` - VO directions
- `[PAUSE]` - Timing marks
- Any other `[...]` bracketed content

## Testing in Different Browsers

### Chrome/Edge (Recommended)
✅ Full support for WAV playback
✅ Data URI download
✅ Audio API support

### Firefox
✅ Full support
⚠️ May need user interaction before autoplay

### Safari
✅ Supports WAV
⚠️ May need user gesture for download
⚠️ iOS requires user interaction for audio playback

## Performance Benchmarks

| Script Length | Expected Time | Notes |
|--------------|---------------|-------|
| 50 words | 3-5 seconds | Fastest |
| 150 words | 5-10 seconds | Typical radio spot |
| 300 words | 10-20 seconds | Long form |
| 500+ words | 20-30 seconds | May timeout |

## Reporting Issues

When reporting audio generation issues, include:

1. **Script length** (character count)
2. **Voice selected**
3. **Browser and version**
4. **Console logs** from terminal
5. **Browser console errors**
6. **Downloaded file size** (should be > 100KB for typical spots)

## Next Steps for Development

### Potential Improvements
- [ ] Add audio waveform preview
- [ ] Support SSML for advanced voice control
- [ ] Add playback speed control
- [ ] Support multiple audio formats (MP3, OGG)
- [ ] Add audio editing/trimming
- [ ] Support longer scripts with chunking
- [ ] Add voice cloning capability
- [ ] Implement audio mixing (music + voice)

### Model Alternatives

If current model doesn't work:
1. Check latest Google AI models supporting TTS
2. Consider using dedicated TTS API (Google Cloud TTS, ElevenLabs)
3. Fall back to browser-based Web Speech API for testing

## Resources

- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [Google AI Studio](https://aistudio.google.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
