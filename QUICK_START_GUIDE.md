# Quick Start Guide: New Features

## Overview
This guide explains how to use the new multi-variant graphics and voice model features in the IPBuilder app.

---

## 🎨 Generating Multiple Image Variations

### Step-by-Step:

1. **Select a Visual Content Type**
   - Choose "Social Media Post", "Display Ad Copy", or "Billboard Ad"

2. **Choose Number of Variations**
   - Find the "Number of Image Variations (Optional)" dropdown
   - Select:
     - 1 image (default)
     - 2 images (A/B test)
     - 3 images (A/B/C test)
     - 4 images (A/B/C/D test)

3. **Generate Content**
   - Click "Generate Marketing Copy"
   - Text will generate first
   - Images will generate in parallel

4. **Compare Variants**
   - Use tabs to switch between image variants
   - Each tab shows:
     - The unique image prompt used
     - The generated image
   - Compare different visual approaches
   - Choose the best for your campaign

### Benefits:
- Test multiple creative directions without regenerating
- Save time with parallel generation
- Make data-driven decisions with A/B testing

---

## 🎤 Selecting Voice Models for Audio

### Step-by-Step:

1. **Select Audio Content Type**
   - Choose "Radio Script" or "TV Script"

2. **Choose Voice Gender (Optional)**
   - Find "Voice Gender" dropdown
   - Options:
     - Auto-select (Default) - uses Algenib (male gravelly)
     - Male Voice - shows 16 male voices
     - Female Voice - shows 14 female voices

3. **Select Specific Voice (Optional)**
   - Appears after selecting gender
   - Each voice has a personality description
   - Examples:
     - **Male**: Puck (Upbeat), Charon (Informative), Algenib (Gravelly)
     - **Female**: Zephyr (Bright), Kore (Firm), Leda (Youthful)

4. **Generate Script**
   - Script defaults to 30 seconds
   - Can change length in script settings
   - Word count automatically adjusted

5. **Generate Audio**
   - Click "Generate Audio Spec" button
   - Audio uses your selected voice
   - Can regenerate with different voice

### Tips:
- **Upbeat brands**: Try Puck (male) or Laomedeia (female)
- **Professional/Corporate**: Try Charon (male) or Kore (female)
- **Friendly/Casual**: Try Achird (male) or Aoede (female)
- **Mature/Authoritative**: Try Schedar (male) or Gacrux (female)

---

## 📝 Content Types Quick Reference

### Visual Content (Supports Image Variations):
- ✅ **Social Media Post** - 1-4 images
- ✅ **Display Ad Copy** - 1-4 images
- ✅ **Billboard Ad** - 1-4 images
- Website Copy - Single image

### Audio Content (Supports Voice Selection):
- ✅ **Radio Script** - Choose from 30 voices
- ✅ **TV Script** - Choose from 30 voices

### Text-Only Content:
- Blog Post
- Podcast Outline
- Website Wireframe
- Lead Generation Email

---

## 💡 Best Practices

### For Image Variations:
1. **Start with 2-3 variants** for most A/B tests
2. **Use 4 variants** for major campaigns needing more options
3. **Compare variants** before choosing one for production
4. **Consider platform** - different images may work better on different social platforms

### For Voice Selection:
1. **Match voice to brand personality**
   - Tech/Modern → Try Fenrir (excitable) or Zephyr (bright)
   - Professional → Try Charon (informative) or Kore (firm)
   - Friendly → Try Achird or Callirrhoe (easy-going)

2. **Test different voices** for the same script
3. **Consider target audience** - demographics may respond better to certain voices
4. **Keep 30s default** unless you have specific duration requirements

### For Optimal Workflow:
1. Generate text content first
2. Review and edit if needed
3. Generate images/audio after text is finalized
4. Compare variants
5. Choose best performing option

---

## ⚡ Common Scenarios

### Scenario 1: Social Media Campaign with A/B Testing
```
1. Select: "Social Media Post"
2. Set: "Number of Image Variations" → 3 images
3. Generate → Get 5 text variations + 3 image variations
4. Test each combination to find winner
```

### Scenario 2: Radio Commercial with Custom Voice
```
1. Select: "Radio Script"
2. Set: "Voice Gender" → Female Voice
3. Set: "Specific Voice" → Zephyr (Bright)
4. Keep: 30 seconds (default)
5. Generate script → Generate audio with Zephyr voice
```

### Scenario 3: Display Ad with Multiple Creative Approaches
```
1. Select: "Display Ad Copy"
2. Set: "Number of Image Variations" → 4 images
3. Generate → Get 4 completely different visual approaches
4. A/B/C/D test to find best performer
```

---

## 🔧 Troubleshooting

### Image Generation Failed
**Error**: "Failed to generate image. Please try again or check your internet connection."

**Solutions**:
- Check internet connection
- Try regenerating
- If all images fail, try reducing number of variants
- Check that API credentials are configured

### Audio Generation Issues
**Problem**: Can't select specific voice

**Solution**: First select Voice Gender, then specific voice picker appears

### No Image Variant Selector
**Reason**: Only appears for Social Media, Display Ads, and Billboards

**Solution**: Select one of those content types to see the option

### No Voice Selector
**Reason**: Only appears for Radio Script and TV Script

**Solution**: Select one of those content types to see the option

---

## 📞 Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for technical details
2. Review error messages for troubleshooting guidance
3. Contact support with specific error messages if needed

---

**Version**: 1.0
**Last Updated**: Implementation completion
**Status**: All features ready for production use ✅
